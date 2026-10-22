import 'dart:convert';
import 'package:http/http.dart' as http;

/// Backend local derriere nginx. Emulateur Android par defaut ; telephone :
/// flutter run --dart-define=API_URL=http://IP_DU_PC:3001 (ou l'URL ngrok).
const _baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3001');

const _timeout = Duration(seconds: 15);

class ApiException implements Exception {
  ApiException(this.message, [this.status]);
  final String message;
  final int? status;
  @override
  String toString() => message;
}

/// ponytail: un seul client statique, pas de DI/singleton-factory pour une
/// app a un seul backend. Token garde en memoire (perdu au redemarrage de
/// l'app) — ajouter une persistance si "rester connecte" est demande.
class Api {
  static String? token;

  /// Appele quand le serveur refuse le jeton (expire apres 24 h) : l'app se deconnecte.
  static void Function()? onUnauthorized;
  static const baseUrl = _baseUrl;

  static Uri _uri(String path) => Uri.parse('$_baseUrl$path');

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  static Map<String, dynamic> _decode(http.Response r) {
    Map<String, dynamic> body;
    try {
      body = jsonDecode(r.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException('Réponse serveur invalide (${r.statusCode}).');
    }
    if (r.statusCode == 401 && token != null) onUnauthorized?.call();
    if (r.statusCode >= 400) {
      // DRF renvoie {"detail": "..."} pour ses propres erreurs (405, 401 mal
      // formes, throttling...), distinct du {"error": ...}/{"message": ...}
      // des vues ecrites a la main dans ce projet.
      throw ApiException(
          (body['error'] ?? body['message'] ?? body['detail'] ?? 'Erreur serveur (${r.statusCode}).')
              .toString(),
          r.statusCode);
    }
    return body;
  }

  static Future<Map<String, dynamic>> get(String path) async {
    try {
      final r = await http.get(_uri(path), headers: _headers)
          .timeout(_timeout);
      return _decode(r);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Impossible de joindre le serveur BAOU Finance.');
    }
  }

  static Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    try {
      final r = await http
          .post(_uri(path), headers: _headers, body: jsonEncode(body))
          .timeout(_timeout);
      return _decode(r);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Impossible de joindre le serveur BAOU Finance.');
    }
  }

  static Future<Map<String, dynamic>> patch(String path, Map<String, dynamic> body) async {
    try {
      final r = await http
          .patch(_uri(path), headers: _headers, body: jsonEncode(body))
          .timeout(_timeout);
      return _decode(r);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Impossible de joindre le serveur BAOU Finance.');
    }
  }
}
