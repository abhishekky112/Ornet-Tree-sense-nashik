import math, urllib.parse, urllib.request, re
lon,lat=73.7898,19.9975
R=20037508.342789244
def tile(z):
    n=2**z
    x=int((lon+180)/360*n)
    xyz=int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
    return x,n-1-xyz
def bounds(z,x,y):
    s=2*R/2**z
    return -R+x*s,-R+y*s,-R+(x+1)*s,-R+(y+1)*s
base='http://localhost:8081/geoserver/nashiktreecensus/ows'
important="(IsHeritageTree='Yes' OR HealthCondition='Dead' OR HealthCondition='Dangerous')"
for z in (10,11,12,13,14,15):
    x,y=tile(z); b=bounds(z,x,y)
    for label,cql in [('important',important),('all','INCLUDE')]:
        params={'service':'WFS','version':'2.0.0','request':'GetFeature','resultType':'hits','typeNames':'nashiktreecensus:nashiktreecensus','bbox':','.join(map(str,b))+',EPSG:3857'}
        if cql!='INCLUDE': params['CQL_FILTER']=cql
        u=base+'?'+urllib.parse.urlencode(params)
        try:
            s=urllib.request.urlopen(u,timeout=60).read().decode()
            m=re.search(r'numberMatched="([^"]+)"',s)
            print(f'z{z} {x}/{y} {label}={m.group(1) if m else "?"}')
        except Exception as e: print(f'z{z} {label} ERROR={e}')
