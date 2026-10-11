# ORNET tech stack

- OS: Windows.
- Frontend: React 19, JavaScript/JSX, Vite 7, npm.
- Mapping: OpenLayers 10.
- UI: lucide-react; Tailwind CSS is present.
- Existing GIS services: GeoServer 3.0.1 with WMS/WFS and GeoWebCache.
- Current tree data source: GeoPackage `nashiktreecensus.gpkg`; tree geometry is Point, EPSG:4326.
- Vector tiles: GeoServer/GeoWebCache can emit Mapbox Vector Tiles (PBF). This is intended for the future 3D deck.gl pipeline.
- No deck.gl/Three.js/Cesium dependency is currently installed in `nashik-map`.
- Current Heatmap implementation: GeoServer SLD rendering transformation `vec:Heatmap` -> WMS image -> OpenLayers ImageWMS.
- Important GeoServer facts: MVT is transport/output; it does not itself solve LOD. Low-zoom raw MVT tiles can become very large, so use LOD/precomputation for production 3D.
References: `mem:core`, `mem:geoserver/operations`