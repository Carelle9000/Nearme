import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/toasts.dart';
import '../../features/identity/identity_verification_provider.dart';
import '../../features/locale/locale_provider.dart';

class IdentityVerificationScreen extends StatefulWidget {
  const IdentityVerificationScreen({super.key});

  @override
  State<IdentityVerificationScreen> createState() =>
      _IdentityVerificationScreenState();
}

class _IdentityVerificationScreenState extends State<IdentityVerificationScreen> {
  @override
  void initState() {
    super.initState();
    _setupWebsocketListener();
  }

  void _setupWebsocketListener() {
    // TODO: If you have WebSocket service, uncomment:
    // context.read<WsService>().on('verification:age_verified', (_) {
    //   context.read<IdentityVerificationProvider>()
    //       .onWebhookVerificationComplete(true);
    // });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<IdentityVerificationProvider>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: switch (provider.step) {
          VerificationStep.faceCapture =>
            _FaceVerificationStep(onNext: _handleFaceComplete),
          VerificationStep.ageVerification =>
            _AgeVerificationStep(onNext: _handleAgeStart),
          VerificationStep.verificationPending => const _VerificationPendingStep(),
          VerificationStep.completed => const _VerificationCompleteStep(),
        },
      ),
    );
  }

  Future<void> _handleFaceComplete(Uint8List selfie, Uint8List reference) async {
    final success = await context
        .read<IdentityVerificationProvider>()
        .startFaceVerification(
          selfieBytes: selfie,
          referenceBytes: reference,
        );

    if (success && mounted) {
      AppToasts.success(context, 'Face verified ✓');
    } else if (mounted) {
      AppToasts.error(context, 'Face verification failed');
    }
  }

  Future<void> _handleAgeStart() async {
    final success =
        await context.read<IdentityVerificationProvider>().startAgeVerification();

    if (!success && mounted) {
      AppToasts.error(context, 'Failed to start age verification');
    }
  }
}

// ─── Step 1: Face Verification ─────────────────────────────────
class _FaceVerificationStep extends StatefulWidget {
  final Future<void> Function(Uint8List selfie, Uint8List reference) onNext;
  const _FaceVerificationStep({required this.onNext});

  @override
  State<_FaceVerificationStep> createState() => _FaceVerificationStepState();
}

class _FaceVerificationStepState extends State<_FaceVerificationStep> {
  Uint8List? _selfieBytes;
  Uint8List? _referenceBytes;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 20),
        Text(
          'Verify Your Face',
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Step 1: Facial Recognition',
          style: GoogleFonts.dmSans(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 40),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            children: [
              _PhotoStep(
                title: 'Take a Selfie',
                subtitle: 'Clear, well-lit photo of your face',
                icon: Icons.camera_alt_rounded,
                isSelected: _selfieBytes != null,
                onCapture: () => _capturePhoto(isSelfie: true),
              ),
              const SizedBox(height: 32),
              _PhotoStep(
                title: 'Upload Profile Photo',
                subtitle: 'Match the angle and lighting',
                icon: Icons.image_rounded,
                isSelected: _referenceBytes != null,
                onCapture: () => _pickPhoto(),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: SizedBox(
            width: double.infinity,
            height: 58,
            child: ElevatedButton(
              onPressed: (_selfieBytes != null && _referenceBytes != null)
                  ? () => widget.onNext(_selfieBytes!, _referenceBytes!)
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.violet,
                disabledBackgroundColor: AppColors.border,
              ),
              child: Text('Next: Age Verification'.toUpperCase()),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _capturePhoto({required bool isSelfie}) async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: ImageSource.camera);

    if (xfile == null) return;

    final bytes = await xfile.readAsBytes();
    setState(() {
      if (isSelfie) {
        _selfieBytes = bytes;
      } else {
        _referenceBytes = bytes;
      }
    });
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: ImageSource.gallery);

    if (xfile == null) return;

    final bytes = await xfile.readAsBytes();
    setState(() => _referenceBytes = bytes);
  }
}

class _PhotoStep extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onCapture;

  const _PhotoStep({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onCapture,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.dmSans(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: GoogleFonts.dmSans(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: onCapture,
          child: Container(
            height: 200,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? AppColors.emerald : AppColors.border,
              ),
            ),
            child: isSelected
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: AppColors.emerald,
                          size: 48,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Photo selected',
                          style: GoogleFonts.dmSans(
                            color: AppColors.emerald,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  )
                : Center(
                    child: Icon(icon, color: AppColors.violet, size: 48),
                  ),
          ),
        ),
      ],
    );
  }
}

// ─── Step 2: Age Verification ──────────────────────────────────
class _AgeVerificationStep extends StatelessWidget {
  final VoidCallback onNext;
  const _AgeVerificationStep({required this.onNext});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 40),
        Text(
          'Verify Your Age',
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Step 2: Identity Document',
          style: GoogleFonts.dmSans(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 60),
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.violet.withValues(alpha: 0.15),
                  ),
                  child: const Icon(
                    Icons.credit_card_rounded,
                    color: AppColors.violet,
                    size: 44,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Secure ID Verification',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.dmSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'Your ID is never stored. Stripe verifies securely & deletes it immediately.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.dmSans(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: SizedBox(
            width: double.infinity,
            height: 58,
            child: ElevatedButton(
              onPressed: onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.violet,
              ),
              child: const Text('Verify with ID'),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Step 3: Pending ───────────────────────────────────────────
class _VerificationPendingStep extends StatelessWidget {
  const _VerificationPendingStep();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 60,
            height: 60,
            child: CircularProgressIndicator(
              strokeWidth: 4,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.violet),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Verifying Your Identity',
            style: GoogleFonts.fraunces(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This usually takes less than 30 seconds.',
            style: GoogleFonts.dmSans(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Step 4: Complete ─────────────────────────────────────────
class _VerificationCompleteStep extends StatelessWidget {
  const _VerificationCompleteStep();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.emerald,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Colors.white,
              size: 44,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Verified!',
            style: GoogleFonts.fraunces(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your identity has been verified.\nWelcome to NearMe!',
            textAlign: TextAlign.center,
            style: GoogleFonts.dmSans(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 40),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pushReplacementNamed(AppRoutes.discover);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.violet,
            ),
            child: const Text('Start Exploring'),
          ),
        ],
      ),
    );
  }
}
