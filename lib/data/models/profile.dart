class Profile {
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
  final bool sharedSpots;

  const Profile({
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
    required this.sharedSpots,
  });
}
