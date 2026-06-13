import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/countries_data.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
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

    // arguments == true  → called from LandingScreen (onboarding flow)
    //                       → replace this screen with /auth
    // no argument        → called from Discover settings icon
    //                       → just pop back to discover
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
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: Text(t('chooseLanguage'), style: AppTheme.display(size: 20, color: AppColors.navy)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: [
                  const SizedBox(height: 10),
                  Text(
                    t('langSub'),
                    textAlign: TextAlign.center,
                    style: AppTheme.body(size: 14),
                  ),
                  const SizedBox(height: 32),
                  _SectionLabel(text: t('selectLanguage')),
                  const SizedBox(height: 16),
                  _LangGrid(
                    selected: locale.langCode,
                    onSelect: (code) => locale.selectLanguage(code),
                  ),
                  const SizedBox(height: 32),
                  _SectionLabel(text: t('selectCountry')),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _search,
                    onChanged: (v) => setState(() => _query = v),
                    decoration: InputDecoration(
                      hintText: t('searchCountries'),
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.violet),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...visibleCountries.map((c) => _CountryTile(
                        country: c,
                        selected: locale.country.code == c.code,
                        onTap: () => locale.selectCountry(c),
                      )),
                  const SizedBox(height: 32),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
              child: Column(children: [
                SizedBox(
                  width: double.infinity,
                  child: Container(
                    decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.violet.withValues(alpha: 0.2),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      onPressed: _confirm,
                      style: ElevatedButton.styleFrom(shape: const StadiumBorder()),
                      child: Text(t('continueBtn').toUpperCase()),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  t('changeAnytime'),
                  textAlign: TextAlign.center,
                  style: AppTheme.body(size: 12, color: AppColors.textMuted),
                ),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.2,
        color: AppColors.navy,
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
        mainAxisExtent: 70,
      ),
      itemCount: AppStrings.supportedLocales.length,
      itemBuilder: (_, i) {
        final l = AppStrings.supportedLocales[i];
        final isSelected = l.code == selected;
        return GestureDetector(
          onTap: () => onSelect(l.code),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? AppColors.violet : AppColors.border,
                width: 2,
              ),
              boxShadow: [
                if (isSelected)
                  BoxShadow(
                    color: AppColors.violet.withValues(alpha: 0.1),
                    blurRadius: 10,
                  ),
              ],
            ),
            child: Row(children: [
              Text(l.flag, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      l.englishName,
                      style: TextStyle(
                        color: AppColors.navy,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      l.nativeName,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
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
  const _CountryTile({
    required this.country,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? AppColors.violet : AppColors.border,
              width: 1.5,
            ),
          ),
          child: Row(children: [
            Text(country.flag, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                country.name,
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 15,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle_rounded, color: AppColors.violet, size: 20),
          ]),
        ),
      ),
    );
  }
}
