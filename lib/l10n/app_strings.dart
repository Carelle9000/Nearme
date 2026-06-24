class LocaleInfo {
  final String code;
  final String englishName;
  final String nativeName;
  final String flag;
  final bool rtl;
  const LocaleInfo(
      this.code, this.englishName, this.nativeName, this.flag, this.rtl);
}

class AppStrings {
  static const supportedLocales = <LocaleInfo>[
    LocaleInfo('en', 'English', 'English', '🇺🇸', false),
    LocaleInfo('fr', 'French', 'Français', '🇫🇷', false),
    LocaleInfo('es', 'Spanish', 'Español', '🇪🇸', false),
    LocaleInfo('de', 'German', 'Deutsch', '🇩🇪', false),
    LocaleInfo('it', 'Italian', 'Italiano', '🇮🇹', false),
    LocaleInfo('pt', 'Portuguese', 'Português', '🇵🇹', false),
    LocaleInfo('ar', 'Arabic', 'العربية', '🇸🇦', true),
    LocaleInfo('tr', 'Turkish', 'Türkçe', '🇹🇷', false),
    LocaleInfo('ru', 'Russian', 'Русский', '🇷🇺', false),
    LocaleInfo('hi', 'Hindi', 'हिन्दी', '🇮🇳', false),
    LocaleInfo('ja', 'Japanese', '日本語', '🇯🇵', false),
    LocaleInfo('zh', 'Chinese', '中文', '🇨🇳', false),
  ];

  static bool isRtl(String code) =>
      supportedLocales.any((l) => l.code == code && l.rtl);

  static const Map<String, Map<String, String>> _data = {
    'fr': {
      'tagline': 'Rencontrez votre prochaine personne préférée juste dans votre quartier.',
      'subTagline': 'L\'application de rencontre hyperlocale. Vraies connexions. Vraie proximité.',
      'startNow': 'Démarrer maintenant',
      'joinFooter': 'Rejoignez des milliers de locaux déjà connectés à proximité',
      'login': 'Connexion',
      'register': 'S\'inscrire',
      'email': 'E-mail',
      'password': 'Mot de passe',
      'fullName': 'Nom complet',
      'confirmPassword': 'Confirmer le mot de passe',
      'signIn': 'Se connecter',
      'createAccount': 'Créer un compte',
      'forgotPassword': 'Mot de passe oublié ?',
      'forgotPasswordSub': 'Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.',
      'forgotPasswordSent': '✅ E-mail de réinitialisation envoyé ! Vérifiez votre boîte de réception.',
      'sendReset': 'Envoyer le lien',
      'agreeTerms': 'En continuant, vous acceptez nos conditions',
      'chooseLanguage': 'Choisissez votre langue',
      'langSub': 'NearMe est disponible en plusieurs langues',
      'selectLanguage': 'Sélectionner la langue',
      'selectCountry': 'Sélectionnez votre pays',
      'searchCountries': 'Rechercher des pays…',
      'continueBtn': 'Continuer',
      'changeAnytime': 'Vous pouvez changer cela à tout moment dans les paramètres',
      'discover': 'Découvrir',
      'matches': 'Matchs',
      'profile': 'Profil',
      'filters': 'Filtres',
      'nope': 'Non',
      'superLike': 'Super',
      'like': 'J\'aime',
      'trialBanner': '🎁 Essai gratuit actif',
      'noMatchesYet': 'Pas encore de matchs',
      'noMatchesSub': 'Commencez à swiper pour trouver votre match parfait à proximité ! 💕',
      'itsAMatch': 'C\'est un Match ! 🎉',
      'sendMessage': 'Envoyer un message',
      'keepSwiping': 'Continuer à swiper',
      'aboutMe': 'À propos de moi',
      'myPhotos': 'Mes photos',
      'myInterests': 'Mes centres d\'intérêt',
      'settings': 'Paramètres',
      'editProfile': 'Modifier le profil',
      'logout': 'Déconnexion',
      'verifyIdentity': 'Vérifiez votre identité',
      'verifySub': 'Pour garder notre communauté en sécurité, veuillez vérifier votre identité à l\'aide d\'un document valide.',
      'idCard': 'Carte d\'identité',
      'passport': 'Passeport',
      'driverLicense': 'Permis de conduire',
      'uploadDoc': 'Télécharger le document',
      'verifying': 'Vérification...',
      'gender': 'Genre',
      'height': 'Taille (cm)',
      'bio': 'Bio',
      'intention': 'Intention',
      'location': 'Localisation',
      'interests': 'Intérêts',
      'photos': 'Photos',
      'verification': 'Vérification faciale',
      'skipForNow': 'Passer pour le moment',
      'next': 'Suivant',
      'previous': 'Précédent',
      'addPhoto': 'Ajouter une photo',
      'editPhotos': 'Modifier les photos',
      'deletePhoto': 'Supprimer la photo',
      'uploadingPhotos': 'Téléchargement…',
      'photoRequired': 'Ajoutez au moins 1 photo',
      'confirmDeletePhoto': 'Supprimer cette photo ?',
      'friendship': 'Amitié',
      'marriage': 'Mariage',
      'fun': 'Fun',
      'sex': 'Sexe',
      'cancel': 'Annuler',
      'finish': 'Terminer',
      'welcomeBack': 'Bon retour ! Entrez vos identifiants.',
      'noAccount': 'Vous n\'avez pas de compte ? ',
      'signInWithEmail': 'Se connecter avec l\'e-mail',
      'signInWithGoogle': 'Se connecter avec Google',
      'signInWithApple': 'Se connecter avec Apple',
      'findSomeoneNearby': 'Trouvez quelqu\'un\nprès de chez vous',
      'connectToDiscover': 'Connectez-vous pour découvrir des personnes\nautour de vous dès maintenant',
      'accountCreated': 'Compte créé ! Veuillez vous connecter 🎉',
      'createAccountStep': 'Créer un compte',
      'startAdventure': 'Commencez votre aventure NearMe.',
      'yourProfile': 'Votre profil',
      'selectDate': 'Sélectionner une date',
      'iAm': 'JE SUIS',
      'interestedIn': 'INTÉRESSÉ(E) PAR',
      'maxDistance': 'DISTANCE MAXIMALE',
      'tellUsMore': 'Dites-nous en un peu plus...',
      'yourInterests': 'Vos centres d\'intérêt',
      'profilePhotos': 'Photos de profil',
      'maxPhotos': 'Maximum 6 photos',
      'errorPhoto': 'Erreur de photo',
      'updateError': 'Erreur lors de la mise à jour',
      'realProximityTitle': 'Vraie proximité',
      'realProximityDesc': 'Découvrez des personnes passionnantes à quelques pas de vous en temps réel.',
      'maxSafetyTitle': 'Sécurité maximale',
      'maxSafetyDesc': 'Chaque profil est vérifié pour garantir des rencontres authentiques et paisibles.',
      'instantConnectionsTitle': 'Connexions instantanées',
      'instantConnectionsDesc': 'N\'attendez pas des jours pour une réponse. Connectez-vous et rencontrez-vous maintenant.',
      'privacyPolicyTitle': 'Politique de confidentialité',
      'safetyRulesTitle': 'Règles de sécurité',
      'termsOfUseShort': 'En continuant, vous acceptez nos conditions d\'utilisation',
      'meetPeopleNearby': 'Rencontrez des gens à proximité',
      'privacy_policy_content': '''Chez NearMe, nous prenons votre vie privée très au sérieux.

1. Collecte des données
Nous collectons les informations que vous nous fournissez directement : nom, e-mail, photos et préférences de profil. Nous utilisons également votre localisation en temps réel pour vous proposer des rencontres pertinentes à proximité.

2. Utilisation de la localisation
Votre position exacte n'est jamais partagée avec d'autres utilisateurs. Nous n'affichons qu'une distance approximative pour préserver votre sécurité.

3. Partage des données
Nous ne vendons jamais vos données personnelles à des tiers. Vos informations sont utilisées exclusivement pour le fonctionnement de l'application et l'amélioration de votre expérience.

4. Sécurité
Toutes vos données sont cryptées et stockées sur des serveurs sécurisés. Vous pouvez supprimer votre compte et vos données à tout moment depuis les paramètres.''',
      'safety_rules_content': '''Pour que NearMe reste un endroit sûr et agréable pour tous :

1. Soyez respectueux
Les comportements abusifs, le harcèlement ou les discours de haine ne sont pas tolérés. Tout signalement fera l'objet d'une enquête immédiate.

2. Authenticité
Utilisez de vraies photos de vous. L'usurpation d'identité est strictement interdite et entraîne un bannissement définitif.

3. Rencontres réelles
Lorsque vous rencontrez quelqu'un pour la première fois, faites-le dans un lieu public et informez un proche de vos projets.

4. Signalement
N'hésitez pas à signaler tout profil suspect ou comportement déplacé. Notre équipe de modération est active 24/7.''',
      'verifyAge': 'Vérifiez votre âge',
      'idDocVerification': 'Vérification du document d\'identité',
      'secureIdVerification': 'Vérification d\'identité sécurisée',
      'stripeVerificationNotice': 'Votre identité est vérifiée en toute sécurité par Stripe. Votre document n\'est jamais stocké.',
      'verifyWithId': 'Vérifier l\'âge',
      'verifyingIdentity': 'Vérification de votre âge',
      'takes30Seconds': 'Cela prend généralement moins de 30 secondes.',
      'verified': 'Vérifié !',
      'welcomeToNearme': 'Votre âge a été confirmé. Vous êtes autorisé à utiliser NearMe !\nRedirection vers la connexion...',
      'startExploring': 'Commencer à explorer',
      'uploadDocument': 'Téléchargez votre document',
      'docTypesList': 'Carte d\'identité, passeport ou permis de conduire',
      'selectDocType': 'Sélectionner le type de document',
      'docCapturedSuccess': 'Document capturé avec succès',
      'takePhoto': 'Prendre une photo',
      'chooseGallery': 'Choisir dans la galerie',
      'continueToVerification': 'Continuer vers la vérification',
      'chooseDifferentDoc': 'Choisir un autre document',
      'interests_list':
          '🎬 Cinéma,🍴 Restaurant,📚 Mangas,🛍️ Shopping,🎭 Humour,🎮 Jeux vidéo,🧘 Méditation,🍹 Verre/Apéro,✈️ Voyage,🎵 Musique,⚽ Sport,📖 Lecture,💪 Musculation,🍳 Cuisine,🥾 Randonnée,🎨 Art,💃 Danse,🎙️ Podcasts,🚴 Cyclisme',
    },
    'en': {
      // ── Onboarding ──────────────────────────────────────────────────
      'tagline': 'Meet your next favorite person right in your neighborhood.',
      'subTagline':
          'The hyperlocal dating app. Real connections. Real proximity.',
      'startNow': 'Start Now',
      'joinFooter': 'Join thousands of locals already connecting nearby',
      // ── Auth ────────────────────────────────────────────────────────
      'login': 'Login',
      'register': 'Register',
      'email': 'Email',
      'password': 'Password',
      'fullName': 'Full Name',
      'confirmPassword': 'Confirm Password',
      'signIn': 'Sign In',
      'createAccount': 'Create Account',
      'forgotPassword': 'Forgot Password?',
      'forgotPasswordSub':
          'Enter your email and we\'ll send you a reset link.',
      'forgotPasswordSent':
          '✅ Reset email sent! Check your inbox.',
      'sendReset': 'Send Link',
      'agreeTerms': 'By continuing, you agree to our Terms',
      // ── Language / Country ──────────────────────────────────────────
      'chooseLanguage': 'Choose Your Language',
      'langSub': 'NearMe is available in English',
      'selectLanguage': 'Select Language',
      'selectCountry': 'Select Your Country',
      'searchCountries': 'Search countries…',
      'continueBtn': 'Continue',
      'changeAnytime': 'You can change this anytime in Settings',
      // ── Discover / Matching ─────────────────────────────────────────
      'discover': 'Discover',
      'matches': 'Matches',
      'profile': 'Profile',
      'filters': 'Filters',
      'nope': 'Nope',
      'superLike': 'Super',
      'like': 'Like',
      'trialBanner': '🎁 Free Trial Active',
      // ── Matches / Chat ──────────────────────────────────────────────
      'noMatchesYet': 'No matches yet',
      'noMatchesSub':
          'Start swiping to find your perfect match nearby! 💕',
      'itsAMatch': "It's a Match! 🎉",
      'sendMessage': 'Send a Message',
      'keepSwiping': 'Keep Swiping',
      // ── Profile ─────────────────────────────────────────────────────
      'aboutMe': 'About Me',
      'myPhotos': 'My Photos',
      'myInterests': 'My Interests',
      'settings': 'Settings',
      'editProfile': 'Edit Profile',
      'logout': 'Logout',
      // ── Identity / Registration ─────────────────────────────────────
      'verifyIdentity': 'Verify Your Identity',
      'verifySub':
          'To keep our community safe, please verify your identity using a valid document.',
      'idCard': 'ID Card',
      'passport': 'Passport',
      'driverLicense': 'Driver License',
      'uploadDoc': 'Upload Document',
      'verifying': 'Verifying...',
      'gender': 'Gender',
      'height': 'Height (cm)',
      'bio': 'Bio',
      'intention': 'Intention',
      'location': 'Location',
      'interests': 'Interests',
      'photos': 'Photos',
      'verification': 'Face Verification',
      'skipForNow': 'Skip for now',
      'next': 'Next',
      'previous': 'Previous',
      'addPhoto': 'Add a photo',
      'editPhotos': 'Edit photos',
      'deletePhoto': 'Delete photo',
      'uploadingPhotos': 'Uploading…',
      'photoRequired': 'Add at least 1 photo',
      'confirmDeletePhoto': 'Remove this photo?',
      'friendship': 'Friendship',
      'marriage': 'Marriage',
      'fun': 'Fun',
      'sex': 'Sex',
      'cancel': 'Cancel',
      'finish': 'Finish',
      'welcomeBack': 'Welcome back! Enter your credentials.',
      'noAccount': 'Don\'t have an account? ',
      'signInWithEmail': 'Sign in with Email',
      'signInWithGoogle': 'Sign in with Google',
      'signInWithApple': 'Sign in with Apple',
      'findSomeoneNearby': 'Find someone\nnear you',
      'connectToDiscover': 'Connect to discover people\naround you right now',
      'accountCreated': 'Account created! Please sign in 🎉',
      'createAccountStep': 'Create an Account',
      'startAdventure': 'Start your NearMe adventure.',
      'yourProfile': 'Your Profile',
      'selectDate': 'Select Date',
      'iAm': 'I AM',
      'interestedIn': 'INTERESTED IN',
      'maxDistance': 'MAXIMUM DISTANCE',
      'tellUsMore': 'Tell us a bit more...',
      'yourInterests': 'Your Interests',
      'profilePhotos': 'Profile Photos',
      'maxPhotos': 'Maximum 6 photos',
      'errorPhoto': 'Photo error',
      'updateError': 'Error during update',
      'realProximityTitle': 'Real Proximity',
      'realProximityDesc': 'Discover exciting people just a few steps away from you in real-time.',
      'maxSafetyTitle': 'Maximum Safety',
      'maxSafetyDesc': 'Every profile is verified to ensure authentic and peaceful encounters.',
      'instantConnectionsTitle': 'Instant Connections',
      'instantConnectionsDesc': 'Don\'t wait days for a response. Connect and meet now.',
      'privacyPolicyTitle': 'Privacy Policy',
      'safetyRulesTitle': 'Safety Rules',
      'termsOfUseShort': 'By continuing, you agree to our Terms of Use',
      'meetPeopleNearby': 'Meet people near you',
      'privacy_policy_content': '''At NearMe, we take your privacy very seriously.

1. Data Collection
We collect information you provide directly: name, email, photos, and profile preferences. We also use your real-time location to offer relevant encounters nearby.

2. Use of Location
Your exact position is never shared with other users. We only display an approximate distance to preserve your safety.

3. Data Sharing
We never sell your personal data to third parties. Your information is used exclusively for the operation of the application and the improvement of your experience.

4. Security
All your data is encrypted and stored on secure servers. You can delete your account and data at any time from the settings.''',
      'safety_rules_content': '''To keep NearMe a safe and pleasant place for everyone:

1. Be Respectful
Abusive behavior, harassment, or hate speech are not tolerated. Any report will be immediately investigated.

2. Authenticity
Use real photos of yourself. Identity theft is strictly prohibited and leads to a permanent ban.

3. Real Meetings
When you meet someone for the first time, do so in a public place and inform a loved one of your plans.

4. Reporting
Do not hesitate to report any suspicious profile or inappropriate behavior. Our moderation team is active 24/7.''',
      'verifyAge': 'Verify Your Age',
      'idDocVerification': 'Identity Document Verification',
      'secureIdVerification': 'Secure ID Verification',
      'stripeVerificationNotice': 'Your ID is verified securely by Stripe. Your document is never stored.',
      'verifyWithId': 'Verify Age',
      'verifyingIdentity': 'Verifying Your Age',
      'takes30Seconds': 'This usually takes less than 30 seconds.',
      'verified': 'Verified!',
      'welcomeToNearme': 'Your age has been confirmed. You are authorized to use NearMe!\nRedirecting to login...',
      'startExploring': 'Start Exploring',
      'uploadDocument': 'Upload Your Document',
      'docTypesList': 'ID Card, Passport, or Driving License',
      'selectDocType': 'Select Document Type',
      'docCapturedSuccess': 'Document captured successfully',
      'takePhoto': 'Take Photo',
      'chooseGallery': 'Choose from Gallery',
      'continueToVerification': 'Continue to Verification',
      'chooseDifferentDoc': 'Choose Different Document',
      'interests_list':
          '🎬 Cinema,🍴 Restaurant,📚 Mangas,🛍️ Shopping,🎭 Comedy,🎮 Video Games,🧘 Meditation,🍹 Snacks/Drink,✈️ Travel,🎵 Music,⚽ Sport,📖 Reading,💪 Gym,🍳 Cooking,🥾 Hiking,🎨 Art,💃 Dance,🎙️ Podcasts,🚴 Cycling',
    },
  };

  static String t(String langCode, String key) {
    return _data[langCode]?[key] ?? _data['en']?[key] ?? key;
  }
}
