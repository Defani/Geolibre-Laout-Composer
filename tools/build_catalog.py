import json, re, os
import pypdf
SP = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SP, "..", "src", "04g-catalog-data.js")

# ---------------------------------------------------------------- icon grouping
GROUPS = [
    ("Water & hydrology", r"water|waterfall|wetland|swamp|dam|fountain|spring|harbor|harbour|slipway|ferry|boat|canoe|kayak|rafting|sail|pier|quay|buoy|anchor|fish|coral|lighthouse|geyser|islet|beach|surf|diving|scuba|jet_ski|watermill|drinking|shower|fish_ladder"),
    ("Terrain & nature", r"mountain|volcano|cliff|valley|cape|natural|cave|boulder|cairn|rock|landform|arch|snow|glacier|globe|island"),
    ("Vegetation & forest", r"tree|shrub|grass|lawn|garden|park|wood|forest|plant|hedge|logging|cactus|palm|leaf|needle|farm|grapes"),
    ("Transport", r"airport|airfield|heliport|aerial|rail|train|tram|subway|metro|bus|taxi|car|parking|fuel|charging|bicycle|scooter|motorcycle|truck|road|highway|toll|tunnel|bridge|terminal|transit|gate|lift_gate|barrier|crossing|kerb|traffic|speed|junction|stop|gondola|chairlift|cable_car|monorail|trolley|plane|jet|freight|buffer|elevator|entrance|wheelchair|pedestrian|cyclist|rocket|roadblock|turnstile|bollard|chicane"),
    ("Government & public", r"town|city|village|capitol|courthouse|embassy|police|prison|post|letter|military|army|fire|rescue|ranger|town-hall|town_hall|checkpoint|passport|border|flag|shield|bunker|military_checkpoint|telephone|emergency|defibrillator"),
    ("Health", r"hospital|doctor|pharmacy|dentist|clinic|blood|veterinary|optician|hearing|physio|heart|medical|ambulance"),
    ("Education & culture", r"school|college|library|museum|book|theatre|cinema|art|gallery|music|monument|historic|castle|ruins|statue|sculpture|obelisk|memorial|plaque|landmark|marae|paifang"),
    ("Religion", r"religious|worship|church|mosque|temple|shinto|hinduism|sikhism|taoism|quaker|cemetery|grave"),
    ("Tourism & recreation", r"attraction|viewpoint|observation|picnic|campsite|camp|tent|lodging|hotel|hut|cabin|shelter|information|info_board|zoo|aquarium|amusement|playground|play|swing|slide|sandbox|maze|roller|binocular|telescope|spotting|casino|karaoke|nightclub|bbq|campfire|hot-spring|spa"),
    ("Sports", r"soccer|football|baseball|basketball|tennis|golf|swimming|stadium|pitch|skiing|ski|skate|horse|racetrack|speedway|bowling|cricket|volleyball|archery|climbing|fitness|gym|sport|table-tennis|pickleball|disc_golf|field_hockey|hang_gliding|abseiling|snowboard|sledding|ice|balance_beam|horizontal_bar|trampoline|shuffleboard|abseil"),
    ("Food & shops", r"restaurant|cafe|coffee|bar|beer|alcohol|bakery|bread|fast-food|food|ice-cream|teahouse|confectionery|chocolate|donut|grocery|shop|store|mall|convenience|clothing|shoe|jewelry|florist|gift|furniture|hardware|optician|hairdresser|beauty|laundry|bank|atm|money|vending|market|meat|milk|catering|bubble|hotpot|sandwich|spice"),
    ("Utilities & industry", r"industry|warehouse|power|electric|cable|gas|pipe|oil|mast|antenna|tower|communication|radio|silo|storage|tank|cooling|radiation|construction|crane|bulldozer|scaffold|mine|adit|quarry|manhole|meter|utility|recycling|waste|windmill|slaughterhouse|commercial|residential|building|home|row_houses|manufactured|barn|chimney|street_lamp|lamp|bulb|trench"),
    ("Hazards & warnings", r"danger|caution|accident|hazard|warning|cliff_falling|fire_hydrant|security|radiation|road-accident"),
    ("Basic symbols", r"^(circle|circle-stroked|square|square-stroked|triangle|triangle-stroked|star|star-stroked|marker|marker-stroked|diamond|cross|arrow|heart|pin|asterisk|temaki|compass)$"),
]
def group_of(name):
    n = name.lower()
    for g, rx in GROUPS[::-1] if False else GROUPS:
        if g == "Basic symbols":
            continue
    # basic symbols first (exact)
    if re.match(GROUPS[-1][1], n):
        return "Basic symbols"
    for g, rx in GROUPS[:-1]:
        if re.search(rx, n):
            return g
    return "Other"

icon_sets = {}
for key, fname, label, ver, pkg in [
    ("maki", "maki_names.json", "Maki", "8.2.0", "@mapbox/maki"),
    ("temaki", "temaki_names.json", "Temaki", "5.13.0", "@rapideditor/temaki"),
]:
    names = json.load(open(os.path.join(SP, fname)))
    groups = {}
    for n in names:
        groups.setdefault(group_of(n), []).append(n)
    icon_sets[key] = {"label": label, "license": "CC0-1.0", "url": f"https://cdn.jsdelivr.net/npm/{pkg}@{ver}/icons/{{name}}.svg", "groups": groups}

# ---------------------------------------------------------------- KLHK symbology (SK MENLHK 399/2024, Daftar Simbologi IGT LHK)
r = pypdf.PdfReader(os.environ.get("SK_PDF", "SK MENLHK_399_2024.pdf"))
sections = []
cur = None
buf = []
rgb_line = re.compile(r"^(.*?)\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s+(.*))?$")
head = re.compile(r"^(\d+\.\d+)\.\s+(.+)$")
SKIP = re.compile(r"^(Deskripsi|Warna|Lainnya|R G B|Keterangan|- \d+ -|\(?\d\)?$|Alternatif)", re.I)
for i in range(171, 236):
    text = r.pages[i].extract_text() or ""
    for raw in text.split("\n"):
        line = raw.strip().replace("\u00b3", "³").replace("\ufffd", "³")
        if not line:
            continue
        m = head.match(line)
        if m and not rgb_line.match(line):
            cur = {"code": m.group(1), "title": m.group(2).title(), "items": []}
            sections.append(cur)
            buf = []
            continue
        if cur is None or SKIP.match(line) or line.isupper() and len(line) > 6 and not rgb_line.match(line):
            if line.isupper() and cur is not None and not rgb_line.match(line):
                buf = []  # abbreviation rows / headings
            continue
        m = rgb_line.match(line)
        if m:
            name = " ".join(buf + ([m.group(1)] if m.group(1) else [])).strip()
            rr, gg, bb = int(m.group(2)), int(m.group(3)), int(m.group(4))
            note = (m.group(5) or "").strip()
            buf = []
            if max(rr, gg, bb) > 255:
                continue
            if not name or re.match(r"^(warna|ketebalan|kemiringan|jarak|simbologi|polygon|blok)", name, re.I):
                # style detail row (foreground/background/pattern): attach to the previous item
                if cur["items"]:
                    cur["items"][-1].setdefault("extra", []).append({"rgb": [rr, gg, bb], "note": (name + " " + note).strip()})
                continue
            cur["items"].append({"name": name, "rgb": [rr, gg, bb], **({"note": note} if note else {})})
        else:
            if len(buf) > 6:
                buf = buf[-3:]
            buf.append(line)
NOISE = re.compile(r"(line fill|outline|style\s*:|symbol style|symbol name|type\s*:|dengan tebal|pola garis|^point$|^:|definisi warna|^- -|ukuran marker|angel|offset|width|basic latin|latin 1|marker fill|^\(?perairan\)?$)", re.I)
def clean(n):
    n = re.sub(r"\s+", " ", n).strip(" -:")
    n = re.sub(r"^(TN, TWA, TB, SM,? ?(CA, )?Tahura|KSAL/KPAL, TNL, TWAL, TBL, SML, CAL \(Perairan\)|TBL, SML, CAL \(Perairan\)|\(Perairan\))\s*", "", n, flags=re.I)
    return n.replace("�", "³").strip()
for sec in sections:
    keep = []
    for it in sec["items"]:
        it["name"] = clean(it["name"])
        if len(it["name"]) < 2 or NOISE.search(it["name"]):
            continue
        keep.append(it)
    sec["items"] = keep
sections = [s for s in sections if s["items"]]
total = sum(len(s["items"]) for s in sections)

# hand-checked core set used for forest-area maps (page 185) + boundary lines (page 187)
KAWASAN = [
    {"name": "Kawasan Suaka Alam / Pelestarian Alam (KSA/KPA)", "abbr": "KSA/KPA", "rgb": [173, 63, 255]},
    {"name": "Hutan Lindung (HL)", "abbr": "HL", "rgb": [2, 173, 0]},
    {"name": "Hutan Produksi Terbatas (HPT)", "abbr": "HPT", "rgb": [138, 242, 0]},
    {"name": "Hutan Produksi Tetap (HP)", "abbr": "HP", "rgb": [255, 255, 0]},
    {"name": "Hutan Produksi yang dapat Dikonversi (HPK)", "abbr": "HPK", "rgb": [255, 94, 255]},
    {"name": "Areal Penggunaan Lain (APL)", "abbr": "APL", "rgb": [255, 255, 255]},
]

data = {
    "iconSets": icon_sets,
    "klhk": {"source": "Keputusan Menteri LHK No. 399 Tahun 2024 — Lampiran: Simbologi IGT LHK (hal. 172–235)", "sections": sections, "kawasanHutan": KAWASAN},
}
js = "// ---------------------------------------------------------------- symbol catalog data (generated by tools/build_catalog.py)\n"
js += "const CATALOG = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(OUT, "w", encoding="utf8").write(js)
print("sections", len(sections), "items", total, "bytes", len(js))
for s in sections[:60]:
    print(s["code"], s["title"][:60], len(s["items"]), [x["name"][:30] for x in s["items"][:3]])
for k, v in icon_sets.items():
    print(k, {g: len(n) for g, n in v["groups"].items()})
