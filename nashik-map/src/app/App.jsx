import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { fromLonLat } from 'ol/proj';
import { setBaseLayer } from '../map/layers/baseLayers';
import MapView from '../components/map/MapView';
import FilterPanel from '../components/filters/FilterPanel';
import NearbyTreesPanel from '../components/tree/NearbyTreesPanel';
const CesiumView = lazy(() => import('../cesium/CesiumView'));

import { setNearbyTrees, getFeatureCoordinate3857 } from '../map/layers/nearbyTreeLayer';
import { getTreeFeatures } from '../services/geoserver/wfs';
import { getCqlFilter } from '../features/filters/filterService';
import './app.css';

const RADIUS_METERS = 30;

import { Map, Satellite, Layers3, TreePine, Navigation } from 'lucide-react';

function distanceMeters(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export default function App() {
  const [filters, setFilters] = useState({});
  const [nearby, setNearby] = useState(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [selectedTree, setSelectedTree] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [basemap, setBasemap] = useState('street');
  const [viewMode, setViewMode] = useState('normal');
  const [displayMode, setDisplayMode] = useState('2d');
  const [tilt, setTilt] = useState(0);
  const [rotation, setRotation] = useState(0);

  const toggleTilt = () => setTilt((current) => (current === 0 ? 38 : 0));

  const selectedCount = useMemo(() => Object.values(filters).flat().length, [filters]);

  const toggle = (group, item) => setFilters((current) => {
    const values = current[group] || [];
    const next = values.includes(item)
      ? values.filter((value) => value !== item)
      : [...values, item];

    if (next.length === 0) {
      const { [group]: _removed, ...rest } = current;
      return rest;
    }
    return { ...current, [group]: next };
  });

  const clear = () => setFilters({});

  const handleMapClick = useCallback(async ({ coordinate, layers, url }) => {
    setLoadingNearby(true);
    setNearbyError('');
    setSelectedTree(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GeoServer GetFeatureInfo failed (${response.status})`);
      const result = await response.json();
      const rawFeatures = Array.isArray(result.features) ? result.features : [];
      const features = rawFeatures.map((feature) => {
        const projected = getFeatureCoordinate3857(feature);
        const distance = projected ? distanceMeters(projected, coordinate) : Number.POSITIVE_INFINITY;
        return { ...feature, _distance: distance };
      })
      .sort((a, b) => a._distance - b._distance);

      if (features.length === 0) {
        setNearby(null);
        setSelectedTree(null);
        setNearbyTrees(layers.nearbyTrees, [], null);
      } else {
        setNearby({ features, radius: 25, center: coordinate });
        setNearbyTrees(layers.nearbyTrees, features, features[0]);
        setSelectedTree(features[0]);
      }
    } catch (error) {
      setNearby(null);
      setNearbyError(error.message || 'Unable to query GeoServer.');
      setNearbyTrees(layers.nearbyTrees, [], null);
    } finally {
      setLoadingNearby(false);
    }
  }, []);

  const selectTree = useCallback((feature) => {
    setSelectedTree(feature);
    if (mapInstance && nearby?.features) {
      const nearbyTreesLayer = mapInstance.getLayers().getArray().find((l) => l.get('id') === 'nearby-trees');
      if (nearbyTreesLayer) {
        setNearbyTrees(nearbyTreesLayer, nearby.features, feature);
      }
    }
  }, [mapInstance, nearby]);
  const changeBasemap = (id) => {
    if (mapInstance) setBaseLayer(mapInstance, id);
    setBasemap(id);
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><TreePine size={20} strokeWidth={1.8} /></div><div><h1>Nashik Tree Census</h1><p>Urban forest intelligence · Nashik</p></div></div>
      <div className="topbar-actions"><span className="connection"><i /> GeoServer online</span><span className="selection-pill">{selectedCount} filters active</span></div>
    </header>
    <section className="workspace">
      <FilterPanel filters={filters} onChange={toggle} onClear={clear} />
      <div className="map-stage">
        {displayMode === '3d'
          ? <Suspense fallback={<div className="cesium-loading">Loading 3D viewer…</div>}><CesiumView filters={filters} /></Suspense>
          : <MapView
              filters={filters}
              viewMode={viewMode}
              tilt={tilt}
              rotation={rotation}
              onRotationChange={setRotation}
              onMapClick={handleMapClick}
              onMapReady={setMapInstance}
            />}
        <div className="display-mode-selector" role="group" aria-label="Map dimension">
          <button type="button" className={displayMode === '2d' ? 'active' : ''} onClick={() => setDisplayMode('2d')}>2D Map</button>
          <button type="button" className={displayMode === '3d' ? 'active' : ''} onClick={() => setDisplayMode('3d')}>3D View</button>
        </div>
        {displayMode === '2d' && <>
          <div className="view-selector">
            <span className="toolbar-label">View</span>
            <select value={viewMode} onChange={(event) => setViewMode(event.target.value)} aria-label="Map visualization view">
              <option value="normal">Normal</option>
              <option value="cluster">Cluster</option>
              <option value="heatmap">Heatmap</option>
            </select>
          </div>
          <div className="map-toolbar">
            <span className="toolbar-label">Basemap</span>
            {[
              ['street', <><Map size={14} /> Street</>],
              ['satellite', <><Satellite size={14} /> Satellite</>],
              ['hybrid', <><Layers3 size={14} /> Hybrid</>],
            ].map(([id, label]) => <button key={id} className={basemap === id ? 'active' : ''} onClick={() => changeBasemap(id)}>{label}</button>)}
          </div>
          <div className={`map-camera-toolbar ${nearby ? 'with-panel' : ''}`} role="toolbar" aria-label="Camera perspective and rotation">
            <div className="camera-tilt-group">
              <button
                type="button"
                className={`toolbar-btn ${tilt > 0 ? 'active' : ''}`}
                onClick={toggleTilt}
                title={tilt > 0 ? 'Switch to 2D Flat' : 'Switch to Angled Ride View (2.5D)'}
              >
                <span className="btn-icon">📐</span>
                <span>{tilt > 0 ? `Angled ${tilt}°` : '2D Flat'}</span>
              </button>
              {tilt > 0 && (
                <div className="tilt-slider-wrap" title={`Tilt angle: ${tilt}°`}>
                  <input
                    type="range"
                    min="15"
                    max="46"
                    step="1"
                    value={tilt}
                    onChange={(event) => setTilt(Number(event.target.value))}
                    aria-label="Adjust tilt angle"
                  />
                  <span className="tilt-val">{tilt}°</span>
                </div>
              )}
            </div>

            <div className="camera-rotation-group" title="Rotate map view (or hold Alt+Shift+Drag)">
              <button
                type="button"
                className="compass-btn"
                onClick={() => setRotation(0)}
                title="Click to reset North (0°)"
                aria-label={`Reset North. Current heading: ${rotation}°`}
              >
                <Navigation
                  size={14}
                  className="compass-needle"
                  style={{ transform: `rotate(${-rotation}deg)` }}
                />
                <span className="compass-n">N</span>
              </button>
              <div className="heading-slider-wrap" title={`Heading: ${rotation}°`}>
                <input
                  type="range"
                  min="0"
                  max="359"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  aria-label="Rotate map heading"
                />
                <span className="heading-val">{rotation}°</span>
              </div>
            </div>
          </div>
        </>}
      </div>
      <NearbyTreesPanel data={nearby} loading={loadingNearby} error={nearbyError} selectedTree={selectedTree} onSelect={selectTree} onClose={() => { setNearby(null); setSelectedTree(null); }} />
    </section>
  </main>;
}
