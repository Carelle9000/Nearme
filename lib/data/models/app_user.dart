import 'package:cloud_firestore/cloud_firestore.dart';

enum Intention { friendship, marriage, fun, sex }

/// Application user model.
///
/// Authentication credentials are handled by Firebase Auth.
/// This model holds only profile data.
class AppUser {
  final String id;       // UID from Firebase Auth
  final String name;
  final String email;
  final DateTime createdAt;
  final bool verified;

  // Profile fields
  final String? gender;
  final String? interestedIn;
  final DateTime? birthDate;
  final double? searchDistance;
  final double? height;
  final String? bio;
  final Intention? intention;
  final String? location;
  final List<String> interests;

  /// Firebase Storage URLs for profile photos.
  final List<String>? photos;
  final bool? isFaceVerified;
  final bool isAgeVerified;

  /// Geolocation data for NearMe proximity features.
  /// Format: { 'geopoint': GeoPoint, 'geohash': String }
  final Map<String, dynamic>? position;

  final List<String> favorites;

  // Presence
  final bool isOnline;
  final DateTime? lastSeen;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.createdAt,
    this.verified = false,
    this.gender,
    this.interestedIn,
    this.birthDate,
    this.searchDistance,
    this.height,
    this.bio,
    this.intention,
    this.location,
    this.interests = const [],
    this.photos,
    this.isFaceVerified,
    this.isAgeVerified = false,
    this.position,
    this.favorites = const [],
    this.isOnline = false,
    this.lastSeen,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'createdAt': createdAt.toIso8601String(),
        'verified': verified,
        'gender': gender,
        'interestedIn': interestedIn,
        'birthDate': birthDate?.toIso8601String(),
        'searchDistance': searchDistance,
        'height': height,
        'bio': bio,
        'intention': intention?.name,
        'location': location,
        'interests': interests,
        'photos': photos ?? [],
        'isFaceVerified': isFaceVerified ?? false,
        'isAgeVerified': isAgeVerified,
        'position': position,
        'favorites': favorites,
        'isOnline': isOnline,
        'lastSeen': lastSeen?.toIso8601String(),
      };

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String,
        email: json['email'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        verified: json['verified'] as bool? ?? false,
        gender: json['gender'] as String?,
        interestedIn: json['interestedIn'] as String?,
        birthDate: json['birthDate'] != null
            ? DateTime.parse(json['birthDate'] as String)
            : null,
        searchDistance: (json['searchDistance'] as num?)?.toDouble(),
        height: (json['height'] as num?)?.toDouble(),
        bio: json['bio'] as String?,
        intention: _parseIntention(json['intention'] as String?),
        location: json['location'] as String?,
        interests: List<String>.from(json['interests'] ?? []),
        photos: List<String>.from(json['photos'] ?? []),
        isFaceVerified: json['isFaceVerified'] as bool? ?? false,
        isAgeVerified: json['isAgeVerified'] as bool? ?? false,
        position: json['position'] as Map<String, dynamic>?,
        favorites: List<String>.from(json['favorites'] ?? []),
        isOnline: json['isOnline'] as bool? ?? false,
        lastSeen: json['lastSeen'] != null
            ? DateTime.parse(json['lastSeen'] as String)
            : null,
      );

  factory AppUser.fromFirestore(Map<String, dynamic> data, dynamic user) {
    final displayName = user?.displayName ?? '';
    final email = user?.email ?? '';

    return AppUser(
      id: user?.uid ?? data['id'] ?? '',
      name: data['name'] as String? ?? displayName,
      email: data['email'] as String? ?? email,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      verified: user?.emailVerified ?? false,
      gender: data['gender'] as String?,
      interestedIn: data['interestedIn'] as String?,
      birthDate: data['birthDate'] != null
          ? (data['birthDate'] as Timestamp).toDate()
          : null,
      searchDistance: (data['searchDistance'] as num?)?.toDouble(),
      height: (data['heightCm'] as num?)?.toDouble(),
      bio: data['bio'] as String?,
      intention: _parseIntention(data['intention'] as String?),
      location: data['location'] as String?,
      interests: List<String>.from(data['interests'] ?? []),
      photos: List<String>.from(data['photos'] ?? []),
      isFaceVerified: data['isFaceVerified'] as bool? ?? false,
      isAgeVerified: data['isAgeVerified'] as bool? ?? false,
      position: data['position'] as Map<String, dynamic>?,
      favorites: List<String>.from(data['favorites'] ?? []),
      isOnline: data['isOnline'] as bool? ?? false,
      lastSeen: data['lastSeen'] != null
          ? (data['lastSeen'] as Timestamp).toDate()
          : null,
    );
  }

  static Intention? _parseIntention(String? value) {
    if (value == null) return null;
    final cleanValue = value.split('.').last;
    return Intention.values.asNameMap()[cleanValue];
  }

  Map<String, dynamic> toFirestore() => {
        'name': name,
        'email': email,
        'gender': gender,
        'interestedIn': interestedIn,
        'birthDate': birthDate,
        'searchDistance': searchDistance,
        'heightCm': height?.toInt(),
        'bio': bio,
        'intention': intention?.name,
        'location': location,
        'interests': interests,
        'photos': photos ?? [],
        'isFaceVerified': isFaceVerified ?? false,
        'isAgeVerified': isAgeVerified,
        'position': position,
        'favorites': favorites,
        'isOnline': isOnline,
        'lastSeen': lastSeen != null ? Timestamp.fromDate(lastSeen!) : null,
        'updatedAt': FieldValue.serverTimestamp(),
      };

  AppUser copyWith({
    String? name,
    String? gender,
    String? interestedIn,
    DateTime? birthDate,
    double? searchDistance,
    double? height,
    String? bio,
    Intention? intention,
    String? location,
    List<String>? interests,
    List<String>? photos,
    bool? isFaceVerified,
    bool? isAgeVerified,
    Map<String, dynamic>? position,
    List<String>? favorites,
    bool? isOnline,
    DateTime? lastSeen,
  }) =>
      AppUser(
        id: id,
        name: name ?? this.name,
        email: email,
        createdAt: createdAt,
        verified: verified,
        gender: gender ?? this.gender,
        interestedIn: interestedIn ?? this.interestedIn,
        birthDate: birthDate ?? this.birthDate,
        searchDistance: searchDistance ?? this.searchDistance,
        height: height ?? this.height,
        bio: bio ?? this.bio,
        intention: intention ?? this.intention,
        location: location ?? this.location,
        interests: interests ?? this.interests,
        photos: photos ?? this.photos,
        isFaceVerified: isFaceVerified ?? this.isFaceVerified,
        isAgeVerified: isAgeVerified ?? this.isAgeVerified,
        position: position ?? this.position,
        favorites: favorites ?? this.favorites,
        isOnline: isOnline ?? this.isOnline,
        lastSeen: lastSeen ?? this.lastSeen,
      );


}
