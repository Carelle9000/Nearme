import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';

import 'package:firebase_storage/firebase_storage.dart';
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
    if (kIsWeb) {
      // Sur le web, convertir en Base64 pour éviter les problèmes de blob URL expirées
      final bytes = await source.readAsBytes();
      final base64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      return base64;
    }

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
  /// pour `Image.file` / `Image.memory`.
  ///
  /// • Chemin local absolu (Unix, Windows) → retourné tel quel
  /// • URL complète (`http`, `https`, `blob:`) → retournée telle quelle
  /// • Chemin relatif serveur (`/photos/...`) → construit l'URL complète
  static String resolveDisplayUrl(String path) {
    if (path.isEmpty) return '';
    if (isLocalFilePath(path)) return path;
    if (isRemoteUrl(path)) return path;
    return AppConfig.photoUrl(path);
  }

  /// True when [path] points to a file on device (pre-upload preview).
  static bool isLocalFilePath(String path) {
    if (path.isEmpty) return false;
    if (isRemoteUrl(path)) return false;
    // Unix absolute path (Android/iOS/macOS/Linux)
    if (path.startsWith('/') && !path.startsWith('/photos')) return true;
    // Windows absolute path (C:\...) or UNC
    if (!kIsWeb && (path.contains(':\\') || path.startsWith(r'\\'))) {
      return true;
    }
    return false;
  }

  /// True when [path] is a remote or blob URL loadable via [Image.network].
  static bool isRemoteUrl(String path) {
    return path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('blob:');
  }

  // ── Firebase Storage ──────────────────────────────────────────────────────

  /// Uploads a single photo to Firebase Storage.
  /// Returns the download URL.
  static Future<String> uploadToStorage(
    String uid,
    String localPath,
    int index,
  ) async {
    final bytes = await _readImageBytes(localPath);
    final ext = p.extension(localPath).isEmpty
        ? '.jpg'
        : p.extension(localPath);
    final filename =
        '${DateTime.now().millisecondsSinceEpoch}$ext';
    final ref = FirebaseStorage.instance.ref('photos/$uid/$filename');
    await ref.putData(
      bytes,
      SettableMetadata(contentType: 'image/jpeg'),
    );
    return ref.getDownloadURL();
  }

  /// Reads image bytes from a local path or image_picker cache URI.
  static Future<Uint8List> _readImageBytes(String localPath) async {
    // Gérer les chaînes Base64 sur le web
    if (kIsWeb && localPath.startsWith('data:image/')) {
      final base64Data = localPath.split(',').last;
      return Uint8List.fromList(base64.decode(base64Data));
    }
    
    if (!kIsWeb) {
      try {
        final file = File(localPath);
        if (await file.exists()) {
          return file.readAsBytes();
        }
      } catch (_) {}
    }
    return XFile(localPath).readAsBytes();
  }

  /// Uploads multiple photos to Firebase Storage.
  /// Returns a list of download URLs in order.
  static Future<List<String>> uploadAll(
    String uid,
    List<String> localPaths,
  ) async {
    final urls = <String>[];
    for (var i = 0; i < localPaths.length; i++) {
      urls.add(await uploadToStorage(uid, localPaths[i], i));
    }
    return urls;
  }

  /// Deletes a photo from Firebase Storage using its download URL.
  static Future<void> deleteFromStorage(String downloadUrl) async {
    try {
      await FirebaseStorage.instance.refFromURL(downloadUrl).delete();
    } catch (_) {}
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  static Future<Directory> _localDir() async {
    final docs = await getApplicationDocumentsDirectory();
    final dir  = Directory(p.join(docs.path, _kLocalFolder));
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }
}
