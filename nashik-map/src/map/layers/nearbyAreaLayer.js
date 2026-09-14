import Feature from 'ol/Feature';
import Circle from 'ol/geom/Circle';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

export function createNearbyAreaLayer() {
  return new VectorLayer({
    properties: { id: 'nearby-area' },
    source: new VectorSource(),
    zIndex: 20,
  });
}

export function showNearbyArea(layer, center, radius) {
  // Nearby analysis keeps its radius internally; the search area is intentionally not rendered.
  layer.getSource().clear();
}

export function clearNearbyArea(layer) {
  layer.getSource().clear();
}
