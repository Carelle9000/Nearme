import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geoflutterfire_plus/geoflutterfire_plus.dart';
import 'package:geolocator/geolocator.dart';

class LocationService {
  final _firestore = FirebaseFirestore.instance;

  /// Demande les permissions et récupère la position actuelle
  Future<Position?> getCurrentPosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return null;
    }

    if (permission == LocationPermission.deniedForever) return null;

    return await Geolocator.getCurrentPosition();
  }

  /// Met à jour la position de l'utilisateur dans Firestore
  Future<void> updateUserLocation(String userId, Position position) async {
    final geoPoint = GeoPoint(position.latitude, position.longitude);
    final geoFirePoint = GeoFirePoint(geoPoint);

    await _firestore.collection('profiles').doc(userId).update({
      'position': geoFirePoint.data, // Contient 'geopoint' et 'geohash'
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Calcule la distance entre deux points en km
  double calculateDistance(double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng) / 1000;
  }
}
