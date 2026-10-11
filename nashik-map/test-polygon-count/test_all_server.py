import xml.etree.ElementTree as ET, subprocess, re, html

KML = "../map_openlayer/kml/nashik_kml.kml"
URL = "http://localhost:8081/geoserver/nashiktreecensus/ows"

root = ET.parse(KML).getroot()
ns = {"k":"http://www.opengis.net/kml/2.2"}
polygons = root.findall(".//k:Polygon", ns)

def ring_for(p):
    text = p.findtext(".//k:outerBoundaryIs/k:LinearRing/k:coordinates", namespaces=ns)
    return [tuple(map(float, item.split(",")[:2])) for item in text.strip().split()]

def polygon_name(p, index):
    # KML name is normally the Placemark sibling of Polygon.
    placemark = next((x for x in root.iter("{http://www.opengis.net/kml/2.2}Placemark")
                      if p in list(x.iter("{http://www.opengis.net/kml/2.2}Polygon"))), None)
    if placemark is not None:
        return placemark.findtext("k:name", default="", namespaces=ns).strip() or f"Polygon {index+1}"
    return f"Polygon {index+1}"

def make_xml(ring):
    pos = " ".join(f"{x:.15f} {y:.15f}" for x,y in ring)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<wfs:GetFeature service="WFS" version="1.1.0" resultType="hits"
 xmlns:wfs="http://www.opengis.net/wfs"
 xmlns:ogc="http://www.opengis.net/ogc"
 xmlns:gml="http://www.opengis.net/gml">
<wfs:Query typeName="nashiktreecensus:nashiktreecensus">
<ogc:Filter>
<ogc:Intersects>
<ogc:PropertyName>geom</ogc:PropertyName>
<gml:Polygon srsName="EPSG:4326">
<gml:exterior><gml:LinearRing><gml:posList>{pos}</gml:posList></gml:LinearRing></gml:exterior>
</gml:Polygon>
</ogc:Intersects>
</ogc:Filter>
</wfs:Query>
</wfs:GetFeature>'''

total=0
for i,p in enumerate(polygons):
    ring=ring_for(p)
    name=polygon_name(p,i)
    proc=subprocess.run(
        ["curl","-sS","-X","POST",URL,"-H","Content-Type: application/xml","--data-binary",make_xml(ring)],
        capture_output=True,text=True,timeout=180
    )
    body=proc.stdout
    m=re.search(r'numberOfFeatures="(\d+)"', body)
    count=int(m.group(1)) if m else None
    if count is not None:
        total += count
    print(f"{i+1:02d}. {name}: {count if count is not None else 'ERROR'}")
    if count is None:
        print(body[:1000])
print(f"SUM: {total:,}")
