import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'core/network/ws_service.dart';
import 'data/services/auth_service.dart';
import 'data/services/face_compare_service.dart';
import 'data/services/locale_service.dart';
import 'data/services/stripe_service.dart';
import 'features/auth/auth_provider.dart';
import 'features/discover/discover_provider.dart';
import 'features/locale/locale_provider.dart';
import 'features/matches/matches_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();

  final authService   = await AuthService.create(prefs);
  final localeService = await LocaleService.create();

  final wsService = WsService();
  if (authService.isLoggedIn && authService.accessToken != null) {
    await wsService.connect(authService.accessToken!);
  }

  runApp(
    MultiProvider(
      providers: [
        Provider<WsService>.value(value: wsService),

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
