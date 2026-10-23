import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'screens.dart';
import 'api.dart';
import 'data.dart';

// Orange, blanc, vert.
const brandOrange = Color(0xFFFF6B00);
const brandGreen = Color(0xFF16A34A);
const brandDark = Color(0xFF1A1A1A);

// Onboarding (3 slides) affiche seulement au tout premier lancement -- voir
// onboarding_screen.dart, qui pose ce flag une fois la derniere slide passee.
const onboardingSeenKey = 'onboarding_seen';

final theme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: brandOrange,
    secondary: brandGreen,
  ),
  scaffoldBackgroundColor: Colors.white,
  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: brandOrange,
      minimumSize: const Size.fromHeight(54),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.grey.shade50,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: Colors.grey.shade200),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: brandOrange, width: 1.5),
    ),
  ),
  cardTheme: CardThemeData(
    elevation: 0,
    color: Colors.white,
    surfaceTintColor: Colors.white,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(20),
      side: BorderSide(color: Colors.grey.shade100),
    ),
  ),
);

final navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final seenOnboarding = prefs.getBool(onboardingSeenKey) ?? false;
  Api.baseUrl = prefs.getString(apiUrlKey) ?? Api.baseUrl;
  var token = prefs.getString('auth_token');
  if (token != null && token.isNotEmpty) {
    Api.token = token;
    try {
      await app.refresh();
    } on ApiException catch (e) {
      if (e.status == 401) {
        // Jeton expire (24 h) : retour a l'ecran de connexion.
        Api.token = token = null;
        await prefs.remove('auth_token');
      }
    } catch (_) {}
  }
  Api.onUnauthorized = () {
    app.logout();
    navigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  };
  runApp(BaouFinanceApp(
      seenOnboarding: seenOnboarding, loggedIn: token != null && token.isNotEmpty));
}

class BaouFinanceApp extends StatelessWidget {
  const BaouFinanceApp(
      {super.key, required this.seenOnboarding, required this.loggedIn});
  final bool seenOnboarding;
  final bool loggedIn;

  @override
  Widget build(BuildContext context) => MaterialApp(
        navigatorKey: navigatorKey,
        title: 'BAOU',
        debugShowCheckedModeBanner: false,
        theme: theme,
        home: loggedIn
            ? const Shell()
            : (seenOnboarding ? const LoginScreen() : const OnboardingScreen()),
      );
}

/// Logo importe depuis assets/logo.jpg. Bascule sur le wordmark texte si le
/// fichier venait a manquer — rien ne casse.
class Logo extends StatelessWidget {
  const Logo({super.key, this.height = 72});
  final double height;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.asset(
          'assets/logo.jpg',
          height: height,
          errorBuilder: (_, __, ___) => Text(
            'BAOU Finance',
            style: TextStyle(
                fontSize: height * .3,
                fontWeight: FontWeight.w700,
                color: brandDark),
          ),
        ),
      );
}
