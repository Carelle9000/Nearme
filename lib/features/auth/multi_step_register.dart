import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/toasts.dart';
import '../../core/widgets/profile_photo_tile.dart';
import '../../data/models/app_user.dart';
import '../../data/services/photo_service.dart';
import '../locale/locale_provider.dart';
import 'auth_provider.dart';
import 'identity_verification_screen.dart';
import '../../features/identity/identity_verification_provider.dart';
import 'package:firebase_auth/firebase_auth.dart' hide AuthProvider;

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
  bool _submitting = false;

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();
  bool _termsAccepted = false;

  String? _gender;
  String? _interestedIn;
  DateTime? _birthDate;
  double _searchDistance = 50;
  double _height = 170;
  final _bioCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  Intention _intention = Intention.friendship;

  final List<String> _selectedInterests = [];
  final List<String> _localPhotoPaths = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<IdentityVerificationProvider>().reset();
      }
    });
  }

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

  Future<void> _next() async {
    final error = _validateStep(_currentStep);
    if (error != null) {
      AppToasts.error(context, error);
      return;
    }

    final auth = context.read<AuthProvider>();

    if (_currentStep == 0) {
      setState(() => _submitting = true);
      final ok = await auth.register(
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      setState(() => _submitting = false);
      if (!ok) {
        if (mounted && auth.error != null) AppToasts.error(context, auth.error!);
        return;
      }
    }

    if (_currentStep == 3) {
      // Before moving to verification, save everything else
      final success = await _saveProfile();
      if (!success) return;
    }

    if (_currentStep < 4) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
      setState(() => _currentStep++);
    } else {
      _finishAndNotify();
    }
  }

  Future<bool> _saveProfile() async {
    setState(() => _submitting = true);
    try {
      final auth = context.read<AuthProvider>();
      final currentUser = auth.user;
      if (currentUser == null) return false;

      final updatedUser = currentUser.copyWith(
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
      if (_localPhotoPaths.isNotEmpty) await auth.addPhotos(_localPhotoPaths);
      return true;
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Error during update');
      return false;
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _finishAndNotify() {
    widget.onSuccess(_emailCtrl.text.trim());
  }

  String? _validateStep(int step) {
    if (step == 0) {
      if (_nameCtrl.text.trim().isEmpty) return 'Enter your name';
      if (_emailCtrl.text.trim().isEmpty) return 'Enter your email';
      if (!_emailCtrl.text.contains('@')) return 'Invalid email';
      if (_passCtrl.text.length < 8) return 'Password too short (min 8)';
      if (_passCtrl.text != _confirmPassCtrl.text) return 'Passwords do not match';
      if (!_termsAccepted) return 'Accept terms and conditions';
    }
    if (step == 1) {
      if (_gender == null) return 'Select your gender';
      if (_birthDate == null) return 'Enter your birth date';
      if (_interestedIn == null) return 'Who are you interested in?';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final busy = context.select<AuthProvider, bool>((a) => a.busy) || _submitting;

    return Stack(
      children: [
        Column(
          children: [
            const _TopHeader(),
            const SizedBox(height: 24),
            _ProgressBar(currentStep: _currentStep),
            const SizedBox(height: 28),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  SingleChildScrollView(child: _AccountStep(nameCtrl: _nameCtrl, emailCtrl: _emailCtrl, passCtrl: _passCtrl, confirmPassCtrl: _confirmPassCtrl, termsAccepted: _termsAccepted, onTermsChange: (v) => setState(() => _termsAccepted = v ?? false), t: t)),
                  SingleChildScrollView(child: _ProfileStep(gender: _gender, onGenderChange: (v) => setState(() => _gender = v), interestedIn: _interestedIn, onInterestedInChange: (v) => setState(() => _interestedIn = v), birthDate: _birthDate, onBirthDateChange: (v) => setState(() => _birthDate = v), searchDistance: _searchDistance, onDistanceChange: (v) => setState(() => _searchDistance = v), height: _height, onHeightChange: (v) => setState(() => _height = v), bioCtrl: _bioCtrl, locationCtrl: _locationCtrl, intention: _intention, onIntentionChange: (v) => setState(() => _intention = v!), t: t)),
                  SingleChildScrollView(child: _InterestsStep(selected: _selectedInterests, onToggle: (interest) => setState(() { _selectedInterests.contains(interest) ? _selectedInterests.remove(interest) : _selectedInterests.add(interest); }), t: t)),
                  SingleChildScrollView(child: _PhotosStep(photoPaths: _localPhotoPaths, onAddPhoto: _addPhoto, onRemovePhoto: (index) => setState(() { PhotoService.deleteLocal(_localPhotoPaths[index]); _localPhotoPaths.removeAt(index); }), t: t)),
                  SingleChildScrollView(child: _VerificationStep(t: t, onFinish: _finishAndNotify)),
                ],
              ),
            ),
            if (_currentStep < 4)
              _NavBar(currentStep: _currentStep, busy: busy, onPrev: _prev, onNext: _next, t: t),
          ],
        ),
      ],
    );
  }

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

  Future<void> _addPhoto() async {
    final t = context.read<LocaleProvider>().t;
    if (_localPhotoPaths.length >= 6) { if (mounted) AppToasts.info(context, t('maxPhotos')); return; }
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (xfile == null) return;
    try {
      final localPath = await PhotoService.persistLocally(xfile);
      setState(() => _localPhotoPaths.add(localPath));
    } catch (e) {
      if (mounted) AppToasts.error(context, t('errorPhoto'));
    }
  }
}

class _TopHeader extends StatelessWidget {
  const _TopHeader();
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        width: 48, height: 48,
        decoration: BoxDecoration(shape: BoxShape.circle, gradient: AppColors.violetGradient, boxShadow: [BoxShadow(color: AppColors.violet.withValues(alpha: 0.35), blurRadius: 15, spreadRadius: 2)]),
        child: const Icon(Icons.near_me_rounded, color: Colors.white, size: 24),
      ),
      const SizedBox(height: 8),
      Text('NearMe', style: GoogleFonts.fraunces(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
    ]);
  }
}

class _ProgressBar extends StatelessWidget {
  final int currentStep;
  const _ProgressBar({required this.currentStep});
  @override
  Widget build(BuildContext context) {
    return Row(children: List.generate(5, (i) => Expanded(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        height: 6, margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(color: i <= currentStep ? AppColors.violet : Colors.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
      ),
    )));
  }
}

class _NavBar extends StatelessWidget {
  final int currentStep;
  final bool busy;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final String Function(String) t;

  const _NavBar({required this.currentStep, required this.busy, required this.onPrev, required this.onNext, required this.t});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        TextButton(onPressed: busy ? null : onPrev, child: Text(currentStep == 0 ? t('cancel').toUpperCase() : t('previous').toUpperCase(), style: GoogleFonts.dmSans(color: AppColors.textSecondary, fontWeight: FontWeight.w700))),
        ElevatedButton(
          onPressed: busy ? null : onNext,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.violet, foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            elevation: 0,
          ),
          child: busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                     : Text(currentStep == 4 ? t('finish').toUpperCase() : t('continue').toUpperCase(), style: GoogleFonts.dmSans(fontWeight: FontWeight.w800, letterSpacing: 1.1)),
        ),
      ]),
    );
  }
}

class _AccountStep extends StatelessWidget {
  final TextEditingController nameCtrl, emailCtrl, passCtrl, confirmPassCtrl;
  final bool termsAccepted;
  final ValueChanged<bool?> onTermsChange;
  final String Function(String) t;

  const _AccountStep({required this.nameCtrl, required this.emailCtrl, required this.passCtrl, required this.confirmPassCtrl, required this.termsAccepted, required this.onTermsChange, required this.t});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(t('createAccountStep'), style: GoogleFonts.fraunces(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      Text(t('startAdventure'), style: GoogleFonts.dmSans(color: AppColors.textSecondary)),
      const SizedBox(height: 32),
      _Field(label: t('fullName'), controller: nameCtrl, icon: Icons.person_outline),
      const SizedBox(height: 20),
      _Field(label: t('email'), controller: emailCtrl, keyboard: TextInputType.emailAddress, icon: Icons.alternate_email_rounded),
      const SizedBox(height: 20),
      _Field(label: t('password'), controller: passCtrl, obscure: true, icon: Icons.lock_outline),
      const SizedBox(height: 20),
      _Field(label: t('confirmPassword'), controller: confirmPassCtrl, obscure: true, icon: Icons.lock_outline),
      const SizedBox(height: 20),
      Row(children: [
        Checkbox(value: termsAccepted, onChanged: onTermsChange, activeColor: AppColors.violet, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4))),
        Expanded(child: Text(t('agreeTerms'), style: const TextStyle(fontSize: 13, color: AppColors.textSecondary))),
      ]),
    ]);
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
  final String Function(String) t;

  const _ProfileStep({required this.gender, required this.onGenderChange, required this.interestedIn, required this.onInterestedInChange, required this.birthDate, required this.onBirthDateChange, required this.searchDistance, required this.onDistanceChange, required this.height, required this.onHeightChange, required this.bioCtrl, required this.locationCtrl, required this.intention, required this.onIntentionChange, required this.t});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(t('yourProfile'), style: GoogleFonts.fraunces(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      const SizedBox(height: 24),

      _Label(t('birthDate').toUpperCase()),
      GestureDetector(
        onTap: () async {
          final now = DateTime.now();
          final eighteenYearsAgo = now.subtract(const Duration(days: 365*18));
          final twentyFiveYearsAgo = now.subtract(const Duration(days: 365*25));
          final d = await showDatePicker(
            context: context, initialDate: twentyFiveYearsAgo,
            firstDate: DateTime(1950), lastDate: eighteenYearsAgo,
            builder: (context, child) => Theme(data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: AppColors.violet, onPrimary: Colors.white, surface: AppColors.surface, onSurface: AppColors.textPrimary)), child: child!),
          );
          if (d != null) onBirthDateChange(d);
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.surface.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withValues(alpha: 0.05))),
          child: Row(children: [
            const Icon(Icons.cake_outlined, color: AppColors.violet, size: 20),
            const SizedBox(width: 12),
            Text(birthDate == null ? t('selectLanguage') : DateFormat('dd MMMM yyyy', 'en').format(birthDate!), style: GoogleFonts.dmSans(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
          ]),
        ),
      ),
      const SizedBox(height: 24),

      _Label(t('iAm')),
      _GenderSelector(selected: gender, onSelect: onGenderChange),
      const SizedBox(height: 24),

      _Label(t('interestedIn')),
      _GenderSelector(selected: interestedIn, onSelect: onInterestedInChange),
      const SizedBox(height: 24),

      _Label(t('intention').toUpperCase()),
      _IntentionSelector(selected: intention, onSelect: onIntentionChange, t: t),
      const SizedBox(height: 24),

      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        _Label(t('maxDistance')),
        Text('${searchDistance.toInt()} km', style: GoogleFonts.dmSans(color: AppColors.violet, fontWeight: FontWeight.w800)),
      ]),
      Slider(value: searchDistance, min: 1, max: 200, onChanged: onDistanceChange, activeColor: AppColors.violet, inactiveColor: Colors.white.withValues(alpha: 0.05)),

      const SizedBox(height: 20),
      _Field(label: t('bio'), controller: bioCtrl, hint: t('tellUsMore'), lines: 3),
    ]);
  }
}

class _IntentionSelector extends StatelessWidget {
  final Intention selected;
  final ValueChanged<Intention?> onSelect;
  final String Function(String) t;
  const _IntentionSelector({required this.selected, required this.onSelect, required this.t});

  @override
  Widget build(BuildContext context) {
    final items = [
      {'val': Intention.friendship, 'label': t('friendship'), 'icon': Icons.handshake_outlined},
      {'val': Intention.marriage, 'label': t('marriage'), 'icon': Icons.favorite_outline},
      {'val': Intention.fun, 'label': t('fun'), 'icon': Icons.celebration_outlined},
      {'val': Intention.sex, 'label': t('sex'), 'icon': Icons.local_fire_department_outlined},
    ];

    return Wrap(
      spacing: 8, runSpacing: 8,
      children: items.map((item) {
        final sel = selected == item['val'];
        return GestureDetector(
          onTap: () => onSelect(item['val'] as Intention),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: sel ? AppColors.violet : AppColors.surface.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: sel ? AppColors.violet : Colors.white.withValues(alpha: 0.05)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(item['icon'] as IconData, size: 16, color: sel ? Colors.white : AppColors.textSecondary),
                const SizedBox(width: 8),
                Text(item['label'] as String, style: GoogleFonts.dmSans(color: sel ? Colors.white : AppColors.textPrimary, fontSize: 13, fontWeight: sel ? FontWeight.bold : FontWeight.normal)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _InterestsStep extends StatelessWidget {
  final List<String> selected;
  final ValueChanged<String> onToggle;
  final String Function(String) t;

  const _InterestsStep({required this.selected, required this.onToggle, required this.t});

  @override
  Widget build(BuildContext context) {
    final interests = t('interests_list').split(',').map((e) => e.trim()).toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(t('yourInterests'), style: GoogleFonts.fraunces(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      const SizedBox(height: 20),
      Wrap(spacing: 8, runSpacing: 8, children: interests.map((i) {
        final sel = selected.contains(i);
        return FilterChip(
          label: Text(i), selected: sel, onSelected: (_) => onToggle(i),
          selectedColor: AppColors.violet, checkmarkColor: Colors.white,
          labelStyle: GoogleFonts.dmSans(color: sel ? Colors.white : AppColors.textPrimary, fontSize: 13, fontWeight: sel ? FontWeight.w700 : FontWeight.normal),
          backgroundColor: AppColors.surface.withValues(alpha: 0.5), shape: const StadiumBorder(side: BorderSide(color: Colors.white10)),
        );
      }).toList()),
    ]);
  }
}

class _PhotosStep extends StatelessWidget {
  final List<String> photoPaths;
  final VoidCallback onAddPhoto;
  final ValueChanged<int> onRemovePhoto;
  final String Function(String) t;

  const _PhotosStep({required this.photoPaths, required this.onAddPhoto, required this.onRemovePhoto, required this.t});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(t('profilePhotos'), style: GoogleFonts.fraunces(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      const SizedBox(height: 20),
      GridView.builder(
        shrinkWrap: true,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 0.8),
        itemCount: photoPaths.length + (photoPaths.length < 6 ? 1 : 0),
        itemBuilder: (_, i) {
          if (i == photoPaths.length) {
            return ProfilePhotoAddTile(
              onTap: onAddPhoto,
              backgroundColor: AppColors.surface.withValues(alpha: 0.3),
            );
          }
          return ProfilePhotoTile(
            path: photoPaths[i],
            allPhotos: photoPaths,
            photoIndex: i,
            onDelete: () => onRemovePhoto(i),
          );
        },
      ),
    ]);
  }
}

class _VerificationStep extends StatefulWidget {
  final String Function(String) t;
  final VoidCallback onFinish;
  const _VerificationStep({required this.t, required this.onFinish});

  @override
  State<_VerificationStep> createState() => _VerificationStepState();
}

class _VerificationStepState extends State<_VerificationStep> {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<IdentityVerificationProvider>();
    final t = widget.t;

    return switch (provider.step) {
      VerificationStep.documentCapture =>
        DocumentCaptureStep(onDocumentSelected: _handleDocumentSelected, t: t),
      VerificationStep.ageVerification =>
        AgeVerificationStep(onNext: _handleAgeStart, t: t),
      VerificationStep.verificationPending => VerificationPendingStep(t: t),
      VerificationStep.completed => VerificationCompleteStep(t: t),
    };
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

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) {
    return Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(text, style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.violetGlow.withValues(alpha: 0.7), letterSpacing: 1.2)));
  }
}

class _GenderSelector extends StatelessWidget {
  final String? selected;
  final ValueChanged<String?> onSelect;
  const _GenderSelector({required this.selected, required this.onSelect});
  @override
  Widget build(BuildContext context) {
    final genders = ['Male', 'Female', 'Other'];
    return Row(children: genders.map((g) {
      final sel = selected == g;
      return Expanded(child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: GestureDetector(
          onTap: () => onSelect(g),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(color: sel ? AppColors.violet : AppColors.surface.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(12), border: Border.all(color: sel ? AppColors.violet : Colors.white12)),
            alignment: Alignment.center,
            child: Text(g, style: GoogleFonts.dmSans(color: sel ? Colors.white : AppColors.textPrimary, fontWeight: sel ? FontWeight.bold : FontWeight.normal, fontSize: 13)),
          ),
        ),
      ));
    }).toList());
  }
}

class _Field extends StatefulWidget {
  final String label;
  final TextEditingController controller;
  final String? hint;
  final bool obscure;
  final TextInputType? keyboard;
  final int lines;
  final IconData? icon;

  const _Field({required this.label, required this.controller, this.hint, this.obscure = false, this.keyboard, this.lines = 1, this.icon});

  @override
  State<_Field> createState() => _FieldState();
}

class _FieldState extends State<_Field> {
  late bool _obscured;
  @override
  void initState() { super.initState(); _obscured = widget.obscure; }
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(widget.label.toUpperCase(), style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.violetGlow.withValues(alpha: 0.7), letterSpacing: 1.2)),
      const SizedBox(height: 10),
      ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: TextField(
            controller: widget.controller, obscureText: _obscured, keyboardType: widget.keyboard, maxLines: widget.lines,
            style: GoogleFonts.dmSans(color: AppColors.textPrimary),
            decoration: InputDecoration(
              prefixIcon: widget.icon != null ? Icon(widget.icon, color: AppColors.violet, size: 20) : null,
              suffixIcon: widget.obscure ? IconButton(icon: Icon(_obscured ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppColors.violet, size: 20), onPressed: () => setState(() => _obscured = !_obscured)) : null,
              filled: true, fillColor: AppColors.surface.withValues(alpha: 0.5), contentPadding: const EdgeInsets.all(18),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.violet, width: 1.5)),
            ),
          ),
        ),
      ),
    ]);
  }
}
