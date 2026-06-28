import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/constants/countries_data.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/country.dart';
import '../../l10n/app_strings.dart';
import 'locale_provider.dart';

class LangSelectScreen extends StatefulWidget {
  const LangSelectScreen({super.key});

  @override
  State<LangSelectScreen> createState() => _LangSelectScreenState();
}

class _LangSelectScreenState extends State<LangSelectScreen> {
  final _search = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final locale = context.read<LocaleProvider>();
    await locale.persist();
    if (!mounted) return;

    final fromOnboarding =
        ModalRoute.of(context)?.settings.arguments == true;

    if (fromOnboarding) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.auth);
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final t = locale.t;
    final visibleCountries = kCountries
        .where((c) =>
            _query.isEmpty ||
            c.name.toLowerCase().contains(_query.toLowerCase()) ||
            c.code.toLowerCase().contains(_query.toLowerCase()))
        .toList();

    return Scaffold(
      body: Stack(
        children: [
          // Modern Background
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.midnightGradient,
              ),
            ),
          ),
          // Ambient Glows
          const _AmbientGlow(
            offset: Offset(0.9, 0.1),
            color: AppColors.violet,
            radius: 250,
            opacity: 0.12,
          ),
          const _AmbientGlow(
            offset: Offset(0.1, 0.8),
            color: AppColors.pink,
            radius: 200,
            opacity: 0.08,
          ),

          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 20),
                _TopHeader(),
                const SizedBox(height: 30),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    children: [
                      Text(
                        t('chooseLanguage'),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.fraunces(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t('langSub'),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.dmSans(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 40),
                      _SectionLabel(text: t('selectLanguage')),
                      const SizedBox(height: 16),
                      _LangGrid(
                        selected: locale.langCode,
                        onSelect: (code) => locale.selectLanguage(code),
                      ),
                      const SizedBox(height: 40),
                      _SectionLabel(text: t('selectCountry')),
                      const SizedBox(height: 16),
                      _SearchField(
                        controller: _search,
                        onChanged: (v) => setState(() => _query = v),
                        hintText: t('searchCountries'),
                      ),
                      const SizedBox(height: 16),
                      ...visibleCountries.map((c) => _CountryTile(
                            country: c,
                            selected: locale.country.code == c.code,
                            onTap: () => locale.selectCountry(c),
                          )),
                      const SizedBox(height: 100), // Bottom padding for button
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Button
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 30),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.bg.withValues(alpha: 0.0),
                    AppColors.bg.withValues(alpha: 0.9),
                    AppColors.bg,
                  ],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
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
                        onPressed: _confirm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.violet,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          t('continueBtn').toUpperCase(),
                          style: GoogleFonts.dmSans(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    t('changeAnytime'),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.dmSans(
                      fontSize: 12,
                      color: AppColors.textMuted,
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
}

class _TopHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Container(
        width: 48, height: 48,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.violetGradient,
          boxShadow: [
            BoxShadow(color: AppColors.violet.withValues(alpha: 0.35), blurRadius: 15, spreadRadius: 2),
          ],
        ),
        child: const Icon(Icons.near_me_rounded, color: Colors.white, size: 24),
      ),
      const SizedBox(height: 8),
      Text('NearMe', style: GoogleFonts.fraunces(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
    ]);
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: GoogleFonts.dmSans(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
        color: AppColors.violetGlow.withValues(alpha: 0.7),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final String hintText;

  const _SearchField({
    required this.controller,
    required this.onChanged,
    required this.hintText,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: TextField(
          controller: controller,
          onChanged: onChanged,
          style: GoogleFonts.dmSans(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: GoogleFonts.dmSans(color: AppColors.textSecondary.withValues(alpha: 0.6)),
            prefixIcon: Icon(Icons.search_rounded, color: AppColors.violetGlow, size: 20),
            filled: true,
            fillColor: AppColors.surface.withValues(alpha: 0.4),
            contentPadding: const EdgeInsets.all(18),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: AppColors.violet, width: 1.5)),
          ),
        ),
      ),
    );
  }
}

class _LangGrid extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onSelect;
  const _LangGrid({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        mainAxisExtent: 80,
      ),
      itemCount: AppStrings.supportedLocales.length,
      itemBuilder: (_, i) {
        final l = AppStrings.supportedLocales[i];
        final isSelected = l.code == selected;
        return GestureDetector(
          onTap: () => onSelect(l.code),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.violet.withValues(alpha: 0.2)
                  : AppColors.surface.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? AppColors.violet : Colors.white.withValues(alpha: 0.05),
                width: 1.5,
              ),
            ),
            child: Row(children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
                alignment: Alignment.center,
                child: Text(l.flag, style: const TextStyle(fontSize: 22)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(l.englishName, style: GoogleFonts.dmSans(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13)),
                    Text(l.nativeName, style: GoogleFonts.dmSans(color: AppColors.textSecondary, fontSize: 11)),
                  ],
                ),
              ),
            ]),
          ),
        );
      },
    );
  }
}

class _CountryTile extends StatelessWidget {
  final Country country;
  final bool selected;
  final VoidCallback onTap;
  const _CountryTile({required this.country, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.violet.withValues(alpha: 0.15) : AppColors.surface.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? AppColors.violet : Colors.white.withValues(alpha: 0.05), width: 1.2),
          ),
          child: Row(children: [
            Text(country.flag, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 12),
            Expanded(child: Text(country.name, style: GoogleFonts.dmSans(color: AppColors.textPrimary, fontSize: 15, fontWeight: selected ? FontWeight.w700 : FontWeight.w500))),
            if (selected) const Icon(Icons.check_circle_rounded, color: AppColors.violet, size: 20),
          ]),
        ),
      ),
    );
  }
}

class _AmbientGlow extends StatelessWidget {
  final Offset offset;
  final Color color;
  final double radius;
  final double opacity;

  const _AmbientGlow({required this.offset, required this.color, required this.radius, required this.opacity});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Positioned(
      left: size.width * offset.dx - radius,
      top: size.height * offset.dy - radius,
      child: Container(
        width: radius * 2, height: radius * 2,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: opacity)),
        child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80), child: Container(color: Colors.transparent)),
      ),
    );
  }
}
