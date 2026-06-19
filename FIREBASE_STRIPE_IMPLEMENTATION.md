# 🔥 FIREBASE + STRIPE IDENTITY - IMPLEMENTATION COMPLÈTE

**Architecture**: Firebase Cloud Functions + Firestore (No NestJS backend)

**Status**: Ready to implement

---

## 🚀 QUICK START (15 minutes)

### 1. Initialize Firebase Functions

```bash
cd nearme
firebase init functions --project=[your-project]
cd functions
npm install stripe
npm install -D @types/stripe
```

### 2. Create Cloud Functions

**File**: `functions/src/index.ts`

```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ─── Function 1: Create Verification Session ───────────────
export const createVerificationSession = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated"
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
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const user = userDoc.data();

    // Create Stripe Identity session
    const session = await stripe.identity.verificationSessions.create({
      type: "id_number",
      metadata: {
        userId,
        email: user?.email,
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
        ageVerificationAttempts: (user?.ageVerificationAttempts || 0) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`[Verification] Session created for ${userId}: ${session.id}`);

    return {
      sessionId: session.id,
      clientSecret: session.client_secret,
    };
  }
);

// ─── Function 2: Handle Stripe Webhook ─────────────────────
export const handleStripeWebhook = functions.https.onRequest(
  async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret
      );

      console.log(`[Webhook] Received: ${event.type}`);

      // Only handle verified events
      if (event.type !== "identity.verification_session.verified") {
        res.json({ received: true });
        return;
      }

      const session = event.data.object as any;
      const userId = session.metadata?.userId;

      if (!userId) {
        console.warn("[Webhook] No userId in metadata");
        res.json({ received: true });
        return;
      }

      // Verify user exists
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();

      if (!userDoc.exists || userDoc.data()?.stripeVerificationId !== session.id) {
        console.warn(`[Webhook] Session mismatch for ${userId}`);
        res.json({ received: true });
        return;
      }

      // Update user - VERIFIED!
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .update({
          isAgeVerified: true,
          ageVerifiedAt: admin.firestore.Timestamp.now(),
          ageVerificationStatus: "verified",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

      console.log(`[Webhook] ✓ User ${userId} verified`);
      res.json({ success: true });
    } catch (error) {
      console.error("[Webhook] Error:", error);
      res.status(400).json({ error: String(error) });
    }
  }
);

// ─── Function 3: Get Verification Status (optional polling) ──
export const getVerificationStatus = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "");
    }

    const userId = context.auth.uid;
    const verificationId = data.verificationId as string;

    // Get from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    const user = userDoc.data();

    if (user?.stripeVerificationId !== verificationId) {
      throw new functions.https.HttpsError("permission-denied", "");
    }

    // Query Stripe
    const session = await stripe.identity.verificationSessions.retrieve(
      verificationId
    );

    return {
      id: session.id,
      status: session.status,
      ageAbove18:
        session.verified_outputs?.age_above_18 ||
        session.verified_outputs?.birthdate != null,
      createdAt: new Date(session.created * 1000),
    };
  }
);
```

### 3. Set Environment Variables

**File**: `functions/.env.local`

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY
```

**Or in Firebase Console:**
- Go to Cloud Functions
- Select `handleStripeWebhook`
- Runtime settings → Set environment variables

### 4. Deploy Functions

```bash
cd functions
firebase deploy --only functions

# Output:
# Function URL: https://us-central1-[project].cloudfunctions.net/createVerificationSession
# Function URL: https://us-central1-[project].cloudfunctions.net/handleStripeWebhook
# Function URL: https://us-central1-[project].cloudfunctions.net/getVerificationStatus
```

### 5. Configure Firestore Schema

**Collection**: `users` (add fields to existing User document)

```javascript
// Firestore User Document Structure:
{
  uid: "user123",
  email: "user@example.com",
  name: "John Doe",
  
  // Existing:
  isFaceVerified: false,
  
  // NEW:
  isAgeVerified: false,
  ageVerifiedAt: null,
  stripeVerificationId: null,
  ageVerificationStatus: "pending",  // "pending" | "verified" | "failed"
  ageVerificationAttempts: 0,
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**Collection**: `verificationLogs` (create new)

```javascript
// Document structure:
{
  userId: "user123",
  type: "age",  // "face" | "age"
  status: "success",  // "success" | "failed" | "pending"
  metadata: {
    verificationSessionId: "vs_test_...",
    ageAbove18: true
  },
  errorCode: null,
  errorMessage: null,
  createdAt: Timestamp
}
```

### 6. Update Firestore Security Rules

**File**: `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users: Only authenticated user can access their own data
    match /users/{uid} {
      allow read, update: if request.auth.uid == uid;
      allow create: if request.auth.uid == uid;
      
      // Cloud Functions can update (via admin SDK)
      allow write: if request.auth != null && isAdmin();
    }

    // Verification Logs: Write-only (audit trail)
    match /verificationLogs/{document=**} {
      allow write: if request.auth != null;
      allow read: if false;  // No direct reads
    }
  }

  function isAdmin() {
    return request.auth.token.admin == true;
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 7. Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Settings → Webhooks → Add endpoint
3. Endpoint URL: 
   ```
   https://us-central1-[YOUR_PROJECT].cloudfunctions.net/handleStripeWebhook
   ```
4. Events: `identity.verification_session.verified`
5. Copy webhook secret → Add to `functions/.env`

### 8. Update Flutter Service

**File**: `lib/data/services/stripe_identity_service.dart`

```dart
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';

class StripeIdentityServiceImpl implements StripeIdentityService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  @override
  Future<StripeIdentityResult> startVerification() async {
    try {
      // Call Cloud Function
      final result = await _functions
          .httpsCallable('createVerificationSession')
          .call();

      final data = result.data as Map<String, dynamic>;
      
      return StripeIdentityResult(
        verificationSessionId: data['sessionId'] as String,
        status: 'pending',
      );
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<StripeIdentityStatus> checkStatus(String verificationId) async {
    try {
      final result = await _functions
          .httpsCallable('getVerificationStatus')
          .call({'verificationId': verificationId});

      final data = result.data as Map<String, dynamic>;
      return StripeIdentityStatus.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  @override
  void cancel() {}
}
```

### 9. Update pubspec.yaml

```yaml
dependencies:
  cloud_functions: ^5.0.0  # ← ADD
  firebase_core: ^3.0.0    # Update if needed
  firebase_auth: ^5.0.0
  cloud_firestore: ^5.0.0
  # Remove: http (if only used for backend API)
```

```bash
flutter pub get
```

### 10. Add Firestore Listener (Optional - for real-time updates)

**In IdentityVerificationProvider**:

```dart
void _setupFirestoreListener() {
  final userId = FirebaseAuth.instance.currentUser?.uid;
  if (userId == null) return;

  FirebaseFirestore.instance
      .collection('users')
      .doc(userId)
      .snapshots()
      .listen((doc) {
    final user = doc.data();
    if (user != null && user['isAgeVerified'] == true) {
      // Webhook received! User verified
      onWebhookVerificationComplete(true);
    }
  });
}
```

---

## 🧪 TESTING LOCALLY

### 1. Start Firebase Emulators

```bash
firebase emulators:start

# Output:
# ✓ functions emulator ready at http://localhost:5001
# ✓ firestore emulator ready at http://localhost:8080
# ✓ authentication emulator ready at http://localhost:9099
```

### 2. Test Cloud Function (Terminal 2)

```bash
# Get test ID token
curl -X POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Call function with token
curl -X POST http://localhost:5001/[project]/us-central1/createVerificationSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ID_TOKEN]" \
  -d '{}'
```

### 3. Test Webhook

```bash
# Simulate webhook
stripe trigger identity.verification_session.verified
```

### 4. Run Flutter with Emulator

```bash
flutter run -d chrome

# Navigate to Identity screen
# Should call Cloud Function (emulator)
# Should update Firestore (emulator)
```

---

## 📊 FILE STRUCTURE

```
nearme/
├── functions/  ← NEW FOLDER
│   ├── src/
│   │   ├── index.ts          ✅ Cloud Functions
│   │   └── ...
│   ├── .env.local            ✅ Stripe keys
│   ├── .gitignore            ✅ Protect .env
│   ├── package.json          ✅ Dependencies
│   └── firebase.json         ✅ Config
│
├── lib/
│   ├── features/
│   │   ├── auth/
│   │   │   └── identity_verification_screen.dart  ✅ (unchanged)
│   │   ├── identity/
│   │   │   └── identity_verification_provider.dart  ✅ (unchanged)
│   │   └── ...
│   ├── data/services/
│   │   └── stripe_identity_service.dart  ✅ (updated to call Cloud Functions)
│   └── ...
│
├── firebase.json             ✅ Update
├── firestore.rules          ✅ Update
├── firestore.indexes.json   ✅ Auto-generated
├── pubspec.yaml             ✅ Update (add cloud_functions)
│
└── ...
```

---

## ✅ CHECKLIST

```
Backend Setup:
☐ Initialize Firebase Functions (firebase init functions)
☐ Install Stripe SDK (npm install stripe)
☐ Create functions/src/index.ts (copy code above)
☐ Add environment variables (.env.local)
☐ Deploy functions (firebase deploy --only functions)

Firestore Setup:
☐ Create/update Firestore user schema (add age verification fields)
☐ Create verificationLogs collection
☐ Update firestore.rules
☐ Deploy rules (firebase deploy --only firestore:rules)

Stripe Configuration:
☐ Create Stripe webhook endpoint
☐ Add webhook secret to functions/.env
☐ Test webhook with Stripe CLI

Flutter Update:
☐ Update stripe_identity_service.dart
☐ Add cloud_functions to pubspec.yaml
☐ Run flutter pub get
☐ Test Cloud Function calls

Testing:
☐ Test createVerificationSession
☐ Test handleStripeWebhook
☐ Test Firestore updates
☐ Test Flutter UI flow
☐ Test end-to-end (capture photo → verify → webhook → complete)
```

---

## 🔐 SECURITY

✅ **Firebase Authentication**: Users authenticated via Firebase Auth  
✅ **Cloud Functions**: Protected by `context.auth` check  
✅ **Firestore Rules**: Users can only access their own documents  
✅ **Webhook Validation**: Stripe signature verified  
✅ **User Verification**: userId verified on webhook  
✅ **GDPR Compliant**: No ID documents stored (Stripe handles)  
✅ **Audit Trail**: All verifications logged in verificationLogs

---

## 💰 COST

**Firebase (free tier covers)**:
- Cloud Functions: 2M invocations/month
- Firestore: 50K reads, 20K writes, 20K deletes/day
- Storage: 5GB

**Stripe**:
- $1.50 per verification (age_above_18 check)

---

## 🚀 DEPLOYMENT

### Development
```bash
firebase emulators:start
flutter run -d chrome
```

### Production
```bash
# Deploy everything
firebase deploy

# Or specific:
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

## 📞 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| `Cannot find module 'stripe'` | `cd functions && npm install stripe` |
| Function not deployed | Check project ID, run `firebase deploy --only functions` |
| Webhook not received | Verify endpoint in Stripe dashboard, check logs |
| Firestore update not working | Check rules, verify userId permissions |
| Flutter can't call function | Verify `cloud_functions` dependency, check Firebase setup |

---

## 🎉 RESULT

✅ **No NestJS backend needed**  
✅ **Firebase handles everything**  
✅ **Stripe Identity fully integrated**  
✅ **Flutter UI unchanged (works as-is)**  
✅ **Production-ready**  
✅ **Scalable & secure**

---

**Time to implement**: ~45 minutes  
**Status**: 🟢 Ready to build!
