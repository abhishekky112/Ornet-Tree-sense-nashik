import { useEffect, useRef } from 'react';
import { createMap } from '../../map/mapInstance';
import { toLonLat } from 'ol/proj';
import { getTreeWmsSourceParams } from '../../services/geoserver/wms';
import { getTreeFeatures, getTreeFeatureCount, getFeatureInfoUrl } from '../../services/geoserver/wfs';
import { getCqlFilter } from '../../features/filters/filterService';
import {
  setClusterFeatures,
  clearClusterFeatures,
  updateClusterDistance,
} from '../../map/visualizations/clusterLayer';

const DIRECT_TREE_THRESHOLD = 20;
const CLUSTER_GRID_SIZE = 4;
const CLUSTER_FEATURE_LIMIT = 2000;

function createBboxGrid(bbox, gridSize = CLUSTER_GRID_SIZE) {
  const [minX, minY, maxX, maxY] = bbox;
  const cellWidth = (maxX - minX) / gridSize;
  const cellHeight = (maxY - minY) / gridSize;
  const cells = [];

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      cells.push({
        bbox: [
          minX + column * cellWidth,
          minY + row * cellHeight,
          column === gridSize - 1 ? maxX : minX + (column + 1) * cellWidth,
          row === gridSize - 1 ? maxY : minY + (row + 1) * cellHeight,
        ],
        center: [
          minX + (column + 0.5) * cellWidth,
          minY + (row + 0.5) * cellHeight,
        ],
      });
    }
  }

  return cells;
}

function isInsideNashikBoundary(coordinate, boundaryFeatures) {
  return boundaryFeatures.some((feature) => {
    const geometry = feature.getGeometry();
    return geometry?.intersectsCoordinate?.(coordinate) || false;
  });
}

async function getServerAggregatedTreeFeatures({ cqlFilter, bbox, signal, boundaryFeatures }) {
  const cells = createBboxGrid(bbox);
  const results = await Promise.all(cells.map(async ({ bbox: cellBbox, center }) => {
    const count = await getTreeFeatureCount({
      cqlFilter,
      bbox: cellBbox,
      signal,
    });
    return { count, center };
  }));

  return results
    .filter(({ count, center }) => count > 0 && isInsideNashikBoundary(center, boundaryFeatures))
    .map(({ count, center }, index) => ({
      type: 'Feature',
      id: `tree-grid-${index}-${center.join('-')}`,
      geometry: { type: 'Point', coordinates: toLonLat(center) },
      properties: { clusterCount: count, aggregation: 'server-grid' },
    }));
}

export default function MapView({ filters, viewMode = 'normal', onMapClick, onMapReady }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const clickHandlerRef = useRef(onMapClick);
  const viewModeRef = useRef(viewMode);

  useEffect(() => { clickHandlerRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  useEffect(() => {
    if (!ref.current) return;
    const instance = createMap(ref.current);
    mapRef.current = instance;
    onMapReady?.(instance.map);

    const handleClick = (evt) => {
      if (viewModeRef.current === 'cluster') {
        const clusterFeature = instance.map.forEachFeatureAtPixel(
          evt.pixel,
          (feature) => feature,
          { hitTolerance: 4 },
        );
        const members = clusterFeature?.get('features') || [];
        const memberCount = members.reduce(
          (sum, member) => sum + Number(member.get('data')?.properties?.clusterCount || 1),
          0,
        );
        if (memberCount > 1) {
          const currentZoom = instance.map.getView().getZoom() || 12;
          instance.map.getView().animate({
            center: clusterFeature.getGeometry().getCoordinates(),
            zoom: Math.min(currentZoom + 2, 19),
            duration: 350,
          });
          return;
        }
      }

      const view = instance.map.getView();
      const source = instance.layers.trees.getSource();
      const url = getFeatureInfoUrl(
        source,
        evt.coordinate,
        view.getResolution(),
        view.getProjection().getCode(),
        { FEATURE_COUNT: '50', BUFFER: '10' },
      );
      clickHandlerRef.current?.({
        coordinate: evt.coordinate,
        url,
        map: instance.map,
        layers: instance.layers,
      });
    };

    instance.map.on('singleclick', handleClick);

    const updateDistance = () => {
      if (viewModeRef.current === 'cluster') {
        updateClusterDistance(
          instance.layers.clusters,
          instance.map.getView().getZoom(),
        );
      }
    };

    instance.map.getView().on('change:resolution', updateDistance);
    updateDistance();

    return () => {
      instance.map.un('singleclick', handleClick);
      instance.map.getView().un('change:resolution', updateDistance);
      instance.map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = mapRef.current;
    if (!instance) return;

    const cqlFilter = getCqlFilter(filters);
    const treeLayer = instance.layers.trees;
    const clusterLayer = instance.layers.clusters;

    treeLayer.setVisible(viewMode === 'normal');
    clusterLayer.setVisible(viewMode === 'cluster');
    treeLayer.getSource().updateParams(getTreeWmsSourceParams(cqlFilter));

    if (viewMode !== 'cluster') {
      clearClusterFeatures(clusterLayer);
      return undefined;
    }

    const controller = new AbortController();
    let requestSequence = 0;
    let refreshTimer = null;

    const loadClusterData = async () => {
      if (controller.signal.aborted) return;

      const size = instance.map.getSize();
      if (!size || size[0] <= 0 || size[1] <= 0) return;

      const view = instance.map.getView();
      const bbox = view.calculateExtent(size);
      const sequence = ++requestSequence;

      try {
        const boundaryFeatures = instance.layers.kml.getSource().getFeatures();
        if (boundaryFeatures.length === 0) return;

        const totalCount = await getTreeFeatureCount({
          cqlFilter,
          bbox,
          signal: controller.signal,
        });

        let features;
        if (totalCount <= DIRECT_TREE_THRESHOLD) {
          const result = await getTreeFeatures({
            cqlFilter,
            bbox,
            limit: CLUSTER_FEATURE_LIMIT,
            signal: controller.signal,
          });
          features = result.features || [];
        } else {
          features = await getServerAggregatedTreeFeatures({
            cqlFilter,
            bbox,
            signal: controller.signal,
            boundaryFeatures: instance.layers.kml.getSource().getFeatures(),
          });
        }

        if (controller.signal.aborted || sequence !== requestSequence) return;
        setClusterFeatures(clusterLayer, features);
      } catch (error) {
        if (controller.signal.aborted || sequence !== requestSequence) return;
        clearClusterFeatures(clusterLayer);
        console.error('Cluster WFS loading failed:', error);
      }
    };

    const handleMoveEnd = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(loadClusterData, 150);
    };

    const boundarySource = instance.layers.kml.getSource();
    const handleBoundaryChange = () => {
      if (boundarySource.getFeatures().length > 0) loadClusterData();
    };

    instance.map.on('moveend', handleMoveEnd);
    boundarySource.on('change', handleBoundaryChange);
    loadClusterData();

    return () => {
      window.clearTimeout(refreshTimer);
      controller.abort();
      instance.map.un('moveend', handleMoveEnd);
      boundarySource.un('change', handleBoundaryChange);
    };
  }, [filters, viewMode]);

  return <div ref={ref} className="map-view" />;
}

