import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/router/app_routes.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/auth_screen.dart';
import 'features/auth/identity_verification_screen.dart';
import 'features/chat/chat_screen.dart';
import 'features/landing/landing_screen.dart';
import 'features/landing/onboarding_screen.dart';
import 'features/locale/lang_select_screen.dart';
import 'features/locale/language_selection_screen.dart';
import 'features/locale/country_selection_screen.dart';
import 'features/locale/locale_provider.dart';
import 'features/shell/main_shell.dart';

class NearMeApp extends StatelessWidget {
  const NearMeApp({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final authProvider = context.read<AuthProvider>();
    final isLoggedIn = authProvider.isLoggedIn;

    // ✅ Vérifier si vérification d'âge est nécessaire après connexion
    String initialRoute = AppRoutes.landing;
    if (isLoggedIn) {
      // Au lieu d'aller directement à discover, vérifier si vérification nécessaire
      initialRoute = AppRoutes.discover;
      // La logique de redirection vers identity est dans MainShell ou AuthGuard
    }

    return MaterialApp(
      title: 'NearMe',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      locale: locale.locale,
      builder: (context, child) => Directionality(
        textDirection: locale.direction,
        child: child ?? const SizedBox.shrink(),
      ),
      // Returning users skip onboarding entirely
      initialRoute: initialRoute,
      routes: {
        AppRoutes.landing: (_) => const LandingScreen(),
        AppRoutes.onboarding: (_) => const OnboardingScreen(),
        AppRoutes.auth: (_) => const AuthScreen(),
        AppRoutes.langSelect: (_) => const LangSelectScreen(),
        AppRoutes.languageSelect: (_) => const LanguageSelectionScreen(),
        AppRoutes.countrySelect: (_) => const CountrySelectionScreen(),
        AppRoutes.identity: (_) => const IdentityVerificationScreen(),
        AppRoutes.discover: (_) =>
            const _AuthGuard(child: MainShell()),
        AppRoutes.chat: (_) =>
            const _AuthGuard(child: ChatScreen()),
      },
    );
  }
}

class _AuthGuard extends StatelessWidget {
  final Widget child;
  const _AuthGuard({required this.child});

  @override
  Widget build(BuildContext context) {
    final loggedIn =
        context.select<AuthProvider, bool>((a) => a.isLoggedIn);
    if (!loggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.auth);
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return child;
  }
}
