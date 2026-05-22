#!/usr/bin/env python3
"""Envoie une notification au webhook Slack défini dans `SLACK_WEBHOOK_URL`.

Usage :
  python3 notify_slack.py --template draft --vars '{"title":"...","preview_url":"...",...}'

Templates disponibles (alignés sur CONFIG.yaml `slack.message_template_*`) :
  - draft          : article créé en preview, en attente de validation
  - published      : article mergé et déployé en prod
  - error          : abort skill avec erreur
  - empty_pipeline : aucun article "Next up" trouvé en Notion ce matin

`SLACK_WEBHOOK_URL` doit être configuré dans l'environnement de la routine
cron (cf. SKILL.md § 9). Si absent, le script log un message visible et
exit 1 — la routine continue, mais l'absence de notif sera visible dans
les logs cron, plutôt qu'un échec silencieux comme avant.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.request
import urllib.error

TEMPLATES = {
    "draft": (
        "✅ *Article Sanalia prêt à valider*\n"
        "• Titre : {title}\n"
        "• Mot-clé : {keyword}\n"
        "• Preview : {preview_url}\n"
        "• PR : {pr_url}\n"
        "• Notion : {notion_url}\n\n"
        "Quand tu es ok, change le statut Notion en *Validé* — la 2ème routine s'occupera du merge."
    ),
    "published": (
        "🚀 *Article Sanalia publié en prod*\n"
        "• Titre : {title}\n"
        "• URL prod : {prod_url}\n"
        "• Notion : {notion_url}"
    ),
    "error": (
        "⚠️ *Erreur publication article Sanalia*\n"
        "• Article : {title}\n"
        "• Étape : {step}\n"
        "• Erreur : {error}\n"
        "• Notion : {notion_url}"
    ),
    "empty_pipeline": (
        "📭 *Pipeline blog Sanalia vide aujourd'hui*\n"
        "Aucun article au statut « Next up » dans Notion pour aujourd'hui ({today}).\n"
        "Pour relancer la publication automatique, ajoute un brief dans la base "
        "« Articles blog à rédiger » et passe-le à « Next up » avec une Date de "
        "parution ≤ aujourd'hui.\n"
        "Notion : {notion_url}"
    ),
}


# User-Agent reconnaissable (utile si le serveur webhook filtre les UA "bot")
USER_AGENT = "Sanalia-Cron/1.0 (publish-article-sanalia)"


def send_via_urllib(text: str, webhook_url: str) -> tuple[bool, str]:
    """Tente d'envoyer via Python urllib. Retourne (ok, diagnostic)."""
    payload = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            "Accept": "application/json,*/*",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read(500).decode("utf-8", errors="replace")
            return 200 <= resp.status < 300, f"HTTP {resp.status} — {body[:200]}"
    except urllib.error.HTTPError as e:
        # Lit le body de la réponse pour aider au diagnostic
        try:
            body = e.read(500).decode("utf-8", errors="replace")
        except Exception:
            body = ""
        return False, f"HTTP {e.code} {e.reason} — body: {body[:200]}"
    except Exception as e:
        return False, f"Exception : {type(e).__name__} : {e}"


def send_via_curl(text: str, webhook_url: str) -> tuple[bool, str]:
    """Fallback : utilise curl en subprocess. Peut passer là où urllib échoue
    (par ex. si le sandbox cron filtre urllib mais autorise curl, ou si le
    serveur webhook filtre les UA python)."""
    curl = shutil.which("curl")
    if not curl:
        return False, "curl introuvable dans PATH"

    payload = json.dumps({"text": text})
    cmd = [
        curl, "-sS", "-o", "/dev/null", "-w", "%{http_code}",
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", f"User-Agent: {USER_AGENT}",
        "-d", payload,
        "--max-time", "10",
        webhook_url,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        http_code = result.stdout.strip()
        ok = http_code.startswith("2")
        return ok, f"HTTP {http_code} (via curl) — stderr: {result.stderr[:200]}"
    except subprocess.TimeoutExpired:
        return False, "curl timeout"
    except Exception as e:
        return False, f"curl Exception : {type(e).__name__} : {e}"


def send(text: str, webhook_url: str) -> bool:
    """Envoie via urllib puis fallback curl si échec.

    Retourne True si au moins une méthode a réussi.
    """
    # Tentative 1 : urllib
    ok, diag = send_via_urllib(text, webhook_url)
    if ok:
        print(f"✓ Slack notifié via urllib ({diag})", file=sys.stderr)
        return True
    print(f"⚠ urllib échec : {diag}", file=sys.stderr)

    # Tentative 2 : curl en fallback (souvent passe là où urllib bloque)
    ok, diag = send_via_curl(text, webhook_url)
    if ok:
        print(f"✓ Slack notifié via curl fallback ({diag})", file=sys.stderr)
        return True
    print(f"⚠ curl échec : {diag}", file=sys.stderr)

    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True, choices=list(TEMPLATES.keys()))
    ap.add_argument("--vars", required=True, help="JSON string des variables")
    args = ap.parse_args()

    url = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not url:
        print(
            "✗ SLACK_WEBHOOK_URL absent — notif Slack NON envoyée.\n"
            "  → configure cette variable dans l'env de la routine cron "
            "(cf. SKILL.md § Étape 9).",
            file=sys.stderr,
        )
        sys.exit(1)

    vars_dict = json.loads(args.vars)
    # Valeurs par défaut pour éviter les KeyError
    for k in ("title", "keyword", "preview_url", "pr_url", "notion_url", "prod_url", "step", "error", "today"):
        vars_dict.setdefault(k, "—")

    text = TEMPLATES[args.template].format(**vars_dict)
    ok = send(text, url)
    print("✓ Slack notifié" if ok else "⚠ Slack non livré")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
