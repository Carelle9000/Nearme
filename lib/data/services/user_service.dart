import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/app_user.dart';
import '../models/profile.dart';

class UserService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<List<Profile>> getPotentialMatches(String currentUserId) async {
    try {
      // Pour une vraie application, on filtrerait par localisation, genre, etc.
      // Ici on récupère simplement les autres profils
      final querySnapshot = await _db
          .collection('profiles')
          .where('id', isNotEqualTo: currentUserId)
          .limit(20)
          .get();

      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        // Simuler un objet "user" de Firebase Auth car AppUser.fromFirestore en a besoin
        // Ou utiliser AppUser.fromJson si on a tout dans Firestore
        final appUser = AppUser.fromJson({...data, 'id': doc.id});
        return Profile.fromAppUser(appUser);
      }).toList();
    } catch (e) {
      print('Error fetching users: $e');
      return [];
    }
  }
}
