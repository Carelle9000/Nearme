# ⚡ CODEMAGIC - QUICK START (30 min)

**Goal**: Auto-build NearMe in cloud, no local Gradle issues  
**Result**: Push code → Auto-build & test distribution  

---

## 5 STEPS

### 1️⃣ Sign Up (2 min)
```
Go to: https://codemagic.io
Click: "Get Started Free"
Sign in with GitHub
```

### 2️⃣ Connect Repo (2 min)
```
Click: "New app"
Select: nearme repo
Choose: Flutter App
Done!
```

### 3️⃣ Push codemagic.yaml (1 min)
```bash
git add codemagic.yaml
git commit -m "Add Codemagic CI/CD config"
git push origin main
```

### 4️⃣ Get Firebase Token (5 min)
```bash
firebase login:ci

# Copy token → Paste in Codemagic
# See: FIREBASE_TOKEN_SETUP.md
```

### 5️⃣ Add Variables to Codemagic (15 min)
```
In Codemagic Console → Variables:

FIREBASE_TOKEN=<your-token>
FIREBASE_APP_ID=1:123...android:abc
FIREBASE_TESTERS=email@test.com
CODEMAGIC_EMAIL=your@email.com
```

---

## ✅ TEST IT

```bash
# Just push!
git commit -am "Test build"
git push

# Codemagic auto-builds:
# - Compiles Flutter app
# - Generates APK
# - Uploads to Firebase
# - Notifies testers

# Done in ~15 min! 🎉
```

---

## 📋 DETAILED GUIDES

| Topic | Guide |
|-------|-------|
| Full Codemagic Setup | `CODEMAGIC_SETUP.md` |
| Firebase Token | `FIREBASE_TOKEN_SETUP.md` |
| Build Config | `codemagic.yaml` (already in repo) |

---

## 🚀 YOU'RE ALL SET!

After setup:
- ✅ Zero local build problems
- ✅ Auto-builds every commit
- ✅ Firebase distribution ready
- ✅ Tester notifications
- ✅ Free forever!

---

**Next**: Start step 1 → https://codemagic.io 🎉
