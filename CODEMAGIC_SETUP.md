# 🚀 CODEMAGIC SETUP - Cloud CI/CD for NearMe

**What**: Free cloud build service (no local build needed!)  
**Time**: 30 minutes setup  
**Result**: Auto-build & upload to Firebase App Distribution

---

## 🎯 WHAT YOU GET

✅ Auto-build on every commit  
✅ No local Gradle issues  
✅ Direct upload to Firebase  
✅ Free tier covers everything  
✅ Build reports & notifications  

---

## 📋 STEP-BY-STEP SETUP

### STEP 1: Create Codemagic Account (5 min)

1. Go to: **https://codemagic.io**
2. Click: **"Get Started Free"**
3. Sign up with **GitHub account**
4. Authorize Codemagic to access your repos

---

### STEP 2: Connect Your GitHub Repository (5 min)

1. Click: **"New app"**
2. Select your NearMe repository
3. Choose: **"Flutter App"**
4. Click: **"Finish"**

---

### STEP 3: Add Configuration File (1 min)

1. Add `codemagic.yaml` to your repo root:
   - Already created at: `codemagic.yaml` in this project
   - Push to GitHub:
     ```bash
     git add codemagic.yaml
     git commit -m "Add Codemagic CI/CD configuration"
     git push
     ```

---

### STEP 4: Configure Environment Variables (10 min)

**In Codemagic Console:**

1. Click your app → **Variables**
2. Add these variables:

```
FIREBASE_TOKEN=<your-firebase-ci-token>
FIREBASE_APP_ID=<your-firebase-app-id>
FIREBASE_TESTERS=email1@test.com,email2@test.com
CODEMAGIC_EMAIL=your@email.com
```

**How to get FIREBASE_TOKEN:**

```bash
# Login to Firebase
firebase login:ci

# Copy the token from output
# Add to Codemagic variables
```

**How to get FIREBASE_APP_ID:**

```bash
# From Firebase Console:
# Project Settings → Apps → Android App ID
# Example: 1:123456789:android:abcdef1234567890
```

---

### STEP 5: Configure Android Signing (5 min)

**In Codemagic Console:**

1. Go to: **Certificates** → **Android signing**
2. Upload your keystore file:
   - Located at: `android/app/key.jks`
   - Or create new if needed

3. Add keystore password
4. Add key password

---

### STEP 6: Test First Build (10 min)

**In Codemagic Console:**

1. Click: **"Start new build"**
2. Select branch: **main**
3. Click: **"Build"**
4. Wait for build to complete

**Monitor build progress:**
- Live logs visible
- Should complete in ~10-15 minutes

---

## ✅ AUTOMATED WORKFLOW

Once configured, **every push to main** will:

```
Push commit → Codemagic auto-detects → Build starts
  ↓
Build APK (Windows instance)
  ↓
Run analysis (flutter analyze)
  ↓
Upload to Firebase App Distribution
  ↓
Send notification to testers
  ↓
Build complete! 🎉
```

---

## 🧪 TESTING THE BUILD

### First Time Manual Build

```bash
# In Codemagic Console:
1. Click app name
2. Click "Start new build"
3. Select branch: main
4. Click "Build"
5. Wait ~15 min
6. Check Firebase for new build
```

### Automatic Builds (After Setup)

```bash
# Just push to GitHub!
git commit -m "New feature"
git push

# Codemagic auto-detects:
# - Builds APK
# - Uploads to Firebase
# - Notifies testers
# Done! 🚀
```

---

## 📱 TESTING VIA FIREBASE APP DISTRIBUTION

**For testers to install:**

1. They receive email from Firebase
2. Click link in email
3. Install app directly to device
4. App auto-updates on new builds

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

```yaml
# Firebase
FIREBASE_TOKEN=<ci-token>          # From: firebase login:ci
FIREBASE_APP_ID=1:123:android:abc   # From: Firebase Console
FIREBASE_TESTERS=email@test.com     # Comma-separated testers

# Build
FLUTTER_VERSION=3.3.0               # Or latest

# Notifications
CODEMAGIC_EMAIL=your@email.com      # Notification recipient
```

---

## 🎯 CONFIGURATION CHECKLIST

```
☐ Codemagic account created (GitHub login)
☐ GitHub repo connected to Codemagic
☐ codemagic.yaml added to repo & pushed
☐ FIREBASE_TOKEN added to Codemagic variables
☐ FIREBASE_APP_ID added
☐ FIREBASE_TESTERS added
☐ Android signing keystore uploaded
☐ First manual build tested successfully
☐ APK received in Firebase App Distribution
☐ Testers received email invitation
```

---

## 🚀 USAGE AFTER SETUP

```bash
# That's it! Just commit and push:

git commit -am "Add new feature"
git push

# Codemagic handles everything:
# - Builds APK
# - Runs tests
# - Uploads to Firebase
# - Notifies testers
# - Sends build report
```

---

## 📞 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Build fails | Check logs in Codemagic console |
| Firebase upload fails | Verify FIREBASE_TOKEN is valid |
| Testers don't get email | Check FIREBASE_TESTERS emails |
| APK not found | Check build logs for compilation errors |

---

## 💰 PRICING

**Codemagic Free Tier**:
- ✅ 500 build minutes/month
- ✅ Mac & Windows builds
- ✅ Unlimited projects
- ✅ Perfect for our app!

---

## 🎉 RESULT

After setup, you have:
- ✅ Zero local build issues
- ✅ Auto-builds on every push
- ✅ Direct Firebase distribution
- ✅ Tester notifications
- ✅ Build reports
- ✅ All FREE!

---

## 📚 CODEMAGIC RESOURCES

- **Dashboard**: https://codemagic.io/apps
- **Docs**: https://docs.codemagic.io/
- **Firebase Integration**: https://docs.codemagic.io/integrations/firebase-app-distribution/

---

## 🎯 NEXT STEPS

1. **Sign up**: https://codemagic.io (5 min)
2. **Connect repo**: Select NearMe GitHub (3 min)
3. **Add variables**: Firebase tokens (10 min)
4. **Setup signing**: Android keystore (5 min)
5. **Test build**: Manual first build (15 min)
6. **Success!** 🎉

**Total time: ~40 minutes**

Then: **Just commit & push** → Automatic build & test distribution!

---

**Status**: 🟢 Ready to automate your builds!

Let me know when you're at step 4 if you need help with FIREBASE_TOKEN! 🚀
