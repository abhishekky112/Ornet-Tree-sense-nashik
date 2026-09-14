import { useCallback, useMemo, useState } from 'react';
import { fromLonLat } from 'ol/proj';
import { setBaseLayer } from '../map/layers/baseLayers';
import MapView from '../components/map/MapView';
import FilterPanel from '../components/filters/FilterPanel';
import NearbyTreesPanel from '../components/tree/NearbyTreesPanel';

import { getCqlFilter } from '../features/filters/filterService';
import { setNearbyTrees } from '../map/layers/nearbyTreeLayer';
import { showNearbyArea } from '../map/layers/nearbyAreaLayer';
import './app.css';

const RADIUS_METERS = 150;

import { Map, Satellite, Layers3, TreePine } from 'lucide-react';

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
      const features = (result.features || []).map((feature) => {
        const point = feature.geometry?.coordinates;
        const projected = Array.isArray(point) ? fromLonLat(point) : null;
        const distance = projected ? distanceMeters(projected, coordinate) : Number.POSITIVE_INFINITY;
        return { ...feature, _distance: distance };
      }).sort((a, b) => a._distance - b._distance);
      setNearby({ features, radius: RADIUS_METERS, center: coordinate });
      setNearbyTrees(layers.nearbyTrees, features, null);
    } catch (error) {
      setNearby(null);
      setNearbyError(error.message || 'Unable to query GeoServer.');
      setNearbyTrees(layers.nearbyTrees, [], null);
    } finally {
      setLoadingNearby(false);
    }
  }, []);

  const selectTree = useCallback((feature) => setSelectedTree(feature), []);
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
        <MapView filters={filters} onMapClick={handleMapClick} onMapReady={setMapInstance} />
        <div className="map-toolbar">
          <span className="toolbar-label">Basemap</span>
          {[
            ['street', <><Map size={14} /> Street</>],
            ['satellite', <><Satellite size={14} /> Satellite</>],
            ['hybrid', <><Layers3 size={14} /> Hybrid</>],
          ].map(([id, label]) => <button key={id} className={basemap === id ? 'active' : ''} onClick={() => changeBasemap(id)}>{label}</button>)}
        </div>
      </div>
      <NearbyTreesPanel data={nearby} loading={loadingNearby} error={nearbyError} selectedTree={selectedTree} onSelect={selectTree} onClose={() => { setNearby(null); setSelectedTree(null); }} />
    </section>
  </main>;
}
