import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Group from 'ol/layer/Group';

export function createBaseLayer() {
  const satelliteUrl = 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/Wayback_2024_11_18/MapServer/tile/{z}/{y}/{x}';
  const labelsUrl = 'https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

  const street = new TileLayer({
    properties: { id: 'street', title: 'Street' },
    source: new OSM(),
    visible: true,
  });

  const satellite = new TileLayer({
    properties: { id: 'satellite', title: 'Satellite' },
    source: new XYZ({
      url: satelliteUrl,
      attributions: 'Imagery © Esri, Maxar, Earthstar Geographics',
      maxZoom: 18,
      crossOrigin: 'anonymous',
      transition: 0,
    }),
    visible: false,
  });

  // Keep Hybrid independent from Satellite so switching modes never reuses
  // or duplicates the same tile layer. This follows the old Nashik map logic:
  // imagery + a transparent Esri boundaries/places reference layer.
  const hybridImagery = new TileLayer({
    properties: { id: 'hybrid-imagery', title: 'Esri Imagery' },
    source: new XYZ({
      url: satelliteUrl,
      attributions: 'Imagery © Esri, Maxar, Earthstar Geographics',
      maxZoom: 18,
      crossOrigin: 'anonymous',
      transition: 0,
    }),
    visible: true,
  });

  const hybridLabels = new TileLayer({
    properties: { id: 'hybrid-labels', title: 'Esri Labels' },
    source: new XYZ({
      url: labelsUrl,
      attributions: 'Labels © Esri',
      maxZoom: 18,
      crossOrigin: 'anonymous',
      transition: 0,
    }),
    visible: true,
  });

  const hybrid = new Group({
    properties: { id: 'hybrid', title: 'Hybrid' },
    layers: [hybridImagery, hybridLabels],
    visible: false,
  });

  return new Group({
    properties: { id: 'basemaps', title: 'Basemaps' },
    layers: [street, satellite, hybrid],
  });
}

export function setBaseLayer(map, id) {
  const group = map.getLayers().getArray().find((layer) => layer.get('id') === 'basemaps');
  if (!group) return;

  group.getLayers().forEach((layer) => layer.setVisible(layer.get('id') === id));
}
