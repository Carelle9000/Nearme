import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'data/services/auth_service.dart';
import 'data/services/face_compare_service.dart';
import 'data/services/locale_service.dart';
import 'data/services/stripe_service.dart';
import 'features/auth/auth_provider.dart';
import 'features/discover/discover_provider.dart';
import 'features/locale/locale_provider.dart';
import 'features/matches/matches_provider.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  final authService = AuthService();
  await authService.loadCurrentUser();

  final localeService = await LocaleService.create();

  runApp(
    MultiProvider(
      providers: [
        Provider<AuthService>.value(value: authService),
        Provider<StripeService>(create: (_) => StripeService()),
        Provider<FaceCompareService>(create: (_) => FacePlusPlusService()),
        ChangeNotifierProvider(create: (_) => AuthProvider(authService)),
        ChangeNotifierProvider(create: (_) => LocaleProvider(localeService)),
        ChangeNotifierProvider(create: (_) => DiscoverProvider()),
        ChangeNotifierProvider(create: (_) => MatchesProvider()),
      ],
      child: const NearMeApp(),
    ),
  );
}
