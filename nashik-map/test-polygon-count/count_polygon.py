import sqlite3, struct, xml.etree.ElementTree as ET

GPKG = "../nashiktreecensus.gpkg"
KML = "../map_openlayer/kml/nashik_kml.kml"

def point_from_gpkg(blob):
    # GeoPackage geometry header: magic 2 bytes, version 1, flags 1, srs 4, envelope...
    flags = blob[3]
    envelope_code = (flags >> 1) & 0b111
    envelope_sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    offset = 8 + envelope_sizes[envelope_code]
    wkb = blob[offset:]
    endian = "<" if wkb[0] == 1 else ">"
    geom_type = struct.unpack(endian + "I", wkb[1:5])[0] & 0xFF
    if geom_type != 1:
        raise ValueError(f"Expected POINT WKB, got {geom_type}")
    return struct.unpack(endian + "dd", wkb[5:21])

def load_polygon(index=0):
    root = ET.parse(KML).getroot()
    ns = {"k": "http://www.opengis.net/kml/2.2"}
    polygons = root.findall(".//k:Polygon", ns)
    coords_text = polygons[index].findtext(".//k:outerBoundaryIs/k:LinearRing/k:coordinates", namespaces=ns)
    ring = []
    for item in coords_text.strip().split():
        lon, lat, *_ = map(float, item.split(","))
        ring.append((lon, lat))
    return ring

def inside(x, y, ring):
    hit = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        crosses = ((yi > y) != (yj > y))
        if crosses and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit

ring = load_polygon(0)
minx = min(x for x, _ in ring); maxx = max(x for x, _ in ring)
miny = min(y for _, y in ring); maxy = max(y for _, y in ring)
print("TEST POLYGON 0")
print("bbox:", minx, miny, maxx, maxy)
print("vertices:", len(ring))

db = sqlite3.connect(GPKG)
rows = db.execute("SELECT geom FROM nashiktreecensus WHERE geom IS NOT NULL").fetchall()
count = 0
for (blob,) in rows:
    x, y = point_from_gpkg(blob)
    if minx <= x <= maxx and miny <= y <= maxy and inside(x, y, ring):
        count += 1

print("tree_count:", count)
print("total_checked:",     len(rows))
          