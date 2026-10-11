<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
    xmlns:sld="http://www.opengis.net/sld"
    xmlns:ogc="http://www.opengis.net/ogc"
    version="1.0.0">
  <sld:NamedLayer>
    <sld:Name>nashiktreecensus:nashiktreecensus</sld:Name>
    <sld:UserStyle>
      <sld:Name>nashikTrees3D_v2</sld:Name>
      <sld:Title>Nashik Trees - 3D LOD v2</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:VendorOption name="vt-attributes">TreeCensusCd,Height,Girth,Canopy,Specie,LocalName,HealthCondition,IsHeritageTree</sld:VendorOption>
        <sld:Rule>
          <sld:Name>Far - Important Trees</sld:Name>
          <sld:MaxScaleDenominator>100000</sld:MaxScaleDenominator>
          <ogc:Filter>
            <ogc:Or>
              <ogc:PropertyIsEqualTo><ogc:PropertyName>IsHeritageTree</ogc:PropertyName><ogc:Literal>Yes</ogc:Literal></ogc:PropertyIsEqualTo>
              <ogc:PropertyIsEqualTo><ogc:PropertyName>HealthCondition</ogc:PropertyName><ogc:Literal>Dead</ogc:Literal></ogc:PropertyIsEqualTo>
              <ogc:PropertyIsEqualTo><ogc:PropertyName>HealthCondition</ogc:PropertyName><ogc:Literal>Dangerous</ogc:Literal></ogc:PropertyIsEqualTo>
            </ogc:Or>
          </ogc:Filter>
          <sld:PointSymbolizer><sld:Graphic><sld:Mark><sld:WellKnownName>circle</sld:WellKnownName><sld:Fill/><sld:Stroke/></sld:Mark><sld:Size>6</sld:Size></sld:Graphic></sld:PointSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:Name>Medium - Individual Trees</sld:Name>
          <sld:MinScaleDenominator>25000</sld:MinScaleDenominator>
          <sld:MaxScaleDenominator>100000</sld:MaxScaleDenominator>
          <sld:PointSymbolizer><sld:Graphic><sld:Mark><sld:WellKnownName>circle</sld:WellKnownName><sld:Fill/><sld:Stroke/></sld:Mark><sld:Size>5</sld:Size></sld:Graphic></sld:PointSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:Name>Close - Detailed Trees</sld:Name>
          <sld:MaxScaleDenominator>25000</sld:MaxScaleDenominator>
          <sld:PointSymbolizer><sld:Graphic><sld:Mark><sld:WellKnownName>circle</sld:WellKnownName><sld:Fill/><sld:Stroke/></sld:Mark><sld:Size>4</sld:Size></sld:Graphic></sld:PointSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>
</sld:StyledLayerDescriptor>