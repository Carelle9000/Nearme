import 'package:shared_preferences/shared_preferences.dart';

class LocaleService {
  static const _kLang = 'nearme_lang';
  static const _kCountry = 'nearme_country';

  final SharedPreferences _prefs;
  LocaleService(this._prefs);

  static Future<LocaleService> create() async =>
      LocaleService(await SharedPreferences.getInstance());

  String get langCode => _prefs.getString(_kLang) ?? 'en';
  String get countryCode => _prefs.getString(_kCountry) ?? 'US';

  Future<void> save({required String lang, required String country}) async {
    await _prefs.setString(_kLang, lang);
    await _prefs.setString(_kCountry, country);
  }
}
