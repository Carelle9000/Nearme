# 🔑 FIREBASE TOKEN SETUP - For Codemagic

**What**: Get Firebase CI token for Codemagic  
**Time**: 5 minutes  
**Required for**: Uploading builds to Firebase App Distribution

---

## 🎯 GET FIREBASE_TOKEN

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login:ci
```

This will:
- Open browser to Firebase login
- Ask you to authorize Firebase CLI
- Display a **CI token**

### Step 3: Copy the Token

```
Output will look like:

✓ Success! Use this token to login on a CI server:

1//0gF...extremely-long-token...ZyA

Paste this token into Codemagic!
```

---

## 📋 ADD TO CODEMAGIC

1. Go to: **https://codemagic.io**
2. Click your app
3. Go to: **Variables**
4. Click: **"Add variable"**
5. Name: `FIREBASE_TOKEN`
6. Value: Paste the token from above
7. Click: **"Save"**

---

## 🔐 SECURITY NOTE

✅ Token is **encrypted** in Codemagic  
✅ Never commit to git  
✅ Only visible to you in Codemagic  
✅ Safe to use in CI/CD

---

## ✅ VERIFY TOKEN

```bash
# Test if token works:
firebase apps:list --token=YOUR_TOKEN_HERE

# Should list your Firebase projects
```

---

## 🎯 OTHER REQUIRED VARIABLES

While in Codemagic Variables, also add:

```
FIREBASE_APP_ID=1:123456789:android:abcdef1234567890
FIREBASE_TESTERS=tester1@test.com,tester2@test.com
CODEMAGIC_EMAIL=your@email.com
```

---

## 📊 HOW TO GET OTHER VARIABLES

### FIREBASE_APP_ID
```
1. Go to: https://console.firebase.google.com
2. Select your project: "nearme"
3. Go to: Project Settings
4. Scroll to: "Your apps"
5. Find Android app
6. Copy: Android App ID (looks like: 1:123456789:android:abc...)
```

### FIREBASE_TESTERS
```
List emails of people who should receive test builds:
tester1@gmail.com,tester2@gmail.com

They'll get Firebase invite links to install app
```

### CODEMAGIC_EMAIL
```
Your email for build notifications:
your@gmail.com
```

---

## 🚀 COMPLETE SETUP CHECKLIST

```
☐ firebase-tools installed (npm install -g firebase-tools)
☐ Logged in (firebase login:ci)
☐ CI token copied
☐ Pasted into Codemagic: FIREBASE_TOKEN
☐ Added FIREBASE_APP_ID
☐ Added FIREBASE_TESTERS
☐ Added CODEMAGIC_EMAIL
☐ Ready to build!
```

---

## 🎉 DONE!

Now you can:
1. Commit & push to GitHub
2. Codemagic auto-builds
3. Uploads to Firebase
4. Testers get install link
5. No more local build issues!

---

**Time**: ~5 min total  
**Result**: Automated CI/CD pipeline ready! 🚀
