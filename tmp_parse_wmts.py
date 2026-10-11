import xml.etree.ElementTree as ET
p=r"C:\Users\lenovo\AppData\Local\Temp\nashik_wmts.xml"
root=ET.parse(p).getroot()
ns={"ows":"http://www.opengis.net/ows/1.1","wmts":"http://www.opengis.net/wmts/1.0"}
for layer in root.findall(".//wmts:Layer",ns):
    ident=layer.find("ows:Identifier",ns)
    if ident is not None and ident.text=="nashiktreecensus:nashiktreecensus":
        print("LAYER", ident.text)
        print("STYLES")
        for s in layer.findall("wmts:Style",ns):
            sid=s.find("ows:Identifier",ns)
            print(" ", sid.text if sid is not None else "")
        print("FORMATS",[e.text for e in layer.findall("wmts:Format",ns)])
        print("TILEMATRIXSETS",[e.text for e in layer.findall("wmts:TileMatrixSetLink/wmts:TileMatrixSet",ns)])
