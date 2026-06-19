# 🚀 SHOREBIRD - DEPLOY IN 5 MINUTES

**Console**: https://console.shorebird.dev/orgs/50576/apps

---

## 3 STEPS

### 1️⃣ Build APK
```bash
flutter build apk --release
# Creates: build/app/outputs/flutter-app.apk (~50MB)
```

### 2️⃣ Go to Shorebird Console
```
https://console.shorebird.dev/orgs/50576/apps
→ Click "Create Release"
→ Select "Android"
→ Upload APK file
```

### 3️⃣ Deploy
```
Write Release Notes:
  Version 1.0.1 - Identity Verification
  ✨ Stripe Identity age verification
  ✨ Face recognition
  ✨ Firebase Cloud Functions
  
→ Click "Deploy"
→ Choose rollout: 10% → 50% → 100%
→ Done! 🎉
```

---

## ⏱️ Timeline

```
flutter build apk --release   3 min
Upload to Shorebird          1 min
Write notes                   1 min
Deploy                        < 1 min
─────────────────────────────
Total                         ~5 min
```

---

## ✅ Pre-Deploy Checklist

```
☐ flutter analyze (no errors)
☐ Tested locally (flutter run)
☐ Firebase functions deployed
☐ APK built successfully
☐ Version bumped (pubspec.yaml)
☐ Ready to go!
```

---

## 📊 Release Notes Template

```
NearMe v1.0.1 - Identity Verification

🎉 NEW:
✨ Stripe Identity age verification
✨ Face recognition (selfie + profile photo)
✨ Real-time verification status

⚡ IMPROVEMENTS:
• Firebase Cloud Functions integration
• Enhanced security with Firestore rules
• Better error handling
• Dark theme UI

🔧 TECHNICAL:
• Stripe Identity API
• Face++ comparison
• Firebase Cloud Functions
• Firestore updates

📱 REQUIREMENTS:
• Android 12+
• Internet connection
• Google Play Services
```

---

## 🎯 Rollout Strategy

**Staged** (Recommended):
- Day 1: 10% of users
- Day 2: 50% of users
- Day 3: 100% of users

**Instant**:
- 100% immediately
- For bug fixes only

---

## 📱 For NearMe

**Current App**:
- Version: 1.0.1
- Platform: Android
- Features: All implemented ✅

**Deployment**:
1. Build APK
2. Upload to Shorebird
3. Deploy with staged rollout
4. Monitor for crashes
5. Expand rollout

---

## 🆘 Issues?

| Problem | Fix |
|---------|-----|
| Build fails | `flutter clean` → rebuild |
| APK too large | Enable minification |
| Can't login | Use web console instead |
| Deployment fails | Check network, retry |

---

## 📞 Resources

- **Console**: https://console.shorebird.dev
- **Docs**: https://docs.shorebird.dev
- **Org**: 50576

---

## 🚀 GO DEPLOY!

1. `flutter build apk --release`
2. Open Shorebird Console
3. Upload APK
4. Click Deploy
5. Monitor crashes

**Done in 5 min!** ⏱️

For detailed steps: See `SHOREBIRD_DEPLOYMENT.md`
