import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { Draw } from 'ol/interaction';
import GeoJSON from 'ol/format/GeoJSON';
import WKT from 'ol/format/WKT';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke, Fill } from 'ol/style';

// ✅ Drawing Source
const drawSource = new VectorSource();
const drawLayer = new VectorLayer({
  source: drawSource,
  style: new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.1)',
    }),
  }),
});
map.addLayer(drawLayer);

// ✅ Add Draw Interaction
const draw = new Draw({
  source: drawSource,
  type: 'Polygon',
});
map.addInteraction(draw);

// ✅ Popup
const popupElement = document.createElement('div');
popupElement.className = 'ol-popup';
document.body.appendChild(popupElement);
const popup = new Overlay({
  element: popupElement,
  positioning: 'bottom-center',
  stopEvent: false,
});
map.addOverlay(popup);

// ✅ On Draw End
draw.on('drawend', function (event) {
  const feature = event.feature;
  const format = new WKT();
  const wkt = format.writeGeometry(feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));

  const wfsUrl = `http://localhost:9090/geoserver/tree_data/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=tree_data:aa&outputFormat=application/json&CQL_FILTER=INTERSECTS(geom, ${wkt})`;

  fetch(wfsUrl)
    .then((res) => res.json())
    .then((data) => {
      if (data.features.length > 0) {
        let content = `<strong>${data.features.length} trees found:</strong><br>`;
        data.features.forEach((feat, i) => {
          content += `${i + 1}) ${feat.properties.local_name} (${feat.properties.species})<br>`;
        });

        popup.setPosition(event.feature.getGeometry().getInteriorPoint().getCoordinates());
        popupElement.innerHTML = content;
      } else {
        popupElement.innerHTML = 'No trees found.';
      }
    });
});