/*
 * mapbuilder.js
 *
 * This script loads, populates, and defines the behavior of the map
 * interface.
 */

 $(document).ready(function() {

    // Initialize the map
    var map = L.map('map');
    map.setMaxZoom(18).setMinZoom(14);
    map.setView([40.345129502014764, -74.65826869010927], 16);
    //map.setMaxBounds([[40.33761, -74.67769], [40.350697, -74.64053]]);

    L.control.locate({options:{
        setView: 'untilPan'
    }}).addTo(map);



    // Load a tile layer
    layers = {}
    layers.tiles = L.tileLayer('https://api.mapbox.com/styles/v1/bnprks/cizxah1p6003n2rs6zu65xd7i/tiles/256/{z}/{x}/{y}?access_token={accessToken}',
    {
      accessToken:'pk.eyJ1IjoiYm5wcmtzIiwiYSI6ImNqMHVpaHBndjA2NG0zMnFheG5kbG5wa3AifQ.Cypl8hCriRSkA4XF-4GgMQ',
      attribution: 'Tiles by <a href="http://mapc.org">MAPC</a>, Data by <a href="http://mass.gov/mgis">MassGIS</a>',
      id: 'bnprks.9754e7af',
      maxZoom: 18,
      minZoom: 14
  }).addTo(map);

    /*------------------------------------------------------------------------*/

    // Pull latest offerings from database, store in 'offerings'

    function pullOfferings() {
        var offerings = {
            "type": "FeatureCollection",
            "features": [],
            "error": false   // this is set to true to indicate a failure to retrieve offerings
        };

        // Helper function: Returns HTML for a div.popup-content with the popup
        // content for a given offering object in the format returned by url
        // /offerings/.
        function makePopupContent(offering) {
            ret = '<div class="' + "popup-content" + '"><p><b>' + offering.location.name + '</b>';
            var realret = [];
            realret.push(ret);
            for (i = 0; i < offering.offerings.length; i++) {
                minutes_string = (offering.offerings[i].minutes > 60? '1 hour, '+(offering.offerings[i].minutes-60): offering.offerings[i].minutes) + (offering.offerings[i].minutes%60 == 1? ' minute old': ' minutes old');
                realret.push('<br><i>' + offering.offerings[i].title + '</i><br>' + minutes_string + '<br>');
                realret.push('<p>' + offering.offerings[i].description + '</p><hr>');
            }
            return  realret;
        }

        function makeExtraContent(offering) {
            ret = '<div class="' + "popup-content" + '"><p><b>' + offering.location.name + '</b><br>';
            for (i = 0; i < offering.offerings.length; i++) {
                minutes_string = (offering.offerings[i].minutes > 60? '1 hour, '+(offering.offerings[i].minutes-60): offering.offerings[i].minutes) + (offering.offerings[i].minutes%60 == 1? ' minute old': ' minutes old');
                ret += '<i>' + offering.offerings[i].title + '</i><br>' + minutes_string + '</p>'
                ret += '<br><p>' + offering.offerings[i].description + '</p>'
            }
            return  ret + '</div>';
        }

        $.ajax({
            url: document.URL + 'offerings',
            async: false,
            timeout: 5000,
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
                            "popupContent": makePopupContent(response_offerings[i]),
                            "extra": ""//makeExtraContent(response_offerings[i])
                        },
                        "id": i
                    });
                }
            },

            error: function() {
                offerings.error = true;
            }
        });

        return offerings;
    }

    var offerings = pullOfferings();
    // TODO: Make nicer looking alert messages built into the UI
    if (offerings.error) {
        // alert('Oops! We could not get the free food offerings!');
    }
    if (offerings.features.length == 0) {
        //alert("There is currently no free food available. Sorry!");
    }

    /*------------------------------------------------------------------------*/

    // Create and define behavior of markers

    var marker = {  // container variable for marker properties
        icon: icons.fork_and_knife,
        width: 32,
        height: 37,
        default_opacity: 0.7,
        hover_opacity: 1.0
    };

    // On mouse hover
    function onSetHover(e) {
        this.setOpacity(marker.hover_opacity);
        this.openPopup();
    }

    // On removing mouse hover
    function onRemoveHover(e) {
        this.setOpacity(marker.default_opacity);
        this.closePopup();
    }

  var sidebar = L.control.sidebar('sidebar', {
        closeButton: true,
        position: 'left'
    });
  map.addControl(sidebar);

    // Place markers on map
    function placeMarkers() {
        layers.offerings = L.geoJSON(offerings, {
            style: function (feature) {
                return feature.properties && feature.properties.style;
            },

            onEachFeature: function (feature, layer) {
                // Adds mouse hover/click listeners and sets the marker's popup window
                // content. The parameter 'feature' passed in is one of the feature
                // objects in 'places', defined in the last section.
                var popupContent = feature.properties.popupContent[0];
                for (i = 1; i < feature.properties.popupContent.length; i = i + 2)
                    popupContent += feature.properties.popupContent[i];
                layer.bindPopup(popupContent, {closeButton: false, autoPan: false});
                layer.on({
                    'mouseover': onSetHover,
                    'mouseout': onRemoveHover,
                    'click': function() { 
                        var sidebarContent = feature.properties.popupContent[0];
                        for (i = 1; i < feature.properties.popupContent.length; i++)
                            sidebarContent += feature.properties.popupContent[i];
                        sidebar.setContent(sidebarContent); sidebar.show(); }
                 });
            },

            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    icon: L.icon({
                      iconUrl: marker.icon,
                      iconSize: [marker.width, marker.height],
                      iconAnchor: [marker.width / 2, marker.height],  // rel to top-left
                      popupAnchor: [0, -marker.height]  // rel to iconAnchor
                    }),
                    opacity: marker.default_opacity,
                    riseOnHover: true
                });
            }
        }).addTo(map);
    }

    placeMarkers();

    // Update markers every minute
    setInterval(function() {
        offerings = pullOfferings();
        if (!offerings.error) {
            map.removeLayer(layers.offerings);
            placeMarkers();
        } else {
            console.log('Failed to update markers. Retaining the old markers.');
        }
    }, 60000);

});