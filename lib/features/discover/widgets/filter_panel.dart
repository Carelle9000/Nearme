import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
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
    context.read<DiscoverProvider>().updateFilters(_draft);
    Navigator.of(context).pop();
  }

  void _reset() {
    setState(() => _draft = const DiscoverFilters());
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
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
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Title row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Filters', style: AppTheme.display(size: 22)),
              TextButton(
                onPressed: _reset,
                child: Text(
                  'Reset',
                  style: AppTheme.body(
                    size: 13,
                    color: AppColors.violet,
                    weight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Age range
          _FilterLabel(
            label: 'Age Range',
            value: '${_draft.ageMin}–${_draft.ageMax}',
          ),
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
          const SizedBox(height: 12),

          // Radius
          _FilterLabel(
            label: 'Radius',
            value: '${_draft.radiusKm.toStringAsFixed(1)} km',
          ),
          Slider(
            value: _draft.radiusKm,
            min: 0.5,
            max: 50,
            divisions: 99,
            label: '${_draft.radiusKm.toStringAsFixed(1)} km',
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(radiusKm: v)),
          ),
          const SizedBox(height: 8),

          // Toggle switches
          _FilterSwitch(
            label: '✅ Verified Only',
            value: _draft.verifiedOnly,
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(verifiedOnly: v)),
          ),
          _FilterSwitch(
            label: '🟢 Online Now',
            value: _draft.onlineOnly,
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(onlineOnly: v)),
          ),
          _FilterSwitch(
            label: '🏠 Shared Spots',
            value: _draft.sharedOnly,
            onChanged: (v) =>
                setState(() => _draft = _draft.copyWith(sharedOnly: v)),
          ),
          const SizedBox(height: 20),

          // Apply button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _apply,
              child: const Text('Apply Filters'),
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
  final bool value;
  final ValueChanged<bool> onChanged;
  const _FilterSwitch({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: AppTheme.body(
                  size: 14, color: AppColors.textPrimary)),
          Switch(
            value: value,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
