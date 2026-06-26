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
      Navigator.of(context).pushReplacementNamed(AppRoutes.discover);
    } else if (auth.error != null) {
      _snack(auth.error!, error: true);
    }
  }

  Future<void> _showForgotPasswordDialog(BuildContext context, String Function(String) t) async {
    final emailCtrl = TextEditingController(text: _loginEmail.text.trim());
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceHigh,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(t('forgotPassword'), style: GoogleFonts.fraunces(fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(t('forgotPasswordSub'), style: GoogleFonts.dmSans(color: AppColors.textSecondary, fontSize: 14)),
          const SizedBox(height: 16),
          TextField(
            controller: emailCtrl, keyboardType: TextInputType.emailAddress, autofocus: true,
            style: GoogleFonts.dmSans(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: t('email'), hintStyle: GoogleFonts.dmSans(color: AppColors.textMuted),
              prefixIcon: const Icon(Icons.email_outlined, color: AppColors.violet),
              filled: true, fillColor: AppColors.surface,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: Text(t('cancel'), style: GoogleFonts.dmSans(color: AppColors.textSecondary))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.violet, shape: const StadiumBorder()),
            onPressed: () async {
              Navigator.of(ctx).pop();
              final auth = context.read<AuthProvider>();
              final ok = await auth.forgotPassword(emailCtrl.text.trim());
              if (!mounted) return;
              if (ok) _snack(t('forgotPasswordSent')); else if (auth.error != null) _snack(auth.error!, error: true);
            },
            child: Text(t('sendReset'), style: GoogleFonts.dmSans(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    emailCtrl.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    if (error) AppToasts.error(context, msg); else AppToasts.success(context, msg);
  }


  Widget _buildTopHeader() {
    return Column(
      children: [
        Container(
          width: 56, height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppColors.violet.withValues(alpha: 0.25),
                blurRadius: 20,
                spreadRadius: 1,
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Image.asset(
            'assets/images/logo.jpeg',
            fit: BoxFit.cover,
            errorBuilder: (ctx, _, __) => Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.violetGradient,
              ),
              child: const Icon(Icons.near_me_rounded, color: Colors.white, size: 24),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text('Nearme', style: GoogleFonts.fraunces(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary, letterSpacing: -0.5)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final busy = context.select<AuthProvider, bool>((a) => a.busy);

    if (_isRegisteringMultiStep) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        body: Stack(
          children: [
            Positioned.fill(child: Container(decoration: const BoxDecoration(gradient: AppColors.midnightGradient))),
            const _AmbientGlow(offset: Offset(0.9, 0.1), color: AppColors.violet, radius: 250, opacity: 0.1),
            const _AmbientGlow(offset: Offset(0.1, 0.9), color: AppColors.pink, radius: 200, opacity: 0.05),
            SafeArea(
              child: Column(children: [
                Align(alignment: Alignment.centerLeft, child: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.textSecondary, size: 20), onPressed: () => setState(() => _isRegisteringMultiStep = false))),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: MultiStepRegister(
                      onCancel: () =>
                          setState(() => _isRegisteringMultiStep = false),
                      onSuccess: (email) {
                        final auth = context.read<AuthProvider>();
                        if (auth.isLoggedIn) {
                          // Already logged in and verified after multi-step registration
                          Navigator.of(context)
                              .pushReplacementNamed(AppRoutes.discover);
                        } else {
                          setState(() {
                            _isRegisteringMultiStep = false;
                            _showEmailForm = true;
                            _loginEmail.text = email;
                            _loginPassword.clear();
                          });
                          AppToasts.success(
                              context, t('accountCreated'));
                        }
                      },
                    ),
                  ),
                ),
              ]),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(child: Container(decoration: const BoxDecoration(gradient: AppColors.midnightGradient))),
          const _AmbientGlow(offset: Offset(0.8, 0.2), color: AppColors.violet, radius: 260, opacity: 0.12),
          const _AmbientGlow(offset: Offset(0.2, 0.7), color: AppColors.pink, radius: 200, opacity: 0.08),

          if (_showEmailForm) ...[
            Positioned.fill(child: Opacity(opacity: 0.2, child: Image.network('https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop', fit: BoxFit.cover, cacheWidth: 800, errorBuilder: (_, __, ___) => Container()))),
            Positioned.fill(child: Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [AppColors.bg.withValues(alpha: 0.7), AppColors.bg])))),
          ],

          SafeArea(child: _showEmailForm ? _buildEmailFormView(t, busy) : _buildSocialView(t)),
        ],
      ),
    );
  }

  Widget _buildSocialView(String Function(String) t) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          _buildTopHeader(),
          const SizedBox(height: 30),
          Container(
            height: 220,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(30), image: const DecorationImage(image: NetworkImage('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop'), fit: BoxFit.cover), boxShadow: [BoxShadow(color: AppColors.violet.withValues(alpha: 0.2), blurRadius: 30, offset: const Offset(0, 10))]),
            child: Container(decoration: BoxDecoration(borderRadius: BorderRadius.circular(30), gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, AppColors.bg.withValues(alpha: 0.8)]))),
          ),
          const SizedBox(height: 32),
          Text(t('findSomeoneNearby'), textAlign: TextAlign.center, style: GoogleFonts.fraunces(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.5, height: 1.1)),
          const SizedBox(height: 12),
          Text(t('connectToDiscover'), textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 13, color: AppColors.textSecondary, height: 1.5)),
          const SizedBox(height: 40),
          _SocialButton(icon: Icons.email_outlined, label: t('signInWithEmail'), filled: true, color: AppColors.violet, onTap: () => setState(() => _showEmailForm = true)),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildEmailFormView(String Function(String) t, bool busy) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.start, children: [
            GestureDetector(onTap: () => setState(() => _showEmailForm = false), child: ClipRRect(borderRadius: BorderRadius.circular(12), child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), child: Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.surface.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withValues(alpha: 0.1))), child: const Icon(Icons.arrow_back_ios_new_rounded, size: 15, color: AppColors.textPrimary))))),
            _buildTopHeader(),
            const SizedBox(width: 40),
          ]),
          const SizedBox(height: 48),
          Text(t('login'), style: GoogleFonts.fraunces(fontSize: 36, fontWeight: FontWeight.w900, color: AppColors.textPrimary, letterSpacing: -1.0)),
          const SizedBox(height: 12),
          Text(t('welcomeBack'), style: GoogleFonts.dmSans(fontSize: 15, color: AppColors.textSecondary)),
          const SizedBox(height: 48),
          _LoginForm(emailCtrl: _loginEmail, passwordCtrl: _loginPassword, onSubmit: _login, onForgotPassword: () => _showForgotPasswordDialog(context, t), busy: busy, t: t),
          const SizedBox(height: 32),
          Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Text(t('noAccount'), style: GoogleFonts.dmSans(fontSize: 14, color: AppColors.textSecondary)), GestureDetector(onTap: () => setState(() => _isRegisteringMultiStep = true), child: Text(t('register'), style: GoogleFonts.dmSans(fontSize: 14, color: AppColors.violet, fontWeight: FontWeight.w800)))])) ,
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData? icon; final Widget? customIcon; final String label; final bool filled; final Color color; final VoidCallback onTap;
  const _SocialButton({this.icon, this.customIcon, required this.label, required this.filled, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(onTap: onTap, child: Container(padding: const EdgeInsets.symmetric(vertical: 14), decoration: BoxDecoration(color: filled ? color : Colors.transparent, borderRadius: BorderRadius.circular(20), border: Border.all(color: filled ? Colors.transparent : Colors.white.withValues(alpha: 0.1), width: 1.5), boxShadow: filled ? [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 5))] : null), child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [customIcon ?? Icon(icon!, color: filled ? Colors.white : color, size: 20), const SizedBox(width: 12), Text(label, style: GoogleFonts.dmSans(fontSize: 14, fontWeight: FontWeight.w700, color: filled ? Colors.white : AppColors.textPrimary))])));
  }
}

class _GoogleLetterIcon extends StatelessWidget {
  const _GoogleLetterIcon();
  @override
  Widget build(BuildContext context) { return Text('G', style: GoogleFonts.dmSans(fontSize: 18, fontWeight: FontWeight.w900, color: const Color(0xFF4285F4))); }
}

class _AmbientGlow extends StatelessWidget {
  final Offset offset; final Color color; final double radius; final double opacity;
  const _AmbientGlow({required this.offset, required this.color, required this.radius, required this.opacity});
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Positioned(left: size.width * offset.dx - radius, top: size.height * offset.dy - radius, child: Container(width: radius * 2, height: radius * 2, decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: opacity)), child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80), child: Container(color: Colors.transparent))));
  }
}

class _LoginForm extends StatelessWidget {
  final TextEditingController emailCtrl, passwordCtrl; final VoidCallback onSubmit, onForgotPassword; final bool busy; final String Function(String) t;
  const _LoginForm({required this.emailCtrl, required this.passwordCtrl, required this.onSubmit, required this.onForgotPassword, required this.busy, required this.t});
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      _ModernTextField(controller: emailCtrl, hintText: t('email'), icon: Icons.alternate_email_rounded, keyboardType: TextInputType.emailAddress),
      const SizedBox(height: 20),
      _ModernTextField(controller: passwordCtrl, hintText: t('password'), icon: Icons.shield_outlined, obscureText: true),
      Align(alignment: Alignment.centerRight, child: TextButton(onPressed: onForgotPassword, child: Text(t('forgotPassword'), style: GoogleFonts.dmSans(fontSize: 13, color: AppColors.violetGlow, fontWeight: FontWeight.w600)))),
      const SizedBox(height: 32),
      SizedBox(width: double.infinity, height: 58, child: Container(decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: AppColors.violet.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 10))]), child: ElevatedButton(onPressed: busy ? null : onSubmit, style: ElevatedButton.styleFrom(backgroundColor: AppColors.violet, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), elevation: 0), child: busy ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white)) : Text(t('signIn').toUpperCase(), style: GoogleFonts.dmSans(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 1.2))))),
    ]);
  }
}

class _ModernTextField extends StatefulWidget {
  final TextEditingController controller; final String hintText; final IconData icon; final bool obscureText; final TextInputType? keyboardType;
  const _ModernTextField({required this.controller, required this.hintText, required this.icon, this.obscureText = false, this.keyboardType});
  @override State<_ModernTextField> createState() => _ModernTextFieldState();
}

class _ModernTextFieldState extends State<_ModernTextField> {
  late bool _obscured;
  @override void initState() { super.initState(); _obscured = widget.obscureText; }
  @override
  Widget build(BuildContext context) {
    return ClipRRect(borderRadius: BorderRadius.circular(20), child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5), child: TextField(controller: widget.controller, obscureText: _obscured, keyboardType: widget.keyboardType, style: GoogleFonts.dmSans(color: AppColors.textPrimary), decoration: InputDecoration(hintText: widget.hintText, hintStyle: GoogleFonts.dmSans(color: AppColors.textSecondary.withValues(alpha: 0.6)), prefixIcon: Icon(widget.icon, color: AppColors.violetGlow, size: 22), suffixIcon: widget.obscureText ? IconButton(icon: Icon(_obscured ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppColors.violetGlow, size: 22), onPressed: () => setState(() => _obscured = !_obscured)) : null, filled: true, fillColor: AppColors.surface.withValues(alpha: 0.4), contentPadding: const EdgeInsets.all(20), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: AppColors.violet, width: 1.5))))));
  }
}
