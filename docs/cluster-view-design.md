# Cluster View — Design & Implementation Specification

## 1. Purpose

Add a **Cluster** visualization mode to the Nashik Tree Census map.

The Cluster View will display filtered tree records as dynamically grouped map points. Nearby trees will be represented by a cluster marker with the number of trees in that group. As the user zooms in, clusters will split into smaller clusters and eventually individual tree points.

This document defines the design before implementation. It is intentionally limited to the Cluster View and does not implement or design the other planned visualizations in detail.

---

## 2. Core UX Principle

The project will have two independent concepts:

- **Filters** decide **which trees are included**.
- **View** decides **how those trees are visualized**.

Therefore, the same filter panel remains available in every visualization mode.

Example:

```text
Filters
  Ward = Ward 5
  Health = Healthy

View = Cluster

        ↓

Filtered healthy trees in Ward 5
        ↓

Cluster visualization
```

Changing from `Normal` to `Cluster` must not reset the active filters.

Changing filters while `Cluster` is active must update the clusters automatically.

---

## 3. User Interface

### 3.1 View Selector

Add a compact **View** selector to the existing map controls/header area.

Initial options:

```text
View
 ├── Normal
 └── Cluster
```

Future options may be added without redesigning the control:

```text
View
 ├── Normal
 ├── Health
 ├── Cluster
 ├── Heatmap
 ├── Ward Density
 ├── Tree Size
 └── Hexagon
```

### 3.2 UI behavior

Default:

```text
View: Normal
```

When Cluster is selected:

```text
View: Cluster
```

The filter panel remains unchanged.

The Street / Satellite / Hybrid basemap control remains independent from the View selector.

### 3.3 Responsibility separation

```text
Filters  → WHAT data is shown
View     → HOW data is shown
Basemap  → WHAT background is shown
```

---

## 4. Current Project Integration

The current Nashik application already contains:

- React + Vite
- OpenLayers
- GeoServer WMS
- GeoServer WFS service helper
- CQL filter generation
- FilterPanel and filter state
- Tree WMS layer
- Nearby tree layer
- Map instance/layer registry
- Tree GetFeatureInfo workflow

The Cluster View should reuse these capabilities instead of introducing a second map implementation.

Existing relevant areas:

```text
nashik-map/src/
├── app/
│   └── App.jsx
├── components/
│   ├── filters/
│   │   └── FilterPanel.jsx
│   └── map/
│       └── MapView.jsx
├── features/
│   └── filters/
│       └── filterService.js
├── map/
│   ├── mapInstance.js
│   └── layers/
│       └── treeLayer.js
├── services/
│   └── geoserver/
│       └── wfs.js
└── config/
    └── env.js
```

---

## 5. Architecture

The Cluster View should not create another OpenLayers map.

Instead, the existing map receives a dedicated cluster visualization layer.

Target concept:

```text
                         React UI
                            │
             ┌──────────────┴──────────────┐
             │                             │
         Filter State                  View State
             │                             │
             ↓                             ↓
        getCqlFilter()              Normal / Cluster
             │                             │
             └──────────────┬──────────────┘
                            ↓
                     Visualization Logic
                            │
             ┌──────────────┴──────────────┐
             │                             │
           Normal                       Cluster
             │                             │
            WMS                            WFS
             │                             │
       Tree WMS Layer               Tree Features
                                           │
                                     Cluster Source
                                           │
                                      Cluster Layer
                                           │
                            ┌──────────────┴──────────────┐
                            ↓                             ↓
                       Cluster Marker              Tree Marker
                            │                             │
                            └──────────────┬──────────────┘
                                           ↓
                                      OpenLayers Map
```

---

## 6. Why WFS for Cluster View?

The existing Normal View uses GeoServer WMS because WMS is appropriate for server-rendered map imagery.

Clustering requires access to individual point features and their coordinates. Therefore Cluster View should use WFS data.

Flow:

```text
CQL Filter
   ↓
GeoServer WFS GetFeature
   ↓
GeoJSON tree features
   ↓
OpenLayers VectorSource
   ↓
OpenLayers Cluster source
   ↓
Cluster VectorLayer
```

The existing `getTreeFeatures()` helper in `services/geoserver/wfs.js` should be reused or extended rather than creating an unrelated WFS request implementation.

---

## 7. Filter Integration

Cluster View must use the same CQL filter generated by the existing filter service.

Existing conceptual flow:

```text
FilterPanel
    ↓
filters state
    ↓
getCqlFilter(filters)
```

Cluster flow:

```text
FilterPanel
    ↓
filters state
    ↓
getCqlFilter(filters)
    ↓
WFS GetFeature
    ↓
filtered tree features
    ↓
cluster source
```

### Required behavior

#### No filters

```text
filters = {}
```

The WFS request must return the full applicable tree dataset.

#### Filters selected

Only matching trees should be clustered.

#### Filter changed

The existing cluster feature source must be replaced/updated with the newly filtered dataset.

#### Last filter removed

All applicable trees must return to the cluster view.

The filter behavior must remain consistent with the existing `INCLUDE` fallback used by the WMS path.

---

## 8. Cluster Layer Design

Create a dedicated visualization module, proposed location:

```text
src/map/visualizations/clusterLayer.js
```

The module should encapsulate OpenLayers-specific clustering behavior.

### Responsibilities

- Create the underlying vector source.
- Create the OpenLayers cluster source.
- Create the cluster vector layer.
- Accept/update tree features.
- Clear cluster data.
- Expose the cluster layer to the map layer registry.
- Apply cluster styling.
- Provide access to cluster members when needed for interaction.

### Non-responsibilities

The cluster layer should not:

- own React state;
- build the filter UI;
- generate business-level CQL rules;
- directly manage application navigation;
- duplicate tree-detail UI.

---

## 9. Cluster Data Model

The cluster source should preserve the original tree features as cluster members.

Conceptually:

```text
Cluster Feature
├── geometry: cluster center
└── members
    ├── Tree Feature
    ├── Tree Feature
    ├── Tree Feature
    └── ...
```

This allows the application to determine whether a clicked feature represents:

- multiple trees → cluster interaction;
- one tree → individual tree interaction.

The original tree properties should remain available through the member features.

---

## 10. Cluster Visual Design

### 10.1 Initial design

Use a simple, readable circular marker containing the tree count.

Example:

```text
      ╭─────╮
     │  24   │
      ╰─────╯
```

The marker represents 24 trees grouped at that map position.

### 10.2 Size levels

Cluster marker size should respond to the number of trees.

Initial conceptual levels:

```text
1–9 trees       → small
10–49 trees     → medium
50–99 trees     → large
100+ trees      → extra large
```

The exact radius, typography, and colors should be finalized during UI implementation.

### 10.3 Single tree

When a cluster contains only one tree, render an individual tree marker rather than a misleading count cluster.

---

## 11. Zoom Behavior

Clustering must respond naturally to map zoom.

Example:

```text
Zoomed out

        [127]
          [83]
                    [214]
```

After zooming in:

```text
          [54]   [73]
             [28]
```

After further zooming:

```text
       [8]   [12]

           ●
       ●       ●
```

Eventually individual tree points become visible.

OpenLayers' cluster source should handle the basic distance-based regrouping.

The initial implementation should use a configurable pixel distance rather than hard-coding the value throughout the application.

Proposed configuration concept:

```js
clusterDistance: 40
```

The exact value should be tuned visually after implementation.

---

## 12. Cluster Click Behavior

### 12.1 Multiple-tree cluster

When the user clicks a cluster containing multiple trees:

```text
Click cluster
      ↓
Determine cluster members
      ↓
Zoom map toward cluster
```

The first implementation should prefer zooming in rather than opening a list containing dozens of trees.

### 12.2 Individual tree

When a cluster resolves to one tree, clicking the point should reuse the existing tree information workflow where practical.

The application should not create a second tree-details component solely for Cluster View.

---

## 13. Tree Details Integration

Existing tree information includes data such as:

- Tree UID
- Local name
- Health condition
- Age group
- Height
- Girth
- Canopy
- Latitude / Longitude
- Survey date
- Survey by
- Tree photo

Cluster View should eventually connect an individual tree click to the same existing tree-detail experience.

The Cluster View is a visualization feature, not a replacement for tree details.

---

## 14. Map Layer Strategy

The existing map already contains several layers.

Conceptually:

```text
Map
├── Basemaps
├── KML
├── Tree WMS
├── Nearby Area
├── Nearby Trees
└── Cluster Layer        ← new
```

However, the application should ensure that Normal and Cluster representations are not unnecessarily rendered on top of each other.

### Normal View

```text
Tree WMS     → visible
Cluster      → hidden
```

### Cluster View

```text
Tree WMS     → hidden
Cluster      → visible
```

The other existing map layers should remain unaffected.

---

## 15. View State

Introduce a small view state in the application layer.

Conceptually:

```js
const [viewMode, setViewMode] = useState('normal');
```

Allowed initial values:

```text
normal
cluster
```

Do not duplicate filter state inside the visualization layer.

The selected view should remain active when filters change.

The selected filters should remain active when the view changes.

---

## 16. Data Refresh Rules

### View changes to Cluster

```text
View = Cluster
      ↓
Build current CQL
      ↓
Request WFS data
      ↓
Populate vector source
      ↓
Display clusters
```

### Filters change while Cluster is active

```text
Filter change
      ↓
Build new CQL
      ↓
Request WFS data
      ↓
Replace vector features
      ↓
Recalculate clusters
```

### View changes to Normal

```text
View = Normal
      ↓
Hide cluster layer
      ↓
Show WMS tree layer
```

The cluster layer may retain its source in memory if appropriate, but correctness and memory usage should be evaluated during implementation.

---

## 17. Loading and Error States

Cluster data comes from WFS and therefore needs explicit request state handling.

Required states:

```text
idle
loading
success
error
```

### Loading

A small map/UI indicator should communicate that cluster data is being loaded.

Example:

```text
Loading trees…
```

### Error

Example:

```text
Unable to load cluster data.
Please try again.
```

The application should not leave stale cluster data visible after a failed request without clearly indicating that the displayed data may be stale.

---

## 18. Performance Strategy

Clustering can become expensive if a very large number of features are loaded into the browser.

### Phase 1 — Initial implementation

Use:

```text
Current filters
      ↓
WFS filtered feature request
      ↓
OpenLayers clustering
```

This is intentionally simple and allows real-world performance to be measured against the Nashik dataset.

### Phase 2 — If required

If the dataset is too large, introduce viewport-aware loading:

```text
Current map extent
      ↓
BBOX
      ↓
CQL + BBOX
      ↓
WFS
      ↓
Only visible-area trees
      ↓
Cluster
```

The existing WFS helper already has support for an optional BBOX, so the architecture should leave room for this optimization.

### Additional future optimizations

Only if actual performance requires them:

- debounced viewport requests;
- caching by filter + BBOX + zoom;
- server-side aggregation;
- reduced WFS property payload;
- vector tiles for very large datasets.

These are not part of the first Cluster implementation.

---

## 19. Proposed File Changes

### New file

```text
src/map/visualizations/clusterLayer.js
```

### Likely existing files to update

```text
src/app/App.jsx
src/components/map/MapView.jsx
src/map/mapInstance.js
src/services/geoserver/wfs.js
```

Depending on the final UI structure, a dedicated component may also be introduced for the View selector, for example:

```text
src/components/map/ViewSelector.jsx
```

The exact file split should be confirmed against the current code before implementation.

### Files that should not be changed unnecessarily

Do not modify unrelated modules or the existing old/reference application under `map_openlayer/`.

---

## 20. No New Mapping Library for Phase 1

The current application already uses OpenLayers.

The first Cluster implementation should use the OpenLayers clustering capability rather than introducing Leaflet or another map engine.

Therefore:

```text
OpenLayers
   +
GeoServer WFS
   +
Existing CQL filtering
```

is the preferred Phase 1 stack.

Do not add `Leaflet.markercluster`, Turf.js, H3, deck.gl, or another visualization engine solely for this first cluster feature.

Those technologies can be evaluated later for features where they provide a clear benefit.

---

## 21. Accessibility Requirements

Cluster markers should be interactive using mouse and keyboard where technically practical.

The UI should:

- provide a clear label for the View selector;
- show the active view;
- preserve keyboard accessibility;
- avoid relying only on color to communicate cluster state;
- keep cluster counts readable at normal map zoom levels.

---

## 22. Responsive Design

The View selector must work on desktop and smaller screens.

Desktop concept:

```text
Filters: 3 selected        View: Cluster
```

Mobile concept:

```text
[ Filters ]   [ View ▾ ]
```

The control should not cover important map interactions or the existing nearby-tree panel.

---

## Debugging, BBOX Loading & Pagination Plan

The observed Cluster View problem is not solved by cluster styling alone. The Normal WMS view can display the full filtered layer, while the previous Cluster implementation requested only the first 5,000 WFS features for the entire dataset. This can under-represent trees spatially and produce a small number of oversized clusters.

GeoServer WFS 2.0 already supports the required mechanisms: `BBOX` restricts a GetFeature request to a geographic area, and `startIndex` + `count` provide paging. No custom BBOX or pagination service needs to be built inside GeoServer. The React/OpenLayers client must use the existing GeoServer WFS correctly.

### 1. Separate the responsibilities

The Cluster data pipeline is:

```text
Existing filters
     ↓
CQL_FILTER
     ↓
Current OpenLayers viewport
     ↓
BBOX in EPSG:3857
     ↓
GeoServer WFS 2.0
     ↓
Paged GeoJSON responses
     ↓
Complete filtered viewport dataset
     ↓
OpenLayers Cluster
```

The responsibilities remain distinct:

- **CQL_FILTER:** which trees are eligible;
- **BBOX:** which geographic area is requested;
- **pagination:** how a large result set is transferred safely;
- **Cluster:** how returned point features are visually grouped.

### 2. BBOX strategy

Cluster View must request only the current map viewport instead of requesting the entire Nashik dataset.

OpenLayers `View.calculateExtent(map.getSize())` provides the current viewport extent. The map view uses EPSG:3857, so the WFS request sends the BBOX with an explicit `EPSG:3857` CRS. The WFS response requests `srsName=EPSG:4326`, which keeps the existing `fromLonLat()` conversion in the cluster layer explicit and predictable.

GeoServer WFS supports BBOX requests and allows the BBOX CRS to be specified explicitly. This avoids relying on ambiguous CRS/axis-order defaults.

### 3. Pagination strategy

A viewport can still contain thousands of trees. Cluster View therefore uses WFS 2.0 pagination:

```text
BBOX + CQL_FILTER
       ↓
page 1: startIndex=0,    count=2000
       ↓
page 2: startIndex=2000, count=2000
       ↓
page 3: startIndex=4000, count=2000
       ↓
continue until numberMatched is satisfied
       ↓
combine features
       ↓
cluster
```

The client uses the WFS `numberMatched` and `numberReturned` metadata when available. Pagination stops when:

- all matched features have been received;
- a page returns zero features; or
- the returned page is smaller than the requested page size.

This replaces the previous fixed `limit: 5000` behavior.

### 4. Request cancellation and stale-result protection

Map movement and filter changes can trigger overlapping requests. Production implementation must:

- use `AbortController` to cancel obsolete WFS requests;
- debounce `moveend` refreshes slightly to avoid unnecessary duplicate requests;
- ignore results from an older request sequence;
- clear stale cluster features when the active request fails.

The user should never see an old viewport's clusters after moving the map.

### 5. Refresh triggers

Cluster WFS data must be refreshed when:

- Cluster View becomes active;
- any filter changes;
- the map finishes a pan or zoom (`moveend`);
- the viewport size changes sufficiently to change the visible extent, if a future resize observer is added.

Changing only the cluster distance must not re-request WFS data.

### 6. Projection strategy

The client and server CRS responsibilities are explicit:

```text
OpenLayers View: EPSG:3857
        │
        ├── BBOX → GeoServer as EPSG:3857
        │
        └── WFS response → EPSG:4326
                              ↓
                       fromLonLat()
                              ↓
                       EPSG:3857 Point
```

This prevents the cluster layer from accidentally treating longitude/latitude coordinates as Web Mercator coordinates.

### 7. Zoom-aware clustering remains part of the solution

BBOX + pagination solves **data completeness for the visible area**. It does not determine how nearby points should be grouped.

OpenLayers `Cluster.distance` is measured in pixels and can be changed dynamically with `setDistance()`. The implementation therefore keeps zoom-aware distance values:

- low zoom: smaller clustering distance so broad-area groups remain spatially separated;
- medium zoom: balanced distance;
- high zoom: larger local grouping distance before individual trees appear.

`minDistance` is used only to reduce visual overlap between cluster icons; it does not create additional clusters.

### 8. Large-area / high-density behavior

If a viewport contains an extremely large number of trees, BBOX + pagination still transfers many point features to the browser. The system should monitor this case rather than silently truncating the dataset.

The current Phase 1 implementation loads all paged features returned for the active viewport so Cluster View remains semantically complete. If production measurements show that a broad zoom level contains too many features for interactive client-side clustering, the next optimization should be a server-side density/aggregation view at low zoom, not an arbitrary increase to the WFS limit.

Future architecture:

```text
Low zoom      → density / hexagon / ward aggregation
Medium zoom   → BBOX + paged WFS + clustering
High zoom     → BBOX + paged WFS + local clustering / trees
```

### 9. Things explicitly not required in GeoServer

Do **not** create a custom GeoServer service for:

- BBOX;
- pagination;
- cluster-distance calculation.

These are existing WFS/OpenLayers capabilities. GeoServer configuration should only be changed if testing proves the existing WFS service or underlying datastore cannot support the required requests efficiently.

#### Production implementation status

This status records the implementation delivered with the current Cluster View fix.

Implemented in Phase 1:

- viewport BBOX loading from the OpenLayers View;
- explicit BBOX CRS (`EPSG:3857`);
- explicit WFS response CRS (`EPSG:4326`);
- WFS 2.0 pagination using `startIndex` + `count`;
- aggregation of all pages for the active viewport;
- `AbortController` cancellation;
- stale-request sequence protection;
- debounced `moveend` refresh;
- existing CQL filter reuse;
- existing zoom-aware OpenLayers cluster distance;
- existing Normal WMS behavior preserved.

No custom BBOX or pagination implementation was added to GeoServer because these are native WFS capabilities.

### Debug acceptance criteria

Before considering the fix complete, verify:

- the WFS request contains the current viewport BBOX;
- BBOX is explicitly sent as EPSG:3857;
- WFS response is requested in EPSG:4326;
- multiple WFS pages are fetched when `numberMatched` exceeds the page size;
- no fixed 5,000-feature global cap remains in Cluster View;
- changing filters changes the requested dataset without changing the visualization architecture;
- panning/zooming refreshes clusters for the new viewport;
- obsolete requests are cancelled or ignored;
- cluster counts correspond to the trees visible in the current area;
- Normal WMS View remains unchanged;
- Cluster View does not require excessive zooming simply because the client received only a subset of the dataset.

## 23. Testing Checklist

### View switching

- [ ] Normal is selected by default.
- [ ] Cluster can be selected.
- [ ] Normal → Cluster works.
- [ ] Cluster → Normal works.
- [ ] Switching view does not reset filters.

### Filtering

- [ ] Cluster with no filters.
- [ ] Cluster with Ward filter.
- [ ] Cluster with Health filter.
- [ ] Cluster with Ownership filter.
- [ ] Cluster with multiple filters.
- [ ] Removing one filter updates clusters.
- [ ] Removing the final filter restores all applicable trees.

### Clustering

- [ ] Nearby trees form clusters.
- [ ] Cluster count is correct.
- [ ] Cluster size responds to member count.
- [ ] Zooming in splits clusters.
- [ ] Zooming out combines nearby trees.
- [ ] Individual tree markers eventually appear.

### Interaction

- [ ] Clicking a multi-tree cluster zooms in.
- [ ] Clicking an individual tree can use existing tree details.
- [ ] Map remains usable while clusters are displayed.

### Network

- [ ] WFS request uses the current CQL filter.
- [ ] No unnecessary WFS request occurs while Normal View is active.
- [ ] Loading state is visible.
- [ ] Errors are handled.
- [ ] Stale data is not silently presented as current data.

### Performance

- [ ] Test with the complete Nashik dataset.
- [ ] Test with no filters.
- [ ] Test with restrictive filters.
- [ ] Test repeated zoom/pan operations.
- [ ] Measure whether viewport/BBOX loading is required.

### Existing functionality

- [ ] Street basemap remains functional.
- [ ] Satellite basemap remains functional.
- [ ] Hybrid basemap remains functional.
- [ ] Existing WMS filters remain functional.
- [ ] Existing nearby-tree workflow remains functional.
- [ ] KML remains functional.

---

## 24. Acceptance Criteria

The Cluster View is considered complete for Phase 1 when:

1. A View selector provides `Normal` and `Cluster`.
2. Normal remains the default view.
3. Cluster uses individual tree features from GeoServer WFS.
4. The existing filter system is reused without duplicating filter definitions.
5. All existing filter groups remain available in Cluster View.
6. Active filters are preserved when switching views.
7. Changing filters while Cluster is active refreshes the cluster dataset.
8. Cluster markers display their member count.
9. Cluster grouping changes naturally with map zoom.
10. Clicking a multi-tree cluster zooms toward the cluster.
11. Individual trees can eventually be selected/clicked.
12. Loading and WFS errors are handled cleanly.
13. Existing Normal/WMS functionality is preserved.
14. The implementation remains based on the existing OpenLayers + GeoServer architecture.
15. No unrelated project functionality is changed.

---

## 25. Future Extension Point

The Cluster View should be implemented so it can later become one entry in a reusable visualization system.

Target future architecture:

```text
Visualization Manager
│
├── Normal
├── Health
├── Cluster       ← Phase 1
├── Heatmap
├── Ward Density
├── Tree Size
└── Hexagon
```

The Cluster implementation should therefore keep visualization-specific logic isolated from filter state and general application state.

This allows future views to consume the same filtered dataset contract:

```text
filters
   ↓
CQL
   ↓
filtered tree dataset
   ↓
selected visualization
```

---

## 26. Implementation Order

Implementation should proceed in this order:

### Step 1 — Review current map/layer interfaces

Confirm the exact APIs and symbols in the current map, WFS, filter, and application modules before editing.

### Step 2 — Add View state

Introduce `normal` / `cluster` state without changing existing filter behavior.

### Step 3 — Add View selector

Add the UI control using the existing Lucide icon system and current styling approach.

### Step 4 — Create cluster layer module

Implement the OpenLayers VectorSource + Cluster source + VectorLayer abstraction.

### Step 5 — Connect WFS

Use the existing WFS service and current CQL filter.

### Step 6 — Connect cluster data to the map

Show Cluster layer only when Cluster View is active.

### Step 7 — Add cluster styling

Implement count-based markers and configurable cluster distance.

### Step 8 — Add cluster interaction

Implement zoom-to-cluster and individual tree selection behavior.

### Step 9 — Validate filter behavior

Verify all existing filter groups and filter reset behavior.

### Step 10 — Validate performance

Test the complete dataset and decide whether BBOX loading is necessary.

### Step 11 — Build and regression test

Confirm that existing map, basemap, WMS filtering, KML, and nearby-tree behavior remain intact.

---

## 27. Explicit Non-Goals for Phase 1

The first Cluster View implementation will **not** include:

- heatmap;
- health SLD visualization changes;
- ward choropleth;
- hexagon/H3 aggregation;
- tree-size visualization;
- Turf.js spatial analysis;
- Leaflet marker clustering;
- server-side cluster aggregation;
- carbon analysis;
- analytics dashboard.

These remain separate future visualization/features.
