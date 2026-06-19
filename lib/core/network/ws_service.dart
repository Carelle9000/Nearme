// Le chat temps réel utilise maintenant Firestore directement
// via MatchesProvider et ChatScreen.
// Ce fichier est conservé pour compatibilité mais n'est plus utilisé.

class WsService {
  bool get isConnected => false;

  Future<void> connect(String token) async {}

  void disconnect() {}
}
