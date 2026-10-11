# Task completion checklist

A coding/GeoServer task in nashik-map is done only after:

1. Inspect the current project/code before changing it; do not assume a requested component or mode is absent.
2. Make focused changes and preserve existing visualization modes unless explicitly changing them.
3. For GeoServer resources, verify the actual server state through REST. Never infer that a style is published merely because an SLD file exists locally.
4. For every new SLD style: validate XML; check style existence with REST; publish/update through REST; verify the catalog entry; run a direct WMS GetMap test; only then rely on the frontend.
5. Run npm run build from D:\\abhishek_project\\ornet\\nashik-map.
6. Check code diagnostics where available.
7. For performance-sensitive GIS work, benchmark the actual Nashik dataset and actual zoom levels instead of relying only on theoretical performance claims.
8. Remove temporary scripts/test artifacts created only for the task when no longer needed.
9. Clearly distinguish source-code changed, GeoServer configuration changed/verified, and end-to-end browser behavior verified.
10. Before saying “working”, verify the exact requested behavior end-to-end or explicitly state what has and has not been verified.

References: mem:suggested_commands, mem:conventions, mem:geoserver/operations