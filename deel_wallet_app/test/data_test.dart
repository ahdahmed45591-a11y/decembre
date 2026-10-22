import 'package:flutter_test/flutter_test.dart';
import 'package:deel_wallet/data.dart';

void main() {
  test('money formats in FCFA without decimals', () {
    expect(money(813200), '813 200 FCFA');
  });

  test('phoneValid accepts 10-digit local numbers, rejects the rest', () {
    expect(phoneValid('0700000000'), isTrue);
    expect(phoneValid('07 00 00 00 00'), isTrue);
    expect(phoneValid('123'), isFalse);
    expect(phoneValid('1700000000'), isFalse);
  });

  test('PRU = moyenne ponderee des achats valides ; la vente le garde ; pending ignore', () {
    final d = DateTime(2026, 1, 1);
    Txn t(String type, int q, double p, {String status = 'validated'}) => Txn('x', 0, '', d,
        ticker: 'SNTS', company: 'Sonatel', quantity: q, unitPrice: p, type: type, status: status);
    final s = AppState();
    // L'API renvoie le plus recent d'abord.
    s.transactions = [t('BUY', 5, 999, status: 'pending'), t('SELL', 5, 300), t('BUY', 10, 200), t('BUY', 10, 100)];
    s.recomputeFromTransactions();
    expect(s.holdings.single.quantity, 15);
    expect(s.holdings.single.avgPrice, 150);
  });
}
