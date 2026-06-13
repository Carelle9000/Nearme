import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/constants/countries_data.dart';
import '../../data/models/country.dart';
import '../../data/services/locale_service.dart';
import '../../l10n/app_strings.dart';

class LocaleProvider extends ChangeNotifier {
  final LocaleService _service;
  String _langCode;
  Country _country;

  LocaleProvider(this._service)
      : _langCode = _service.langCode,
        _country = kCountries.firstWhere(
          (c) => c.code == _service.countryCode,
          orElse: () => kCountries.first,
        );

  String get langCode => _langCode;
  Country get country => _country;
  Locale get locale => Locale(_langCode, _country.code);
  TextDirection get direction =>
      AppStrings.isRtl(_langCode) ? TextDirection.rtl : TextDirection.ltr;

  String t(String key) => AppStrings.t(_langCode, key);

  // Persist immediately so back-button doesn't lose the selection.
  void selectLanguage(String code) {
    if (_langCode == code) return;
    _langCode = code;
    notifyListeners();
    unawaited(_service.save(lang: code, country: _country.code));
  }

  void selectCountry(Country country) {
    if (_country.code == country.code) return;
    _country = country;
    notifyListeners();
    unawaited(_service.save(lang: _langCode, country: country.code));
  }

  // Kept for backward compat — now a no-op since selection already persisted.
  Future<void> persist() => Future.value();
}
