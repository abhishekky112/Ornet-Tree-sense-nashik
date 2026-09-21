const required = (key, fallback = '') => import.meta.env[key] || fallback;

export const GEO_CONFIG = {
  baseUrl: required('VITE_GEOSERVER_BASE_URL', '/geoserver'),
  workspace: required('VITE_GEOSERVER_WORKSPACE', 'nashiktreecensus'),
  layer: required('VITE_GEOSERVER_LAYER', 'nashiktreecensus'),
  style: required('VITE_GEOSERVER_STYLE', 'nashikTrees'),
};

export const TREE_LAYER_NAME = `${GEO_CONFIG.workspace}:${GEO_CONFIG.layer}`;
