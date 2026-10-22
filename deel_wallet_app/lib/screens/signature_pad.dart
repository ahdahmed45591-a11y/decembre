import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// Pad de signature manuscrite : capture les traits au doigt et les rend en
/// PNG (RepaintBoundary.toImage). Natif Flutter (CustomPainter), pas de
/// dependance signature/canvas externe pour un besoin aussi simple.
class SignaturePad extends StatefulWidget {
  const SignaturePad({super.key, required this.onChanged});
  final ValueChanged<bool> onChanged;
  @override
  State<SignaturePad> createState() => SignaturePadState();
}

class SignaturePadState extends State<SignaturePad> {
  final _boundaryKey = GlobalKey();
  final List<Offset?> _points = [];

  void _addPoint(Offset? p) {
    setState(() => _points.add(p));
    widget.onChanged(_points.any((p) => p != null));
  }

  void clear() {
    setState(() => _points.clear());
  }

  Future<Uint8List?> capture() async {
    if (_points.every((p) => p == null)) return null;
    final boundary = _boundaryKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
    if (boundary == null) return null;
    final image = await boundary.toImage(pixelRatio: 2);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return bytes?.buffer.asUint8List();
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
        key: _boundaryKey,
        child: Container(
          height: 160,
          width: double.infinity,
          decoration: BoxDecoration(
              border: Border.all(color: Colors.black38, width: 1.5),
              borderRadius: BorderRadius.circular(8),
              color: Colors.white),
          // ClipRRect : le trait ne doit jamais deborder du cadre arrondi,
          // sinon la capture (boundary.toImage) inclut des pixels hors zone.
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Stack(
              children: [
                if (_points.isEmpty)
                  const Center(
                    child: Text(
                      'Écrivez votre signature ici',
                      style: TextStyle(color: Colors.black26, fontSize: 13, fontStyle: FontStyle.italic),
                    ),
                  ),
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onPanStart: (d) => _addPoint(d.localPosition),
                  onPanUpdate: (d) => _addPoint(d.localPosition),
                  onPanEnd: (_) => _addPoint(null),
                  child: SizedBox.expand(
                    child: CustomPaint(
                      painter: _SignaturePainter(List<Offset?>.from(_points)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}

class _SignaturePainter extends CustomPainter {
  _SignaturePainter(this.points);
  final List<Offset?> points;

  @override
  void paint(Canvas canvas, Size size) {
    // Fond blanc explicite pour garantir le contraste sur tous les modes d'affichage
    canvas.drawRect(Offset.zero & size, Paint()..color = Colors.white);

    final strokePaint = Paint()
      ..color = const Color(0xFF000000) // Noir 100% opaque
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke
      ..isAntiAlias = true;

    final dotPaint = Paint()
      ..color = const Color(0xFF000000)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    final path = Path();
    bool inPath = false;

    for (var i = 0; i < points.length; i++) {
      final p = points[i];
      if (p == null) {
        inPath = false;
        continue;
      }

      final next = (i + 1 < points.length) ? points[i + 1] : null;
      if (!inPath) {
        if (next == null) {
          // Point isolé : dessiner un point plein
          canvas.drawCircle(p, 2.0, dotPaint);
        } else {
          path.moveTo(p.dx, p.dy);
          inPath = true;
        }
      } else {
        path.lineTo(p.dx, p.dy);
      }
    }

    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _SignaturePainter old) => true;
}
