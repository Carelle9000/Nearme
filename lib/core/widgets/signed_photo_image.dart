import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';

import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../data/services/photo_service.dart';
import '../theme/app_colors.dart';

/// Affiche une photo depuis n'importe quelle source :
///
/// • Fichier local (inscription, preview avant upload) → [Image.file] / [Image.memory]
/// • URL Firebase / HTTP / blob → [Image.network]
class SignedPhotoImage extends StatefulWidget {
  final String path;
  final BoxFit fit;
  final int? cacheWidth;
  final int? cacheHeight;

  const SignedPhotoImage({
    super.key,
    required this.path,
    this.fit = BoxFit.cover,
    this.cacheWidth,
    this.cacheHeight,
  });

  @override
  State<SignedPhotoImage> createState() => _SignedPhotoImageState();
}

class _SignedPhotoImageState extends State<SignedPhotoImage> {
  String? _localPath;
  String? _remoteUrl;
  Uint8List? _localBytes;
  bool _loading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(SignedPhotoImage old) {
    super.didUpdateWidget(old);
    if (old.path != widget.path) _load();
  }

  Future<void> _load() async {
    final path = widget.path;
    if (!mounted) return;

    setState(() {
      _loading = true;
      _error = false;
      _localPath = null;
      _remoteUrl = null;
      _localBytes = null;
    });

    if (path.isEmpty) {
      if (mounted) setState(() { _loading = false; _error = true; });
      return;
    }

    try {
      // Gérer les URLs Base64 sur le web
      if (path.startsWith('data:image/')) {
        final bytes = _base64ToBytes(path);
        if (mounted) {
          setState(() {
            _localBytes = bytes;
            _loading = false;
          });
        }
      } else if (PhotoService.isLocalFilePath(path)) {
        if (kIsWeb) {
          try {
            final bytes = await XFile(path).readAsBytes();
            if (mounted) {
              setState(() {
                _localBytes = bytes;
                _loading = false;
              });
            }
          } catch (_) {
            if (mounted) setState(() { _loading = false; _error = true; });
          }
        } else {
          if (mounted) {
            setState(() {
              _localPath = path;
              _loading = false;
            });
          }
        }
      } else {
        final displayUrl = PhotoService.resolveDisplayUrl(path);
        if (displayUrl.isNotEmpty) {
          if (mounted) {
            setState(() {
              _remoteUrl = displayUrl;
              _loading = false;
            });
          }
        } else {
          if (mounted) setState(() { _loading = false; _error = true; });
        }
      }
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = true; });
    }
  }

  Uint8List _base64ToBytes(String base64String) {
    final base64Data = base64String.split(',').last;
    return Uint8List.fromList(base64.decode(base64Data));
  }

  @override
  Widget build(BuildContext context) {
    if (_error) return const _ErrorTile();
    if (_loading) return const _ShimmerTile();

    if (_localBytes != null) {
      return Image.memory(
        _localBytes!,
        fit: widget.fit,
        cacheWidth: widget.cacheWidth,
        cacheHeight: widget.cacheHeight,
        errorBuilder: (_, __, ___) => const _ErrorTile(),
      );
    }

    if (_localPath != null) {
      return Image.file(
        File(_localPath!),
        fit: widget.fit,
        cacheWidth: widget.cacheWidth,
        cacheHeight: widget.cacheHeight,
        errorBuilder: (_, __, ___) => const _ErrorTile(),
      );
    }

    if (_remoteUrl != null) {
      return Image.network(
        _remoteUrl!,
        fit: widget.fit,
        cacheWidth: widget.cacheWidth,
        cacheHeight: widget.cacheHeight,
        loadingBuilder: (_, child, progress) {
          if (progress == null) return child;
          return const _ShimmerTile();
        },
        errorBuilder: (_, exception, stackTrace) {
          debugPrint('Image load error: $exception');
          return const _ErrorTile();
        },
      );
    }

    return const _ErrorTile();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ShimmerTile extends StatelessWidget {
  const _ShimmerTile();

  @override
  Widget build(BuildContext context) => Container(
        color: AppColors.rose.withValues(alpha: 0.06),
        child: const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              color: AppColors.rose,
              strokeWidth: 2,
            ),
          ),
        ),
      );
}

class _ErrorTile extends StatelessWidget {
  const _ErrorTile();

  @override
  Widget build(BuildContext context) => Container(
        color: AppColors.rose.withValues(alpha: 0.06),
        child: const Center(
          child: Icon(
            Icons.image_outlined,
            color: AppColors.rose,
            size: 28,
          ),
        ),
      );
}
