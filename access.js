function initMap() {
 // var myLatlng = {lat: -25.363, lng: 131.044};
  //var temp = 0;
  var markers = []

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: myLatlng//fix this
  });

  //database name, version number, text description, approximate size
  //see http://html5doctor.com/introducing-web-sql-databases/
  var db = openDatabase('foodmap_app_offering', '1.0', 'my first database', 2 * 1024 * 1024);
  var db2 = openDatabase('foodmap_app_location', '1.0', 'my second database', 2 * 1024 * 1024);
  db.transaction(function(tx) {
    tx.executeSql('SELECT title, description, image from foodmap_app_offering WHERE TIMEDIFF(NOW(), timestamp) < 3', [], function(tx, results) {
      var len = results.rows.length, i;
      for (i = 0; i < len; i++) {
        db2.transaction(function(tx2) {
          tx2.executeSql('SELECT lat, lng from foodmap_app_location WHERE id = '+results.rows.item(i).location_id, [], function(tx2, results2) {
        var marker = new google.maps.Marker({
          position: {lat: results2.rows.item(0), lng: results2.rows.item(1)},
          map: map,
          title: 'FoodMap'
        });
        var temp = results.rows.item(i);
        marker.addListener('click', function() {
          alert(temp.title+'\n'+
            temp.description
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