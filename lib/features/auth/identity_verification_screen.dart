import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/toasts.dart';
import '../../data/services/stripe_service.dart';
import '../locale/locale_provider.dart';

class IdentityVerificationScreen extends StatefulWidget {
  const IdentityVerificationScreen({super.key});

  @override
  State<IdentityVerificationScreen> createState() =>
      _IdentityVerificationScreenState();
}

class _IdentityVerificationScreenState
    extends State<IdentityVerificationScreen> {
  String? _selectedDoc;
  bool _isBusy = false;

  Future<void> _verify() async {
    if (_selectedDoc == null || !mounted) return;
    setState(() => _isBusy = true);

    final stripe = context.read<StripeService>();

    try {
      final result = await stripe.startIdentityVerification(
        residenceCountry: 'US',
        documentCountry: 'US',
        documentType: _selectedDoc!,
      );

      if (!mounted) return;

      if (result.status == IdentityStatus.pending) {
        final finalResult = await stripe.simulateResult(approve: true);
        if (!mounted) return;

        if (finalResult.status == IdentityStatus.approved) {
          Navigator.of(context).pushReplacementNamed(AppRoutes.discover);
          return;
        }
      }

      // Verification failed path
      if (mounted) {
        setState(() => _isBusy = false);
        AppToasts.error(context, 'Verification failed. Please try again.');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isBusy = false);
        AppToasts.error(context, 'Error: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              const Center(
                child: Text('🛡️', style: TextStyle(fontSize: 60)),
              ),
              const SizedBox(height: 24),
              Text(
                t('verifyIdentity'),
                style: AppTheme.display(size: 30, color: AppColors.navy),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                t('verifySub'),
                style: AppTheme.body(size: 15, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              _DocOption(
                label: t('idCard'),
                icon: Icons.badge_outlined,
                selected: _selectedDoc == 'id_card',
                onTap: () => setState(() => _selectedDoc = 'id_card'),
              ),
              const SizedBox(height: 12),
              _DocOption(
                label: t('passport'),
                icon: Icons.public_outlined,
                selected: _selectedDoc == 'passport',
                onTap: () => setState(() => _selectedDoc = 'passport'),
              ),
              const SizedBox(height: 12),
              _DocOption(
                label: t('driverLicense'),
                icon: Icons.drive_eta_outlined,
                selected: _selectedDoc == 'driving_license',
                onTap: () => setState(() => _selectedDoc = 'driving_license'),
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: (_selectedDoc == null || _isBusy) ? null : _verify,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: AppColors.violet,
                  shape: const StadiumBorder(),
                ),
                child: _isBusy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child:
                            CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Text(t('uploadDoc').toUpperCase()),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _DocOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _DocOption({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.violet : AppColors.border,
            width: 2,
          ),
          boxShadow: [
            if (selected)
              BoxShadow(
                color: AppColors.violet.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: selected
                    ? AppColors.violet.withValues(alpha: 0.1)
                    : AppColors.bg,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: selected ? AppColors.violet : AppColors.navy,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Text(
              label,
              style: TextStyle(
                color: AppColors.navy,
                fontSize: 16,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
            const Spacer(),
            if (selected)
              const Icon(Icons.check_circle_rounded, color: AppColors.violet),
          ],
        ),
      ),
    );
  }
}
