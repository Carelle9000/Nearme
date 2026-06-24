import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/toasts.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/identity/identity_verification_provider.dart';
import '../locale/locale_provider.dart';

class IdentityVerificationScreen extends StatefulWidget {
  const IdentityVerificationScreen({super.key});

  @override
  State<IdentityVerificationScreen> createState() =>
      _IdentityVerificationScreenState();
}

class _IdentityVerificationScreenState extends State<IdentityVerificationScreen> {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<IdentityVerificationProvider>();
    final t = context.watch<LocaleProvider>().t;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: switch (provider.step) {
          VerificationStep.documentCapture =>
            DocumentCaptureStep(onDocumentSelected: _handleDocumentSelected, t: t),
          VerificationStep.ageVerification =>
            AgeVerificationStep(onNext: _handleAgeStart, t: t),
          VerificationStep.verificationPending => VerificationPendingStep(t: t),
          VerificationStep.completed => VerificationCompleteStep(t: t),
        },
      ),
    );
  }

  Future<void> _handleDocumentSelected(String documentPath) async {
    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.user?.id;

    if (userId == null) {
      if (mounted) AppToasts.error(context, 'User not authenticated');
      return;
    }

    context
        .read<IdentityVerificationProvider>()
        .setDocumentAndContinue(documentPath, userId);
  }

  Future<void> _handleAgeStart() async {
    // Debug: check Firebase Auth status
    final firebaseUser = FirebaseAuth.instance.currentUser;
    debugPrint('[IdentityVerification] Firebase Auth UID: ${firebaseUser?.uid}');

    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.user?.id;

    if (userId == null) {
      if (mounted) AppToasts.error(context, 'User not authenticated');
      return;
    }

    final success =
        await context.read<IdentityVerificationProvider>().startAgeVerification(userId);

    if (!success && mounted) {
      AppToasts.error(context, 'Failed to start age verification');
    }
  }
}

// ─── Step 1: Age Verification ──────────────────────────────
class AgeVerificationStep extends StatelessWidget {
  final VoidCallback onNext;
  final String Function(String) t;
  const AgeVerificationStep({required this.onNext, required this.t});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 40),
        Text(
          t('verifyAge'),
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          t('idDocVerification'),
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
                  t('secureIdVerification'),
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
                    t('stripeVerificationNotice'),
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
              child: Text(t('verifyWithId')),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Step 2: Pending ───────────────────────────────────────
class VerificationPendingStep extends StatelessWidget {
  final String Function(String) t;
  const VerificationPendingStep({required this.t});

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
            t('verifyingIdentity'),
            style: GoogleFonts.fraunces(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            t('takes30Seconds'),
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

// ─── Step 3: Complete ─────────────────────────────────────
class VerificationCompleteStep extends StatefulWidget {
  final String Function(String) t;
  final VoidCallback? onFinish;
  const VerificationCompleteStep({required this.t, this.onFinish});

  @override
  State<VerificationCompleteStep> createState() =>
      _VerificationCompleteStepState();
}

class _VerificationCompleteStepState extends State<VerificationCompleteStep> {
  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero, () async {
      if (mounted) {
        AppToasts.success(context, widget.t('welcomeToNearme'));

        final auth = context.read<AuthProvider>();
        await auth.logout();

        if (mounted) {
          Navigator.of(context).pushNamedAndRemoveUntil(AppRoutes.auth, (route) => false);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: AppColors.violet),
    );
  }
}

// ─── Step 0: Document Capture ─────────────────────────────────
class DocumentCaptureStep extends StatefulWidget {
  final Function(String) onDocumentSelected;
  final String Function(String) t;
  const DocumentCaptureStep({required this.onDocumentSelected, required this.t});

  @override
  State<DocumentCaptureStep> createState() => _DocumentCaptureStepState();
}

class _DocumentCaptureStepState extends State<DocumentCaptureStep> {
  String? _selectedDocumentPath;
  Uint8List? _selectedDocumentBytes;
  String? _selectedDocumentType;

  final ImagePicker _picker = ImagePicker();

  Future<void> _pickDocument(ImageSource source) async {
    try {
      final image = await _picker.pickImage(source: source);
      if (image != null) {
        final bytes = await image.readAsBytes();
        setState(() {
          _selectedDocumentPath = image.path;
          _selectedDocumentBytes = bytes;
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            widget.t('uploadDocument'),
          style: GoogleFonts.fraunces(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          widget.t('docTypesList'),
          style: GoogleFonts.dmSans(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
          const SizedBox(height: 40),
          if (_selectedDocumentPath == null) ...[
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.violet.withValues(alpha: 0.15),
              ),
              child: const Icon(
                Icons.document_scanner_rounded,
                color: AppColors.violet,
                size: 50,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              widget.t('selectDocType'),
              style: GoogleFonts.dmSans(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                _DocumentTypeButton(
                  label: widget.t('idCard'),
                  icon: Icons.credit_card,
                  onTap: () {
                    setState(() => _selectedDocumentType = 'id_card');
                  },
                ),
                _DocumentTypeButton(
                  label: widget.t('passport'),
                  icon: Icons.assignment_ind,
                  onTap: () {
                    setState(() => _selectedDocumentType = 'passport');
                  },
                ),
                _DocumentTypeButton(
                  label: widget.t('driverLicense'),
                  icon: Icons.drive_eta,
                  onTap: () {
                    setState(() => _selectedDocumentType = 'driving_license');
                  },
                ),
              ],
            ),
          ] else ...[
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.violet, width: 2),
              ),
              child: Image.memory(
                _selectedDocumentBytes!,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              widget.t('docCapturedSuccess'),
              style: GoogleFonts.dmSans(
                fontSize: 14,
                color: AppColors.emerald,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const SizedBox(height: 40),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                if (_selectedDocumentPath == null) ...[
                  SizedBox(
                    width: double.infinity,
                    height: 58,
                    child: ElevatedButton.icon(
                      onPressed: _selectedDocumentType != null
                          ? () => _pickDocument(ImageSource.camera)
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.violet,
                      ),
                      icon: const Icon(Icons.camera_alt),
                      label: Text(widget.t('takePhoto')),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 58,
                    child: OutlinedButton.icon(
                      onPressed: _selectedDocumentType != null
                          ? () => _pickDocument(ImageSource.gallery)
                          : null,
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.violet),
                      ),
                      icon: const Icon(Icons.image, color: AppColors.violet),
                      label: Text(widget.t('chooseGallery')),
                    ),
                  ),
                ] else ...[
                  SizedBox(
                    width: double.infinity,
                    height: 58,
                    child: ElevatedButton(
                      onPressed: () {
                        widget.onDocumentSelected(_selectedDocumentPath!);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.violet,
                      ),
                      child: Text(widget.t('continueToVerification')),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 58,
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _selectedDocumentPath = null;
                          _selectedDocumentType = null;
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.violet),
                      ),
                      child: Text(widget.t('chooseDifferentDoc')),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentTypeButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _DocumentTypeButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.violet.withValues(alpha: 0.1),
            ),
            child: Icon(icon, color: AppColors.violet, size: 35),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.dmSans(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
