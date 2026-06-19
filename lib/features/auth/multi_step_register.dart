import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/toasts.dart';
import '../../core/widgets/signed_photo_image.dart';
import '../../data/models/app_user.dart';
import '../../data/services/photo_service.dart';
import '../locale/locale_provider.dart';
import 'auth_provider.dart';

// ─── Multi-step registration flow ─────────────────────────────────────────────
//
// Step 1: Account   (name / email / password)
// Step 2: Profile   (gender / height / bio / intention)
// Step 3: Interests
// Step 4: Photos    (profile photos — required minimum 1)
//

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
  int _currentStep = 0;

  // Step 1 — Account
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  // Step 2 — Profile
  String? _gender;
  double _height = 170;
  final _bioCtrl = TextEditingController();
  Intention _intention = Intention.friendship;

  // Step 3 — Interests
  final List<String> _selectedInterests = [];

  // Step 4 — Photos
  final List<String> _localPhotoPaths = [];

  // Extra account / profile fields
  final _confirmPassCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  bool _termsAccepted = false;
  bool _submitting = false;

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    _locationCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  // ── Photo picker ────────────────────────────────────────────────────────────

  Future<void> _addPhoto() async {
    if (_localPhotoPaths.length >= 6) {
      if (mounted) AppToasts.info(context, 'Maximum 6 photos');
      return;
    }
    final picker = ImagePicker();
    final xfile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (xfile == null) return;
    try {
      final localPath = await PhotoService.persistLocally(xfile);
      setState(() => _localPhotoPaths.add(localPath));
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Failed to load photo');
    }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  void _next() {
    final error = _validateStep(_currentStep);
    if (error != null) {
      AppToasts.error(context, error);
      return;
    }
    if (_currentStep < 3) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentStep++);
    } else {
      _finish();
    }
  }

  void _prev() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      setState(() => _currentStep--);
    } else {
      widget.onCancel();
    }
  }

  static final _emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  String? _validateStep(int step) {
    switch (step) {
      case 0:
        if (_nameCtrl.text.trim().isEmpty) return 'Please enter your name';
        if (_emailCtrl.text.trim().isEmpty) return 'Please enter your email';
        if (!_emailRegex.hasMatch(_emailCtrl.text.trim())) {
          return 'Please enter a valid email address';
        }
        if (_passCtrl.text.length < 8) {
          return 'Password must be at least 8 characters';
        }
        if (_confirmPassCtrl.text != _passCtrl.text) {
          return 'Passwords do not match';
        }
        if (!_termsAccepted) {
          return 'Please accept the Terms of Service to continue';
        }
        return null;
      case 3:
        if (_localPhotoPaths.isEmpty) return 'Add at least 1 photo';
        return null;
      default:
        return null;
    }
  }

  Future<void> _finish() async {
    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthProvider>();

      final ok = await auth.register(
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
        gender: _gender,
        height: _height,
        bio: _bioCtrl.text.trim(),
        intention: _intention,
        location: _locationCtrl.text.trim().isEmpty
            ? null
            : _locationCtrl.text.trim(),
        interests: _selectedInterests,
      );
      if (!mounted) return;
      if (ok) {
        // Upload photos after successful registration
        if (_localPhotoPaths.isNotEmpty) {
          await auth.addPhotos(_localPhotoPaths);
        }
        widget.onSuccess(_emailCtrl.text.trim());
      } else if (auth.error != null) {
        AppToasts.error(context, auth.error!);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;

    return Column(
      children: [
        _ProgressBar(currentStep: _currentStep),
        const SizedBox(height: 28),
        Expanded(
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              SingleChildScrollView(
                child: _AccountStep(
                  nameCtrl: _nameCtrl,
                  emailCtrl: _emailCtrl,
                  passCtrl: _passCtrl,
                  confirmPassCtrl: _confirmPassCtrl,
                  termsAccepted: _termsAccepted,
                  onTermsChange: (v) =>
                      setState(() => _termsAccepted = v ?? false),
                  t: t,
                ),
              ),
              SingleChildScrollView(
                child: _ProfileStep(
                  gender: _gender,
                  onGenderChange: (v) => setState(() => _gender = v),
                  height: _height,
                  onHeightChange: (v) => setState(() => _height = v),
                  bioCtrl: _bioCtrl,
                  locationCtrl: _locationCtrl,
                  intention: _intention,
                  onIntentionChange: (v) => setState(() => _intention = v!),
                  t: t,
                ),
              ),
              SingleChildScrollView(
                child: _InterestsStep(
                  selected: _selectedInterests,
                  onToggle: (interest) => setState(() {
                    _selectedInterests.contains(interest)
                        ? _selectedInterests.remove(interest)
                        : _selectedInterests.add(interest);
                  }),
                  t: t,
                ),
              ),
              SingleChildScrollView(
                child: _PhotosStep(
                  photoPaths: _localPhotoPaths,
                  onAddPhoto: _addPhoto,
                  onRemovePhoto: (index) => setState(() {
                    PhotoService.deleteLocal(_localPhotoPaths[index]);
                    _localPhotoPaths.removeAt(index);
                  }),
                  t: t,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _NavBar(
          currentStep: _currentStep,
          busy: context.select<AuthProvider, bool>((a) => a.busy) ||
              _submitting,
          onPrev: _prev,
          onNext: _next,
          t: t,
        ),
      ],
    );
  }
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

class _ProgressBar extends StatelessWidget {
  final int currentStep;
  const _ProgressBar({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: List.generate(4, (i) {
          return Expanded(
            child: Container(
              height: 6,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: i <= currentStep
                    ? AppColors.violet
                    : AppColors.dark.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ─── Navigation bar ───────────────────────────────────────────────────────────

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
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TextButton(
            onPressed: busy ? null : onPrev,
            child: Text(
              currentStep == 0
                  ? t('login').toUpperCase()
                  : t('previous').toUpperCase(),
              style: const TextStyle(
                  color: AppColors.textSecondary, fontWeight: FontWeight.bold),
            ),
          ),
          ElevatedButton(
            onPressed: busy ? null : onNext,
            style: ElevatedButton.styleFrom(
              padding:
                  const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
              shape: const StadiumBorder(),
              elevation: 4,
              shadowColor: AppColors.violet.withValues(alpha: 0.3),
            ),
            child: busy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                : Text(currentStep == 3
                    ? t('createAccount').toUpperCase()
                    : t('next').toUpperCase()),
          ),
        ],
      ),
    );
  }
}

// ─── Step 1: Account ──────────────────────────────────────────────────────────

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
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.auto_awesome_rounded, color: AppColors.gold, size: 24),
          const SizedBox(width: 12),
          Text(t('createAccount'),
              style: GoogleFonts.fraunces(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              )),
        ]),
        const SizedBox(height: 10),
        Text("Let's start by setting up your credentials.",
            style: GoogleFonts.dmSans(
              fontSize: 15,
              color: AppColors.textSecondary,
            )),
        const SizedBox(height: 32),
        _Field(
            label: t('fullName'),
            controller: nameCtrl,
            hint: 'e.g. Emma Dupont',
            icon: Icons.person_outline),
        const SizedBox(height: 20),
        _Field(
            label: t('email'),
            controller: emailCtrl,
            hint: 'you@email.com',
            keyboard: TextInputType.emailAddress,
            icon: Icons.alternate_email_rounded),
        const SizedBox(height: 20),
        _Field(
            label: t('password'),
            controller: passCtrl,
            hint: 'Min. 8 characters',
            obscure: true,
            icon: Icons.lock_outline_rounded),
        const SizedBox(height: 20),
        _Field(
            label: 'Confirm password',
            controller: confirmPassCtrl,
            hint: 'Re-enter your password',
            obscure: true,
            icon: Icons.lock_outline_rounded),
        const SizedBox(height: 20),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Checkbox(
              value: termsAccepted,
              onChanged: onTermsChange,
              activeColor: AppColors.violet,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4)),
            ),
            Expanded(
              child: Text(
                'I agree to the Terms of Service and Privacy Policy',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ]),
    );
  }
}

// ─── Step 2: Profile ──────────────────────────────────────────────────────────

class _ProfileStep extends StatelessWidget {
  final String? gender;
  final ValueChanged<String?> onGenderChange;
  final double height;
  final ValueChanged<double> onHeightChange;
  final TextEditingController bioCtrl;
  final TextEditingController locationCtrl;
  final Intention intention;
  final ValueChanged<Intention?> onIntentionChange;
  final String Function(String) t;

  const _ProfileStep({
    required this.gender,
    required this.onGenderChange,
    required this.height,
    required this.onHeightChange,
    required this.bioCtrl,
    required this.locationCtrl,
    required this.intention,
    required this.onIntentionChange,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.face_retouching_natural_rounded, color: AppColors.violetGlow, size: 24),
          const SizedBox(width: 12),
          Text(t('profile'),
              style: GoogleFonts.fraunces(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              )),
        ]),
        const SizedBox(height: 10),
        Text('Tell us a bit more about who you are.',
            style: GoogleFonts.dmSans(
              fontSize: 15,
              color: AppColors.textSecondary,
            )),
        const SizedBox(height: 32),
        Text(t('gender').toUpperCase(), style: _kLabelStyle),
        const SizedBox(height: 12),
        Row(
          children: ['Male', 'Female', 'Other'].map((g) {
            final sel = gender == g;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(g),
                  selected: sel,
                  onSelected: (_) => onGenderChange(g),
                  selectedColor: AppColors.violet,
                  labelStyle: TextStyle(
                    color: sel ? Colors.white : AppColors.textPrimary,
                    fontWeight: sel ? FontWeight.bold : FontWeight.normal,
                  ),
                  backgroundColor: AppColors.surface,
                  side: BorderSide(
                      color: sel ? AppColors.violet : AppColors.border),
                  shape: const StadiumBorder(),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(t('height').toUpperCase(), style: _kLabelStyle),
          Text('${height.toInt()} cm',
              style: const TextStyle(
                  fontWeight: FontWeight.bold, color: AppColors.violet)),
        ]),
        Slider(
          value: height,
          min: 140,
          max: 220,
          onChanged: onHeightChange,
          activeColor: AppColors.violet,
          inactiveColor: AppColors.border,
        ),
        const SizedBox(height: 24),
        _Field(
            label: t('bio'),
            controller: bioCtrl,
            hint: 'Describe yourself in a few words...',
            lines: 3),
        const SizedBox(height: 24),
        _Field(
            label: 'City / Location',
            controller: locationCtrl,
            hint: 'e.g. Paris, Abidjan, Montréal…',
            icon: Icons.location_on_outlined),
        const SizedBox(height: 24),
        Text(t('intention').toUpperCase(), style: _kLabelStyle),
        const SizedBox(height: 12),
        DropdownButtonFormField<Intention>(
          initialValue: intention,
          dropdownColor: AppColors.surfaceHigh,
          icon: const Icon(Icons.keyboard_arrow_down_rounded,
              color: AppColors.violet),
          style: const TextStyle(
              color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            filled: true,
            fillColor: AppColors.surface,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.violet, width: 2),
            ),
          ),
          items: Intention.values.map((i) {
            final emoji = {
              Intention.friendship: '🤝',
              Intention.marriage: '💍',
              Intention.fun: '🎉',
              Intention.sex: '🔥',
            }[i];
            return DropdownMenuItem(
                value: i, child: Text('$emoji ${t(i.name)}'));
          }).toList(),
          onChanged: onIntentionChange,
        ),
      ]),
    );
  }
}

// ─── Step 3: Interests ────────────────────────────────────────────────────────

class _InterestsStep extends StatelessWidget {
  final List<String> selected;
  final ValueChanged<String> onToggle;
  final String Function(String) t;

  const _InterestsStep(
      {required this.selected, required this.onToggle, required this.t});

  @override
  Widget build(BuildContext context) {
    final interests = t('interests_list').split(',');
    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Icon(Icons.palette_rounded, color: AppColors.pink, size: 24),
        const SizedBox(width: 12),
        Text(t('interests'),
            style: GoogleFonts.fraunces(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            )),
      ]),
      const SizedBox(height: 10),
      Text('Select things you love to find better matches.',
          style: GoogleFonts.dmSans(
            fontSize: 15,
            color: AppColors.textSecondary,
          )),
      const SizedBox(height: 24),
      Flexible(
        child: SingleChildScrollView(
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: interests.map((interest) {
              final isSel = selected.contains(interest);
              return FilterChip(
                label: Text(interest),
                selected: isSel,
                onSelected: (_) => onToggle(interest),
                selectedColor: AppColors.violet,
                checkmarkColor: Colors.white,
                labelStyle: TextStyle(
                  color: isSel ? Colors.white : AppColors.textPrimary,
                  fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                ),
                backgroundColor: AppColors.surface,
                side: BorderSide(
                    color: isSel ? AppColors.violet : AppColors.border),
                shape: const StadiumBorder(),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              );
            }).toList(),
          ),
        ),
      ),
    ]);
  }
}

// ─── Step 4: Photos ───────────────────────────────────────────────────────────

class _PhotosStep extends StatelessWidget {
  final List<String> photoPaths;
  final VoidCallback onAddPhoto;
  final ValueChanged<int> onRemovePhoto;
  final String Function(String) t;

  const _PhotosStep({
    required this.photoPaths,
    required this.onAddPhoto,
    required this.onRemovePhoto,
    required this.t,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          const Icon(Icons.image_outlined, color: AppColors.emerald, size: 24),
          const SizedBox(width: 12),
          Text('Photos',
              style: GoogleFonts.fraunces(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              )),
        ]),
        const SizedBox(height: 10),
        Text('Add at least 1 photo of yourself to get started.',
            style: GoogleFonts.dmSans(
              fontSize: 15,
              color: AppColors.textSecondary,
            )),
        const SizedBox(height: 24),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 0.75,
          ),
          itemCount: photoPaths.length + (photoPaths.length < 6 ? 1 : 0),
          itemBuilder: (ctx, i) {
            if (i == photoPaths.length) {
              return GestureDetector(
                onTap: onAddPhoto,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.add_photo_alternate_outlined,
                      color: AppColors.violet,
                      size: 32,
                    ),
                  ),
                ),
              );
            }
            return Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SignedPhotoImage(path: photoPaths[i]),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: GestureDetector(
                    onTap: () => onRemovePhoto(i),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.pink.withValues(alpha: 0.2),
                      ),
                      child: const Icon(
                        Icons.cancel,
                        color: AppColors.pink,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            '${photoPaths.length}/6',
            style: GoogleFonts.dmSans(
              fontSize: 12,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Shared field widget ──────────────────────────────────────────────────────

class _Field extends StatefulWidget {
  final String label;
  final TextEditingController controller;
  final String? hint;
  final bool obscure;
  final TextInputType? keyboard;
  final int lines;
  final IconData? icon;

  const _Field({
    required this.label,
    required this.controller,
    this.hint,
    this.obscure = false,
    this.keyboard,
    this.lines = 1,
    this.icon,
  });

  @override
  State<_Field> createState() => _FieldState();
}

class _FieldState extends State<_Field> {
  late bool _obscured;

  @override
  void initState() {
    super.initState();
    _obscured = widget.obscure;
  }

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(widget.label.toUpperCase(), style: GoogleFonts.dmSans(
        fontSize: 12,
        fontWeight: FontWeight.w800,
        color: AppColors.textPrimary,
        letterSpacing: 1.5,
      )),
      const SizedBox(height: 12),
      TextField(
        controller: widget.controller,
        obscureText: _obscured,
        keyboardType: widget.keyboard,
        maxLines: widget.lines,
        style: GoogleFonts.dmSans(
            color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: widget.hint,
          hintStyle: GoogleFonts.dmSans(color: AppColors.textSecondary, fontSize: 14),
          prefixIcon:
              widget.icon != null ? Icon(widget.icon, color: AppColors.violetGlow, size: 20) : null,
          suffixIcon: widget.obscure
              ? IconButton(
                  icon: Icon(
                    _obscured ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                    color: AppColors.violetGlow,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscured = !_obscured),
                )
              : null,
          filled: true,
          fillColor: AppColors.surface,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: const BorderSide(color: AppColors.violet, width: 2),
          ),
        ),
      ),
    ]);
  }
}

const _kLabelStyle = TextStyle(
  fontSize: 12,
  fontWeight: FontWeight.w800,
  color: AppColors.textPrimary,
  letterSpacing: 1.2,
);
