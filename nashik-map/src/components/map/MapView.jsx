import { useEffect, useRef } from 'react';
import { createMap } from '../../map/mapInstance';
import { getTreeWmsSourceParams } from '../../services/geoserver/wms';
import { getFeatureInfoUrl } from '../../services/geoserver/wfs';
import { getCqlFilter } from '../../features/filters/filterService';

export default function MapView({ filters, onMapClick, onMapReady }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const clickHandlerRef = useRef(onMapClick);

  useEffect(() => { clickHandlerRef.current = onMapClick; }, [onMapClick]);

  useEffect(() => {
    if (!ref.current) return;
    const instance = createMap(ref.current);
    mapRef.current = instance;
    onMapReady?.(instance.map);
    const handleClick = (evt) => {
      const view = instance.map.getView();
      const source = instance.layers.trees.getSource();
      const url = getFeatureInfoUrl(
        source,
        evt.coordinate,
        view.getResolution(),
        view.getProjection().getCode(),
        { FEATURE_COUNT: '50', BUFFER: '10' }
      );
      clickHandlerRef.current?.({ coordinate: evt.coordinate, url, map: instance.map, layers: instance.layers });
    };
    instance.map.on('singleclick', handleClick);
    return () => { instance.map.un('singleclick', handleClick); instance.map.setTarget(undefined); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const layer = mapRef.current?.layers.trees;
    if (!layer) return;
    layer.getSource().updateParams(getTreeWmsSourceParams(getCqlFilter(filters)));
  }, [filters]);

  return <div ref={ref} className="map-view" />;
}

