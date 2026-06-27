import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

enum PasswordStrength { weak, fair, good, strong }

class PasswordField extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final bool showStrengthIndicator;
  final String? confirmPassword; // For password matching
  final TextInputAction? textInputAction;
  final bool showMatchIndicator;

  const PasswordField({
    super.key,
    required this.label,
    this.hint,
    required this.controller,
    this.onChanged,
    this.showStrengthIndicator = true,
    this.confirmPassword,
    this.textInputAction,
    this.showMatchIndicator = false,
  });

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscureText = true;
  bool _isFocused = false;
  late FocusNode _focusNode;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
    widget.controller.addListener(_validate);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    widget.controller.removeListener(_validate);
    super.dispose();
  }

  void _onFocusChange() {
    setState(() => _isFocused = _focusNode.hasFocus);
  }

  void _validate() {
    setState(() {
      if (widget.showMatchIndicator && widget.confirmPassword != null) {
        if (widget.controller.text != widget.confirmPassword) {
          _errorText = 'Passwords do not match';
        } else {
          _errorText = null;
        }
      }
    });
  }

  PasswordStrength _calculateStrength(String password) {
    if (password.isEmpty) return PasswordStrength.weak;
    if (password.length < 8) return PasswordStrength.weak;
    if (password.length < 12) return PasswordStrength.fair;

    bool hasUppercase = password.contains(RegExp(r'[A-Z]'));
    bool hasLowercase = password.contains(RegExp(r'[a-z]'));
    bool hasNumbers = password.contains(RegExp(r'[0-9]'));
    bool hasSpecial = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));

    int strength = 0;
    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecial) strength++;

    if (password.length >= 12 && strength >= 3) return PasswordStrength.strong;
    if (password.length >= 10 && strength >= 2) return PasswordStrength.good;
    return PasswordStrength.fair;
  }

  Color _getStrengthColor(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return const Color(0xFFEF4444);
      case PasswordStrength.fair:
        return const Color(0xFFF59E0B);
      case PasswordStrength.good:
        return const Color(0xFF10B981);
      case PasswordStrength.strong:
        return AppColors.violet;
    }
  }

  String _getStrengthLabel(PasswordStrength strength) {
    switch (strength) {
      case PasswordStrength.weak:
        return 'Weak';
      case PasswordStrength.fair:
        return 'Fair';
      case PasswordStrength.good:
        return 'Good';
      case PasswordStrength.strong:
        return 'Strong';
    }
  }

  @override
  Widget build(BuildContext context) {
    final strength = _calculateStrength(widget.controller.text);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Label with error indicator
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.label,
              style: GoogleFonts.dmSans(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: _isFocused ? AppColors.violet : AppColors.textMuted,
                letterSpacing: 0.5,
              ),
            ),
            if (_errorText != null)
              Text(
                _errorText!,
                style: GoogleFonts.dmSans(
                  fontSize: 10,
                  color: const Color(0xFFEF4444),
                  fontWeight: FontWeight.w500,
                ),
              ),
          ],
        ),
        AppSpacing.vGapSm,
        // TextField
        TextField(
          controller: widget.controller,
          focusNode: _focusNode,
          onChanged: (value) {
            _validate();
            widget.onChanged?.call(value);
          },
          obscureText: _obscureText,
          textInputAction: widget.textInputAction,
          style: GoogleFonts.dmSans(
            fontSize: 14,
            color: AppColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: widget.hint ?? widget.label,
            hintStyle: GoogleFonts.dmSans(
              fontSize: 14,
              color: AppColors.textMuted,
            ),
            prefixIcon: const Icon(
              Icons.lock_outline_rounded,
              color: AppColors.textMuted,
              size: AppSpacing.iconMd,
            ),
            suffixIcon: GestureDetector(
              onTap: () => setState(() => _obscureText = !_obscureText),
              child: Icon(
                _obscureText
                    ? Icons.visibility_off_rounded
                    : Icons.visibility_rounded,
                color: _isFocused ? AppColors.violet : AppColors.textMuted,
                size: AppSpacing.iconMd,
              ),
            ),
            filled: true,
            fillColor: _isFocused
                ? AppColors.surfaceHigh.withValues(alpha: 0.8)
                : AppColors.surface,
            contentPadding: AppSpacing.inputContentPadding,
            border: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppSpacing.inputBorderRadius),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppSpacing.inputBorderRadius),
              borderSide: BorderSide(
                color: _errorText != null
                    ? const Color(0xFFEF4444)
                    : AppColors.border,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppSpacing.inputBorderRadius),
              borderSide: BorderSide(
                color: _errorText != null
                    ? const Color(0xFFEF4444)
                    : AppColors.violet,
                width: 1.5,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppSpacing.inputBorderRadius),
              borderSide: const BorderSide(
                color: Color(0xFFEF4444),
                width: 1,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius:
                  BorderRadius.circular(AppSpacing.inputBorderRadius),
              borderSide: const BorderSide(
                color: Color(0xFFEF4444),
                width: 1.5,
              ),
            ),
          ),
        ),
        // Strength indicator
        if (widget.showStrengthIndicator && widget.controller.text.isNotEmpty)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppSpacing.vGapMd,
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusSm),
                      child: LinearProgressIndicator(
                        value: strength.index / PasswordStrength.values.length,
                        backgroundColor: Colors.white.withValues(alpha: 0.05),
                        color: _getStrengthColor(strength),
                        minHeight: 4,
                      ),
                    ),
                  ),
                  AppSpacing.hGapMd,
                  Text(
                    _getStrengthLabel(strength),
                    style: GoogleFonts.dmSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _getStrengthColor(strength),
                    ),
                  ),
                ],
              ),
              AppSpacing.vGapSm,
              Text(
                'At least 8 characters, mix of uppercase, lowercase, numbers, and symbols',
                style: GoogleFonts.dmSans(
                  fontSize: 11,
                  color: AppColors.textMuted,
                  height: 1.4,
                ),
              ),
            ],
          ),
      ],
    );
  }
}
