import { GEO_CONFIG, TREE_LAYER_NAME } from '../../config/env';

export async function getTreeFeatures({ cqlFilter = '', bbox, limit = 1000 } = {}) {
  const params = new URLSearchParams({
    service: 'WFS', version: '2.0.0', request: 'GetFeature',
    typeNames: TREE_LAYER_NAME, outputFormat: 'application/json', count: String(limit),
  });
  if (cqlFilter) params.set('CQL_FILTER', cqlFilter);
  if (bbox) params.set('bbox', bbox.join(','));
  const response = await fetch(`${GEO_CONFIG.baseUrl}/${GEO_CONFIG.workspace}/wfs?${params}`);
  if (!response.ok) throw new Error(`GeoServer WFS request failed (${response.status})`);
  return response.json();
}

export function getFeatureInfoUrl(source, coordinate, viewResolution, projection, extraParams = {}) {
  return source.getFeatureInfoUrl(coordinate, viewResolution, projection, {
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '50',
    ...extraParams,
  });
}
