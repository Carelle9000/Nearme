import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;

import 'app.dart';
import 'data/services/auth_service.dart';
import 'data/services/face_compare_service.dart';
import 'data/services/locale_service.dart';
import 'data/services/push_notification_service.dart';
import 'data/services/stripe_identity_service.dart' show StripeIdentityService, StripeIdentityServiceStub;
import 'data/services/stripe_service.dart';
import 'data/services/user_service.dart';
import 'features/auth/auth_provider.dart';
import 'features/chat/chat_provider.dart';
import 'features/discover/discover_provider.dart';
import 'features/likes/likes_provider.dart';
import 'features/identity/identity_verification_provider.dart';
import 'features/locale/locale_provider.dart';
import 'features/matches/matches_provider.dart';
import 'features/notifications/notifications_provider.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Limit image cache size to prevent memory leaks/context loss on Web/Mobile
  PaintingBinding.instance.imageCache.maximumSizeBytes = 30 * 1024 * 1024; // 30 MB
  PaintingBinding.instance.imageCache.maximumSize = 100; // 100 images

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  await initializeDateFormatting();
  timeago.setLocaleMessages('en', timeago.EnMessages());

  final authService = AuthService();
  await authService.loadCurrentUser();

  final localeService = await LocaleService.create();

  // Initialize push notifications for current user
  final pushNotificationService = PushNotificationService();
  if (authService.isLoggedIn) {
    await pushNotificationService.init();
  }

  runApp(
    MultiProvider(
      providers: [
        Provider<AuthService>.value(value: authService),
        Provider<UserService>(create: (_) => UserService()),
        Provider<StripeService>(create: (_) => StripeService()),
        Provider<StripeIdentityService>(create: (_) => StripeIdentityServiceStub()),
        Provider<FaceCompareService>(create: (_) => FacePlusPlusService()),
        Provider<PushNotificationService>.value(value: pushNotificationService),
        ChangeNotifierProvider(create: (_) => AuthProvider(authService)),
        ChangeNotifierProvider(create: (_) => LocaleProvider(localeService)),
        ChangeNotifierProvider(
          create: (context) => DiscoverProvider(
            userService: context.read<UserService>(),
          ),
        ),
        ChangeNotifierProvider(create: (_) => MatchesProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => LikesProvider()),
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
        ChangeNotifierProvider(
          create: (context) => IdentityVerificationProvider(
            stripeIdentity: context.read<StripeIdentityService>(),
            authService: context.read<AuthService>(),
          ),
        ),
      ],
      child: const NearMeApp(),
    ),
  );
}
