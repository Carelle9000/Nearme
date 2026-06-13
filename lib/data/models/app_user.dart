enum Intention { friendship, marriage, fun, sex }

/// Application user model.
///
/// Authentication credentials are handled entirely by Supabase Auth.
/// This model holds only profile data.
class AppUser {
  final String id;       // UUID from Supabase auth.users
  final String name;
  final String email;
  final DateTime createdAt;
  final bool verified;

  // Profile fields
  final String? gender;
  final double? height;
  final String? bio;
  final Intention? intention;
  final String? location;
  final List<String> interests;

  /// Storage paths in Supabase Storage bucket `profile-photos`.
  /// e.g. "userId/1748000000000.jpg"
  final List<String> photos;
  final bool isFaceVerified;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.createdAt,
    this.verified = false,
    this.gender,
    this.height,
    this.bio,
    this.intention,
    this.location,
    this.interests = const [],
    this.photos = const [],
    this.isFaceVerified = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'createdAt': createdAt.toIso8601String(),
        'verified': verified,
        'gender': gender,
        'height': height,
        'bio': bio,
        'intention': intention?.name,
        'location': location,
        'interests': interests,
        'photos': photos,
        'isFaceVerified': isFaceVerified,
      };

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        verified: json['verified'] as bool? ?? false,
        gender: json['gender'] as String?,
        height: (json['height'] as num?)?.toDouble(),
        bio: json['bio'] as String?,
        intention: json['intention'] != null
            ? Intention.values.byName(json['intention'] as String)
            : null,
        location: json['location'] as String?,
        interests: List<String>.from(json['interests'] ?? []),
        photos: List<String>.from(json['photos'] ?? []),
        isFaceVerified: json['isFaceVerified'] as bool? ?? false,
      );

  AppUser copyWith({
    String? name,
    String? gender,
    double? height,
    String? bio,
    Intention? intention,
    String? location,
    List<String>? interests,
    List<String>? photos,
    bool? isFaceVerified,
  }) =>
      AppUser(
        id: id,
        name: name ?? this.name,
        email: email,
        createdAt: createdAt,
        verified: verified,
        gender: gender ?? this.gender,
        height: height ?? this.height,
        bio: bio ?? this.bio,
        intention: intention ?? this.intention,
        location: location ?? this.location,
        interests: interests ?? this.interests,
        photos: photos ?? this.photos,
        isFaceVerified: isFaceVerified ?? this.isFaceVerified,
      );
}
