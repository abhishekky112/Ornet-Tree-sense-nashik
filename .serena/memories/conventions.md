# Nashik-map conventions

- Inspect existing symbols/files before implementing; preserve the current architecture unless there is a concrete reason to change it.
- Keep map layer construction separate from GeoServer request/configuration helpers.
- Use explicit layer properties.id values for visualization layers.
- Keep mutually exclusive visualization layers separate and toggle visibility intentionally; do not accidentally render normal points underneath heatmap/cluster modes.
- Keep GeoServer style names in src/config/env.js; never put GeoServer admin credentials in frontend code.
- Canonical tree layer: nashiktreecensus:nashiktreecensus.
- GeoServer changes are REST-first. Manual UI instructions are a fallback, not the default.
- For any server-backed visualization, server-side verification comes before frontend claims.
- Prefer symbol-aware Serena edits for whole functions and targeted replacements for small changes.
- Validate with the real Nashik data and actual service responses; avoid assuming a generic example will behave the same.
- Do not conflate “file exists”, “GeoServer catalog knows it”, “WMS renders it”, and “frontend displays it”; these are separate checkpoints.

References: mem:core, mem:task_completion, mem:geoserver/operations