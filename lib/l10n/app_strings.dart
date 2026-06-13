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
    LocaleInfo('es', 'Spanish', 'Español', '🇪🇸', false),
    LocaleInfo('fr', 'French', 'Français', '🇫🇷', false),
    LocaleInfo('de', 'German', 'Deutsch', '🇩🇪', false),
    LocaleInfo('pt', 'Portuguese', 'Português', '🇧🇷', false),
    LocaleInfo('ja', 'Japanese', '日本語', '🇯🇵', false),
    LocaleInfo('ko', 'Korean', '한국어', '🇰🇷', false),
    LocaleInfo('zh', 'Chinese', '中文', '🇨🇳', false),
    LocaleInfo('ar', 'Arabic', 'العربية', '🇸🇦', true),
    LocaleInfo('hi', 'Hindi', 'हिंदी', '🇮🇳', false),
    LocaleInfo('it', 'Italian', 'Italiano', '🇮🇹', false),
    LocaleInfo('tl', 'Filipino', 'Tagalog', '🇵🇭', false),
  ];

  static bool isRtl(String code) => supportedLocales
      .firstWhere((l) => l.code == code,
          orElse: () => supportedLocales.first)
      .rtl;

  static const Map<String, Map<String, String>> _data = {
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
      'langSub': 'NearMe is available in 12 languages across 40+ countries',
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
      'friendship': 'Friendship',
      'marriage': 'Marriage',
      'fun': 'Fun',
      'sex': 'Sex',
      'interests_list':
          '🎬 Cinema,🍴 Restaurant,📚 Mangas,🛍️ Shopping,🎭 Comedy,🎮 Video Games,🧘 Meditation,🍹 Snacks/Drink,✈️ Travel,🎵 Music,⚽ Sport,📖 Reading,💪 Gym,🍳 Cooking,🥾 Hiking,🎨 Art,💃 Dance,🎙️ Podcasts,🚴 Cycling',
    },
    'fr': {
      // ── Onboarding ──────────────────────────────────────────────────
      'tagline': 'Rencontrez votre prochaine personne préférée juste à côté.',
      'subTagline':
          "L'application de rencontres hyperlocale. De vraies connexions.",
      'startNow': 'Commencer',
      'joinFooter':
          "Rejoignez des milliers d'habitants qui se connectent près de chez vous",
      // ── Auth ────────────────────────────────────────────────────────
      'login': 'Connexion',
      'register': 'Inscription',
      'email': 'E-mail',
      'password': 'Mot de passe',
      'fullName': 'Nom complet',
      'confirmPassword': 'Confirmer le mot de passe',
      'signIn': 'Se connecter',
      'createAccount': 'Créer un compte',
      'forgotPassword': 'Mot de passe oublié ?',
      'forgotPasswordSub':
          'Entrez votre email, nous vous enverrons un lien de réinitialisation.',
      'forgotPasswordSent':
          '✅ Email envoyé ! Vérifiez votre boîte mail.',
      'sendReset': 'Envoyer le lien',
      'agreeTerms': 'En continuant, vous acceptez nos Conditions',
      // ── Language / Country ──────────────────────────────────────────
      'chooseLanguage': 'Choisissez votre langue',
      'langSub': 'NearMe est disponible en 12 langues dans 40+ pays',
      'selectLanguage': 'Sélectionner la langue',
      'selectCountry': 'Sélectionner votre pays',
      'searchCountries': 'Rechercher un pays…',
      'continueBtn': 'Continuer',
      'changeAnytime': 'Vous pouvez modifier cela dans Paramètres',
      // ── Discover / Matching ─────────────────────────────────────────
      'discover': 'Découvrir',
      'matches': 'Matchs',
      'profile': 'Profil',
      'filters': 'Filtres',
      'nope': 'Non',
      'superLike': 'Super',
      'like': 'Like',
      'trialBanner': '🎁 Essai gratuit actif',
      // ── Matches / Chat ──────────────────────────────────────────────
      'noMatchesYet': 'Pas encore de matchs',
      'noMatchesSub':
          'Commencez à swiper pour trouver votre match parfait ! 💕',
      'itsAMatch': 'Un Match ! 🎉',
      'sendMessage': 'Envoyer un message',
      'keepSwiping': 'Continuer à swiper',
      // ── Profile ─────────────────────────────────────────────────────
      'aboutMe': 'À propos de moi',
      'myPhotos': 'Mes Photos',
      'myInterests': 'Mes Centres d\'intérêts',
      'settings': 'Paramètres',
      'editProfile': 'Modifier le profil',
      'logout': 'Déconnexion',
      // ── Identity / Registration ─────────────────────────────────────
      'verifyIdentity': 'Vérifiez votre identité',
      'verifySub':
          'Pour la sécurité de notre communauté, merci de vérifier votre identité avec un document valide.',
      'idCard': 'Carte d\'identité',
      'passport': 'Passeport',
      'driverLicense': 'Permis de conduire',
      'uploadDoc': 'Charger le document',
      'verifying': 'Vérification...',
      'gender': 'Genre',
      'height': 'Taille (cm)',
      'bio': 'Bio',
      'intention': 'Intention',
      'location': 'Localisation',
      'interests': 'Centres d\'intérêts',
      'photos': 'Photos',
      'verification': 'Vérification faciale',
      'skipForNow': 'Passer pour l\'instant',
      'next': 'Suivant',
      'previous': 'Précédent',
      'friendship': 'Amitié',
      'marriage': 'Mariage',
      'fun': 'Fun',
      'sex': 'Sexe',
      'interests_list':
          '🎬 Cinéma,🍴 Restaurant,📚 Mangas,🛍️ Shopping,🎭 Comédie,🎮 Jeux Vidéos,🧘 Méditation,🍹 Snacks/Bt,✈️ Voyage,🎵 Musique,⚽ Sport,📖 Lecture,💪 Gym,🍳 Cuisine,🥾 Randonnée,🎨 Art,💃 Danse,🎙️ Podcasts,🚴 Cyclisme',
    },
    'es': {
      'tagline': 'Conoce a tu próxima persona favorita en tu barrio.',
      'subTagline': 'La app de citas hiperlocales. Conexiones reales.',
      'startNow': 'Comenzar',
      'joinFooter': 'Únete a miles de vecinos que ya se conectan cerca',
      'login': 'Iniciar sesión',
      'register': 'Registrarse',
      'email': 'Correo',
      'password': 'Contraseña',
      'fullName': 'Nombre completo',
      'confirmPassword': 'Confirmar contraseña',
      'signIn': 'Entrar',
      'createAccount': 'Crear cuenta',
      'forgotPassword': '¿Olvidaste tu contraseña?',
      'agreeTerms': 'Al continuar, aceptas nuestros Términos',
      'chooseLanguage': 'Elige tu idioma',
      'langSub': 'NearMe está en 12 idiomas y 40+ países',
      'selectLanguage': 'Seleccionar idioma',
      'selectCountry': 'Selecciona tu país',
      'searchCountries': 'Buscar países…',
      'continueBtn': 'Continuar',
      'changeAnytime': 'Puedes cambiarlo en Ajustes',
      'discover': 'Descubrir',
      'matches': 'Matches',
      'profile': 'Perfil',
      'filters': 'Filtros',
      'nope': 'No',
      'superLike': 'Super',
      'like': 'Like',
      'trialBanner': '🎁 Prueba gratuita activa',
      'noMatchesYet': 'Sin matches aún',
      'noMatchesSub': '¡Empieza a deslizar para encontrar tu match! 💕',
      'aboutMe': 'Sobre mí',
      'myPhotos': 'Mis Fotos',
      'myInterests': 'Mis Intereses',
      'settings': 'Ajustes',
      'editProfile': 'Editar perfil',
      'logout': 'Cerrar sesión',
      'sendMessage': 'Enviar mensaje',
      'keepSwiping': 'Seguir deslizando',
      'skipForNow': 'Omitir por ahora',
    },
  };

  static String t(String langCode, String key) {
    return _data[langCode]?[key] ?? _data['en']![key] ?? key;
  }
}
