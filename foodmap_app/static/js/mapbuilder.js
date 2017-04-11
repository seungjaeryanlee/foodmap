/*
 * mapbuilder.js
 *
 * This script loads, populates, and defines the behavior of the map
 * interface.
 */

 $(document).ready(function() {

    // Initialize the map
    var map = L.map('map').setView([40.345129502014764, -74.65826869010927], 17);
    map.setMaxZoom(17).setMinZoom(16);
    //map.setMaxBounds([[40.33761, -74.67769], [40.350697, -74.64053]]);

    L.control.locate({options:{
        setView: 'untilPan',
        icon: 'icon-location',
    }}).addTo(map);
    // L.Control.extend();


    // Load a tile layer
    layers = {}
    layers.tiles = L.tileLayer('https://api.mapbox.com/styles/v1/bnprks/cizxah1p6003n2rs6zu65xd7i/tiles/256/{z}/{x}/{y}?access_token={accessToken}',
    {
      accessToken:'pk.eyJ1IjoiYm5wcmtzIiwiYSI6ImNqMHVpaHBndjA2NG0zMnFheG5kbG5wa3AifQ.Cypl8hCriRSkA4XF-4GgMQ',
      attribution: 'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
      id: 'bnprks.9754e7af',
      maxZoom: 17,
      minZoom: 9
  }).addTo(map);

    /*------------------------------------------------------------------------*/

    // Pull locations and their GPS coordinates from the database, store in 'places'

    var offerings = {
        "type": "FeatureCollection",
        "features": []
    };

    $.ajax({
        url: document.URL + 'offerings',
        async: false,
        success: function(result) {
            // Parse JSON response and fill in places.features with location names
            // and GPS coordinates
            var response_offerings = JSON.parse(result);
            for (i = 0; i < response_offerings.length; i++) {
                // Each feature has mostly standard parameters. We set 'coordinates'
                // (GPS coordinates), 'popupContent' (text that appears in a
                // popup window), and 'id' (which just needs to be a unique integer).
               offerings.features.push({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        // NOTE: The format for the coordinates is LONGITUDE, LATITUDE
                        // (backwards from the norm). This is DUMB! But ugh such is life.
                        parseFloat(response_offerings[i].location.lng), parseFloat(response_offerings[i].location.lat)
                    ]
                },
                "properties": {
                    "popupContent": response_offerings[i].title + '\n' + response_offerings[i].minutes + " minutes old",  // by default this is just location's name
                    "extra": response_offerings[i].description
                },
                "id": i
            });
           }
       }
   });

    /*------------------------------------------------------------------------*/

    // Create and define behavior of markers

    // On mouse hover
    function onSetHover(e) {
        var marker = e.target;
        marker.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
        this.openPopup();
    }

    // On removing mouse hover
    function onRemoveHover(e) {
        var marker = e.target;
        layers.offerings.resetStyle(marker);
        this.closePopup();
    }

    layers.offerings = L.geoJSON(offerings, {
        style: function (feature) {
            return feature.properties && feature.properties.style;
        },

        onEachFeature: function (feature, layer) {
            // Adds mouse hover/click listeners and sets the marker's popup window
            // content. The parameter 'feature' passed in is one of the feature
            // objects in 'places', defined in the last section.
            var popupContent = feature.properties.popupContent;
            layer.bindPopup(popupContent, {closeButton: false, autoPan: false});
            layer.on({
                'mouseover': onSetHover,
                'mouseout': onRemoveHover,
                'click': function(){alert(feature.properties.extra);}
            });
        },

        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 0.2,
                opacity: 0.5,
                fillOpacity: 0.4
            });
        }
    }).addTo(map);

});