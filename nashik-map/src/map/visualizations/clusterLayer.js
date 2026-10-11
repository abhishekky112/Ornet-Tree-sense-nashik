import Feature from 'ol/Feature';
import { fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';

export const CLUSTER_DISTANCE_CONFIG = Object.freeze({
  lowZoom: 24,
  mediumZoom: 32,
  highZoom: 40,
  minDistance: 8,
});

export const getClusterDistance = (zoom) => {
  if (!Number.isFinite(zoom)) return CLUSTER_DISTANCE_CONFIG.mediumZoom;
  if (zoom <= 11) return CLUSTER_DISTANCE_CONFIG.lowZoom;
  if (zoom <= 14) return CLUSTER_DISTANCE_CONFIG.mediumZoom;
  return CLUSTER_DISTANCE_CONFIG.highZoom;
};

function clusterSize(count) {
  if (count >= 100) return 34;
  if (count >= 50) return 30;
  if (count >= 10) return 26;
  return 22;
}

function createClusterStyle(feature) {
  const members = feature.get('features') || [];
  const count = members.reduce(
    (sum, member) => sum + Number(member.get('data')?.properties?.clusterCount || 1),
    0,
  );
  const radius = count === 1 ? 5 : clusterSize(count) / 2;

  return new Style({
    image: new CircleStyle({
      radius,
      fill: new Fill({ color: '#1f7a4d' }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
    text: count > 1 ? new Text({
      text: String(count),
      font: '600 12px sans-serif',
      fill: new Fill({ color: '#ffffff' }),
    }) : undefined,
  });
}

export function createClusterLayer() {
  const source = new VectorSource();
  const clusterSource = new Cluster({
    distance: CLUSTER_DISTANCE_CONFIG.mediumZoom,
    minDistance: CLUSTER_DISTANCE_CONFIG.minDistance,
    source,
  });
  const layer = new VectorLayer({
    source: clusterSource,
    visible: false,
    zIndex: 20,
    style: createClusterStyle,
  });

  layer.set('id', 'tree-clusters');
  layer.set('treeSource', source);
  layer.set('clusterSource', clusterSource);
  return layer;
}

export function updateClusterDistance(layer, zoom) {
  const clusterSource = layer?.getSource();
  if (!clusterSource) return;
  const distance = getClusterDistance(zoom);
  if (clusterSource.getDistance() !== distance) {
    clusterSource.setDistance(distance);
  }
}

/**
 * @param {Array<{geometry?: {coordinates?: number[]}}>} features
 */

export function setClusterFeatures(layer, features) {
  const source = layer?.get('treeSource');
  if (!source) return;

  const featureList = Array.isArray(features) ? features : [];
  source.clear();
  source.addFeatures(featureList.map((feature) => {
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
    const olFeature = new Feature({ geometry: new Point(fromLonLat(coordinates)) });
    olFeature.set('data', feature);
    return olFeature;
  }).filter(Boolean));
}

export function clearClusterFeatures(layer) {
  layer?.get('treeSource')?.clear();
}

export function getClusterMembers(clusterFeature) {
  return clusterFeature?.get('features') || [];
}
