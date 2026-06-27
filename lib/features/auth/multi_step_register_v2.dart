import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/toasts.dart';
import '../../core/utils/validators.dart';
import '../../core/widgets/validated_text_field.dart';
import '../../core/widgets/password_field.dart';
import '../../core/widgets/loading_overlay.dart';
import '../../core/widgets/profile_photo_tile.dart';
import '../../data/models/app_user.dart';
import '../../data/services/photo_service.dart';
import '../../data/services/draft_service.dart';
import '../locale/locale_provider.dart';
import 'auth_provider.dart';
import '../../features/identity/identity_verification_provider.dart';

/// Refactored multi-step registration with 3 steps:
/// Step 0: Account (name, email, password)
/// Step 1: Profile+Interests+Photos (combined)
/// Step 2: Identity Verification
class MultiStepRegister extends StatefulWidget {
  final VoidCallback onCancel;
  final Function(String email) onSuccess;

  const MultiStepRegister({
    super.key,
    required this.onCancel,
    required this.onSuccess,
  });

  @override
  State<MultiStepRegister> createState() => _MultiStepRegisterState();
}

class _MultiStepRegisterState extends State<MultiStepRegister> {
  final _pageController = PageController();
  final _draftService = DraftService();

  int _currentStep = 0;
  bool _submitting = false;

  // Step 0: Account
  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _passCtrl;
  late TextEditingController _confirmPassCtrl;
  bool _termsAccepted = false;

  // Step 1: Profile + Interests + Photos
  String? _gender;
  String? _interestedIn;
  DateTime? _birthDate;
  double _searchDistance = 50;
  double _height = 170;
  late TextEditingController _bioCtrl;
  late TextEditingController _locationCtrl;
  Intention _intention = Intention.friendship;
  final List<String> _selectedInterests = [];
  final List<String> _localPhotoPaths = [];

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController();
    _emailCtrl = TextEditingController();
    _passCtrl = TextEditingController();
    _confirmPassCtrl = TextEditingController();
    _bioCtrl = TextEditingController();
    _locationCtrl = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _draftService.init();
      _loadDraft();
      context.read<IdentityVerificationProvider>().reset();
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    _bioCtrl.dispose();
    _locationCtrl.dispose();
    _pageController.dispose();
    super.dispose();
  }

  /// Load saved draft if available
  void _loadDraft() {
    if (!_draftService.hasDraft()) return;

    final accountData = _draftService.loadAccountStep();
    final profileData = _draftService.loadProfileStep();
    final photoPaths = _draftService.loadPhotoPaths();

    setState(() {
      if (accountData != null) {
        _nameCtrl.text = accountData['name'] ?? '';
        _emailCtrl.text = accountData['email'] ?? '';
        _passCtrl.text = accountData['password'] ?? '';
        _confirmPassCtrl.text = accountData['confirmPassword'] ?? '';
        _termsAccepted = accountData['termsAccepted'] ?? false;
      }

      if (profileData != null) {
        _gender = profileData['gender'];
        _interestedIn = profileData['interestedIn'];
        if (profileData['birthDate'] != null) {
          _birthDate = DateTime.tryParse(profileData['birthDate']);
        }
        _searchDistance = (profileData['searchDistance'] ?? 50).toDouble();
        _height = (profileData['height'] ?? 170).toDouble();
        _bioCtrl.text = profileData['bio'] ?? '';
        _locationCtrl.text = profileData['location'] ?? '';
        _intention = Intention.values.firstWhere(
          (i) => i.toString() == 'Intention.${profileData['intention']}',
          orElse: () => Intention.friendship,
        );
        final interests = profileData['interests'] as List?;
        if (interests != null) {
          _selectedInterests.addAll(interests.cast<String>());
        }
      }

      _localPhotoPaths.addAll(photoPaths);

      if (accountData != null && profileData != null && mounted) {
        final ageHours = _draftService.getDraftAgeInHours() ?? 0;
        AppToasts.info(context, 'Draft loaded (${ageHours}h old)');
      }
    });
  }

  /// Save current step as draft
  Future<void> _saveDraft() async {
    if (_currentStep == 0) {
      await _draftService.saveAccountStep(
        name: _nameCtrl.text,
        email: _emailCtrl.text,
        password: _passCtrl.text,
        confirmPassword: _confirmPassCtrl.text,
        termsAccepted: _termsAccepted,
      );
    } else if (_currentStep == 1) {
      if (_gender != null && _interestedIn != null && _birthDate != null) {
        await _draftService.saveProfileStep(
          gender: _gender!,
          interestedIn: _interestedIn!,
          birthDate: _birthDate!.toIso8601String(),
          searchDistance: _searchDistance,
          height: _height,
          bio: _bioCtrl.text,
          location: _locationCtrl.text,
          intention: _intention.toString().split('.').last,
          interests: _selectedInterests,
        );
        await _draftService.savePhotoPaths(_localPhotoPaths);
      }
    }
  }

  /// Validate current step
  String? _validateStep(int step) {
    if (step == 0) {
      // Account validation
      if (_nameCtrl.text.trim().isEmpty) return 'Enter your name';
      if (Validators.validateName(_nameCtrl.text) != null) {
        return Validators.validateName(_nameCtrl.text);
      }
      if (Validators.validateEmail(_emailCtrl.text) != null) {
        return Validators.validateEmail(_emailCtrl.text);
      }
      if (Validators.validatePassword(_passCtrl.text) != null) {
        return Validators.validatePassword(_passCtrl.text);
      }
      if (Validators.validatePasswordConfirm(_passCtrl.text, _confirmPassCtrl.text) != null) {
        return Validators.validatePasswordConfirm(_passCtrl.text, _confirmPassCtrl.text);
      }
      if (!_termsAccepted) return 'Accept terms and conditions';
    }
    if (step == 1) {
      // Profile validation
      if (_gender == null) return 'Select your gender';
      if (_interestedIn == null) return 'Who are you interested in?';
      if (_birthDate == null) return 'Enter your birth date';
      if (Validators.validateAge(_birthDate) != null) {
        return Validators.validateAge(_birthDate);
      }
      if (_localPhotoPaths.isEmpty) return 'Add at least one photo';
    }
    return null;
  }

  /// Move to next step or register
  Future<void> _next() async {
    final error = _validateStep(_currentStep);
    if (error != null) {
      AppToasts.error(context, error);
      return;
    }

    setState(() => _submitting = true);

    try {
      // Step 0: Register account
      if (_currentStep == 0) {
        final auth = context.read<AuthProvider>();
        final ok = await auth.register(
          name: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          password: _passCtrl.text,
        );
        if (!ok) {
          if (mounted && auth.error != null) {
            AppToasts.error(context, auth.error!);
          }
          setState(() => _submitting = false);
          return;
        }
        await _saveDraft();
      }

      // Step 1: Save profile
      if (_currentStep == 1) {
        await _saveDraft();
        final auth = context.read<AuthProvider>();
        final user = auth.user;
        if (user != null) {
          final updatedUser = user.copyWith(
            gender: _gender,
            interestedIn: _interestedIn,
            birthDate: _birthDate,
            searchDistance: _searchDistance,
            height: _height,
            bio: _bioCtrl.text.trim(),
            location: _locationCtrl.text.trim(),
            intention: _intention,
            interests: _selectedInterests,
          );
          await auth.updateProfile(updatedUser);
          if (_localPhotoPaths.isNotEmpty) {
            await auth.addPhotos(_localPhotoPaths);
          }
        }
      }

      // Move to next step
      if (_currentStep < 2) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOutCubic,
        );
        setState(() => _currentStep++);
      } else {
        // Finish registration
        await _draftService.clearDraft();
        widget.onSuccess(_emailCtrl.text.trim());
      }
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Registration error');
      debugPrint('Register error: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  /// Move to previous step
  void _prev() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
      setState(() => _currentStep--);
    } else {
      widget.onCancel();
    }
  }

  /// Add photo
  Future<void> _addPhoto() async {
    if (_localPhotoPaths.length >= 6) {
      if (mounted) AppToasts.info(context, 'Maximum 6 photos');
      return;
    }

    try {
      final xfile = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 80,
      );
      if (xfile == null) return;

      final localPath = await PhotoService.persistLocally(xfile);
      if (mounted) {
        setState(() => _localPhotoPaths.add(localPath));
        AppToasts.success(context, 'Photo added');
      }
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Failed to add photo');
      debugPrint('Photo error: $e');
    }
  }

  /// Remove photo
  void _removePhoto(int index) {
    PhotoService.deleteLocal(_localPhotoPaths[index]);
    setState(() => _localPhotoPaths.removeAt(index));
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final busy = context.select<AuthProvider, bool>((a) => a.busy) || _submitting;

    return LoadingOverlay(
      isLoading: _submitting,
      message: _submitting ? 'Saving your profile...' : null,
      child: Stack(
        children: [
          Column(
            children: [
              _BuildHeader(step: _currentStep),
              AppSpacing.vGapXl,
              _ProgressBar(currentStep: _currentStep, totalSteps: 3),
              AppSpacing.vGapXxl,
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _AccountStep(
                      nameCtrl: _nameCtrl,
                      emailCtrl: _emailCtrl,
                      passCtrl: _passCtrl,
                      confirmPassCtrl: _confirmPassCtrl,
                      termsAccepted: _termsAccepted,
                      onTermsChange: (v) => setState(() => _termsAccepted = v ?? false),
                      t: t,
                    ),
                    _ProfileStep(
                      gender: _gender,
                      onGenderChange: (v) => setState(() => _gender = v),
                      interestedIn: _interestedIn,
                      onInterestedInChange: (v) => setState(() => _interestedIn = v),
                      birthDate: _birthDate,
                      onBirthDateChange: (v) => setState(() => _birthDate = v),
                      searchDistance: _searchDistance,
                      onDistanceChange: (v) => setState(() => _searchDistance = v),
                      height: _height,
                      onHeightChange: (v) => setState(() => _height = v),
                      bioCtrl: _bioCtrl,
                      locationCtrl: _locationCtrl,
                      intention: _intention,
                      onIntentionChange: (v) => setState(() => _intention = v!),
                      selectedInterests: _selectedInterests,
                      onToggleInterest: (interest) {
                        setState(() {
                          if (_selectedInterests.contains(interest)) {
                            _selectedInterests.remove(interest);
                          } else {
                            _selectedInterests.add(interest);
                          }
                        });
                      },
                      photoPaths: _localPhotoPaths,
                      onAddPhoto: _addPhoto,
                      onRemovePhoto: _removePhoto,
                      t: t,
                    ),
                    _VerificationStep(
                      t: t,
                      onFinish: () => widget.onSuccess(_emailCtrl.text.trim()),
                    ),
                  ],
                ),
              ),
              if (_currentStep < 3)
                _NavBar(
                  currentStep: _currentStep,
                  busy: busy,
                  onPrev: _prev,
                  onNext: _next,
                  t: t,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Widgets Components
// ─────────────────────────────────────────────────────────────────────────────

class _BuildHeader extends StatelessWidget {
  final int step;

  const _BuildHeader({required this.step});

  @override
  Widget build(BuildContext context) {
    final titles = ['Create Account', 'Your Profile', 'Verification'];
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.violetGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.violet.withValues(alpha: 0.35),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: const Icon(Icons.near_me_rounded, color: Colors.white, size: 24),
        ),
        AppSpacing.vGapMd,
        Text(
          'NearMe',
          style: GoogleFonts.fraunces(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: AppColors.textPrimary,
          ),
        ),
        AppSpacing.vGapMd,
        Text(
          titles[step],
          style: GoogleFonts.fraunces(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _ProgressBar extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const _ProgressBar({
    required this.currentStep,
    required this.totalSteps,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: List.generate(
          totalSteps,
          (i) => Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: 6,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: i <= currentStep ? AppColors.violet : Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavBar extends StatelessWidget {
  final int currentStep;
  final bool busy;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final String Function(String) t;

  const _NavBar({
    required this.currentStep,
    required this.busy,
    required this.onPrev,
    required this.onNext,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg, horizontal: AppSpacing.lg),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: busy ? null : onPrev,
            child: Text(
              currentStep == 0 ? 'Cancel' : 'Back',
              style: GoogleFonts.dmSans(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: busy ? null : onNext,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
                vertical: AppSpacing.lg,
              ),
              backgroundColor: AppColors.violet,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
              ),
            ),
            child: busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    currentStep == 2 ? 'Finish' : 'Continue',
                    style: GoogleFonts.dmSans(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      letterSpacing: 1,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Widgets
// ─────────────────────────────────────────────────────────────────────────────

class _AccountStep extends StatelessWidget {
  final TextEditingController nameCtrl, emailCtrl, passCtrl, confirmPassCtrl;
  final bool termsAccepted;
  final ValueChanged<bool?> onTermsChange;
  final String Function(String) t;

  const _AccountStep({
    required this.nameCtrl,
    required this.emailCtrl,
    required this.passCtrl,
    required this.confirmPassCtrl,
    required this.termsAccepted,
    required this.onTermsChange,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.lg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ValidatedTextField(
            label: 'Full Name',
            hint: 'John Doe',
            prefixIcon: Icons.person_outline_rounded,
            controller: nameCtrl,
            validator: Validators.validateName,
          ),
          AppSpacing.vGapXl,
          ValidatedTextField(
            label: 'Email',
            hint: 'you@example.com',
            prefixIcon: Icons.alternate_email_rounded,
            controller: emailCtrl,
            keyboardType: TextInputType.emailAddress,
            validator: Validators.validateEmail,
          ),
          AppSpacing.vGapXl,
          PasswordField(
            label: 'Password',
            controller: passCtrl,
            showStrengthIndicator: true,
          ),
          AppSpacing.vGapXl,
          PasswordField(
            label: 'Confirm Password',
            controller: confirmPassCtrl,
            confirmPassword: passCtrl.text,
            showMatchIndicator: true,
          ),
          AppSpacing.vGapXxl,
          Row(
            children: [
              Checkbox(
                value: termsAccepted,
                onChanged: onTermsChange,
                activeColor: AppColors.violet,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              Expanded(
                child: Text(
                  'I agree to the Terms of Service and Privacy Policy',
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileStep extends StatelessWidget {
  final String? gender, interestedIn;
  final DateTime? birthDate;
  final double searchDistance, height;
  final ValueChanged<String?> onGenderChange, onInterestedInChange;
  final ValueChanged<DateTime?> onBirthDateChange;
  final ValueChanged<double> onDistanceChange, onHeightChange;
  final TextEditingController bioCtrl, locationCtrl;
  final Intention intention;
  final ValueChanged<Intention?> onIntentionChange;
  final List<String> selectedInterests;
  final ValueChanged<String> onToggleInterest;
  final List<String> photoPaths;
  final VoidCallback onAddPhoto;
  final Function(int) onRemovePhoto;
  final String Function(String) t;

  const _ProfileStep({
    required this.gender,
    required this.onGenderChange,
    required this.interestedIn,
    required this.onInterestedInChange,
    required this.birthDate,
    required this.onBirthDateChange,
    required this.searchDistance,
    required this.onDistanceChange,
    required this.height,
    required this.onHeightChange,
    required this.bioCtrl,
    required this.locationCtrl,
    required this.intention,
    required this.onIntentionChange,
    required this.selectedInterests,
    required this.onToggleInterest,
    required this.photoPaths,
    required this.onAddPhoto,
    required this.onRemovePhoto,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.lg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionTitle('Your Profile'),
          AppSpacing.vGapXxl,
          // Gender selection
          Text('Gender', style: _labelStyle),
          AppSpacing.vGapMd,
          Row(
            children: ['Male', 'Female', 'Other'].map((g) {
              final selected = gender == g;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => onGenderChange(g),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.violet.withValues(alpha: 0.2)
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                        border: Border.all(
                          color: selected ? AppColors.violet : AppColors.border,
                          width: 1.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          g,
                          style: GoogleFonts.dmSans(
                            fontSize: 13,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected ? AppColors.violet : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          AppSpacing.vGapXxl,
          // Interested in
          Text('Interested In', style: _labelStyle),
          AppSpacing.vGapMd,
          Row(
            children: ['Women', 'Men', 'Everyone'].map((g) {
              final selected = interestedIn == g;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => onInterestedInChange(g),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.violet.withValues(alpha: 0.2)
                            : AppColors.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                        border: Border.all(
                          color: selected ? AppColors.violet : AppColors.border,
                          width: 1.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          g,
                          style: GoogleFonts.dmSans(
                            fontSize: 13,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected ? AppColors.violet : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          AppSpacing.vGapXxl,
          // Birth date
          Text('Birth Date', style: _labelStyle),
          AppSpacing.vGapMd,
          GestureDetector(
            onTap: () async {
              final now = DateTime.now();
              final eighteenYearsAgo = now.subtract(const Duration(days: 365 * 18));
              final d = await showDatePicker(
                context: context,
                initialDate: birthDate ?? eighteenYearsAgo,
                firstDate: DateTime(1950),
                lastDate: eighteenYearsAgo,
              );
              if (d != null) onBirthDateChange(d);
            },
            child: Container(
              padding: EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today_rounded, color: AppColors.textMuted),
                  AppSpacing.hGapLg,
                  Text(
                    birthDate != null
                        ? DateFormat('MMM d, yyyy').format(birthDate!)
                        : 'Select your birth date',
                    style: GoogleFonts.dmSans(
                      color: birthDate != null
                          ? AppColors.textPrimary
                          : AppColors.textMuted,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AppSpacing.vGapXxl,
          // Distance slider
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Search Distance', style: _labelStyle),
                  Text(
                    '${searchDistance.toInt()} km',
                    style: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.violet,
                    ),
                  ),
                ],
              ),
              AppSpacing.vGapMd,
              Slider(
                value: searchDistance,
                min: 1,
                max: 100,
                divisions: 99,
                onChanged: onDistanceChange,
              ),
            ],
          ),
          AppSpacing.vGapXxl,
          // Height slider
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Height', style: _labelStyle),
                  Text(
                    '${height.toInt()} cm',
                    style: GoogleFonts.dmSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.violet,
                    ),
                  ),
                ],
              ),
              AppSpacing.vGapMd,
              Slider(
                value: height,
                min: 140,
                max: 220,
                divisions: 80,
                onChanged: onHeightChange,
              ),
            ],
          ),
          AppSpacing.vGapXxl,
          // Bio
          ValidatedTextField(
            label: 'Bio',
            hint: 'Tell us about yourself...',
            prefixIcon: Icons.description_outlined,
            controller: bioCtrl,
            maxLines: 4,
            minLines: 3,
            validator: (val) => Validators.validateBio(val),
            helperText: '${bioCtrl.text.length}/500 characters',
          ),
          AppSpacing.vGapXxl,
          // Location
          ValidatedTextField(
            label: 'Location',
            hint: 'City, Country',
            prefixIcon: Icons.location_on_outlined,
            controller: locationCtrl,
          ),
          AppSpacing.vGapXxl,
          // Intention
          Text('Looking For', style: _labelStyle),
          AppSpacing.vGapMd,
          DropdownButton<Intention>(
            value: intention,
            isExpanded: true,
            onChanged: onIntentionChange,
            items: Intention.values
                .map((i) => DropdownMenuItem(
                      value: i,
                      child: Text(i.toString().split('.').last),
                    ))
                .toList(),
          ),
          AppSpacing.vGapXxl,
          // Interests
          Text('Interests', style: _labelStyle),
          AppSpacing.vGapMd,
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.md,
            children: _sampleInterests.map((tag) {
              final selected = selectedInterests.contains(tag);
              return GestureDetector(
                onTap: () => onToggleInterest(tag),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                    vertical: AppSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: selected
                        ? AppColors.violet.withValues(alpha: 0.2)
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
                    border: Border.all(
                      color: selected ? AppColors.violet : AppColors.border,
                      width: 1,
                    ),
                  ),
                  child: Text(
                    tag,
                    style: GoogleFonts.dmSans(
                      fontSize: 12,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      color: selected ? AppColors.violet : AppColors.textSecondary,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          AppSpacing.vGapXxl,
          // Photos
          Text('Photos', style: _labelStyle),
          AppSpacing.vGapMd,
          if (photoPaths.isNotEmpty)
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: photoPaths.length + 1,
              itemBuilder: (ctx, i) {
                if (i == photoPaths.length) {
                  return GestureDetector(
                    onTap: onAddPhoto,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                        border: Border.all(
                          color: AppColors.border,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: const Icon(Icons.add_rounded, color: AppColors.violet),
                    ),
                  );
                }
                return Stack(
                  children: [
                    ProfilePhotoTile(path: photoPaths[i]),
                    Positioned(
                      right: 4,
                      top: 4,
                      child: GestureDetector(
                        onTap: () => onRemovePhoto(i),
                        child: Container(
                          decoration: const BoxDecoration(
                            color: Color(0xFFEF4444),
                            shape: BoxShape.circle,
                          ),
                          padding: EdgeInsets.all(AppSpacing.sm),
                          child: const Icon(
                            Icons.close_rounded,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            )
          else
            GestureDetector(
              onTap: onAddPhoto,
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(vertical: AppSpacing.xl),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.add_photo_alternate_rounded,
                      size: 40,
                      color: AppColors.violet.withValues(alpha: 0.5),
                    ),
                    AppSpacing.vGapMd,
                    Text(
                      'Add photos of yourself',
                      style: GoogleFonts.dmSans(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  static final _labelStyle = GoogleFonts.dmSans(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: AppColors.textMuted,
    letterSpacing: 0.5,
  );

  static const _sampleInterests = [
    'Travel',
    'Music',
    'Sports',
    'Art',
    'Cooking',
    'Movies',
    'Reading',
    'Gaming',
    'Fitness',
    'Nature',
    'Photography',
    'Yoga',
  ];
}

class _VerificationStep extends StatelessWidget {
  final String Function(String) t;
  final VoidCallback onFinish;

  const _VerificationStep({
    required this.t,
    required this.onFinish,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.violet.withValues(alpha: 0.15),
              ),
              child: const Icon(
                Icons.verified_user_rounded,
                color: AppColors.violet,
                size: 40,
              ),
            ),
            AppSpacing.vGapXxl,
            Text(
              'Identity Verification',
              textAlign: TextAlign.center,
              style: GoogleFonts.fraunces(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            AppSpacing.vGapMd,
            Text(
              'Verify your identity with Stripe for security',
              textAlign: TextAlign.center,
              style: GoogleFonts.dmSans(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
            AppSpacing.vGapXxl,
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushReplacementNamed(AppRoutes.identity);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.violet,
                  minimumSize: const Size.fromHeight(AppSpacing.buttonHeight),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
                  ),
                ),
                child: Text(
                  'Verify Identity',
                  style: GoogleFonts.dmSans(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.fraunces(
        fontSize: 24,
        fontWeight: FontWeight.w800,
        color: AppColors.textPrimary,
        letterSpacing: -0.5,
      ),
    );
  }
}
