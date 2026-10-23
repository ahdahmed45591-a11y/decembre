"""Captures de l'appli Flutter (build web) -- ecrans qui n'appellent pas l'API."""
import sys
from playwright.sync_api import sync_playwright

out = sys.argv[1]


def shot(page, name):
    page.wait_for_timeout(1500)
    page.screenshot(path=f"{out}/{name}.png")
    print("capture", name, flush=True)


def tap(page, label, fallback_xy):
    # Flutter web ne cree le DOM d'accessibilite qu'a la demande ; sinon clic aux coordonnees.
    try:
        page.get_by_text(label, exact=False).first.click(timeout=2500)
    except Exception:
        page.mouse.click(*fallback_xy)


with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    page.goto("http://localhost:8080")
    page.wait_for_timeout(6000)
    try:
        page.evaluate("document.querySelector('flt-semantic-placeholder')?.click()")
    except Exception:
        pass
    shot(page, "1_onboarding_1")
    tap(page, "Suivant", (195, 790)); shot(page, "2_onboarding_2")
    tap(page, "Suivant", (195, 790)); shot(page, "3_onboarding_3")
    tap(page, "Commencer", (195, 790)); shot(page, "4_connexion")
    tap(page, "S'inscrire", (260, 560)); shot(page, "5_inscription")
    b.close()
