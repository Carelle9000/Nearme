import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../../core/config/app_config.dart';

/// Gère le cycle de vie des photos de profil.
///
///  ┌─ INSCRIPTION (avant la création du compte) ──────────────────────────────┐
///  │  persistLocally()   → copie XFile dans app docs, retourne le chemin local │
///  │  deleteLocal()      → supprime la copie locale                            │
///  │  clearLocalPhotos() → nettoie toutes les photos temporaires               │
///  └──────────────────────────────────────────────────────────────────────────┘
///  ┌─ APRÈS L'INSCRIPTION ─────────────────────────────────────────────────────┐
///  │  AuthService lit les bytes depuis les chemins locaux et les poste         │
///  │  sur POST /photos/upload. AppUser.photos = URLs serveur.                  │
///  └──────────────────────────────────────────────────────────────────────────┘
///  ┌─ AFFICHAGE DES PHOTOS ────────────────────────────────────────────────────┐
///  │  resolveDisplayUrl() → chemin local (Image.file) ou URL serveur           │
///  └──────────────────────────────────────────────────────────────────────────┘
class PhotoService {
  PhotoService._();

  static const _kLocalFolder = 'reg_photos';

  // ── Local (prévisualisation pendant l'inscription) ────────────────────────

  static Future<String> persistLocally(XFile source) async {
    if (kIsWeb) return source.path;

    final dir = await _localDir();
    final ext = p.extension(source.name).isEmpty
        ? '.jpg'
        : p.extension(source.name);
    final filename = '${DateTime.now().millisecondsSinceEpoch}'
        '_${p.basenameWithoutExtension(source.name)}$ext';
    final dest = File(p.join(dir.path, filename));
    await dest.writeAsBytes(await source.readAsBytes());
    return dest.path;
  }

  static Future<void> deleteLocal(String localPath) async {
    if (kIsWeb) return;
    try {
      final f = File(localPath);
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }

  static Future<void> clearLocalPhotos() async {
    if (kIsWeb) return;
    try {
      final dir = await _localDir();
      await dir.delete(recursive: true);
    } catch (_) {}
  }

  // ── Affichage ─────────────────────────────────────────────────────────────

  /// Retourne une URL affichable par `Image.network` ou un chemin local
  /// pour `Image.file`.
  ///
  /// • Chemin absolu (commence par `/`)  → fichier local sur l'appareil
  /// • URL complète (commence par `http`) → passe directement
  /// • Chemin relatif serveur (`/photos/...`) → construit l'URL complète
  static String resolveDisplayUrl(String path) {
    if (path.isEmpty) return '';
    if (path.startsWith('/') && !path.startsWith('/photos')) return path;
    return AppConfig.photoUrl(path);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  static Future<Directory> _localDir() async {
    final docs = await getApplicationDocumentsDirectory();
    final dir  = Directory(p.join(docs.path, _kLocalFolder));
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }
}
