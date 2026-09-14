import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { GEO_CONFIG, TREE_LAYER_NAME } from '../../config/env';

export function createTreeLayer() {
  return new TileLayer({
    properties: { id: 'trees' },
    source: new TileWMS({
      url: `${GEO_CONFIG.baseUrl}/${GEO_CONFIG.workspace}/wms`,
      params: { LAYERS: TREE_LAYER_NAME, STYLES: GEO_CONFIG.style, TILED: true, FORMAT: 'image/png', TRANSPARENT: true },
      serverType: 'geoserver',
      crossOrigin: 'anonymous',
    }),
  });
}
