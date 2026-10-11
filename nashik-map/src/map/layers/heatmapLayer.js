import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { GEO_CONFIG } from '../../config/env';
import { getHeatmapWmsSourceParams } from '../../services/geoserver/wms';

export function createHeatmapLayer() {
  return new TileLayer({
    properties: { id: 'tree-heatmap' },
    visible: false,
    opacity: 0.9,
    source: new TileWMS({
      url: `${GEO_CONFIG.baseUrl}/${GEO_CONFIG.workspace}/wms`,
      params: {
        ...getHeatmapWmsSourceParams(),
        TILED: true,
      },
      hidpi: false,
      serverType: 'geoserver',
      crossOrigin: 'anonymous',
    }),
  });
}
