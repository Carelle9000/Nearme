import 'app_user.dart';

class Profile {
  final String id;
  final String name;
  final int age;
  final String emoji;
  final String hood;
  final String country;
  final double distanceKm;
  final String bio;
  final List<String> tags;
  final String badge;
  final String gender;
  final String goal;
  final bool verified;
  final bool online;
  final DateTime? lastSeen;
  final bool sharedSpots;
  final List<String> photos;

  const Profile({
    required this.id,
    required this.name,
    required this.age,
    required this.emoji,
    required this.hood,
    required this.country,
    required this.distanceKm,
    required this.bio,
    required this.tags,
    required this.badge,
    required this.gender,
    required this.goal,
    required this.verified,
    required this.online,
    this.lastSeen,
    required this.sharedSpots,
    this.photos = const [],
  });

  factory Profile.fromAppUser(AppUser user) {
    final age = user.birthDate != null
        ? DateTime.now().year - user.birthDate!.year
        : 0;

    // Consider online if isOnline is true AND lastSeen is within last 5 minutes
    final isRecentlySeen = user.lastSeen != null &&
        DateTime.now().difference(user.lastSeen!).inMinutes < 5;
    final isOnline = user.isOnline || isRecentlySeen;

    return Profile(
      id: user.id,
      name: user.name,
      age: age,
      emoji: '👤', // Default emoji if no photo
      hood: user.location ?? 'Unknown',
      country: 'FR', // Default for now
      distanceKm: 0.0, // Should be calculated
      bio: user.bio ?? '',
      tags: user.interests,
      badge: user.intention != null ? _intentionLabel(user.intention!) : '',
      gender: user.gender ?? 'Unknown',
      goal: user.intention?.name ?? '',
      verified: user.isAgeVerified,
      online: isOnline,
      lastSeen: user.lastSeen,
      sharedSpots: false,
      photos: user.photos ?? [],
    );
  }

  static String _intentionLabel(Intention i) {
    switch (i) {
      case Intention.friendship: return 'Amitié';
      case Intention.marriage: return 'Mariage';
      case Intention.fun: return 'Fun';
      case Intention.sex: return 'Sexe';
    }
  }

  Profile copyWith({
    String? id,
    String? name,
    int? age,
    String? emoji,
    String? hood,
    String? country,
    double? distanceKm,
    String? bio,
    List<String>? tags,
    String? badge,
    String? gender,
    String? goal,
    bool? verified,
    bool? online,
    DateTime? lastSeen,
    bool? sharedSpots,
    List<String>? photos,
  }) {
    return Profile(
      id: id ?? this.id,
      name: name ?? this.name,
      age: age ?? this.age,
      emoji: emoji ?? this.emoji,
      hood: hood ?? this.hood,
      country: country ?? this.country,
      distanceKm: distanceKm ?? this.distanceKm,
      bio: bio ?? this.bio,
      tags: tags ?? this.tags,
      badge: badge ?? this.badge,
      gender: gender ?? this.gender,
      goal: goal ?? this.goal,
      verified: verified ?? this.verified,
      online: online ?? this.online,
      lastSeen: lastSeen ?? this.lastSeen,
      sharedSpots: sharedSpots ?? this.sharedSpots,
      photos: photos ?? this.photos,
    );
  }
}
