# 🔥 REFACTOR - Firebase-First Architecture

**Decision**: Use Firebase Cloud Functions + Firestore instead of NestJS backend

---

## 🗑️ REMOVED (NestJS Backend)

```
❌ server/src/verification/verification.service.ts
❌ server/src/verification/verification.controller.ts
❌ server/src/verification/verification.module.ts
❌ server/ (entire directory not needed)
```

**Why**: Firebase handles authentication, database, and serverless functions

---

## 🆕 NEW ARCHITECTURE

### Firebase Cloud Functions (TypeScript)

**Function 1**: `createVerificationSession`
```
POST /createVerificationSession
├─ Input: userId (from Firebase Auth)
├─ Action:
│  ├─ Get user from Firestore
│  ├─ Call Stripe API → create verification session
│  ├─ Save sessionId to Firestore User doc
│  └─ Return clientSecret
└─ Output: { sessionId, clientSecret }
```

**Function 2**: `handleStripeWebhook`
```
POST /handleStripeWebhook (webhook)
├─ Input: Stripe event + signature
├─ Action:
│  ├─ Validate signature
│  ├─ Extract userId from metadata
│  ├─ Update Firestore User.isAgeVerified = true
│  ├─ Create audit log in VerificationLogs collection
│  └─ Send custom claim update (optional)
└─ Output: { success: true }
```

### Firestore Collections

**Collection**: `users`
```
users/userId {
  email: string
  name: string
  isFaceVerified: boolean (existing)
  
  // AGE VERIFICATION (NEW)
  isAgeVerified: boolean (default: false)
  ageVerifiedAt: timestamp?
  stripeVerificationId: string?
  ageVerificationStatus: "pending" | "verified" | "failed"
  ageVerificationAttempts: number (default: 0)
}
```

**Collection**: `verificationLogs`
```
verificationLogs/logId {
  userId: string
  type: "face" | "age"
  status: "success" | "failed" | "pending"
  metadata: {
    verificationSessionId?: string
    ageAbove18?: boolean
  }
  errorCode?: string
  errorMessage?: string
  createdAt: timestamp
}
```

---

## 📱 FLUTTER - No Changes Needed!

The UI stays **exactly the same**:
- ✅ `lib/features/auth/identity_verification_screen.dart` (unchanged)
- ✅ `lib/features/identity/identity_verification_provider.dart` (unchanged)

**Only change**: Update `stripe_identity_service.dart` to call Cloud Functions

```dart
// OLD (NestJS API):
// POST http://localhost:8080/verification/stripe/create-session

// NEW (Firebase Cloud Function):
// POST https://us-central1-[project].cloudfunctions.net/createVerificationSession
```

---

## 🔄 REFACTORING STEPS

### STEP 1: Initialize Firebase Functions
```bash
cd functions
npm install -g firebase-tools
firebase init functions
npm install stripe
```

### STEP 2: Create Cloud Functions
**File**: `functions/src/index.ts`

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Function 1: Create verification session
export const createVerificationSession = functions.https.onCall(
  async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;

    // Get user from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User not found"
      );
    }

    const user = userDoc.data();

    // Create Stripe session
    const session = await stripe.identity.verificationSessions.create({
      type: "id_number",
      metadata: {
        userId,
        email: user.email,
      },
      options: {
        document: {
          allowed_types: ["passport", "driving_license", "id_card"],
        },
      },
    });

    // Save to Firestore
    await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .update({
        stripeVerificationId: session.id,
        ageVerificationStatus: "pending",
        ageVerificationAttempts: (user.ageVerificationAttempts || 0) + 1,
      });

    return {
      sessionId: session.id,
      clientSecret: session.client_secret,
    };
  }
);

// Function 2: Handle webhook
export const handleStripeWebhook = functions.https.onRequest(
  async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      if (event.type === "identity.verification_session.verified") {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;

        if (!userId) {
          res.json({ received: true });
          return;
        }

        // Update Firestore
        await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .update({
            isAgeVerified: true,
            ageVerifiedAt: admin.firestore.Timestamp.now(),
            ageVerificationStatus: "verified",
          });

        // Create audit log
        await admin
          .firestore()
          .collection("verificationLogs")
          .add({
            userId,
            type: "age",
            status: "success",
            metadata: {
              verificationSessionId: session.id,
              ageAbove18: session.verified_outputs?.age_above_18,
            },
            createdAt: admin.firestore.Timestamp.now(),
          });

        // Optional: Send real-time update to client
        // Using Firebase Messaging or Realtime Database
      }

      res.json({ received: true });
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error}`);
    }
  }
);
```

### STEP 3: Update Flutter Service

**File**: `lib/data/services/stripe_identity_service.dart`

```dart
import 'package:cloud_functions/cloud_functions.dart';

class StripeIdentityServiceImpl implements StripeIdentityService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  @override
  Future<StripeIdentityResult> startVerification() async {
    try {
      final result = await _functions.httpsCallable('createVerificationSession').call();
      
      final sessionId = result.data['sessionId'];
      final clientSecret = result.data['clientSecret'];

      return StripeIdentityResult(
        verificationSessionId: sessionId,
        status: 'pending',
      );
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<StripeIdentityStatus> checkStatus(String verificationId) async {
    // Poll Firestore for status
    final userDoc = await FirebaseAuth.instance.currentUser?.getIdTokenResult();
    // Implementation depends on how you structure realtime updates
    throw UnimplementedError();
  }

  @override
  void cancel() {}
}
```

### STEP 4: Update pubspec.yaml

```yaml
dependencies:
  cloud_functions: ^5.0.0  # ← ADD THIS
  # Remove: http, flutter_stripe (if not needed elsewhere)
```

### STEP 5: Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      
      // Others can't see verification status
      allow read: if false;
    }

    // Verification logs (write-only, audit trail)
    match /verificationLogs/{logId} {
      allow write: if request.auth != null;  // Cloud Function writes
      allow read: if false;  // No direct reads
    }
  }
}
```

---

## 🚀 DEPLOYMENT

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Configure Stripe webhooks
# Point to: https://us-central1-[project].cloudfunctions.net/handleStripeWebhook
```

---

## 📊 BEFORE vs AFTER

### Before (NestJS)
```
Flutter App
    ↓ HTTP
NestJS Backend (localhost:8080)
    ↓
Stripe API
```

### After (Firebase)
```
Flutter App
    ↓ Cloud Functions SDK
Firebase Cloud Functions
    ↓
Stripe API
    
Stripe Webhooks
    ↓ HTTPS POST
Firebase Cloud Functions
    ↓
Firestore
```

**Benefits**:
- ✅ No separate backend server
- ✅ Automatic scaling
- ✅ Free tier covers small usage
- ✅ Built-in Firebase Auth integration
- ✅ Firestore for data storage
- ✅ Realtime updates via Firestore listeners

---

## 📝 FILES TO DELETE

```
❌ server/ (entire directory)
❌ STRIPE_IMPLEMENTATION_PLAN.md
❌ IMPLEMENTATION_COMPLET.md
❌ ARCHITECTURE_VISUELLE.md
❌ (All NestJS-related docs)
```

---

## ✅ FILES TO CREATE/MODIFY

### New Files
```
✅ functions/src/index.ts (Cloud Functions)
✅ functions/.env (Stripe keys)
```

### Modified Files
```
✅ lib/data/services/stripe_identity_service.dart (call Cloud Functions)
✅ pubspec.yaml (add cloud_functions)
✅ firebase.json (configure functions deployment)
✅ firestore.rules (security rules)
```

### Unchanged
```
✅ lib/features/auth/identity_verification_screen.dart (same UI!)
✅ lib/features/identity/identity_verification_provider.dart
✅ All routing and navigation
```

---

## 🔑 ENVIRONMENT SETUP

**File**: `functions/.env`

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

Or in Firebase Console → Functions → Set env vars

---

## 🧪 TESTING

```bash
# Test Cloud Function locally
firebase emulators:start

# In another terminal:
curl -X POST http://localhost:5001/[project]/us-central1/createVerificationSession \
  -H "Authorization: Bearer [ID_TOKEN]"

# Or from Flutter:
FirebaseFunctions.instance.httpsCallable('createVerificationSession').call()
```

---

## 📋 MIGRATION CHECKLIST

```
Backend Removal:
☐ Delete server/ directory
☐ Remove NestJS-related docs
☐ Remove package.json (server)

Firebase Setup:
☐ Initialize Firebase Functions (firebase init functions)
☐ Create functions/src/index.ts
☐ Add Stripe dependencies (npm install stripe)
☐ Set environment variables
☐ Deploy functions (firebase deploy --only functions)

Firestore Setup:
☐ Update Firestore schema (add age verification fields)
☐ Deploy security rules (firebase deploy --only firestore:rules)
☐ Test rules in Firestore emulator

Flutter Update:
☐ Update stripe_identity_service.dart (call Cloud Functions)
☐ Add cloud_functions to pubspec.yaml
☐ Run flutter pub get
☐ Test navigation through identity screen

Stripe Configuration:
☐ Add webhook endpoint in Stripe Dashboard
☐ Point to: https://us-central1-[project].cloudfunctions.net/handleStripeWebhook
☐ Test webhook locally with firebase emulators

Testing:
☐ Test createVerificationSession Cloud Function
☐ Test handleStripeWebhook Cloud Function
☐ Test Firestore data updates
☐ Test Flutter UI
☐ Test full flow end-to-end
```

---

## 💡 ADVANTAGES

1. **No separate backend infrastructure** - Firebase handles it
2. **Automatic authentication** - Firebase Auth integration
3. **Real-time updates** - Firestore listeners
4. **Scalable** - Firebase auto-scales
5. **Cost-effective** - Free tier covers small apps
6. **Secure** - Firebase security rules
7. **Integrated** - Everything in one console

---

## 🔒 SECURITY

- ✅ Cloud Functions authenticated via Firebase Auth
- ✅ Firestore Rules restrict data access
- ✅ Webhook signature validation (Stripe)
- ✅ userId verification on webhook
- ✅ GDPR compliant (zero ID storage in Firestore)
- ✅ Audit trail via VerificationLogs collection

---

## 🚀 READY?

This refactoring:
- ✅ Removes NestJS completely
- ✅ Uses Firebase Cloud Functions
- ✅ Keeps Flutter UI unchanged
- ✅ Simplifies deployment
- ✅ Maintains security
- ✅ Full Stripe Identity integration

**Next**: See FIREBASE_IMPLEMENTATION.md for detailed steps!
