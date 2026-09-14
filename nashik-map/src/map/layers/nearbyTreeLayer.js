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

export function createNearbyTreeLayer() {
  return new VectorLayer({ properties: { id: 'nearby-trees' }, source: new VectorSource(), style: normalStyle, zIndex: 25 });
}

export function setNearbyTrees(layer, features, selectedFeature) {
  const source = layer.getSource();
  source.clear();
  features.forEach((feature) => {
    if (feature.geometry?.coordinates) {
      const olFeature = new Feature({ geometry: new Point(fromLonLat(feature.geometry.coordinates)), data: feature });
      olFeature.setStyle(feature === selectedFeature ? selectedStyle : normalStyle);
      source.addFeature(olFeature);
    }
  });
}
