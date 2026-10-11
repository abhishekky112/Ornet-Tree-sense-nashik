import math, urllib.request, os, time
R=20037508.342789244
lon,lat=73.7898,19.9975
def tile_tms(z):
    n=2**z
    x=int((lon+180)/360*n)
    xyz_y=int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
    y=n-1-xyz_y
    return x,y
def bounds(z,x,y):
    s=(2*R)/(2**z)
    minx=-R+x*s; maxx=minx+s
    miny=-R+y*s; maxy=miny+s
    return minx,miny,maxx,maxy
for z in range(10,16):
    x,y=tile_tms(z); b=bounds(z,x,y)
    q=(f'http://localhost:8081/geoserver/nashiktreecensus/wms?service=WMS&version=1.1.1&request=GetMap'
       f'&layers=nashiktreecensus:nashiktreecensus&styles=nashikTrees3D_v2&srs=EPSG:900913'
       f'&bbox={b[0]},{b[1]},{b[2]},{b[3]}&width=256&height=256&format=application/vnd.mapbox-vector-tile')
    out=os.path.join(os.environ.get('TEMP','.'),f'nashik_z{z}_center_v2.pbf')
    try:
        t=time.time()
        with urllib.request.urlopen(q,timeout=120) as r:
            data=r.read()
        open(out,'wb').write(data)
        print(f'z{z} tile={x}/{y} size={len(data)} bytes time={time.time()-t:.2f}s')
    except Exception as e:
        print(f'z{z} tile={x}/{y} ERROR={e}')
