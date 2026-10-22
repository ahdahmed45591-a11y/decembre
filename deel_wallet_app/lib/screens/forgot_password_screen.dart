import 'package:flutter/material.dart';

import '../api.dart';
import '../data.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _code = TextEditingController();
  final _newPassword = TextEditingController();
  bool _busy = false;
  bool _codeSent = false;
  bool _hide = true;

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    _newPassword.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    if (!_email.text.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('E-mail invalide')));
      return;
    }
    setState(() => _busy = true);
    try {
      await Repo.requestPasswordReset(_email.text.trim());
      if (!mounted) return;
      setState(() => _codeSent = true);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Si ce compte existe, un code a été envoyé par e-mail.')));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resetPassword() async {
    final pwd = _newPassword.text;
    final hasLetter = pwd.contains(RegExp(r'[A-Za-z]'));
    final hasDigit = pwd.contains(RegExp(r'\d'));
    if (_code.text.trim().isEmpty || pwd.length < 8 || !hasLetter || !hasDigit) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Collez le code et saisissez un mot de passe (8 car. min, lettres et chiffres)')));
      return;
    }
    setState(() => _busy = true);
    try {
      await Repo.resetPassword(_code.text.trim(), _newPassword.text);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mot de passe mis à jour. Connectez-vous.')));
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Mot de passe oublié')),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                _codeSent
                    ? 'Collez le code reçu par e-mail et choisissez un nouveau mot de passe.'
                    : "Entrez l'e-mail de votre compte : un code de réinitialisation valable 1 heure vous sera envoyé.",
                style: const TextStyle(color: Colors.black54),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _email,
                enabled: !_codeSent,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'E-mail'),
              ),
              const SizedBox(height: 16),
              if (!_codeSent)
                FilledButton(
                  onPressed: _busy ? null : _sendCode,
                  child: _busy
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Envoyer le code'),
                ),
              if (_codeSent) ...[
                TextField(
                  controller: _code,
                  minLines: 1,
                  maxLines: 3,
                  decoration: const InputDecoration(
                      labelText: 'Code reçu par e-mail', alignLabelWithHint: true),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _newPassword,
                  obscureText: _hide,
                  decoration: InputDecoration(
                    labelText: 'Nouveau mot de passe',
                    suffixIcon: IconButton(
                      icon: Icon(_hide ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _hide = !_hide),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _resetPassword,
                  child: _busy
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Réinitialiser le mot de passe'),
                ),
                TextButton(
                  onPressed: _busy ? null : _sendCode,
                  child: const Text('Renvoyer le code'),
                ),
              ],
            ],
          ),
        ),
      );
}
