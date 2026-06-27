import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/discover_filters.dart';
import '../../auth/auth_provider.dart';
import '../discover_provider.dart';

/// Shows the filter panel as a modal bottom sheet.
void showFilterPanel(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => ChangeNotifierProvider.value(
      value: context.read<DiscoverProvider>(),
      child: const _FilterPanel(),
    ),
  );
}

class _FilterPanel extends StatefulWidget {
  const _FilterPanel();

  @override
  State<_FilterPanel> createState() => _FilterPanelState();
}

class _FilterPanelState extends State<_FilterPanel> {
  late DiscoverFilters _draft;

  @override
  void initState() {
    super.initState();
    _draft = context.read<DiscoverProvider>().filters;
  }

  void _apply() {
    final dp = context.read<DiscoverProvider>();
    dp.updateFilters(_draft);

    final auth = context.read<AuthProvider>();
    if (auth.user != null) {
      dp.loadUsers(auth.user!.id);
    }

    Navigator.of(context).pop();
  }

  void _reset() {
    setState(() => _draft = const DiscoverFilters());
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF1A1625),
            const Color(0xFF0F0D1A),
          ],
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Title row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Refine Search',
                style: GoogleFonts.fraunces(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
              TextButton.icon(
                onPressed: _reset,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text(
                  'Reset',
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    color: AppColors.violet,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Age range
          _FilterLabel(
            label: 'Age Range',
            value: '${_draft.ageMin}–${_draft.ageMax}',
          ),
          const SizedBox(height: 10),
          RangeSlider(
            values: RangeValues(
              _draft.ageMin.toDouble(),
              _draft.ageMax.toDouble(),
            ),
            min: 18,
            max: 60,
            divisions: 42,
            labels: RangeLabels(
              '${_draft.ageMin}',
              '${_draft.ageMax}',
            ),
            onChanged: (v) => setState(() => _draft = _draft.copyWith(
                  ageMin: v.start.round(),
                  ageMax: v.end.round(),
                )),
          ),
          const SizedBox(height: 20),

          // Radius
          _FilterLabel(
            label: 'Distance Radius',
            value: '${_draft.radiusKm.toStringAsFixed(1)} km',
          ),
          const SizedBox(height: 10),
          Slider(
            value: _draft.radiusKm,
            min: 0.5,
            max: 50,
            divisions: 99,
            label: '${_draft.radiusKm.toStringAsFixed(1)} km',
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(radiusKm: v)),
          ),
          const SizedBox(height: 24),

          // Toggle switches
          _FilterSwitch(
            label: 'Verified Only',
            icon: Icons.verified_user_rounded,
            value: _draft.verifiedOnly,
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(verifiedOnly: v)),
          ),
          const SizedBox(height: 12),
          _FilterSwitch(
            label: 'Online Now',
            icon: Icons.circle_rounded,
            value: _draft.onlineOnly,
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(onlineOnly: v)),
          ),
          const SizedBox(height: 12),
          _FilterSwitch(
            label: 'Shared Spots Only',
            icon: Icons.location_on_rounded,
            value: _draft.sharedOnly,
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(sharedOnly: v)),
          ),
          const SizedBox(height: 28),

          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.violet,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: _apply,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.search_rounded, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Apply Filters',
                    style: GoogleFonts.dmSans(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper widgets
// ─────────────────────────────────────────────────────────────────────────────

class _FilterLabel extends StatelessWidget {
  final String label;
  final String value;
  const _FilterLabel({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: AppTheme.body(
                size: 14,
                weight: FontWeight.w600,
                color: AppColors.textPrimary)),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.violet.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(value,
              style: AppTheme.body(
                  size: 13,
                  weight: FontWeight.w600,
                  color: AppColors.violet)),
        ),
      ],
    );
  }
}

class _FilterSwitch extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool value;
  final ValueChanged<bool> onChanged;
  const _FilterSwitch({
    required this.label,
    required this.icon,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: value
            ? AppColors.violet.withValues(alpha: 0.15)
            : Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: value
              ? AppColors.violet.withValues(alpha: 0.3)
              : Colors.white.withValues(alpha: 0.1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: value ? AppColors.violet : Colors.white70),
              const SizedBox(width: 10),
              Text(
                label,
                style: GoogleFonts.dmSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          Switch(
            value: value,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
