import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import KML from 'ol/format/KML';

export function createKmlLayer() {
  return new VectorLayer({
    properties: { id: 'nashik-kml' },
    source: new VectorSource({
      url: '/kml/nashik_kml.kml',
      format: new KML({ extractStyles: true }),
    }),
  });
}
