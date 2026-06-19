# 🚀 SHOREBIRD DEPLOYMENT - Complete Guide

**URL**: https://console.shorebird.dev/orgs/50576/apps

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Prerequisites
```
✓ Flutter SDK installed
✓ Firebase configured
✓ Stripe Cloud Functions deployed
✓ Git repository initialized
✓ All code committed
```

**Check**:
```bash
flutter --version
firebase --version
git status
```

---

## 🔧 SETUP SHOREBIRD

### Option 1: Install Shorebird CLI (Recommended)

**macOS/Linux**:
```bash
brew install shorebird
```

**Windows** (PowerShell):
```powershell
iwr https://get.shorebird.dev -OutFile shorebird_installer.ps1
powershell -ExecutionPolicy Bypass -File .\shorebird_installer.ps1
```

**Verify**:
```bash
shorebird --version
```

### Option 2: Use Web Console (No CLI needed)

👉 Go to: https://console.shorebird.dev/orgs/50576/apps

---

## 📱 BUILD & RELEASE

### Step 1: Build APK/IPA

#### For Android:
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-app.apk
```

#### For iOS:
```bash
flutter build ios --release
# Then archive in Xcode
```

### Step 2: Release via Shorebird Console

**Web Console Method** (Easiest):

1. Go to: https://console.shorebird.dev/orgs/50576/apps
2. Click: **"Create Release"**
3. Select Platform: Android / iOS
4. Upload APK/IPA:
   ```
   build/app/outputs/flutter-app.apk
   ```
5. Set Release Notes:
   ```
   Stripe Identity Age Verification
   - Identity verification screen
   - Stripe Identity integration
   - Firebase Cloud Functions
   ```
6. Click: **"Deploy"**

---

## 🎯 NEAR-ME SPECIFIC DEPLOYMENT

### Pre-Release Testing

```bash
# 1. Test all features locally
flutter run -d chrome
# → Test Identity screen
# → Test Face verification
# → Test Age verification flow

# 2. Test Firebase Cloud Functions
firebase emulators:start
# → Verify createVerificationSession works
# → Verify handleStripeWebhook works

# 3. Check for errors
flutter analyze
# → Should have 0 errors

# 4. Run tests (if any)
flutter test
```

### Release Preparation

```bash
# 1. Update version in pubspec.yaml
# pubspec.yaml:
# version: 1.0.1+2

# 2. Update build number
flutter build apk --build-number=2 --build-name=1.0.1

# 3. Verify APK
ls -lh build/app/outputs/flutter-app.apk

# 4. Commit changes
git add pubspec.yaml
git commit -m "Release 1.0.1 with Stripe Identity verification"
git tag v1.0.1
git push
git push --tags
```

### Release via Console

**In Shorebird Console**:
1. **App Name**: nearme
2. **Platform**: Android (or iOS)
3. **Version**: 1.0.1
4. **Build Name**: 1.0.1
5. **Build Number**: 2
6. **APK File**: `build/app/outputs/flutter-app.apk`
7. **Release Notes**:
   ```
   Version 1.0.1 - Stripe Identity Integration

   New Features:
   ✨ Age verification via Stripe Identity
   ✨ Face recognition (selfie vs profile photo)
   ✨ Real-time verification status

   Improvements:
   • Firebase Cloud Functions integration
   • Enhanced security with Firestore rules
   • Better error handling and toasts
   • Dark theme throughout

   Technical:
   • Stripe Identity API
   • Face++ comparison
   • Firebase Cloud Functions
   • Firestore real-time updates
   ```
8. Click: **"Release"**

---

## 📊 POST-DEPLOYMENT

### Rollout Strategy

**Option 1: Immediate Rollout**
- Release to 100% of users immediately
- Good for bug fixes

**Option 2: Staged Rollout**
- Release to 10% of users first
- Monitor for 24 hours
- Then 50%
- Finally 100%
- Better for major features

**For NearMe** (Recommended):
- Since it's identity verification, do **Staged Rollout**
- Start: 10% (24h)
- Then: 50% (24h)
- Finally: 100%

### Monitor Crashes

In Shorebird Console:
- **Crashes** tab → Monitor for errors
- **Analytics** tab → See usage
- **Logs** tab → Debug issues

---

## 🔄 OVER-THE-AIR UPDATES

### Without Shorebird (Standard):
- Build new APK
- Submit to Google Play
- Wait 4-24 hours for review
- Users download new version

### With Shorebird (OTA):
- Deploy new version in console
- Users get update in **seconds**
- No Play Store review
- Instant fixes

---

## ⚙️ CONFIGURE SHOREBIRD

### pubspec.yaml Setup

Add/verify these fields:
```yaml
name: nearme
description: "NearMe — Hyperlocal Dating App"
publish_to: 'none'
version: 1.0.1+2

environment:
  sdk: ^3.3.0

dependencies:
  flutter:
    sdk: flutter
  # ... rest of dependencies
```

### firebase.json for Shorebird

```json
{
  "hosting": {
    "public": "build/web",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions"
  }
}
```

---

## 🚀 CI/CD INTEGRATION

### GitHub Actions (Optional)

Create `.github/workflows/shorebird.yml`:

```yaml
name: Deploy to Shorebird

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: subosito/flutter-action@v2
      
      - run: flutter pub get
      
      - run: flutter build apk --release
      
      - name: Deploy to Shorebird
        run: |
          shorebird auth login --ci \
            --credentials ${{ secrets.SHOREBIRD_CI_KEY }}
          shorebird release android \
            --aab build/app/outputs/flutter-app.apk
```

---

## 📋 DEPLOYMENT CHECKLIST

### Before Deployment
```
✓ All features tested locally
✓ Flutter analyze - 0 errors
✓ No console warnings
✓ Firebase deployed (functions + rules)
✓ Stripe webhook configured
✓ .env files NOT committed
✓ Version bumped in pubspec.yaml
✓ APK built and verified
✓ Git changes committed
✓ Release notes written
```

### During Deployment
```
✓ Logged in to Shorebird Console
✓ Selected correct organization (50576)
✓ Selected correct app (nearme)
✓ Uploaded correct APK/IPA
✓ Platform correct (Android/iOS)
✓ Release notes detailed
✓ Staged rollout enabled
✓ Monitoring enabled
```

### After Deployment
```
✓ Monitor crash reports (1h)
✓ Check analytics (24h)
✓ Verify feature works for users
✓ Check support messages
✓ Plan next release
```

---

## 🆘 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Build fails | Run `flutter clean` then rebuild |
| APK too large | Enable ProGuard minification |
| Deployment stuck | Check internet connection, retry |
| Crashes after deploy | Rollback via Shorebird Console |
| Users don't get update | Check staged rollout %, increase % |

---

## 💡 BEST PRACTICES

✅ **Do**:
- Test thoroughly before release
- Use semantic versioning (1.0.0)
- Write detailed release notes
- Use staged rollout for major features
- Monitor crashes for 24h after release
- Keep Firebase functions up to date

❌ **Don't**:
- Release on Fridays (support hours!)
- Rush deployments
- Forget to bump version number
- Commit .env files
- Deploy without testing
- Skip release notes

---

## 📞 SHOREBIRD SUPPORT

- **Docs**: https://docs.shorebird.dev
- **GitHub**: https://github.com/shorebirdtech/shorebird
- **Discord**: Shorebird Discord community
- **Email**: support@shorebird.dev

---

## 🎯 FOR NEARME

### Current Status
- Version: 1.0.1+2
- Features: Identity verification, Face comparison, Firestore sync
- Backend: Firebase Cloud Functions
- Database: Firestore

### Next Release Strategy
1. Build APK with all features
2. Deploy via Shorebird Console
3. Monitor for 24 hours
4. Gradual rollout (10% → 50% → 100%)
5. Ready for app stores later

---

## 🚀 DEPLOY NOW!

### Quick Start:
1. Go to: https://console.shorebird.dev/orgs/50576/apps
2. Build APK: `flutter build apk --release`
3. Upload to Shorebird Console
4. Write release notes
5. Click Deploy!

**Time**: ~15 minutes ⏱️

---

**Status**: 🟢 READY FOR DEPLOYMENT

Your app is production-ready! Deploy with confidence 🎉
