import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { fromLonLat } from 'ol/proj';
import { getTreeFeatures } from '../services/geoserver/wfs';
import { getCqlFilter } from '../features/filters/filterService';

const NASHIK = { longitude: 73.7898, latitude: 19.9975 };
const INITIAL_ALTITUDE_METERS = 850;
const MAX_TREES_PER_REQUEST = 100;
const CAMERA_REFRESH_DELAY_MS = 300;
const MAX_VIEWPORT_DEGREES = 0.006;
const MAX_FETCH_ALTITUDE_METERS = 12000;
const USE_SAMPLE_DATA = true;
const TERRAIN_SERVICE_URL = 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer';

// Temporary local data so the 3D rendering can be tested independently of WFS.
// Coordinates are deliberately near the initial Nashik camera position.
const SAMPLE_TREES = [
  { TreeCd: 'SAMPLE-001', Specie: 'Neem', Height: 8, Canopy: 5, HealthCondition: 'Good', LocalName: 'Neem', longitude: 73.7882, latitude: 19.9970 },
  { TreeCd: 'SAMPLE-002', Specie: 'Banyan', Height: 13, Canopy: 8, HealthCondition: 'Good', LocalName: 'Banyan', longitude: 73.7904, latitude: 19.9981 },
  { TreeCd: 'SAMPLE-003', Specie: 'Peepal', Height: 10, Canopy: 6, HealthCondition: 'Good', LocalName: 'Peepal', longitude: 73.7911, latitude: 19.9967 },
  { TreeCd: 'SAMPLE-004', Specie: 'Rain Tree', Height: 12, Canopy: 7, HealthCondition: 'Poor', LocalName: 'Rain Tree', longitude: 73.7875, latitude: 19.9990 },
  { TreeCd: 'SAMPLE-005', Specie: 'Gulmohar', Height: 7, Canopy: 4, HealthCondition: 'Good', LocalName: 'Gulmohar', longitude: 73.7891, latitude: 19.9959 },
  { TreeCd: 'SAMPLE-006', Specie: 'Mango', Height: 9, Canopy: 5, HealthCondition: 'Good', LocalName: 'Mango', longitude: 73.7920, latitude: 19.9986 },
  { TreeCd: 'SAMPLE-007', Specie: 'Ashoka', Height: 6, Canopy: 3, HealthCondition: 'Good', LocalName: 'Ashoka', longitude: 73.7869, latitude: 19.9964 },
  { TreeCd: 'SAMPLE-008', Specie: 'Jamun', Height: 11, Canopy: 6, HealthCondition: 'Fair', LocalName: 'Jamun', longitude: 73.7900, latitude: 19.9994 },
].map((tree) => ({
  type: 'Feature',
  id: tree.TreeCd,
  geometry: { type: 'Point', coordinates: [tree.longitude, tree.latitude] },
  properties: tree,
}));

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getFeatureCoordinates(feature) {
  const coordinates = feature.geometry?.coordinates;
  const properties = feature.properties || {};
  const longitude = Number(coordinates?.[0] ?? properties.Longitude ?? properties.longitude);
  const latitude = Number(coordinates?.[1] ?? properties.Latitude ?? properties.latitude);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) return null;
  return [longitude, latitude];
}

function getViewportGeographicBbox(viewer) {
  const rectangle = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
  let west;
  let south;
  let east;
  let north;

  if (rectangle) {
    west = Cesium.Math.toDegrees(rectangle.west);
    south = Cesium.Math.toDegrees(rectangle.south);
    east = Cesium.Math.toDegrees(rectangle.east);
    north = Cesium.Math.toDegrees(rectangle.north);
  } else {
    west = NASHIK.longitude - 0.004;
    east = NASHIK.longitude + 0.004;
    south = NASHIK.latitude - 0.004;
    north = NASHIK.latitude + 0.004;
  }

  // Cap data requests to a compact window; never fetch a city-wide extent.
  const centerLongitude = (west + east) / 2;
  const centerLatitude = (south + north) / 2;
  const halfWidth = Math.min(Math.abs(east - west) / 2, MAX_VIEWPORT_DEGREES / 2);
  const halfHeight = Math.min(Math.abs(north - south) / 2, MAX_VIEWPORT_DEGREES / 2);

  return {
    west: centerLongitude - halfWidth,
    east: centerLongitude + halfWidth,
    south: centerLatitude - halfHeight,
    north: centerLatitude + halfHeight,
  };
}

function getViewportBbox(viewer) {
  const { west, south, east, north } = getViewportGeographicBbox(viewer);
  const lowerLeft = fromLonLat([west, south]);
  const upperRight = fromLonLat([east, north]);
  return [
    Math.min(lowerLeft[0], upperRight[0]),
    Math.min(lowerLeft[1], upperRight[1]),
    Math.max(lowerLeft[0], upperRight[0]),
    Math.max(lowerLeft[1], upperRight[1]),
  ];
}
const MAX_BUILDINGS = 120;
const SAMPLE_BUILDINGS = [
  { id: 'preview-001', tags: { building: 'residential', name: 'Sample House 1', 'building:levels': '2' }, geometry: [{ lon: 73.7879, lat: 19.9982 }, { lon: 73.78808, lat: 19.9982 }, { lon: 73.78808, lat: 19.99836 }, { lon: 73.7879, lat: 19.99836 }, { lon: 73.7879, lat: 19.9982 }] },
  { id: 'preview-002', tags: { building: 'apartments', name: 'Sample Apartment', height: '24' }, geometry: [{ lon: 73.78935, lat: 19.99845 }, { lon: 73.78955, lat: 19.99845 }, { lon: 73.78955, lat: 19.99863 }, { lon: 73.78935, lat: 19.99863 }, { lon: 73.78935, lat: 19.99845 }] },
  { id: 'preview-003', tags: { building: 'commercial', name: 'Sample Office', 'building:levels': '5' }, geometry: [{ lon: 73.79115, lat: 19.9980 }, { lon: 73.79138, lat: 19.9980 }, { lon: 73.79138, lat: 19.99822 }, { lon: 73.79115, lat: 19.99822 }, { lon: 73.79115, lat: 19.9980 }] },
  { id: 'preview-004', tags: { building: 'house', name: 'Sample House 2', 'building:levels': '1' }, geometry: [{ lon: 73.78735, lat: 19.99665 }, { lon: 73.78752, lat: 19.99665 }, { lon: 73.78752, lat: 19.9968 }, { lon: 73.78735, lat: 19.9968 }, { lon: 73.78735, lat: 19.99665 }] },
  { id: 'preview-005', tags: { building: 'office', name: 'Sample Tall Building', height: '32' }, geometry: [{ lon: 73.79035, lat: 19.99565 }, { lon: 73.79058, lat: 19.99565 }, { lon: 73.79058, lat: 19.99588 }, { lon: 73.79035, lat: 19.99588 }, { lon: 73.79035, lat: 19.99565 }] },
  { id: 'preview-006', tags: { building: 'residential', name: 'Sample Building 3', 'building:levels': '3' }, geometry: [{ lon: 73.79205, lat: 19.99745 }, { lon: 73.79225, lat: 19.99745 }, { lon: 73.79225, lat: 19.99765 }, { lon: 73.79205, lat: 19.99765 }, { lon: 73.79205, lat: 19.99745 }] },
];

function getBuildingHeight(tags = {}) {
  const explicitHeight = Number.parseFloat(String(tags.height || '').replace(/[^0-9.]/g, ''));
  if (Number.isFinite(explicitHeight) && explicitHeight >= 3) return Math.min(60, explicitHeight);

  const levels = Number.parseFloat(tags['building:levels']);
  if (Number.isFinite(levels) && levels > 0) return Math.min(60, levels * 3.2);

  return tags.building === 'house' || tags.building === 'residential' ? 6 : 9;
}

function addBuildingEntities(viewer, elements, buildingIds) {
  buildingIds.current.forEach((id) => viewer.entities.removeById(id));
  buildingIds.current.clear();

  let count = 0;
  elements.slice(0, MAX_BUILDINGS).forEach((element) => {
    const geometry = element.geometry;
    if (!Array.isArray(geometry) || geometry.length < 4) return;

    const positions = geometry.flatMap((point) => [Number(point.lon), Number(point.lat)]);
    if (positions.some((coordinate) => !Number.isFinite(coordinate))) return;

    const tags = element.tags || {};
    const id = `osm-building-${element.id}`;
    const height = getBuildingHeight(tags);
    const color = tags.building === 'industrial'
      ? '#9ca3af'
      : tags.building === 'commercial' || tags.building === 'office'
        ? '#8aa7bd'
        : '#c9b8a2';

    viewer.entities.add({
      id,
      name: tags.name || tags.building || 'OpenStreetMap building',
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
        height: 0,
        extrudedHeight: height,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        extrudedHeightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        material: Cesium.Color.fromCssColorString(color).withAlpha(0.88),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#5b6470').withAlpha(0.8),
        closeTop: true,
        closeBottom: true,
      },
      properties: {
        source: 'OpenStreetMap',
        buildingType: tags.building || 'unknown',
        heightMeters: height,
        levels: tags['building:levels'] || '',
      },
    });

    buildingIds.current.add(id);
    count += 1;
  });

  return count;
}

function clearTreeEntities(viewer, entityIds) {
  entityIds.current.forEach((id) => viewer.entities.removeById(id));
  entityIds.current.clear();
}

function addTreeEntities(viewer, features, entityIds, treeDataByEntityId) {
  clearTreeEntities(viewer, entityIds);
  const addedIds = [];

  features.forEach((feature, index) => {
    const coordinates = getFeatureCoordinates(feature);
    if (!coordinates) return;

    const properties = feature.properties || {};
    const featureId = String(
      feature.id ??
      properties.Tree_UID ??
      properties.TreeCensusCd ??
      properties.TreeCd ??
      `viewport-tree-${index}`,
    );
    const height = Math.min(30, Math.max(2, toNumber(properties.Height, 6)));
    const canopyValue = toNumber(properties.Canopy, height * 0.45);
    // Existing census values often look like canopy area (e.g. 176.63), so convert large values to a usable width estimate.
    const canopyWidth = Math.min(12, Math.max(1.5, canopyValue > 20 ? Math.sqrt(canopyValue) : canopyValue));
    const trunkHeight = height * 0.32;
    const [longitude, latitude] = coordinates;
    const trunkId = `tree-${featureId}-trunk`;
    const canopyId = `tree-${featureId}-canopy`;

    viewer.entities.add({
      id: trunkId,
      name: properties.LocalName || properties.Specie || 'Tree trunk',
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, trunkHeight / 2),
      cylinder: {
        length: trunkHeight,
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        topRadius: Math.max(0.08, height * 0.018),
        bottomRadius: Math.max(0.12, height * 0.028),
        material: Cesium.Color.fromCssColorString('#76513a'),
      },
    });

    viewer.entities.add({
      id: canopyId,
      name: properties.LocalName || properties.Specie || 'Tree canopy',
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, trunkHeight + (height - trunkHeight) * 0.45),
      ellipsoid: {
        heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        radii: new Cesium.Cartesian3(canopyWidth / 2, canopyWidth / 2, Math.max(0.8, canopyWidth * 0.42)),
        material: Cesium.Color.fromCssColorString(
          properties.HealthCondition?.toLowerCase?.().includes('poor') ? '#a3a34a' : '#39834b',
        ).withAlpha(0.96),
      },
    });

    addedIds.push(trunkId, canopyId);
    treeDataByEntityId.current.set(trunkId, properties);
    treeDataByEntityId.current.set(canopyId, properties);
  });

  addedIds.forEach((id) => entityIds.current.add(id));
  return addedIds.length / 2;
}

export default function CesiumView({ filters = {} }) {
  const hostRef = useRef(null);
  const viewerRef = useRef(null);
  const entityIdsRef = useRef(new Set());
  const treeDataByEntityIdRef = useRef(new Map());
  const buildingIdsRef = useRef(new Set());
  const sampleBuildingIdsRef = useRef(new Set());
  const [buildingCount, setBuildingCount] = useState(0);
  const [buildingStatus, setBuildingStatus] = useState('Loading OpenStreetMap buildings…');
  const [terrainStatus, setTerrainStatus] = useState('Loading real terrain elevation…');
  const [treeCount, setTreeCount] = useState(0);
  const [status, setStatus] = useState('Preparing the initial viewport…');
  const [error, setError] = useState('');
  const [selectedTree, setSelectedTree] = useState(null);
  const cqlFilter = getCqlFilter(filters);
  const cqlFilterRef = useRef(cqlFilter);
  cqlFilterRef.current = cqlFilter;

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      credit: '© OpenStreetMap contributors',
      maximumLevel: 19,
    });

    const viewer = new Cesium.Viewer(hostRef.current, {
      baseLayer: new Cesium.ImageryLayer(imageryProvider),
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      shouldAnimate: false,
    });

    viewerRef.current = viewer;
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 80;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        NASHIK.longitude,
        NASHIK.latitude,
        INITIAL_ALTITUDE_METERS,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-58),
        roll: 0,
      },
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      const entityId = picked?.id?.id;
      const properties = entityId ? treeDataByEntityIdRef.current.get(entityId) : null;
      setSelectedTree(properties ? { ...properties } : null);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) {
        clearTreeEntities(viewer, entityIdsRef);
        viewer.destroy();
      }
      viewerRef.current = null;
      treeDataByEntityIdRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    let cancelled = false;
    setTerrainStatus('Loading real terrain elevation…');
    Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(TERRAIN_SERVICE_URL)
      .then((terrainProvider) => {
        if (cancelled || viewer.isDestroyed()) return;
        viewer.terrainProvider = terrainProvider;
        viewer.scene.verticalExaggeration = 1.45;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        setTerrainStatus('Real terrain elevation enabled.');
      })
      .catch((loadError) => {
        if (cancelled || viewer.isDestroyed()) return;
        setTerrainStatus('Terrain service unavailable; showing the flat globe fallback.');
        console.error('Cesium terrain could not be loaded:', loadError);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    let timer;
    let activeController = null;
    let requestId = 0;
    let disposed = false;

    const clearAllBuildings = () => {
      if (!viewer.isDestroyed()) {
        buildingIdsRef.current.forEach((id) => viewer.entities.removeById(id));
        sampleBuildingIdsRef.current.forEach((id) => viewer.entities.removeById(id));
      }
      buildingIdsRef.current.clear();
      sampleBuildingIdsRef.current.clear();
      setBuildingCount(0);
    };

    const loadBuildings = async () => {
      if (disposed || viewer.isDestroyed()) return;
      activeController?.abort();
      activeController = new AbortController();
      const controller = activeController;
      const currentRequestId = ++requestId;

      if (viewer.camera.positionCartographic.height > MAX_FETCH_ALTITUDE_METERS) {
        clearAllBuildings();
        setBuildingStatus('Zoom in closer to see the 3D buildings and sample trees.');
        return;
      }

      const { south, west, north, east } = getViewportGeographicBbox(viewer);
      const query = `[out:json][timeout:15];way["building"](${south},${west},${north},${east});out body geom qt ${MAX_BUILDINGS};`;
      let data;
      let lastFailure;
      try {
        setBuildingStatus('Loading nearby OpenStreetMap buildings…');
        const endpoints = [
          'https://overpass.kumi.systems/api/interpreter',
          'https://overpass-api.de/api/interpreter',
        ];
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            });
            if (!response.ok) {
              lastFailure = new Error(`OpenStreetMap request failed (HTTP ${response.status}).`);
              continue;
            }
            data = await response.json();
            break;
          } catch (requestError) {
            if (controller.signal.aborted) return;
            lastFailure = requestError;
          }
        }
        if (!data) throw lastFailure || new Error('No OpenStreetMap response was available.');
        if (disposed || controller.signal.aborted || currentRequestId !== requestId || viewer.isDestroyed()) return;

        const elements = Array.isArray(data.elements) ? data.elements : [];
        const mappedCount = addBuildingEntities(viewer, elements, buildingIdsRef);
        const sampleCount = addBuildingEntities(viewer, SAMPLE_BUILDINGS, sampleBuildingIdsRef);
        setBuildingCount(mappedCount + sampleCount);
        setBuildingStatus(
          mappedCount > 0
            ? `Showing ${mappedCount} mapped + ${sampleCount} sample 3D buildings in the current viewport.`
            : `Showing ${sampleCount} sample 3D buildings; no mapped building footprints came back for this viewport.`,
        );
      } catch (loadError) {
        if (disposed || controller.signal.aborted || currentRequestId !== requestId) return;
        const sampleCount = addBuildingEntities(viewer, SAMPLE_BUILDINGS, sampleBuildingIdsRef);
        setBuildingCount(sampleCount);
        setBuildingStatus(`Using ${sampleCount} sample 3D buildings. OpenStreetMap: ${loadError.message || 'unavailable'}`);
      }
    };

    const scheduleBuildingLoad = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(loadBuildings, 750);
    };

    scheduleBuildingLoad();
    viewer.camera.moveEnd.addEventListener(scheduleBuildingLoad);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      activeController?.abort();
      if (viewerRef.current === viewer && !viewer.isDestroyed()) {
        viewer.camera.moveEnd.removeEventListener(scheduleBuildingLoad);
        buildingIdsRef.current.forEach((id) => viewer.entities.removeById(id));
        sampleBuildingIdsRef.current.forEach((id) => viewer.entities.removeById(id));
      }
      buildingIdsRef.current.clear();
      sampleBuildingIdsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    let timer;
    let activeController = null;
    let requestId = 0;
    let disposed = false;

    const loadViewportTrees = async () => {
      if (disposed || viewer.isDestroyed()) return;

      activeController?.abort();
      activeController = new AbortController();
      const controller = activeController;
      const currentRequestId = ++requestId;

      setError('');
      if (viewer.camera.positionCartographic.height > MAX_FETCH_ALTITUDE_METERS) {
        clearTreeEntities(viewer, entityIdsRef);
        treeDataByEntityIdRef.current.clear();
        setTreeCount(0);
        setStatus('Zoom in closer to load trees. Wide-area requests are disabled in this test mode.');
        return;
      }
      setStatus('Loading trees for the visible area…');

      try {
        let result;
        if (USE_SAMPLE_DATA) {
          // Use local sample features while validating Cesium rendering and click details.
          // WFS remains available to re-enable after the Cesium static assets work.
          result = { features: SAMPLE_TREES, numberMatched: SAMPLE_TREES.length };
        } else {
          const bbox = getViewportBbox(viewer);
          result = await getTreeFeatures({
            bbox,
            bboxCrs: 'EPSG:3857',
            srsName: 'EPSG:4326',
            cqlFilter: cqlFilterRef.current,
            limit: MAX_TREES_PER_REQUEST,
            signal: controller.signal,
          });
        }

        if (disposed || controller.signal.aborted || currentRequestId !== requestId) return;

        const features = Array.isArray(result.features) ? result.features : [];
        treeDataByEntityIdRef.current.clear();
        const renderedCount = addTreeEntities(
          viewer,
          features,
          entityIdsRef,
          treeDataByEntityIdRef,
        );
        setTreeCount(renderedCount);

        const matched = Number(result.numberMatched);
        const capped = features.length >= MAX_TREES_PER_REQUEST ||
          (Number.isFinite(matched) && matched > features.length);
        setStatus(
          renderedCount === 0
            ? 'No trees returned for this viewport. Try panning slightly.'
            : capped
              ? `Showing ${renderedCount} sample trees.`
              : `Showing ${renderedCount} sample trees for 3D testing.`,
        );
      } catch (loadError) {
        if (disposed || controller.signal.aborted || currentRequestId !== requestId) return;
        setTreeCount(0);
        setError(loadError.message || 'Unable to load tree data from GeoServer.');
        setStatus('Tree data could not be loaded.');
      }
    };

    const scheduleViewportLoad = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(loadViewportTrees, CAMERA_REFRESH_DELAY_MS);
    };

    scheduleViewportLoad();
    viewer.camera.moveEnd.addEventListener(scheduleViewportLoad);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      activeController?.abort();
      // React Strict Mode can run this cleanup after the viewer-creation effect
      // has already destroyed the Cesium Viewer. Never read viewer.camera then.
      if (viewerRef.current === viewer && !viewer.isDestroyed()) {
        viewer.camera.moveEnd.removeEventListener(scheduleViewportLoad);
      }
    };
  }, [cqlFilter]);

  return (
    <div className="cesium-view-shell">
      <div ref={hostRef} className="cesium-viewer-host" />

      <div className="cesium-navigation" aria-label="3D map navigation controls">
        <div className="cesium-navigation-group">
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.zoomIn(120)}>+</button>
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.zoomOut(120)}>−</button>
        </div>
        <div className="cesium-navigation-pad" aria-label="Move map">
          <button type="button" title="Move north" aria-label="Move north" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.moveUp(35)}>↑</button>
          <button type="button" title="Move west" aria-label="Move west" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.moveLeft(35)}>←</button>
          <button type="button" title="Move south" aria-label="Move south" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.moveDown(35)}>↓</button>
          <button type="button" title="Move east" aria-label="Move east" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.moveRight(35)}>→</button>
        </div>
        <div className="cesium-navigation-group cesium-navigation-rotation">
          <button type="button" title="Rotate left" aria-label="Rotate left" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.lookLeft(Cesium.Math.toRadians(12))}>↶</button>
          <button type="button" title="Tilt up" aria-label="Tilt up" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.lookUp(Cesium.Math.toRadians(8))}>⤒</button>
          <button type="button" title="Tilt down" aria-label="Tilt down" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.lookDown(Cesium.Math.toRadians(8))}>⤓</button>
          <button type="button" title="Rotate right" aria-label="Rotate right" onClick={() => viewerRef.current && !viewerRef.current.isDestroyed() && viewerRef.current.camera.lookRight(Cesium.Math.toRadians(12))}>↷</button>
        </div>
        <button className="cesium-navigation-home" type="button" title="Reset view to Nashik" aria-label="Reset view to Nashik" onClick={() => {
          const viewer = viewerRef.current;
          if (!viewer || viewer.isDestroyed()) return;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(NASHIK.longitude, NASHIK.latitude, INITIAL_ALTITUDE_METERS),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-58), roll: 0 },
            duration: 0.6,
          });
        }}>Reset to Nashik</button>
      </div>

      <div className="cesium-status" role="status">
        <strong>{treeCount} trees rendered · {buildingCount} buildings</strong>
        <span>{status}</span>
        <span>{buildingStatus}</span>
        <span>{terrainStatus}</span>
        {error && <span className="cesium-error">{error}</span>}
      </div>
      {selectedTree && (
        <aside className="cesium-tree-card">
          <button type="button" className="cesium-tree-card-close" onClick={() => setSelectedTree(null)} aria-label="Close tree details">×</button>
          <strong>{selectedTree.LocalName || selectedTree.Specie || 'Selected tree'}</strong>
          <dl>
            {[
              ['Tree ID', selectedTree.Tree_UID ?? selectedTree.TreeCensusCd ?? selectedTree.TreeCd],
              ['Species', selectedTree.Specie],
              ['Height', selectedTree.Height],
              ['Canopy', selectedTree.Canopy],
              ['Health', selectedTree.HealthCondition],
            ].filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>
            ))}
          </dl>
        </aside>
      )}
    </div>
  );
}
