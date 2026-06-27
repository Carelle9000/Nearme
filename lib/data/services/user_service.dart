import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geoflutterfire_plus/geoflutterfire_plus.dart';
import '../models/app_user.dart';
import '../models/profile.dart';
import '../models/discover_filters.dart';

class UserService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<List<Profile>> getPotentialMatches(
    String currentUserId, {
    DiscoverFilters? filters,
    GeoPoint? center,
  }) async {
    try {
      final collectionRef = _db.collection('profiles');

      // Récupérer uniquement mon propre ID pour ne pas me voir moi-même
      Set<String> excludedIds = {currentUserId};

      // Récupérer tout et appliquer les filtres côté client
      final querySnapshot = await collectionRef.limit(100).get();

      final results = querySnapshot.docs
          .where((doc) {
            if (excludedIds.contains(doc.id)) return false;
            return true;
          })
          .map((doc) {
            final data = doc.data();
            final appUser = AppUser.fromFirestore({...data, 'id': doc.id}, null);
            return Profile.fromAppUser(appUser);
          })
          .where((profile) {
            // Appliquer les filtres
            if (filters == null) return true;

            // Filtre par âge
            if (profile.age < filters.ageMin || profile.age > filters.ageMax) {
              return false;
            }

            // Filtre par distance (approximatif sans géolocalisation)
            // À améliorer avec une vraie géolocalisation
            // if (profile.distanceKm > filters.radiusKm) return false;

            // Filtre par vérification
            if (filters.verifiedOnly && !profile.verified) {
              return false;
            }

            // Filtre par statut en ligne
            if (filters.onlineOnly && !profile.online) {
              return false;
            }

            // Filtre par spots partagés
            if (filters.sharedOnly && !profile.sharedSpots) {
              return false;
            }

            return true;
          })
          .toList();

      return results;
    } catch (e) {
      print('Error fetching users: $e');
      return [];
    }
  }

  Future<Profile?> getProfile(String userId) async {
    try {
      final doc = await _db.collection('profiles').doc(userId).get();
      if (!doc.exists) return null;

      final data = doc.data() as Map<String, dynamic>;
      final appUser = AppUser.fromFirestore({...data, 'id': doc.id}, null);
      return Profile.fromAppUser(appUser);
    } catch (e) {
      print('Error fetching profile: $e');
      return null;
    }
  }

  Future<AppUser?> getUserById(String userId) async {
    try {
      final doc = await _db.collection('profiles').doc(userId).get();
      if (!doc.exists) return null;

      final data = doc.data() as Map<String, dynamic>;
      return AppUser.fromFirestore({...data, 'id': doc.id}, null);
    } catch (e) {
      print('Error fetching user: $e');
      return null;
    }
  }

  // --- Likes & Favoris ---

  Future<void> toggleLike(String currentUserId, String targetUserId) async {
    final likeRef = _db.collection('profiles').doc(targetUserId).collection('received_likes').doc(currentUserId);
    final doc = await likeRef.get();

    if (doc.exists) {
      await likeRef.delete();
      await _db.collection('profiles').doc(currentUserId).collection('sent_likes').doc(targetUserId).delete();
    } else {
      await likeRef.set({'timestamp': FieldValue.serverTimestamp()});
      await _db.collection('profiles').doc(currentUserId).collection('sent_likes').doc(targetUserId).set({'timestamp': FieldValue.serverTimestamp()});
    }
  }

  Future<void> toggleFavorite(String currentUserId, String targetUserId) async {
    final userRef = _db.collection('profiles').doc(currentUserId);
    final favRef = userRef.collection('favorites').doc(targetUserId);
    final doc = await favRef.get();

    if (doc.exists) {
      await favRef.delete();
      await userRef.update({
        'favorites': FieldValue.arrayRemove([targetUserId])
      });
    } else {
      await favRef.set({'timestamp': FieldValue.serverTimestamp()});
      await userRef.update({
        'favorites': FieldValue.arrayUnion([targetUserId])
      });
    }
  }

  Future<bool> isLiked(String currentUserId, String targetUserId) async {
    final doc = await _db.collection('profiles').doc(currentUserId).collection('sent_likes').doc(targetUserId).get();
    return doc.exists;
  }

  Future<bool> isFavorited(String currentUserId, String targetUserId) async {
    final doc = await _db.collection('profiles').doc(currentUserId).collection('favorites').doc(targetUserId).get();
    return doc.exists;
  }

  Future<List<Profile>> getFavorites(String currentUserId) async {
    final snapshot = await _db.collection('profiles').doc(currentUserId).collection('favorites').get();
    final ids = snapshot.docs.map((doc) => doc.id).toList();

    if (ids.isEmpty) return [];

    final profilesSnapshot = await _db.collection('profiles').where(FieldPath.documentId, whereIn: ids).get();
    return profilesSnapshot.docs.map((doc) {
      final data = doc.data();
      final appUser = AppUser.fromFirestore({...data, 'id': doc.id}, null);
      return Profile.fromAppUser(appUser);
    }).toList();
  }

  Future<List<Profile>> getLikes(String currentUserId) async {
    final snapshot = await _db.collection('profiles').doc(currentUserId).collection('received_likes').get();
    final ids = snapshot.docs.map((doc) => doc.id).toList();

    if (ids.isEmpty) return [];

    final profilesSnapshot = await _db.collection('profiles').where(FieldPath.documentId, whereIn: ids).get();
    return profilesSnapshot.docs.map((doc) {
      final data = doc.data();
      final appUser = AppUser.fromFirestore({...data, 'id': doc.id}, null);
      return Profile.fromAppUser(appUser);
    }).toList();
  }

  Future<List<Profile>> getSentLikes(String currentUserId) async {
    final snapshot = await _db.collection('profiles').doc(currentUserId).collection('sent_likes').get();
    final ids = snapshot.docs.map((doc) => doc.id).toList();

    if (ids.isEmpty) return [];

    final profilesSnapshot = await _db.collection('profiles').where(FieldPath.documentId, whereIn: ids).get();
    return profilesSnapshot.docs.map((doc) {
      final data = doc.data();
      final appUser = AppUser.fromFirestore({...data, 'id': doc.id}, null);
      return Profile.fromAppUser(appUser);
    }).toList();
  }
}
