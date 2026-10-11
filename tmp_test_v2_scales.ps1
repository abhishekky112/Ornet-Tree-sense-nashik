$tests = @(
  @{name='z12'; bbox='8208725.340458985,2269873.9916406237,8218509.280078124,2279657.931259766'},
  @{name='z13'; bbox='8208725.340458985,2274765.961450197,8213617.310268555,2279657.931259766'},
  @{name='z14'; bbox='8208725.340458985,2274765.961450197,8211171.32536377,2277211.9463549815'}
)
foreach ($t in $tests) {
  $u = 'http://localhost:8081/geoserver/nashiktreecensus/wms?service=WMS&version=1.1.1&request=GetMap&layers=nashiktreecensus:nashiktreecensus&styles=nashikTrees3D_v2&srs=EPSG:900913&bbox=' + $t.bbox + '&width=256&height=256&format=application/vnd.mapbox-vector-tile'
  $o = Join-Path $env:TEMP ('nashik_' + $t.name + '_v2.pbf')
  Remove-Item $o -ErrorAction SilentlyContinue
  curl.exe -sS $u -o $o
  $f = Get-Item $o
  Write-Output ($t.name + ' SIZE=' + $f.Length)
}
