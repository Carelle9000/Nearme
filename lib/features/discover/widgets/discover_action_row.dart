import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class DiscoverActionRow extends StatelessWidget {
  final VoidCallback onNope;
  final VoidCallback onSuperLike;
  final VoidCallback onLike;

  const DiscoverActionRow({
    super.key,
    required this.onNope,
    required this.onSuperLike,
    required this.onLike,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.xxxl,
        vertical: AppSpacing.lg,
      ),
      decoration: BoxDecoration(
        color: AppColors.bg.withValues(alpha: 0.8),
        border: Border(
          top: BorderSide(
            color: Colors.white.withValues(alpha: 0.05),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Nope Button
          _ActionButton(
            size: 56,
            onTap: onNope,
            bg: Colors.white.withValues(alpha: 0.05),
            border: Colors.white.withValues(alpha: 0.1),
            child: const Icon(
              Icons.close_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),

          // Super Like Button
          _ActionButton(
            size: 56,
            onTap: onSuperLike,
            bg: Colors.white.withValues(alpha: 0.05),
            border: AppColors.gold.withValues(alpha: 0.3),
            child: const Icon(
              Icons.star_rounded,
              color: AppColors.gold,
              size: 24,
            ),
          ),

          // Like Button
          _ActionButton(
            size: 56,
            onTap: onLike,
            bg: AppColors.violet,
            shadow: AppColors.violet.withValues(alpha: 0.4),
            child: const Icon(
              Icons.favorite_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatefulWidget {
  final double size;
  final VoidCallback onTap;
  final Widget child;
  final Color bg;
  final Color? border;
  final Color? shadow;

  const _ActionButton({
    required this.size,
    required this.onTap,
    required this.child,
    required this.bg,
    this.border,
    this.shadow,
  });

  @override
  State<_ActionButton> createState() => _ActionButtonState();
}

class _ActionButtonState extends State<_ActionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.88).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.bg,
            shape: BoxShape.circle,
            border: widget.border != null
                ? Border.all(color: widget.border!, width: 1.5)
                : null,
            boxShadow: widget.shadow != null
                ? [
                    BoxShadow(
                      color: widget.shadow!,
                      blurRadius: 20,
                      spreadRadius: -2,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Center(child: widget.child),
        ),
      ),
    );
  }
}
