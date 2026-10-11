import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

const normalStyle = new Style({
  image: new CircleStyle({ radius: 5, fill: new Fill({ color: '#138a5b' }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
});
const selectedStyle = new Style({
  image: new CircleStyle({ radius: 8, fill: new Fill({ color: '#f59e0b' }), stroke: new Stroke({ color: '#fff', width: 3 }) }),
});

export function getFeatureCoordinate3857(feature) {
  const coords = feature?.geometry?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const [x, y] = coords;
    if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
      return fromLonLat([x, y]);
    }
    return [x, y];
  }
  const lon = Number(feature?.properties?.Longitude);
  const lat = Number(feature?.properties?.Latitude || feature?.properties?.Lattitude);
  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    return fromLonLat([lon, lat]);
  }
  return null;
}

export function createNearbyTreeLayer() {
  return new VectorLayer({ properties: { id: 'nearby-trees' }, source: new VectorSource(), style: normalStyle, zIndex: 25 });
}

export function setNearbyTrees(layer, features, selectedFeature) {
  if (!layer) return;
  const source = layer.getSource();
  source.clear();
  (features || []).forEach((feature) => {
    const coord3857 = getFeatureCoordinate3857(feature);
    if (coord3857) {
      const olFeature = new Feature({ geometry: new Point(coord3857), data: feature });
      olFeature.setStyle(feature === selectedFeature ? selectedStyle : normalStyle);
      source.addFeature(olFeature);
    }
  });
}
