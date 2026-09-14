import { GEO_CONFIG, TREE_LAYER_NAME } from '../../config/env';

export function createTreeWmsUrl() {
  const params = new URLSearchParams({
    SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap',
    LAYERS: TREE_LAYER_NAME, STYLES: GEO_CONFIG.style,
    FORMAT: 'image/png', TRANSPARENT: 'true', TILED: 'true',
  });
  return `${GEO_CONFIG.baseUrl}/${GEO_CONFIG.workspace}/wms?${params}`;
}

export function getTreeWmsSourceParams(cqlFilter = '') {
  // GeoServer's INCLUDE filter explicitly matches every feature. Using it when
  // no UI filters are selected prevents the previous Ward CQL from lingering
  // in the TileWMS source and guarantees that deselecting the last filter
  // restores all wards/trees.
  return {
    LAYERS: TREE_LAYER_NAME,
    STYLES: GEO_CONFIG.style,
    CQL_FILTER: cqlFilter || 'INCLUDE',
  };
}
