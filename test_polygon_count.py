import sqlite3, struct, xml.etree.ElementTree as ET
db=sqlite3.connect("nashiktreecensus.gpkg")
total=db.execute("SELECT count(*) FROM nashiktreecensus WHERE geom IS NOT NULL").fetchone()[0]
def point_from_blob(b):
    f=b[3]; e=(f>>1)&7; off=8+{0:0,1:32,2:48,3:48,4:64}[e]
    w=b[off:]; en="<" if w[0]==1 else ">"
    return struct.unpack(en+"dd",w[5:21])
root=ET.parse("map_openlayer/kml/nashik_kml.kml").getroot()
ns={"k":"http://www.opengis.net/kml/2.2"}
ps=root.findall(".//k:Polygon",ns)
counts=[]
for n,p in enumerate(ps):
    ring=[tuple(map(float,x.split(",")[:2])) for x in p.findtext(".//k:outerBoundaryIs/k:LinearRing/k:coordinates",namespaces=ns).strip().split()]
    minx,maxx=min(x for x,y in ring),max(x for x,y in ring)
    miny,maxy=min(y for x,y in ring),max(y for x,y in ring)
    candidates=db.execute("""SELECT t.geom FROM rtree_nashiktreecensus_geom r JOIN nashiktreecensus t ON t.fid=r.id
        WHERE r.maxx>=? AND r.minx<=? AND r.maxy>=? AND r.miny<=?""",(minx,maxx,miny,maxy)).fetchall()
    c=0
    for (blob,) in candidates:
        x,y=point_from_blob(blob); hit=False; j=len(ring)-1
        for i in range(len(ring)):
            xi,yi=ring[i]; xj,yj=ring[j]
            if ((yi>y)!=(yj>y)) and x<(xj-xi)*(y-yi)/(yj-yi)+xi: hit=not hit
            j=i
        c+=hit
    counts.append(c)
    print(f"polygon_{n+1:02d}: {c:,} candidates={len(candidates):,}")
print(f"SUM: {sum(counts):,}")
print(f"TOTAL TREES: {total:,}")
print(f"DIFFERENCE: {total-sum(counts):,}")
