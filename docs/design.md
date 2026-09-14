# ORNET Nashik React Application — Design & Migration Plan

**Status:** Draft — Review Required  
**Scope:** Nashik-only React/Vite application  
**Rule:** No changes to the existing `map_openlayer` application until this design is approved.

---

## 1. Objective

Create a new, independent **React + Vite + OpenLayers** application for the Nashik Tree Census.

The new application will migrate only Nashik-relevant functionality from the existing ORNET `map_openlayer` implementation, while restructuring it into maintainable, modular, industry-standard components and services.

The existing application remains untouched and acts as the functional reference during migration.

### Primary goals

- Build a clean Nashik-only React application.
- Separate UI, map logic, data access, configuration, and business logic.
- Remove corporation-specific branching that is unnecessary for Nashik.
- Centralize GeoServer configuration so the server can be changed without editing application logic.
- Design map visualizations as extensible modules so future representations can be added safely.
- Preserve existing Nashik functionality before introducing architectural improvements.
- Make the application easier to test, debug, deploy, and extend.

---

## 2. Non-Goals for the Initial Migration

The first migration will **not**:

- Rewrite or modify the existing `map_openlayer` application.
- Modify production GeoServer configuration.
- Modify the production Tree Census backend APIs.
- Migrate unrelated corporations/cities.
- Introduce unnecessary state-management libraries before their need is established.
- Add new visualization types before the existing Nashik functionality is stable.
- Replace working backend functionality with new backend code.

Future improvements can be added after the baseline migration is verified.

---

## 3. Existing Application Reference

The existing implementation is primarily concentrated in `map_openlayer/index.html`, with supporting/legacy implementations in files such as `main.js`, `draw.js`, `oldhtml.html`, and `test.html`.

The current implementation uses:

- OpenLayers for map rendering and interactions.
- GeoServer WMS for tree visualization.
- GeoServer WFS for tree data queries.
- CQL filters for server-side filtering.
- KML for corporation/ward boundary information.
- Backend PHP endpoints for dynamic filter data and NDVI tile URLs.
- LocalStorage for filter data caching.
- Bootstrap/jQuery/DataTables for UI and reporting.
- URL query parameters for externally supplied filter/search state.

For Nashik, the migration will extract only behavior actually required by the Nashik application.

---

## 4. Target High-Level Architecture

```text
React UI
   │
   ├── Map UI
   ├── Filter UI
   ├── Search UI
   ├── Analysis UI
   └── Report UI
          │
          ↓
Feature / Application Logic
          │
          ├── Filter State & CQL Builder
          ├── Tree Search
          ├── Spatial Analysis
          ├── Reports
          └── Visualization Selection
          │
          ↓
Map & Data Services
          │
          ├── OpenLayers Map
          ├── WMS Service
          └── WFS Service
          │
          ├───────────────┐
          ↓               ↓
     GeoServer       Local Filter Data
                         │
                         ↓
                   Future Filter API
```

### Initial backend/data strategy

For the first implementation:

- **GeoServer is the main external GIS backend.** The user already has the GeoServer URL.
- **Filter values are temporarily stored locally** under `src/data/` using the real Nashik dropdown API response already collected from the existing system.
- **The Filter API is not required for the first React implementation.** Its integration will be added later when the project has its own API.
- **NDVI is explicitly paused** and is not part of the initial architecture/runtime.

The local filter data must preserve the API's structure as closely as practical so that replacing it with an API service later does not require rewriting the filter UI.

The key principle is that **React components should not contain raw GeoServer URLs, WFS query construction, or large blocks of OpenLayers implementation logic**.

---

## 5. Proposed Directory Structure

```text
ornet/
│
├── map_openlayer/                 # Existing application — untouched
│
├── nashik-map/                    # New React/Vite application
│   │
│   ├── public/
│   │   └── kml/
│   │       └── nashik_kml.kml
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.jsx
│   │   │   └── app.css
│   │   │
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── MapView.jsx
│   │   │   │   ├── MapControls.jsx
│   │   │   │   └── BasemapSwitcher.jsx
│   │   │   │
│   │   │   ├── filters/
│   │   │   │   ├── FilterPanel.jsx
│   │   │   │   ├── FilterGroup.jsx
│   │   │   │   └── FilterCheckbox.jsx
│   │   │   │
│   │   │   ├── tree/
│   │   │   │   ├── TreePopup.jsx
│   │   │   │   └── TreeDetails.jsx
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── TreeSearch.jsx
│   │   │   │   └── CoordinateSearch.jsx
│   │   │   │
│   │   │   ├── analysis/
│   │   │   │   ├── PolygonAnalysis.jsx
│   │   │   │   └── CircleAnalysis.jsx
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── CarbonReport.jsx
│   │   │       └── TreeDataTable.jsx
│   │   │
│   │   ├── data/
│   │   │   └── nashikFilters.json      # Temporary real API response
│   │   │
│   │   ├── features/
│   │   │   ├── filters/
│   │   │   ├── tree-search/
│   │   │   ├── spatial-analysis/
│   │   │   ├── heatmap/
│   │   │   └── carbon/
│   │   │
│   │   ├── map/
│   │   │   ├── mapInstance.js
│   │   │   ├── layers/
│   │   │   │   ├── baseLayers.js
│   │   │   │   ├── treeLayer.js
│   │   │   │   ├── kmlLayer.js
│   │   │   │   └── heatmapLayer.js
│   │   │   │
│   │   │   ├── interactions/
│   │   │   │   ├── mapClick.js
│   │   │   │   ├── polygonDraw.js
│   │   │   │   └── circleDraw.js
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   └── treeStyles.js
│   │   │   │
│   │   │   └── visualizations/
│   │   │       ├── visualizationRegistry.js
│   │   │       ├── point.js
│   │   │       ├── heatmap.js
│   │   │       ├── choropleth.js
│   │   │       ├── hexagon.js
│   │   │       ├── cluster.js
│   │   │       └── sizeSymbol.js
│   │   │
│   │   ├── services/
│   │   │   ├── geoserver/
│   │   │   │   ├── wms.js
│   │   │   │   ├── wfs.js
│   │   │   │   └── capabilities.js
│   │   │   │
│   │   │   └── tree/
│   │   │       └── treeService.js
│   │   │
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   ├── mapConfig.js
│   │   │   └── nashik.js
│   │   │
│   │   ├── state/
│   │   │   └── mapState.js
│   │   │
│   │   ├── utils/
│   │   │   ├── cql.js
│   │   │   ├── coordinates.js
│   │   │   ├── urlParams.js
│   │   │   └── tree.js
│   │   │
│   │   └── styles/
│   │       ├── global.css
│   │       └── components/
│   │
│   ├── .env.example
│   ├── .env.development
│   ├── .env.production
│   ├── package.json
│   └── vite.config.js
│
└── docs/
    └── design.md
```

The exact structure can be adjusted during implementation if the real migrated code indicates that a smaller structure is more appropriate. We should avoid creating empty abstraction layers solely for appearance.

---

## 6. GeoServer Configuration Strategy

### Current agreed setup

The user already has a GeoServer URL. The new Nashik application will use that existing GeoServer as its GIS backend; we are not creating or modifying a GeoServer as part of the React migration.

The existing Nashik configuration is:

```text
GeoServer base URL: https://www.ornettreecensus.com/geoserver
Workspace:          nashiktreecensus
Layer:              nashiktreecensus
Style:               nashikTrees
```

These values must be verified during implementation against the actual GeoServer capabilities before relying on them in production.

### Problem in the current application

The existing application directly constructs URLs using a hard-coded GeoServer URL and dynamically derives the workspace/layer from `electionName`.

For the Nashik-only application, there is no reason to retain generic corporation branching.

### Proposed solution

Use Vite environment variables.

Example:

```env
VITE_GEOSERVER_URL=https://www.ornettreecensus.com/geoserver
```

and expose configuration through one module:

```js
export const config = {
  geoServerUrl: import.meta.env.VITE_GEOSERVER_URL,
};
```

The rest of the application imports `config` rather than reading `import.meta.env` directly.

### Future server migration

Current:

```text
VITE_GEOSERVER_URL=https://www.ornettreecensus.com/geoserver
```

Future:

```text
VITE_GEOSERVER_URL=https://gis.example.com/geoserver
```

Only deployment/environment configuration should need to change, assuming the new GeoServer exposes compatible WMS/WFS endpoints and layer names.

### Important distinction

The application should keep separate configuration values for:

- GeoServer base URL.
- GeoServer workspace.
- GeoServer layer.
- GeoServer style.
- WMS defaults.
- WFS defaults.
- Nashik map center/zoom.

The previous design listed the production Filter API and NDVI endpoint as required configuration. That is no longer part of the initial implementation scope.

For the initial build:

- Filter values come from `src/data/nashikFilters.json`.
- NDVI is paused and has no runtime/API dependency.
- A future Filter API base URL can be added when the project's own API is ready.

This prevents one URL constant from becoming a hidden dependency throughout the application.

---

## 7. Nashik Configuration

Nashik-specific information should be centralized.

Conceptually:

```js
export const nashikConfig = {
  workspace: 'nashiktreecensus',
  layer: 'nashiktreecensus',
  style: 'nashikTrees',
  kml: '/kml/nashik_kml.kml',
};
```

Actual values must be verified against the existing application/data before implementation.

This means the application will not contain scattered conditions such as:

```js
if (convertLowerElectionName === 'nashik') { ... }
```

unless there is a genuinely Nashik-specific behavior that cannot be represented as configuration.

---

## 8. Data Access Architecture

### WMS

WMS will remain responsible for map rendering where appropriate:

```text
GeoServer WMS
     ↓
OpenLayers TileLayer
     ↓
Map
```

The WMS service module will own construction of WMS parameters such as:

- `LAYERS`
- `STYLES`
- `CQL_FILTER`
- `FORMAT`
- `TRANSPARENT`
- `TILED`

### WFS

WFS will be used when actual tree features/data are required:

```text
GeoServer WFS
     ↓
GeoJSON
     ↓
Tree service / analysis
     ↓
Heatmap / reports / spatial analysis / tables
```

WFS request construction should live in `services/geoserver/wfs.js` rather than inside React components.

---

## 9. Filter Architecture

The existing application has a large `onFilterApply()` function that combines many filter types and creates CQL strings.

### Initial filter-data strategy (temporary)

For the first Nashik React implementation, the filter UI will **not call the production dropdown API at runtime**.

The real Nashik dropdown API was called during design preparation with:

```text
appName=TreeCensus
electionName=Nashik
```

The successful response will be stored locally as:

```text
src/data/nashikFilters.json
```

The local file should preserve the returned API shape, including datasets such as:

- `WardMaster`
- `HealthCondition`
- `LandOwnership`
- `EnvironmentalParameters`
- `StructuralParameters`
- `IUCN_Status`
- `EconomicImp`
- `AdditionalParamaters`
- `AgeGroup`
- `LocalName`
- `TreeLocation`

This is temporary seed/reference data, not a replacement backend. The filter service abstraction should be designed so that a future project-owned Filter API can replace the local data source without requiring a rewrite of the filter components or CQL logic.

The new application should separate:

```text
Filter UI
   ↓
Selected filter state
   ↓
Filter definitions
   ↓
CQL builder
   ↓
WMS/WFS request
```

### Example

User selects:

```text
Ward = 12
Health = Good
Heritage = Yes
```

The filter layer produces something conceptually equivalent to:

```text
WardNameOrNum='12'
AND HealthCondition='Good'
AND IsHeritageTree='Yes'
```

The UI should not know how the CQL syntax is constructed.

### Filter responsibilities

- Define available filters.
- Load dynamic filter values.
- Maintain selected values.
- Build CQL safely.
- Apply CQL to WMS.
- Reuse the same active filter for WFS-based analysis where required.

---

## 10. Search Architecture

Tree search should remain separate from normal filters.

Search capabilities to migrate where applicable:

- Tree UID.
- Local name.
- Species.
- Ward.
- Tree location.
- Ownership.
- Health.
- Economic importance.
- Area name.
- Property name/address.

Search construction should reuse the CQL builder/service rather than directly modifying WMS parameters from the UI.

UID search should also support locating the tree and showing its details.

---

## 11. Spatial Analysis Architecture

The existing application has spatial interactions such as:

### Polygon selection

```text
Draw polygon
     ↓
Transform EPSG:3857 → EPSG:4326
     ↓
Create WKT
     ↓
INTERSECTS(geom, polygon)
     ↓
WFS
     ↓
Tree analysis
```

### 100 m circle

```text
Map click / coordinates
     ↓
100 m circle
     ↓
Spatial query
     ↓
Tree results
```

These interactions should be independent modules so additional spatial operations can be added later.

---

## 12. Map Visualization Architecture

This is a major extensibility requirement.

The map should not be tightly coupled to a single representation of trees.

### Initial visualization

- Existing Nashik tree visualization through GeoServer WMS.

### Existing/future representations to support architecturally

```text
Tree Points / WMS
Heatmap
Ward Choropleth
Hexagon aggregation
Cluster visualization
Size-based symbols
Health-based visualization
NDVI overlay
```

### Proposed concept

```text
Visualization Registry
        │
        ├── point
        ├── heatmap
        ├── choropleth
        ├── hexagon
        ├── cluster
        └── sizeSymbol
```

A visualization module should define how it receives data and how it creates/updates the OpenLayers layer.

The initial migration should implement only the visualizations already required by Nashik. Future visualizations can then be added without rewriting `MapView`.

---

## 13. Heatmap Design

The existing heatmap is generated from WFS tree features and uses the active CQL filter.

The migrated implementation should preserve this behavior:

```text
Active filters
     ↓
WFS query
     ↓
GeoJSON features
     ↓
OpenLayers Heatmap layer
```

Zoom-dependent radius/blur should remain encapsulated inside the heatmap module.

Future improvements can include:

- weighted heatmaps.
- viewport-based loading.
- server-side aggregation.
- configurable radius.
- configurable weighting field.

These are future enhancements, not mandatory initial migration work.

---

## 14. NDVI — Paused for Initial Implementation

NDVI is explicitly **out of scope for the first Nashik React build**.

The existing application references an NDVI tile-URL backend endpoint, but the new application will not depend on that service initially.

Therefore, the initial build will:

- not create an NDVI service module.
- not create an NDVI map layer.
- not display an NDVI/Green Cover checkbox.
- not require an NDVI API endpoint.
- not require any NDVI server/data pipeline.

NDVI can be added later as an isolated feature once its backend/data source is finalized.

---

## 15. Tree Popup / Details

Tree click behavior should be separated into:

```text
Map click
   ↓
FeatureInfo request
   ↓
Tree service
   ↓
TreeDetails data model
   ↓
TreePopup component
```

Corporation-specific photo URL manipulation that is not applicable to Nashik should be removed.

Nashik-specific photo behavior should be isolated in the tree service or a dedicated media utility rather than embedded inside map-click code.

---

## 16. Reports

The existing carbon report performs a client-side directional estimate from tree girth and height.

The migration should preserve the existing warning that the formula is an estimate and should not be treated as an official forestry figure without validation.

The report architecture should be:

```text
Current filter
     ↓
WFS data
     ↓
Carbon calculation service
     ↓
Ward aggregation
     ↓
CarbonReport UI
```

The calculation must not be buried inside the modal component.

---

## 17. State Management

Initial recommendation: **do not introduce Redux/Zustand/etc. unless actual application complexity requires it.**

Start with:

- React state for local UI state.
- Context or a small application state module for genuinely shared map/filter state.
- URL parameters for externally supplied initial state.
- LocalStorage only for appropriate cached preferences/filter metadata.

If the application grows to many independent panels and cross-feature state dependencies, a dedicated state library can be introduced later.

---

## 18. URL Parameter Strategy

The current application accepts parameters such as:

- `electionName`
- `centralLong`
- `centralLat`
- `filter_type`
- `filter_val`
- other legacy parameters

For the Nashik-only application, unnecessary generic parameters should be removed where possible.

The URL layer should be isolated in:

```text
src/utils/urlParams.js
```

This prevents URL parsing from being scattered through components.

Backward compatibility with externally generated Nashik URLs should be verified before removing any parameter.

---

## 19. Caching Strategy

The existing application caches filter data in LocalStorage.

The React version should preserve useful caching but centralize it:

```text
filterCache service
     ↓
LocalStorage
```

Cache keys should be namespaced, versionable, and Nashik-specific.

Example concept:

```text
ornet:nashik:filters:v1
```

The application should handle invalid/expired/corrupt cached data gracefully.

---

## 20. Error & Loading Handling

Network operations should have consistent states:

```text
idle
loading
success
error
```

This should apply to:

- GeoServer WFS.
- Future Filter API (when connected).
- Tree search.
- Spatial analysis.
- Reports.

Instead of each function implementing unrelated loading behavior, reusable UI patterns should be used where practical.

---

## 21. Security / Robustness Considerations

The migration should improve request construction where possible.

Important considerations:

- Escape user-provided values before inserting them into CQL.
- Avoid unsafe HTML interpolation where React rendering can be used instead.
- Do not put secrets in Vite environment variables; `VITE_*` values are client-visible.
- Treat GeoServer/backend URLs as public configuration.
- Validate coordinates before spatial queries.
- Handle failed WMS/WFS/API requests gracefully.
- Avoid exposing unnecessary backend information in UI errors.

---

## 22. Migration Mapping

The migration will be performed feature-by-feature rather than copying the old file.

| Existing functionality | New location |
|---|---|
| Map initialization | `map/` + `components/map/` |
| Basemaps | `map/layers/baseLayers.js` |
| Nashik WMS | `services/geoserver/wms.js` + `map/layers/treeLayer.js` |
| WFS | `services/geoserver/wfs.js` |
| Filter data (initial) | `src/data/nashikFilters.json` |
| Filter data (future) | `services/api/filters.js` |
| Filter UI | `components/filters/` |
| CQL generation | `utils/cql.js` / filter feature module |
| Tree popup | `components/tree/` |
| Tree FeatureInfo | `services/tree/treeService.js` |
| Tree search | `features/tree-search/` |
| Coordinate search | `components/search/` + map interaction |
| Polygon selection | `map/interactions/polygonDraw.js` |
| Circle selection | `map/interactions/circleDraw.js` |
| KML boundary | `map/layers/kmlLayer.js` |
| NDVI (future/deferred) | Future `services/api/ndvi.js` + `map/layers/ndviLayer.js` |
| Heatmap | `features/heatmap/` + visualization module |
| Carbon report | `features/carbon/` + `components/reports/` |
| DataTables/report results | `components/reports/` |
| URL initialization | `utils/urlParams.js` |
| LocalStorage | cache/state utility |

This mapping is a design target and will be adjusted if code inspection during migration reveals better boundaries.

---

## 23. Migration Phases

### Phase 0 — Design Review

- Review this document.
- Agree on folder architecture.
- Agree on environment/configuration strategy.
- Agree on visualization extensibility strategy.
- No code migration yet.

### Phase 1 — React/Vite Foundation

Create the new `nashik-map` application with:

- React.
- Vite.
- OpenLayers.
- Basic application shell.
- Environment configuration.
- Nashik configuration.
- Basic styling.

### Phase 2 — Map Baseline

Migrate and verify:

- map initialization.
- Nashik center/zoom.
- basemaps.
- Nashik KML.
- Nashik WMS tree layer.

### Phase 3 — Filters

Implement and verify:

- local Nashik filter data from `src/data/nashikFilters.json`.
- filter metadata and groups.
- nested/attribute filters where required.
- CQL construction.
- WMS filtering.
- reuse of the same active filter for WFS operations.

**Temporary implementation:** the local JSON is the filter-data source.

**Future replacement:** connect the filter service to the project's own dropdown API without changing the filter UI/CQL contract.

### Phase 4 — Search & Tree Details

Migrate:

- tree search.
- UID search.
- coordinate search.
- map click.
- tree popup/details.

### Phase 5 — Spatial Analysis

Migrate:

- polygon selection.
- circle selection.
- spatial WFS queries.
- result tables.

### Phase 6 — Environmental/Reports

Migrate:

- heatmap.
- carbon report.
- Excel/report behavior where required.

NDVI is intentionally deferred and will be handled as a separate future feature.

### Phase 7 — Verification

Perform feature-by-feature comparison:

```text
Existing Nashik application
          VS
New React Nashik application
```

Verify filters, queries, map behavior, popup data, analysis, and reports.

### Phase 8 — Cleanup & Documentation

After functional parity:

- remove unnecessary legacy branching.
- improve naming.
- improve error handling.
- improve reusable abstractions.
- document important services/configuration.
- optimize network requests where justified.

---

## 24. Testing Strategy

Testing should be incremental.

### Map tests

- Map loads.
- Nashik extent is correct.
- Basemap switching works.
- WMS loads.
- KML loads.

### Filter tests

For each migrated filter:

```text
UI selection
   ↓
Expected CQL
   ↓
Expected WMS result
```

Verify combinations using `AND`/`OR` semantics.

### Search tests

- Valid UID.
- Invalid UID.
- Valid coordinates.
- Invalid coordinates.
- Empty search.
- Search combined with filters.

### Spatial tests

- Polygon draw.
- Circle draw.
- Spatial filtering.
- Empty result.
- Existing filter + spatial filter.

### Visualization tests

- Base tree layer.
- Heatmap.
- Future visualization registration.
- NDVI testing is deferred until NDVI is brought back into scope.

### Report tests

- Filtered dataset.
- Ward aggregation.
- Missing girth/height values.
- Empty dataset.

---

## 25. Deployment Strategy

The application should support separate environment configuration.

Example:

```text
Development
    ↓
.env.development

Production
    ↓
.env.production
```

The production GeoServer URL should never be duplicated across source files.

A future migration to a self-owned GeoServer should therefore primarily involve deployment configuration plus verification of:

- workspace name.
- layer name.
- published styles.
- WMS/WFS availability.
- CORS configuration.
- supported CQL syntax.
- CRS configuration.
- data schema/property names.

---

## 26. Future Multi-City Support

Although the first application is Nashik-only, the architecture should make future city support possible without rebuilding the application from scratch.

Potential future structure:

```text
config/
├── nashik.js
├── amravati.js
├── mbmc.js
└── tmc.js
```

and a city registry:

```text
city → configuration → data services → map
```

However, this should only be introduced when there is an actual second city requirement. The initial app should remain focused on Nashik.

---

## 27. Future Visualization Expansion

When a new representation is requested, the expected workflow should be:

```text
1. Define visualization requirements
2. Define required data
3. Add visualization module
4. Register visualization
5. Add UI option
6. Test against active filters
7. Verify performance
```

For example, adding a ward choropleth should not require rewriting the WFS service or the main map component.

Potential future modules include:

- Health-based SLD/WMS visualization.
- Ward choropleth.
- Tree density heatmap.
- Hexagon aggregation.
- Marker clustering.
- Size-based symbols based on height/girth.
- Species-based visualization.
- Age-group visualization.
- Environmental/NDVI visualization.

---

## 28. Performance Considerations

The current application can request large WFS datasets. The React migration should preserve behavior first, then evaluate optimization.

Potential future optimizations:

- viewport-based WFS loading.
- pagination.
- server-side aggregation.
- GeoServer SQL views.
- vector tiles where appropriate.
- clustering.
- reduced feature payloads.
- caching.
- debounced search.

No optimization should change expected results without explicit verification.

---

## 29. Architecture Principles

The new application should follow these principles:

1. **Single responsibility** — components should have one clear responsibility.
2. **Configuration over hard-coding** — server URLs and Nashik metadata belong in configuration.
3. **Services over network calls in UI** — React components should not directly build GeoServer requests.
4. **Reusable map modules** — interactions and layers should be independently maintainable.
5. **Feature-oriented organization** — related business behavior should stay together.
6. **Visualization independence** — adding a map representation should not require rewriting the application.
7. **Progressive abstraction** — do not create abstractions that have no real use.
8. **Functional parity before redesign** — first reproduce working behavior, then improve it.
9. **Existing application safety** — the old project remains untouched during migration.
10. **Explicit boundaries** — UI, state, business logic, map engine, and external services should remain distinguishable.

---

## 30. Acceptance Criteria

The migration is considered successful when:

- A standalone Nashik React/Vite application runs independently.
- Existing `map_openlayer` remains unchanged.
- Nashik map behavior is functionally equivalent for migrated features.
- GeoServer URL is configurable through environment configuration.
- No production GeoServer URL is duplicated across feature modules.
- WMS and WFS access is centralized.
- Filters are modular and produce correct CQL.
- Tree search and details work.
- Spatial analysis works.
- Heatmap/report functionality works where included in the approved scope.
- NDVI remains explicitly deferred until separately approved.
- Future visualization modules can be added without rewriting the core map architecture.
- The application has clear documentation for configuration and deployment.

---

## 31. Approval Gate

**STOP HERE BEFORE IMPLEMENTATION.**

This document is the proposed design only.

After review, the user should approve or request changes to:

- project/folder name.
- directory structure.
- configuration strategy.
- GeoServer abstraction.
- filter architecture.
- visualization architecture.
- state management approach.
- migration phases.
- initial feature scope.

Only after approval should implementation begin.
