

// 🛰️ Satellite base layer using Esri imagery
  const satelliteLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Tiles © Esri'
    })
  });

  const treeLayer = new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'http://localhost:9090/geoserver/tree_data/wms',
      params: {
        'LAYERS': 'tree_data:aa',
        'TILED': true,
        'FORMAT': 'image/png',
        'TRANSPARENT': true,
        'VERSION': '1.1.0',
        'CRS': 'EPSG:3857',
        'CQL_FILTER': null 
      },
      serverType: 'geoserver',
      transition: 0
    }),
    opacity: 0.7  
  });
  

  // ✅ Initialize map
  const map = new ol.Map({
    target: 'map',
    layers: [satelliteLayer, treeLayer],
    view: new ol.View({
      center: ol.proj.fromLonLat([75.90, 22.71]),
      zoom: 14
    })
  });

  // ✅ Get total tree count from WFS
  function fetchTotalTreeCount() {
    const url = `http://localhost:9090/geoserver/tree_data/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=tree_data:aa&resultType=hits`;

    fetch(url)
      .then(response => response.text())
      .then(xmlText => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const count = xmlDoc.documentElement.getAttribute("numberOfFeatures");
        document.getElementById('featureCount').textContent = `🌳 Total Trees: ${count}`;
        console.log(`🌳 Total Trees: ${count}`);
      })
      .catch(err => {
        console.error("Error fetching tree count:", err);
        document.getElementById('featureCount').textContent = "Error loading count!";
      });
  }

  // ✅ Initial call
  fetchTotalTreeCount();

  const popup = new ol.Overlay({
    element: document.getElementById('popup'),
    positioning: 'bottom-center',
    stopEvent: true,
    offset: [0, -20]
  });
  map.addOverlay(popup);
  
  function showPopup(coord, htmlContent) {
    const content = document.getElementById('popup-content');
    content.innerHTML = htmlContent;
    popup.setPosition(coord);
  }

  map.on('singleclick', function (evt) {
    const viewResolution = map.getView().getResolution();
    const url = treeLayer.getSource().getFeatureInfoUrl(
      evt.coordinate,
      viewResolution,
      'EPSG:3857',
      {
        'INFO_FORMAT': 'application/json',
        'FEATURE_COUNT': 50 // ⬅️ Return up to 50 features in case of overlap
      }
    );
  
    if (url) {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.features.length > 0) {
            // 🌳 Aggregate all tree info
            let html = `<h3>🌲 ${data.features.length} Tree(s) found:</h3><ul>`;
            data.features.forEach((feature, idx) => {
              const props = feature.properties;
              html += `
                <li>
                  <strong>${idx + 1}. ${props.LocalName || 'Unknown Tree'}</strong><br>
                  UID: ${props.Tree_UID}<br>
                  Lat/Lon: ${props.Latitude}, ${props.Longitude}<br>
                  Species: ${props.Specie}<br>
                  Girth: ${props.Girth}, Height: ${props.Height}<br>
                  Age Group: ${props.AgeG}
                </li>
                <hr>
              `;
            });
            html += "</ul>";
  
            // 🧩 Show it in a simple popup (or panel)
            showPopup(evt.coordinate, html);
          } else {
            showPopup(evt.coordinate, "No trees found at this location.");
          }
        })
        .catch(err => {
          console.error("Feature info error:", err);
        });
    }
  });
  



  
//     // filter Data ---------------------------------------------------------
//     function onFilterApply() {
//       const species = document.getElementById('speciesSelect').value;
//       const ageGroup = document.getElementById('ageSelect').value;
//       const localName = document.getElementById('LocalName').value;

//       let filters = [];

//       if (species) {
//         filters.push(`Specie='${species}'`);
//       }
//       if (ageGroup) {
//         filters.push(`AgeGroup='${ageGroup}'`);
//       }
//       if (localName) {
//         filters.push(`LocalName='${localName}'`);
//       }

//       const cqlFilter = filters.length > 0 ? filters.join(" AND ") : null;

//       console.log("🔍 Applying CQL Filter:", cqlFilter);

//       treeLayer.getSource().updateParams({
//         'CQL_FILTER': cqlFilter
//       });

//       // Optional: update tree count based on filter
//       fetchFilteredTreeCount(cqlFilter);
//     }

// function fetchFilteredTreeCount(cqlFilter) {
//   const baseUrl = `http://localhost:9090/geoserver/tree_data/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=tree_data:aa&resultType=hits`;
//   const url = cqlFilter ? `${baseUrl}&CQL_FILTER=${encodeURIComponent(cqlFilter)}` : baseUrl;

//   fetch(url)
//     .then(response => response.text())
//     .then(xmlText => {
//       const parser = new DOMParser();
//       const xmlDoc = parser.parseFromString(xmlText, "text/xml");
//       const count = xmlDoc.documentElement.getAttribute("numberOfFeatures");
//       document.getElementById('featureCount').textContent = `🌳 Total Trees: ${count}`;
//     })
//     .catch(err => {
//       console.error("Error fetching filtered count:", err);
//       document.getElementById('featureCount').textContent = "Error loading count!";
//     });
// }



//   // filter Data ---------------------------------------------------------
  
//   // 🛰️ Satellite base layer using Esri imagery
//     const satelliteLayer = new ol.layer.Tile({
//       source: new ol.source.XYZ({
//         url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
//         attributions: 'Tiles © Esri'
//       })
//     });

//     const treeLayer = new ol.layer.Tile({
//       source: new ol.source.TileWMS({
//         url: 'http://localhost:9090/geoserver/tree_data/wms',
//         params: {
//           'LAYERS': 'tree_data:aa',
//           'TILED': true,
//           'FORMAT': 'image/png',
//           'TRANSPARENT': true,
//           'VERSION': '1.1.0',
//           'CQL_FILTER': null  // Initially no filter
//         },
//         serverType: 'geoserver',
//         transition: 0
//       }),
//       opacity: 0.8
//     });
    

//     // ✅ Initialize map
//     const map = new ol.Map({
//       target: 'map',
//       layers: [satelliteLayer, treeLayer],
//       view: new ol.View({
//         center: ol.proj.fromLonLat([75.90, 22.71]),
//         zoom: 12
//       })
//     });

//     // ✅ Get total tree count from WFS
//     function fetchTotalTreeCount() {
//       const url = `http://localhost:9090/geoserver/tree_data/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=tree_data:aa&resultType=hits`;

//       fetch(url)
//         .then(response => response.text())
//         .then(xmlText => {
//           const parser = new DOMParser();
//           const xmlDoc = parser.parseFromString(xmlText, "text/xml");
//           const count = xmlDoc.documentElement.getAttribute("numberOfFeatures");
//           document.getElementById('featureCount').textContent = `🌳 Total Trees: ${count}`;
//           console.log(`🌳 Total Trees: ${count}`);
//         })
//         .catch(err => {
//           console.error("Error fetching tree count:", err);
//           document.getElementById('featureCount').textContent = "Error loading count!";
//         });
//     }

//     // ✅ Initial call
//     fetchTotalTreeCount();

//     const popup = new ol.Overlay({
//       element: document.getElementById('popup'),
//       positioning: 'bottom-center',
//       stopEvent: true,
//       offset: [0, -20]
//     });
//     map.addOverlay(popup);
    


//     // Create popup element if not already present
//     const popupElement = document.createElement("div");
//     popupElement.id = "popup";
//     popupElement.style.position = "absolute";
//     popupElement.style.background = "white";
//     popupElement.style.padding = "10px";
//     popupElement.style.border = "1px solid #ccc";
//     popupElement.style.borderRadius = "8px";
//     popupElement.style.minWidth = "500px";
//     popupElement.style.height = "400px";
//     popupElement.style.overflow = "scroll";
//     popupElement.style.zIndex = 1000;
//     popupElement.style.display = "none";
//     popupElement.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
//     document.body.appendChild(popupElement);

//     // Show popup at screen position
//     function showPopup(coordinate, content) {
//       const pixel = map.getPixelFromCoordinate(coordinate);
//       popupElement.innerHTML = `
//         <div style="text-align:right;">
//           <button onclick="hidePopup()" style="background:#transparent; color:white; border:none; border-radius:3px; padding:2px 5px; cursor:pointer;">❌</button>
//         </div>
//         ${content}
//       `;
//       popupElement.style.left = `${pixel[0] + 10}px`;
//       popupElement.style.top = `${pixel[1] + 10}px`;
//       popupElement.style.display = "block";
//     }

//     function hidePopup() {
//       popupElement.style.display = "none";
//     }



//     map.on('singleclick', function (evt) {
//       const viewResolution = map.getView().getResolution();
//       const url = treeLayer.getSource().getFeatureInfoUrl(
//         evt.coordinate,
//         viewResolution,
//         'EPSG:3857',
//         {
//           'INFO_FORMAT': 'application/json',
//           'FEATURE_COUNT': 50
//         }
//       );

//       if (url) {
//         fetch(url)
//           .then(response => response.json())
//           .then(data => {
//             if (data.features.length > 0) {
//               let html = `
//                 <h3 style="margin-bottom: 10px;">🌲 ${data.features.length} Tree(s):</h3>
//                 <ul style="list-style: none; padding: 0; margin: 0;">
//               `;

//               data.features.forEach((feature, idx) => {
//                 const props = feature.properties;
//                 html += `
//                   <li style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
//                     <strong style="font-size: 16px; color: #2e7d32;">${idx + 1}. ${props.LocalName || 'Unknown Tree'}</strong>
//                     <div style="display: flex; gap: 10px; margin-top: 5px;">
//                       <div><img src="${props.TreePhoto}" alt="Tree Image" style="width: 60px; height: 60px; border-radius: 4px;"></div>
//                       <div style="flex: 1;">
//                         <div style="margin-bottom: 4px;"><strong>UID:</strong> ${props.Tree_UID}</div>
//                         <div style="display: flex; justify-content: space-between;">
//                           <div><strong>Species:</strong> ${props.Specie}</div>
//                           <div><strong>Age Group:</strong> ${props.AgeGroup}</div>
//                         </div>
//                         <div style="display: flex; justify-content: space-between; margin-top: 4px;">
//                           <div><strong>Heritage Tree:</strong> ${props.IsHeritageTree}</div>
//                           <div><strong>Girth:</strong> ${props.Girth}</div>
//                           <div><strong>Height:</strong> ${props.Height}</div>
//                           <div><strong>Canopy:</strong> ${props.Canopy}</div>
//                         </div>
//                       </div>
//                     </div>
//                   </li>
//                 `;
//               });

//               html += "</ul>";


//               showPopup(evt.coordinate, html);
//             } else {
//               hidePopup(); // 👈 Hide popup if no trees found
//             }
//           })
//           .catch(err => {
//             console.error("Feature info error:", err);
//             hidePopup(); // 👈 Hide popup on error too
//           });
//       } else {
//         hidePopup();
//       }
//     });
