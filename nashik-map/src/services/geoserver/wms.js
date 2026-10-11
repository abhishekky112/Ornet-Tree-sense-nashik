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
  return {
    LAYERS: TREE_LAYER_NAME,
    STYLES: GEO_CONFIG.style,
    CQL_FILTER: cqlFilter || 'INCLUDE',
  };
}

export function getHeatmapWmsSourceParams(cqlFilter = '') {
  return {
    LAYERS: TREE_LAYER_NAME,
    STYLES: GEO_CONFIG.heatmapStyle,
    FORMAT: 'image/png',
    TRANSPARENT: true,
    CQL_FILTER: cqlFilter || 'INCLUDE',
    // Lower kernel radius and coarser computation grid reduce server work
    // while keeping the same visual heat-density concept.
    ENV: 'radius:25;pixelsPerCell:16',
  };
}
