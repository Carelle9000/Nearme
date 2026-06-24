class DiscoverFilters {
  final int ageMin;
  final int ageMax;
  final double radiusKm;
  final String? countryCode;
  final bool verifiedOnly;
  final bool onlineOnly;
  final bool sharedOnly;

  const DiscoverFilters({
    this.ageMin = 18,
    this.ageMax = 40,
    this.radiusKm = 2.0,
    this.countryCode,
    this.verifiedOnly = true,
    this.onlineOnly = false,
    this.sharedOnly = false,
  });

  DiscoverFilters copyWith({
    int? ageMin,
    int? ageMax,
    double? radiusKm,
    String? countryCode,
    bool? verifiedOnly,
    bool? onlineOnly,
    bool? sharedOnly,
  }) =>
      DiscoverFilters(
        ageMin: ageMin ?? this.ageMin,
        ageMax: ageMax ?? this.ageMax,
        radiusKm: radiusKm ?? this.radiusKm,
        countryCode: countryCode ?? this.countryCode,
        verifiedOnly: verifiedOnly ?? this.verifiedOnly,
        onlineOnly: onlineOnly ?? this.onlineOnly,
        sharedOnly: sharedOnly ?? this.sharedOnly,
      );
}
