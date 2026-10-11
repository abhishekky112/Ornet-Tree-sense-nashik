# Windows commands and operational patterns

Run app commands from:
`D:\abhishek_project\ornet\nashik-map`

Primary validation:
`npm run build`

Development:
`npm run dev`

GeoServer REST automation:
- Base URL: `http://localhost:8081/geoserver`
- Workspace: `nashiktreecensus`
- Publish an SLD using authenticated POST to:
  `/rest/workspaces/nashiktreecensus/styles?name=<STYLE_NAME>`
  with Content-Type `application/vnd.ogc.sld+xml` and the SLD file as the request body.
- Verify a named style with:
  `/rest/workspaces/nashiktreecensus/styles/<STYLE_NAME>.json`
- Test a style directly through WMS GetMap before wiring it into React.
- Use Windows PowerShell/curl.exe or Python for these local REST checks. Do not put GeoServer credentials in frontend source or committed .env files.
- A POST returning HTTP 403 with “Style resource ... already exists” is a duplicate-style condition, not necessarily bad credentials; use an update/overwrite flow for an existing style.
- If a style exists only as a data-directory file but the catalog does not know it, WMS can return StyleNotDefined. Prefer REST catalog registration. Controlled data-directory placement is a fallback and may require GeoServer reload/restart.
