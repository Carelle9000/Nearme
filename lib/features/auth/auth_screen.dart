import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../locale/locale_provider.dart';
import 'auth_provider.dart';
import 'multi_step_register.dart';
import '../../core/utils/toasts.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _showEmailForm = false;
  bool _isRegisteringMultiStep = false;
  final _loginEmail = TextEditingController();
  final _loginPassword = TextEditingController();

  @override
  void dispose() {
    _loginEmail.dispose();
    _loginPassword.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_loginEmail.text.trim(), _loginPassword.text);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.identity);
    } else if (auth.error != null) {
      _snack(auth.error!, error: true);
    }
  }

  Future<void> _showForgotPasswordDialog(
    BuildContext context,
    String Function(String) t,
  ) async {
    final emailCtrl = TextEditingController(text: _loginEmail.text.trim());

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          t('forgotPassword'),
          style: const TextStyle(
              fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(
            t('forgotPasswordSub'),
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 14),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            autofocus: true,
            decoration: InputDecoration(
              hintText: t('email'),
              prefixIcon:
                  const Icon(Icons.email_outlined, color: AppColors.violet),
            ),
          ),
        ]),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Annuler',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.violet,
              shape: const StadiumBorder(),
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              final auth = context.read<AuthProvider>();
              final ok =
                  await auth.forgotPassword(emailCtrl.text.trim());
              if (!mounted) return;
              if (ok) {
                _snack(t('forgotPasswordSent'));
              } else if (auth.error != null) {
                _snack(auth.error!, error: true);
              }
            },
            child: Text(t('sendReset'),
                style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    emailCtrl.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    if (error) {
      AppToasts.error(context, msg);
    } else {
      AppToasts.success(context, msg);
    }
  }

  Future<void> _loginWithGoogle() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.loginWithGoogle();
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.identity);
    } else if (auth.error != null) {
      _snack(auth.error!, error: true);
    }
  }

  Future<void> _loginWithApple() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.loginWithApple();
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.identity);
    } else if (auth.error != null) {
      _snack(auth.error!, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final busy = context.select<AuthProvider, bool>((a) => a.busy);

    // ── Vue inscription multi-étapes ────────────────────────────────────────
    if (_isRegisteringMultiStep) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: AppColors.textSecondary),
            onPressed: () =>
                setState(() => _isRegisteringMultiStep = false),
          ),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(children: [
              Expanded(
                child: MultiStepRegister(
                  onCancel: () =>
                      setState(() => _isRegisteringMultiStep = false),
                  onSuccess: (email) {
                    setState(() {
                      _isRegisteringMultiStep = false;
                      _showEmailForm = true;
                      _loginEmail.text = email;
                      _loginPassword.clear();
                    });
                    AppToasts.success(context, 'Compte créé ! Connectez-vous 🎉');
                  },
                ),
              ),
            ]),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Halos d'ambiance
          const _AmbientGlow(
            offset: Offset(0.82, 0.12),
            color: Color(0xFF7C3AED),
            radius: 260,
            opacity: 0.15,
          ),
          const _AmbientGlow(
            offset: Offset(0.12, 0.60),
            color: Color(0xFFF472B6),
            radius: 200,
            opacity: 0.08,
          ),

          // Fond spécifique pour la page de formulaire
          if (_showEmailForm)
            Positioned.fill(
              child: Opacity(
                opacity: 0.4,
                child: Image.network(
                  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(color: AppColors.bg),
                ),
              ),
            ),

          if (_showEmailForm)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppColors.bg.withValues(alpha: 0.8),
                      AppColors.bg,
                    ],
                  ),
                ),
              ),
            ),

          SafeArea(
            child: _showEmailForm
                ? _buildEmailFormView(t, busy)
                : _buildSocialView(),
          ),
        ],
      ),
    );
  }

  // ── Vue principale : illustration + 3 boutons ────────────────────────────

  Widget _buildSocialView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),

          // Image en fond au-dessus des boutons
          Container(
            height: 220,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(30),
              image: const DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop'),
                fit: BoxFit.cover,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.violet.withValues(alpha: 0.2),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(30),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    AppColors.bg.withValues(alpha: 0.7),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 28),

          // Phrase d'invitation
          Text(
            'Retrouvez quelqu\'un\nprès de vous',
            textAlign: TextAlign.center,
            style: GoogleFonts.fraunces(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Connectez-vous pour découvrir des personnes\nautour de vous en ce moment',
            textAlign: TextAlign.center,
            style: GoogleFonts.dmSans(
              fontSize: 12,
              color: AppColors.textSecondary,
              height: 1.55,
            ),
          ),

          const SizedBox(height: 36),

          // Connexion avec Email
          _SocialButton(
            icon: Icons.email_outlined,
            label: 'Connexion avec Email',
            filled: true,
            color: AppColors.violet,
            onTap: () => setState(() => _showEmailForm = true),
          ),
          const SizedBox(height: 12),

          // Connexion avec Google
          _SocialButton(
            customIcon: const _GoogleLetterIcon(),
            label: 'Connexion avec Google',
            filled: false,
            color: const Color(0xFF4285F4),
            onTap: () => _loginWithGoogle(),
          ),
          const SizedBox(height: 12),

          // Connexion avec Apple
          _SocialButton(
            icon: Icons.apple,
            label: 'Connexion avec Apple',
            filled: false,
            color: AppColors.textPrimary,
            onTap: () => _loginWithApple(),
          ),

          const SizedBox(height: 28),
        ],
      ),
    );
  }

  // ── Vue formulaire email ─────────────────────────────────────────────────

  Widget _buildEmailFormView(String Function(String) t, bool busy) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),

          // Bouton retour
          GestureDetector(
            onTap: () => setState(() => _showEmailForm = false),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.surface.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: const Icon(
                    Icons.arrow_back_ios_new_rounded,
                    size: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 40),

          Text(
            'Connexion',
            style: GoogleFonts.fraunces(
              fontSize: 34,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.8,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Content de vous revoir ! Entrez vos identifiants.',
            style: GoogleFonts.dmSans(
                fontSize: 15, color: AppColors.textSecondary, letterSpacing: 0.1),
          ),

          const SizedBox(height: 40),

          _LoginForm(
            emailCtrl: _loginEmail,
            passwordCtrl: _loginPassword,
            onSubmit: _login,
            onForgotPassword: () =>
                _showForgotPasswordDialog(context, t),
            busy: busy,
            t: t,
          ),

          const SizedBox(height: 14),
          Center(
            child: Text(
              t('agreeTerms'),
              textAlign: TextAlign.center,
              style: GoogleFonts.dmSans(
                  fontSize: 10, color: AppColors.textMuted, height: 1.5),
            ),
          ),
          const SizedBox(height: 28),

          // Signup link
          Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Pas encore de compte ? ',
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                GestureDetector(
                  onTap: () =>
                      setState(() => _isRegisteringMultiStep = true),
                  child: Text(
                    'S\'inscrire',
                    style: GoogleFonts.dmSans(
                      fontSize: 13,
                      color: AppColors.violet,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bouton connexion sociale
// ─────────────────────────────────────────────────────────────────────────────

class _SocialButton extends StatelessWidget {
  final IconData? icon;
  final Widget? customIcon;
  final String label;
  final bool filled;
  final Color color;
  final VoidCallback onTap;

  const _SocialButton({
    this.icon,
    this.customIcon,
    required this.label,
    required this.filled,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final iconWidget = customIcon ??
        Icon(icon!, color: filled ? Colors.white : color, size: 19);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 18),
        decoration: BoxDecoration(
          color: filled ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: filled ? Colors.transparent : AppColors.border,
            width: 1.5,
          ),
          boxShadow: filled
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.28),
                    blurRadius: 16,
                    offset: const Offset(0, 5),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            iconWidget,
            const SizedBox(width: 10),
            Text(
              label,
              style: GoogleFonts.dmSans(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: filled ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoogleLetterIcon extends StatelessWidget {
  const _GoogleLetterIcon();

  @override
  Widget build(BuildContext context) {
    return Text(
      'G',
      style: GoogleFonts.dmSans(
        fontSize: 17,
        fontWeight: FontWeight.w900,
        color: const Color(0xFF4285F4),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Illustration de proximité
// ─────────────────────────────────────────────────────────────────────────────

class _ProximityIllustration extends StatelessWidget {
  const _ProximityIllustration();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 170,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Halo central
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  const Color(0xFF7C3AED).withValues(alpha: 0.12),
                  Colors.transparent,
                ],
              ),
            ),
          ),

          // Ligne pointillée de connexion
          Positioned.fill(
            child: CustomPaint(painter: _ConnectionLinePainter()),
          ),

          // Avatar gauche (femme)
          Positioned(
            left: 20,
            child: _PersonAvatar(
                emoji: '👩', color: AppColors.pink),
          ),

          // Avatar droite (homme)
          Positioned(
            right: 20,
            child: _PersonAvatar(
                emoji: '🧑', color: AppColors.violet),
          ),

          // Épingle de localisation centrale
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surface,
              border: Border.all(color: AppColors.violet, width: 2),
              boxShadow: [
                BoxShadow(
                  color: AppColors.violet.withValues(alpha: 0.40),
                  blurRadius: 14,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: const Icon(
              Icons.location_on_rounded,
              color: AppColors.violet,
              size: 21,
            ),
          ),
        ],
      ),
    );
  }
}

class _PersonAvatar extends StatelessWidget {
  final String emoji;
  final Color color;
  const _PersonAvatar({required this.emoji, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.12),
        border: Border.all(color: color.withValues(alpha: 0.30), width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.18),
            blurRadius: 16,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Center(
        child: Text(emoji, style: const TextStyle(fontSize: 28)),
      ),
    );
  }
}

class _ConnectionLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x357C3AED)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final centerY = size.height / 2;
    const startX = 80.0;
    final endX = size.width - 80.0;
    const dashW = 6.0;
    const gapW = 5.0;
    var x = startX;
    while (x < endX) {
      final to = (x + dashW).clamp(0.0, endX);
      canvas.drawLine(Offset(x, centerY), Offset(to, centerY), paint);
      x += dashW + gapW;
    }
  }

  @override
  bool shouldRepaint(_ConnectionLinePainter old) => false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Halo d'ambiance
// ─────────────────────────────────────────────────────────────────────────────

class _AmbientGlow extends StatelessWidget {
  final Offset offset;
  final Color color;
  final double radius;
  final double opacity;

  const _AmbientGlow({
    required this.offset,
    required this.color,
    required this.radius,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Positioned(
      left: size.width * offset.dx - radius,
      top: size.height * offset.dy - radius,
      child: Container(
        width: radius * 2,
        height: radius * 2,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color.withValues(alpha: opacity),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
          child: Container(color: Colors.transparent),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulaire de connexion par email
// ─────────────────────────────────────────────────────────────────────────────

class _LoginForm extends StatelessWidget {
  final TextEditingController emailCtrl;
  final TextEditingController passwordCtrl;
  final VoidCallback onSubmit;
  final VoidCallback onForgotPassword;
  final bool busy;
  final String Function(String) t;

  const _LoginForm({
    required this.emailCtrl,
    required this.passwordCtrl,
    required this.onSubmit,
    required this.onForgotPassword,
    required this.busy,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _ModernTextField(
          controller: emailCtrl,
          hintText: t('email'),
          icon: Icons.alternate_email_rounded,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 18),
        _ModernTextField(
          controller: passwordCtrl,
          hintText: t('password'),
          icon: Icons.shield_outlined,
          obscureText: true,
        ),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: onForgotPassword,
            child: Text(
              t('forgotPassword'),
              style: GoogleFonts.dmSans(
                fontSize: 13,
                color: AppColors.violetGlow,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 30),
        SizedBox(
          width: double.infinity,
          height: 58,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppColors.violet.withValues(alpha: 0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: busy ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.violet,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                elevation: 0,
              ),
              child: busy
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: Colors.white),
                    )
                  : Text(
                      t('signIn').toUpperCase(),
                      style: GoogleFonts.dmSans(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        letterSpacing: 1.2,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ModernTextField extends StatelessWidget {
  final TextEditingController controller;
  final String hintText;
  final IconData icon;
  final bool obscureText;
  final TextInputType? keyboardType;

  const _ModernTextField({
    required this.controller,
    required this.hintText,
    required this.icon,
    this.obscureText = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
        child: TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          style: GoogleFonts.dmSans(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: GoogleFonts.dmSans(
              color: AppColors.textSecondary.withValues(alpha: 0.7),
              fontSize: 15,
            ),
            prefixIcon: Icon(icon, color: AppColors.violetGlow, size: 22),
            filled: true,
            fillColor: AppColors.surface.withValues(alpha: 0.6),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: AppColors.violet, width: 1.5),
            ),
          ),
        ),
      ),
    );
  }
}
