import re
import time
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = "https://arknights.wiki.gg"
CLASS_HUB = f"{BASE}/wiki/Class"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    )
}

CLASS_NAMES = [
    "Vanguard", "Guard", "Defender", "Sniper",
    "Caster", "Medic", "Supporter", "Specialist",
]

def get_soup(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")

def find_class_links():
    links = {}
    try:
        soup = get_soup(CLASS_HUB)
        for a in soup.select("a[href^='/wiki/']"):
            title = (a.get("title") or a.text or "").strip()
            href = a.get("href")
            if not href or not title:
                continue
            name = title.replace(" (class)", "").strip()
            if name in CLASS_NAMES:
                links[name] = urljoin(BASE, href)
        missing = [c for c in CLASS_NAMES if c not in links]
        for m in missing:
            links[m] = f"{BASE}/wiki/{m}"
    except Exception:
        links = {c: f"{BASE}/wiki/{c}" for c in CLASS_NAMES}
    return links

def extract_from_class_page(url: str):
    soup = get_soup(url)
    names = set()

    def clean_name(s: str) -> str:
        s = re.sub(r"\s+", " ", s).strip()
        s = re.sub(r"\[[^\]]*\]$", "", s).strip()
        return s

    headings = soup.find_all(re.compile(r"h[1-4]"))
    tables = []
    for h in headings:
        txt = (h.get_text() or "").strip().lower()
        if "playable operators" in txt or "operators" in txt:
            sib = h.find_next_sibling()
            limit = 0
            while sib and limit < 6:
                if sib.name == "table":
                    tables.append(sib)
                if sib.name and re.fullmatch(r"h[1-4]", sib.name or ""):
                    break
                sib = sib.find_next_sibling()
                limit += 1

    if not tables:
        for t in soup.select("table"):
            ths = " ".join(th.get_text(" ", strip=True).lower() for th in t.select("th"))
            if "operator" in ths or "name" in ths:
                tables.append(t)

    for t in tables:
        for row in t.select("tr"):
            cells = row.find_all(["td", "th"])
            if not cells:
                continue
            first = cells[0].get_text(" ", strip=True)
            a = cells[0].find("a")
            if a and a.get("title"):
                first = a.get("title").strip()
            first = clean_name(first)
            if not first or first.lower() in {"operator", "name"}:
                continue
            names.add(first)

    if not names:
        for a in soup.select("a[href^='/wiki/']"):
            title = (a.get("title") or a.text or "").strip()
            if title and title[0].isalpha() and len(title) <= 32:
                if title not in CLASS_NAMES and "class" not in title.lower():
                    names.add(clean_name(title))

    drop = set()
    for n in names:
        low = n.lower()
        if any(w in low for w in ["operator", "rarity", "example", "class", "resources"]):
            drop.add(n)
    names -= drop

    return names

def main():
    class_links = find_class_links()
    all_names = set()
    for cls, url in class_links.items():
        print(f"[{cls}] {url}")
        try:
            names = extract_from_class_page(url)
            if not names:
                print("  (no names found; page structure may differ)")
            all_names.update(names)
        except Exception as e:
            print(f"  error: {e}")
        time.sleep(0.8)  # polite delay

    out = Path("arknights_operators.txt")
    final = sorted(all_names, key=lambda s: s.lower())
    out.write_text("\n".join(final), encoding="utf-8")
    print(f"\nWrote {len(final)} operators to {out.resolve()}")

if __name__ == "__main__":
    main()
