import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { NASHIK_CONFIG } from '../config/nashik';
import { createBaseLayer } from './layers/baseLayers';
import { createTreeLayer } from './layers/treeLayer';
import { createHeatmapLayer } from './layers/heatmapLayer';
import { createKmlLayer } from './layers/kmlLayer';
import { createNearbyAreaLayer } from './layers/nearbyAreaLayer';
import { createNearbyTreeLayer } from './layers/nearbyTreeLayer';
import { createClusterLayer } from './visualizations/clusterLayer';

export function createMap(target) {
  const base = createBaseLayer();
  const trees = createTreeLayer();
  const heatmap = createHeatmapLayer();
  const kml = createKmlLayer();
  const nearbyArea = createNearbyAreaLayer();
  const nearbyTrees = createNearbyTreeLayer();
  const clusters = createClusterLayer();
  const map = new Map({
    target,
    // Heatmap sits above the basemap/KML but is mutually exclusive with the
    // normal tree and cluster visualization modes.
    layers: [base, kml, trees, heatmap, nearbyArea, nearbyTrees, clusters],
    view: new View({ center: fromLonLat(NASHIK_CONFIG.center), zoom: NASHIK_CONFIG.zoom }),
  });
  return { map, layers: { base, kml, trees, heatmap, nearbyArea, nearbyTrees, clusters } };
}
