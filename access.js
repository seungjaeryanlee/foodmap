function initMap() {
  var roughLatlng = {lat: 40.350052, lng: -74.652147};
  //var temp = 0;
  var markers = []

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: roughLatlng
  });

//see https://developers.google.com/maps/documentation/javascript/examples/map-geolocation#try-it-yourself
  if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            map.setCenter(pos);
          }, function() {
            //do nothing
          });
        } else {
          // Browser doesn't support Geolocation
          //let the user find the right spot
        }
      }

  //database name, version number, text description, approximate size
  //see http://html5doctor.com/introducing-web-sql-databases/
  var db = openDatabase('foodmap_app_offering', '1.0', 'main database', 4 * 128 * 32);
  var db2 = openDatabase('foodmap_app_location', '1.0', 'locations', 8 * 256 * 32);
  db.transaction(function(tx) {
    tx.executeSql('SELECT title, description, image from foodmap_app_offering WHERE TIMEDIFF(NOW(), timestamp) < 3', [], function(tx, results) {
      var len = results.rows.length, i;
      for (i = 0; i < len; i++) {
        db2.transaction(function(tx2) {
          tx2.executeSql('SELECT lat, lng from foodmap_app_location WHERE id = '+results.rows.item(i).location_id, [], function(tx2, results2) {
        var temp = results.rows.item(i);
        var marker = new google.maps.Marker({
          position: {lat: results2.rows.item(0).lat, lng: results2.rows.item(0).lng},
          map: map,
          title: temp.title
        });
        marker.addListener('click', function() {
          alert(temp.description
            +(temp.image == null? '': '\n'+temp.image));
        })
        markers.push(marker);
          })
        })
      }
    });
  });

  //see https://jsfiddle.net/api/post/library/pure/
  /*var marker = new google.maps.Marker({
    position: myLatlng,
    map: map,
    title: 'Click to zoom'
  });

  map.addListener('center_changed', function() {
    // 3 seconds after the center of the map has changed, pan back to the
    // marker.
    window.setTimeout(function() {
      map.panTo(marker.getPosition());
    }, 3000);
  });

  marker.addListener('click', function() {
  	if (temp == 0) {
    	map.setZoom(8);
			temp = 1;
	}
  else {
  temp = 0;
  map.setZoom(0);
  }
    map.setCenter(marker.getPosition());
  });*/
}
