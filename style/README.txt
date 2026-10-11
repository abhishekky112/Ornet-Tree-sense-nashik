Nashik Tree Census - Local GeoServer Normal Style
====================================================

Package contents
----------------
nashikTrees.sld
    Localized copy of the Ornet nashikTrees SLD. The original absolute
    C:/inetpub/... image paths have been changed to relative filenames.

download-images.ps1
    Downloads the exact five PNG icons from the Ornet GeoServer.

download-images.bat
    Double-click this on Windows to run the PowerShell downloader.

images/
    The five PNG files will be placed here after running the downloader.

Required icon files
-------------------
treecut.png
dangerous.png
yellow.png
exotic.png
tree-icon.png

Install on local GeoServer (port 8001)
---------------------------------------
1. Run download-images.bat on a Windows machine that can reach:
   https://www.ornettreecensus.com/geoserver/

2. Find your GeoServer data directory. Inside it, open:
   styles/

3. Copy these five downloaded PNG files into:
   <GEOSERVER_DATA_DIR>\styles\

4. In GeoServer:
   http://localhost:8001/geoserver

   Go to:
   Styles -> Add a new style

5. Workspace:
   nashiktreecensus

   Style name:
   nashikTrees

6. Upload:
   nashikTrees.sld

7. Save/validate the style.

8. Go to:
   Layers -> nashiktreecensus

   Set the default style to:
   nashikTrees

9. Save and open Layer Preview.

Important
---------
The exact PNGs could not be downloaded into this package from this execution
environment because the Ornet domain was not reachable from the environment.
The downloader script uses the exact filenames and public GeoServer styles
directory so your Windows machine can retrieve the original files directly.

Do NOT change the five image filenames. The SLD references them by filename.
