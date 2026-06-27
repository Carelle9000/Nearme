import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

typedef ValidationFunction = String? Function(String value);

class ValidatedTextField extends StatefulWidget {
  final String label;
  final String? hint;
  final IconData? prefixIcon;
  final TextEditingController controller;
  final ValidationFunction? validator;
  final TextInputType keyboardType;
  final bool obscureText;
  final int? maxLines;
  final int? minLines;
  final ValueChanged<String>? onChanged;
  final bool showErrorMessage;
  final TextInputAction? textInputAction;
  final String? helperText;

  const ValidatedTextField({
    super.key,
    required this.label,
    this.hint,
    this.prefixIcon,
    required this.controller,
    this.validator,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
    this.maxLines = 1,
    this.minLines,
    this.onChanged,
    this.showErrorMessage = true,
    this.textInputAction,
    this.helperText,
  });

  @override
  State<ValidatedTextField> createState() => _ValidatedTextFieldState();
}

class _ValidatedTextFieldState extends State<ValidatedTextField> {
  String? _errorText;
  bool _isFocused = false;
  late FocusNode _focusNode;

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
    if (widget.validator != null) {
      final error = widget.validator!(widget.controller.text);
      setState(() => _errorText = error);
    }
  }

  bool get _isValid => _errorText == null && widget.controller.text.isNotEmpty;

  @override
  Widget build(BuildContext context) {
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
            if (_errorText != null && widget.showErrorMessage)
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
          keyboardType: widget.keyboardType,
          obscureText: widget.obscureText,
          maxLines: widget.obscureText ? 1 : widget.maxLines,
          minLines: widget.minLines,
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
            prefixIcon: widget.prefixIcon != null
                ? Icon(
                    widget.prefixIcon,
                    color: _isFocused ? AppColors.violet : AppColors.textMuted,
                    size: AppSpacing.iconMd,
                  )
                : null,
            suffixIcon: _isValid && widget.controller.text.isNotEmpty
                ? const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.emerald,
                    size: AppSpacing.iconMd,
                  )
                : null,
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
        // Helper text
        if (widget.helperText != null && !_isFocused)
          Column(
            children: [
              AppSpacing.vGapSm,
              Text(
                widget.helperText!,
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
