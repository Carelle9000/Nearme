import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/profile.dart';

class MatchService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Enregistre un "Like" et vérifie si c'est un match mutuel
  Future<bool> swipeLike(String currentUserId, Profile targetProfile) async {
    try {
      // 1. Enregistrer le like
      await _db
          .collection('profiles')
          .doc(currentUserId)
          .collection('likes')
          .doc(targetProfile.id)
          .set({
        'targetId': targetProfile.id,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // 2. Vérifier si l'autre a déjà liké
      final otherLike = await _db
          .collection('profiles')
          .doc(targetProfile.id)
          .collection('likes')
          .doc(currentUserId)
          .get();

      if (otherLike.exists) {
        // C'est un match !
        await _createMatch(currentUserId, targetProfile.id);
        return true;
      }
      return false;
    } catch (e) {
      print('Error swiping like: $e');
      return false;
    }
  }

  Future<void> _createMatch(String user1, String user2) async {
    final matchId = user1.hashCode <= user2.hashCode
        ? '${user1}_$user2'
        : '${user2}_$user1';

    await _db.collection('matches').doc(matchId).set({
      'users': [user1, user2],
      'matchedAt': FieldValue.serverTimestamp(),
      'lastMessage': null,
    });
  }

  Stream<List<String>> getMatchesIds(String userId) {
    return _db
        .collection('matches')
        .where('users', arrayContains: userId)
        .snapshots()
        .map((snap) => snap.docs.map((doc) {
              final users = List<String>.from(doc.data()['users']);
              return users.firstWhere((id) => id != userId);
            }).toList());
  }
}
