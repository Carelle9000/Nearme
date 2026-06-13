import 'dart:io';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';

import '../../data/services/photo_service.dart';
import '../theme/app_colors.dart';

/// Displays a photo from any of these sources, resolving asynchronously:
///
///  • Supabase storage path (e.g. `userId/1748000000.jpg`)
///    → generates/caches a signed URL then uses [Image.network]
///  • Local file path (starts with `/`)
///    → [Image.file] — used during the registration preview
///  • HTTP URL (starts with `http`)
///    → [Image.network] directly
///
/// Shows a shimmer placeholder while loading and a rose icon on error.
class SignedPhotoImage extends StatefulWidget {
  final String path;
  final BoxFit fit;

  const SignedPhotoImage({
    super.key,
    required this.path,
    this.fit = BoxFit.cover,
  });

  @override
  State<SignedPhotoImage> createState() => _SignedPhotoImageState();
}

class _SignedPhotoImageState extends State<SignedPhotoImage> {
  String? _resolved; // null = loading
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  @override
  void didUpdateWidget(SignedPhotoImage old) {
    super.didUpdateWidget(old);
    if (old.path != widget.path) _resolve();
  }

  void _resolve() {
    if (!mounted) return;
    setState(() {
      _resolved = PhotoService.resolveDisplayUrl(widget.path);
      _error    = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_error) return _ErrorTile();
    if (_resolved == null) return _ShimmerTile();

    // Local file (registration flow — still on device)
    if (!kIsWeb && _resolved!.startsWith('/')) {
      return Image.file(
        File(_resolved!),
        fit: widget.fit,
        errorBuilder: (ctx, err, stack) => _ErrorTile(),
      );
    }

    // Remote URL (signed or public)
    return Image.network(
      _resolved!,
      fit: widget.fit,
      errorBuilder: (ctx, err, stack) => _ErrorTile(),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ShimmerTile extends StatelessWidget {
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
