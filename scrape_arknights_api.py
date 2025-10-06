# scrape_arknights_api.py
import time, sys
from pathlib import Path
from urllib.parse import urlencode
import requests

BASE = "https://arknights.wiki.gg"
API  = f"{BASE}/api.php"

# Some sites rate-limit; be polite
HEADERS = {
    "User-Agent": "OperatorListFetcher/1.0 (+https://example.com)",
    "Accept": "application/json",
}

# Many MediaWiki installs group operators by class category names like these.
# If your wiki uses different names, adjust here (e.g., "Category:Vanguard Operators").
CLASS_CATEGORIES = [
    "Category:Vanguard_Operators",
    "Category:Guard_Operators",
    "Category:Defender_Operators",
    "Category:Sniper_Operators",
    "Category:Caster_Operators",
    "Category:Medic_Operators",
    "Category:Supporter_Operators",
    "Category:Specialist_Operators",
]

def mw_api(params):
    """GET the MediaWiki API with polite headers + simple retry."""
    q = dict(params)
    q.setdefault("format", "json")
    url = f"{API}?{urlencode(q)}"
    for attempt in range(3):
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code == 200:
            return r.json()
        time.sleep(1 + attempt)
    r.raise_for_status()

def collect_category_members(category_title):
    """Return page titles (operators) from a category, handling continuation."""
    titles = set()
    cmcontinue = None
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": category_title,
            "cmlimit": "500",
            "cmtype": "page",
        }
        if cmcontinue:
            params["cmcontinue"] = cmcontinue
        data = mw_api(params)
        members = data.get("query", {}).get("categorymembers", [])
        for m in members:
            title = m.get("title", "").strip()
            if title:
                titles.add(title)
        cmcontinue = data.get("continue", {}).get("cmcontinue")
        if not cmcontinue:
            break
        time.sleep(0.4)
    return titles

def main():
    all_ops = set()
    for cat in CLASS_CATEGORIES:
        try:
            print(f"[Class] {cat}")
            ops = collect_category_members(cat)
            print(f"  +{len(ops)} from {cat}")
            all_ops.update(ops)
        except Exception as e:
            print(f"  error reading {cat}: {e}")

    # If API categories didn’t return anything (site layout may differ),
    # bail with a helpful note.
    if not all_ops:
        print("\nNo operators returned via API. This wiki may use different category names, or blocks API access.")
        print("Option B below (local HTML parsing) will still work.")
        sys.exit(2)

    out = Path("arknights_operators.txt")
    out.write_text("\n".join(sorted(all_ops, key=str.lower)), encoding="utf-8")
    print(f"\nWrote {len(all_ops)} operators → {out.resolve()}")

if __name__ == "__main__":
    main()
