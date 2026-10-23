import 'package:deel_wallet/api.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('normalizeUrl ajoute http:// et retire le / final', () {
    expect(Api.normalizeUrl(' 192.168.1.23:3001/ '), 'http://192.168.1.23:3001');
    expect(Api.normalizeUrl('https://x.ngrok.app//'), 'https://x.ngrok.app');
    expect(Api.normalizeUrl('  '), '');
  });
}
