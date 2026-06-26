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
import '../auth/auth_provider.dart';
import '../locale/locale_provider.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  bool _busy = false;

  late TextEditingController _nameCtrl;
  late TextEditingController _bioCtrl;
  late TextEditingController _heightCtrl;

  String? _gender;
  String? _interestedIn;
  DateTime? _birthDate;
  Intention? _intention;
  List<String> _selectedInterests = [];
  List<String> _photos = [];

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _nameCtrl = TextEditingController(text: user?.name ?? '');
    _bioCtrl = TextEditingController(text: user?.bio ?? '');
    _heightCtrl = TextEditingController(text: user?.height?.toInt().toString() ?? '');

    _gender = user?.gender;
    _interestedIn = user?.interestedIn;
    _birthDate = user?.birthDate;
    _intention = user?.intention;
    _selectedInterests = List.from(user?.interests ?? []);
    _photos = List.from(user?.photos ?? []);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _bioCtrl.dispose();
    _heightCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) {
      AppToasts.error(context, 'Name cannot be empty');
      return;
    }

    setState(() => _busy = true);
    try {
      final auth = context.read<AuthProvider>();
      final currentUser = auth.user;
      if (currentUser == null) return;

      final updatedUser = currentUser.copyWith(
        name: _nameCtrl.text.trim(),
        bio: _bioCtrl.text.trim(),
        height: double.tryParse(_heightCtrl.text),
        gender: _gender,
        interestedIn: _interestedIn,
        birthDate: _birthDate,
        intention: _intention,
        interests: _selectedInterests,
        photos: _photos,
      );

      await auth.updateProfile(updatedUser);
      if (mounted) {
        AppToasts.success(context, 'Profile updated successfully');
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Failed to update profile');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _addPhoto() async {
    if (_photos.length >= 6) {
      AppToasts.info(context, 'Maximum 6 photos');
      return;
    }
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (xfile == null) return;

    setState(() => _busy = true);
    try {
      final auth = context.read<AuthProvider>();
      final localPath = await PhotoService.persistLocally(xfile);
      await auth.addPhotos([localPath]);
      setState(() {
        _photos = List.from(auth.user?.photos ?? []);
      });
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Failed to upload photo');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _deletePhoto(String url) async {
    setState(() => _busy = true);
    try {
      final auth = context.read<AuthProvider>();
      await auth.deletePhoto(url);
      setState(() {
        _photos = List.from(auth.user?.photos ?? []);
      });
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Failed to delete photo');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _setAsMain(String url) async {
    if (_photos.isNotEmpty && _photos.first == url) return;
    setState(() => _busy = true);
    try {
      final auth = context.read<AuthProvider>();
      final currentUser = auth.user;
      if (currentUser == null) return;

      final updatedPhotos = List<String>.from(_photos);
      updatedPhotos.remove(url);
      updatedPhotos.insert(0, url);

      await auth.updateProfile(currentUser.copyWith(photos: updatedPhotos));
      setState(() {
        _photos = updatedPhotos;
      });
      if (mounted) AppToasts.success(context, 'Main photo updated');
    } catch (e) {
      if (mounted) AppToasts.error(context, 'Failed to update main photo');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(t('editProfile'), style: GoogleFonts.fraunces(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (_busy)
            const Center(child: Padding(padding: EdgeInsets.only(right: 16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))))
          else
            TextButton(
              onPressed: _save,
              child: Text('SAVE', style: GoogleFonts.dmSans(fontWeight: FontWeight.w800, color: AppColors.violet)),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _Label(t('fullName').toUpperCase()),
            _EditField(controller: _nameCtrl, hint: t('fullName')),
            const SizedBox(height: 24),

            _Label(t('profilePhotos').toUpperCase()),
            _PhotoGrid(
              photos: _photos,
              onAdd: _addPhoto,
              onDelete: _deletePhoto,
              onSetMain: _setAsMain,
            ),
            const SizedBox(height: 24),

            _Label(t('bio').toUpperCase()),
            _EditField(controller: _bioCtrl, hint: t('tellUsMore'), lines: 3),
            const SizedBox(height: 24),

            _Label(t('birthDate').toUpperCase()),
            _DatePickerField(
              date: _birthDate,
              onSelect: (d) => setState(() => _birthDate = d),
              t: t,
            ),
            const SizedBox(height: 24),

            _Label(t('gender').toUpperCase()),
            _ChoiceRow(
              choices: ['Male', 'Female', 'Other'],
              selected: _gender,
              onSelect: (v) => setState(() => _gender = v),
            ),
            const SizedBox(height: 24),

            _Label(t('interestedIn').toUpperCase()),
            _ChoiceRow(
              choices: ['Male', 'Female', 'Other'],
              selected: _interestedIn,
              onSelect: (v) => setState(() => _interestedIn = v),
            ),
            const SizedBox(height: 24),

            _Label(t('intention').toUpperCase()),
            _IntentionSelector(
              selected: _intention,
              onSelect: (v) => setState(() => _intention = v),
              t: t,
            ),
            const SizedBox(height: 24),

            _Label(t('height').toUpperCase()),
            _EditField(controller: _heightCtrl, hint: '170', keyboard: TextInputType.number),
            const SizedBox(height: 24),

            _Label(t('interests').toUpperCase()),
            _InterestsSelector(
              selected: _selectedInterests,
              onToggle: (i) => setState(() {
                _selectedInterests.contains(i) ? _selectedInterests.remove(i) : _selectedInterests.add(i);
              }),
              t: t,
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(text, style: GoogleFonts.dmSans(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 1.2)),
    );
  }
}

class _EditField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int lines;
  final TextInputType? keyboard;
  const _EditField({required this.controller, required this.hint, this.lines = 1, this.keyboard});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: lines,
      keyboardType: keyboard,
      style: GoogleFonts.dmSans(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.all(16),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.violet, width: 1.5)),
      ),
    );
  }
}

class _DatePickerField extends StatelessWidget {
  final DateTime? date;
  final ValueChanged<DateTime> onSelect;
  final String Function(String) t;
  const _DatePickerField({required this.date, required this.onSelect, required this.t});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        final d = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now().subtract(const Duration(days: 365 * 20)),
          firstDate: DateTime(1950),
          lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
          builder: (context, child) => Theme(data: ThemeData.dark().copyWith(colorScheme: const ColorScheme.dark(primary: AppColors.violet, onPrimary: Colors.white, surface: AppColors.surface, onSurface: AppColors.textPrimary)), child: child!),
        );
        if (d != null) onSelect(d);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withValues(alpha: 0.05))),
        child: Row(children: [
          const Icon(Icons.cake_outlined, color: AppColors.violet, size: 20),
          const SizedBox(width: 12),
          Text(date == null ? 'Select Date' : DateFormat('dd MMMM yyyy').format(date!), style: GoogleFonts.dmSans(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
        ]),
      ),
    );
  }
}

class _ChoiceRow extends StatelessWidget {
  final List<String> choices;
  final String? selected;
  final ValueChanged<String> onSelect;
  const _ChoiceRow({required this.choices, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: choices.map((c) {
        final sel = selected == c;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () => onSelect(c),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: sel ? AppColors.violet : AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: sel ? AppColors.violet : Colors.white12),
                ),
                alignment: Alignment.center,
                child: Text(c, style: GoogleFonts.dmSans(color: sel ? Colors.white : AppColors.textPrimary, fontWeight: sel ? FontWeight.bold : FontWeight.normal, fontSize: 13)),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _IntentionSelector extends StatelessWidget {
  final Intention? selected;
  final ValueChanged<Intention?> onSelect;
  final String Function(String) t;
  const _IntentionSelector({required this.selected, required this.onSelect, required this.t});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: Intention.values.map((val) {
        final sel = selected == val;
        final label = t(val.name);
        return GestureDetector(
          onTap: () => onSelect(val),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: sel ? AppColors.violet : AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: sel ? AppColors.violet : Colors.white12),
            ),
            child: Text(label, style: GoogleFonts.dmSans(color: sel ? Colors.white : AppColors.textPrimary, fontSize: 13, fontWeight: sel ? FontWeight.bold : FontWeight.normal)),
          ),
        );
      }).toList(),
    );
  }
}

class _InterestsSelector extends StatelessWidget {
  final List<String> selected;
  final ValueChanged<String> onToggle;
  final String Function(String) t;
  const _InterestsSelector({required this.selected, required this.onToggle, required this.t});

  @override
  Widget build(BuildContext context) {
    final interests = t('interests_list')
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: interests.map((i) {
        final sel = selected.contains(i);
        return FilterChip(
          label: Text(i), selected: sel, onSelected: (_) => onToggle(i),
          selectedColor: AppColors.violet, checkmarkColor: Colors.white,
          labelStyle: GoogleFonts.dmSans(color: sel ? Colors.white : AppColors.textPrimary, fontSize: 13),
          backgroundColor: AppColors.surface, shape: const StadiumBorder(side: BorderSide(color: Colors.white10)),
        );
      }).toList(),
    );
  }
}

class _PhotoGrid extends StatelessWidget {
  final List<String> photos;
  final VoidCallback onAdd;
  final Function(String) onDelete;
  final Function(String) onSetMain;
  const _PhotoGrid({required this.photos, required this.onAdd, required this.onDelete, required this.onSetMain});

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 100),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 0.8),
        itemCount: photos.length + (photos.length < 6 ? 1 : 0),
        itemBuilder: (_, i) {
          if (i == photos.length) {
            return ProfilePhotoAddTile(onTap: onAdd);
          }
          return ProfilePhotoTile(
            path: photos[i],
            allPhotos: photos,
            photoIndex: i,
            onDelete: () => onDelete(photos[i]),
            onLongPress: () => onSetMain(photos[i]),
            isMain: i == 0,
          );
        },
      ),
    );
  }
}
