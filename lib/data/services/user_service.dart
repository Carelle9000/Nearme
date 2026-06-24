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
      print('DEBUG: Fetching potential matches for $currentUserId');

      // Récupérer les IDs déjà swipés (Likes et Nopes) pour les exclure
      Set<String> excludedIds = {currentUserId};
      try {
        final sentLikes = await collectionRef.doc(currentUserId).collection('sent_likes').get();
        final nopes = await collectionRef.doc(currentUserId).collection('nopes').get();
        excludedIds.addAll(sentLikes.docs.map((d) => d.id));
        excludedIds.addAll(nopes.docs.map((d) => d.id));
        print('DEBUG: Excluded ${excludedIds.length} IDs (including self)');
      } catch (e) {
        print('DEBUG: Error fetching excluded IDs (likely permission error on subcollections): $e');
      }

      // 1. Si on a une position centrale, on fait une geo-query
      if (center != null && filters != null) {
        // ... (code existant pour geo-query)
      }

      // 2. Fallback sans geo-query (Récupère tout le monde pour débugger)
      print('DEBUG: Running fallback query on "profiles" collection...');

      // On enlève temporairement le filtre verifiedOnly pour être sûr de voir des profils
      Query query = collectionRef.limit(50);

      final querySnapshot = await query.get();
      print('DEBUG: Found ${querySnapshot.docs.length} total documents in "profiles"');

      final results = querySnapshot.docs
          .where((doc) {
            final isExcluded = excludedIds.contains(doc.id);
            if (isExcluded) print('DEBUG: Filtering out excluded doc: ${doc.id}');
            return !isExcluded;
          })
          .map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            final appUser = AppUser.fromFirestore({...data, 'id': doc.id}, null);
            return Profile.fromAppUser(appUser);
          }).toList();

      print('DEBUG: Returning ${results.length} profiles to the UI');
      return results;
    } catch (e) {
      print('Error fetching users (Global Catch): $e');
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
}
