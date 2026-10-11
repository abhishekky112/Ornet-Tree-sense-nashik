$u = 'http://localhost:8081/geoserver/nashiktreecensus/wms?service=WMS&version=1.1.1&request=GetMap&layers=nashiktreecensus:nashiktreecensus&styles=nashikTrees3D_v2&srs=EPSG:900913&bbox=8208725.340458985,2269873.9916406237,8218509.280078124,2279657.931259766&width=256&height=256&format=application/vnd.mapbox-vector-tile'
$o = Join-Path $env:TEMP 'nashik_style_v2_test.pbf'
curl.exe -sS $u -o $o
$f = Get-Item $o
Write-Output ("HTTP/FILE_SIZE=" + $f.Length)
