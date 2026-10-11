# ORNET project core

- Project root: D:\abhishek_project\ornet.
- Active app: `nashik-map`, a Vite + React + OpenLayers Nashik Tree Census application.
- Legacy reference app: `map_openlayer`; keep it untouched unless explicitly requested.
- The Nashik app consumes GeoServer WMS/WFS. GeoServer is external infrastructure/configuration, not part of the React source tree.
- Main GeoServer workspace/layer: `nashiktreecensus:nashiktreecensus`.
- Tree source contains about 1.17M point features in a GeoPackage; native CRS is EPSG:4326.
- Current 2D map already has normal tree WMS, cluster aggregation, basemaps, KML boundaries, nearby-tree interaction.
- New 2D Heatmap mode uses a separate GeoServer `vec:Heatmap` SLD and OpenLayers ImageWMS layer; it must not show normal tree points or cluster overlays.
- Future 3D direction: deck.gl + GeoServer MVT, with precomputed representative-tree LODs; do not replace the working 2D stack.
- GeoServer configuration should be automated through authenticated REST API when possible; manual UI is fallback.
References: `mem:tech_stack`, `mem:suggested_commands`, `mem:conventions`, `mem:task_completion`, `mem:geoserver/operations`