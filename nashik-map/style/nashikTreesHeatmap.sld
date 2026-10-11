<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
    xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"
    xmlns="http://www.opengis.net/sld"
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>nashikTreesHeatmap</Name>
    <UserStyle>
      <Name>nashikTreesHeatmap</Name>
      <Title>Nashik Tree Density Heatmap</Title>
      <Abstract>Server-side heatmap of Nashik tree census points. Every tree contributes equally.</Abstract>

      <FeatureTypeStyle>
        <Transformation>
          <ogc:Function name="vec:Heatmap">
            <ogc:Function name="parameter">
              <ogc:Literal>data</ogc:Literal>
            </ogc:Function>

            <!-- No weightAttr: Heatmap defaults each point to weight 1. -->

            <ogc:Function name="parameter">
              <ogc:Literal>radiusPixels</ogc:Literal>
              <ogc:Function name="env">
                <ogc:Literal>radius</ogc:Literal>
                <ogc:Literal>35</ogc:Literal>
              </ogc:Function>
            </ogc:Function>

            <ogc:Function name="parameter">
              <ogc:Literal>pixelsPerCell</ogc:Literal>
              <ogc:Function name="env">
                <ogc:Literal>pixelsPerCell</ogc:Literal>
                <ogc:Literal>8</ogc:Literal>
              </ogc:Function>
            </ogc:Function>

            <ogc:Function name="parameter">
              <ogc:Literal>outputBBOX</ogc:Literal>
              <ogc:Function name="env">
                <ogc:Literal>wms_bbox</ogc:Literal>
              </ogc:Function>
            </ogc:Function>

            <ogc:Function name="parameter">
              <ogc:Literal>outputWidth</ogc:Literal>
              <ogc:Function name="env">
                <ogc:Literal>wms_width</ogc:Literal>
              </ogc:Function>
            </ogc:Function>

            <ogc:Function name="parameter">
              <ogc:Literal>outputHeight</ogc:Literal>
              <ogc:Function name="env">
                <ogc:Literal>wms_height</ogc:Literal>
              </ogc:Function>
            </ogc:Function>
          </ogc:Function>
        </Transformation>

        <Rule>
          <RasterSymbolizer>
            <!-- Input geometry attribute is required for SLD validation. -->
            <Geometry>
              <ogc:PropertyName>geom</ogc:PropertyName>
            </Geometry>
            <Opacity>0.72</Opacity>
            <ColorMap type="ramp">
              <ColorMapEntry color="#FFFFFF" quantity="0" label="No density" opacity="0"/>
              <ColorMapEntry color="#EAF2FF" quantity="0.02" label="Very low" opacity="0"/>
              <ColorMapEntry color="#72A7FF" quantity="0.12" label="Low"/>
              <ColorMapEntry color="#35C76F" quantity="0.30" label="Medium"/>
              <ColorMapEntry color="#FFD43B" quantity="0.52" label="High"/>
              <ColorMapEntry color="#FF7A00" quantity="0.75" label="Very high"/>
              <ColorMapEntry color="#D21E1E" quantity="1.0" label="Extreme"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
