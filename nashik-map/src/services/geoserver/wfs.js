import { GEO_CONFIG, TREE_LAYER_NAME } from '../../config/env';

export async function getTreeFeatures({
  cqlFilter = '',
  bbox,
  limit = 2000,
  startIndex = 0,
  bboxCrs = 'EPSG:3857',
  srsName = 'EPSG:4326',
  signal,
} = {}) {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: TREE_LAYER_NAME,
    outputFormat: 'application/json',
    count: String(limit),
    startIndex: String(startIndex),
    srsName,
  });

  if (cqlFilter) params.set('CQL_FILTER', cqlFilter);
  if (bbox) params.set('bbox', `${bbox.join(',')},${bboxCrs}`);

  const response = await fetch(
    `${GEO_CONFIG.baseUrl}/${GEO_CONFIG.workspace}/wfs?${params}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`GeoServer WFS request failed (${response.status})`);
  }

  return response.json();
}

export async function getTreeFeatureCount({
  cqlFilter = '',
  bbox,
  bboxCrs = 'EPSG:3857',
  signal,
} = {}) {
  const [minX, minY, maxX, maxY] = bbox || [];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<wfs:GetFeature service="WFS" version="1.1.0" resultType="hits"
 xmlns:wfs="http://www.opengis.net/wfs"
 xmlns:ogc="http://www.opengis.net/ogc"
 xmlns:gml="http://www.opengis.net/gml">
  <wfs:Query typeName="${TREE_LAYER_NAME}">
    <ogc:Filter>
      <ogc:Intersects>
        <ogc:PropertyName>geom</ogc:PropertyName>
        <gml:Polygon srsName="${bboxCrs}">
          <gml:exterior>
            <gml:LinearRing>
              <gml:posList>${minX} ${minY} ${maxX} ${minY} ${maxX} ${maxY} ${minX} ${maxY} ${minX} ${minY}</gml:posList>
            </gml:LinearRing>
          </gml:exterior>
        </gml:Polygon>
      </ogc:Intersects>
    </ogc:Filter>
  </wfs:Query>
</wfs:GetFeature>`;

  const response = await fetch(
    `${GEO_CONFIG.baseUrl}/${GEO_CONFIG.workspace}/ows`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml,
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`GeoServer WFS count request failed (${response.status})`);
  }

  const text = await response.text();
  const match = text.match(/numberOfFeatures="([0-9]+)"|numberMatched="([0-9]+)"/i);
  const count = match ? Number(match[1] || match[2]) : NaN;

  if (!Number.isFinite(count)) {
    throw new Error('GeoServer WFS POST count response did not contain a feature count');
  }

  return count;
}


export async function getAllTreeFeatures({
  cqlFilter = '',
  bbox,
  pageSize = 2000,
  signal,
} = {}) {
  const features = [];
  let startIndex = 0;
  let numberMatched = null;

  while (true) {
    const result = await getTreeFeatures({
      cqlFilter,
      bbox,
      limit: pageSize,
      startIndex,
      signal,
    });

    const page = Array.isArray(result.features) ? result.features : [];
    features.push(...page);

    if (numberMatched === null && Number.isFinite(Number(result.numberMatched))) {
      numberMatched = Number(result.numberMatched);
    }

    if (page.length === 0) break;
    if (numberMatched !== null && features.length >= numberMatched) break;
    if (page.length < pageSize) break;

    startIndex += page.length;
  }

  return {
    ...{
      type: 'FeatureCollection',
      features,
    },
    numberMatched: numberMatched ?? features.length,
    numberReturned: features.length,
  };
}

export function getFeatureInfoUrl(source, coordinate, viewResolution, projection, extraParams = {}) {
  return source.getFeatureInfoUrl(coordinate, viewResolution, projection, {
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: '50',
    ...extraParams,
  });
}
