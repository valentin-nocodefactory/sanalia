#!/usr/bin/env python3
"""Envoie une notification au webhook Slack/n8n défini dans SLACK_WEBHOOK_URL.

Usage :
  python3 notify_slack.py --template draft --vars '{"title":"...","preview_url":"...",...}'

Templates disponibles (alignés sur CONFIG.yaml `slack.message_template_*`) :
  - draft       : article créé en preview, en attente de validation
  - published   : article mergé et déployé en prod
  - error       : abort skill avec erreur

Si SLACK_WEBHOOK_URL est absent ou vide, le script log un warning et exit 0
(ne casse pas le pipeline, mais alerte que la notif n'est pas partie).
"""
from __future__ import annotations

import argparse
import json
import os
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
}


def send(text: str, webhook_url: str) -> bool:
    payload = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return 200 <= resp.status < 300
    except urllib.error.HTTPError as e:
        print(f"⚠ HTTP {e.code} envoyant Slack : {e.reason}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"⚠ Erreur Slack : {e}", file=sys.stderr)
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True, choices=TEMPLATES.keys())
    ap.add_argument("--vars", required=True, help="JSON string des variables")
    args = ap.parse_args()

    url = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not url:
        print("⚠ SLACK_WEBHOOK_URL absent, notification ignorée", file=sys.stderr)
        sys.exit(0)

    vars_dict = json.loads(args.vars)
    # Valeurs par défaut pour éviter les KeyError
    for k in ("title", "keyword", "preview_url", "pr_url", "notion_url", "prod_url", "step", "error"):
        vars_dict.setdefault(k, "—")

    text = TEMPLATES[args.template].format(**vars_dict)
    ok = send(text, url)
    print("✓ Slack notifié" if ok else "⚠ Slack non livré")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
