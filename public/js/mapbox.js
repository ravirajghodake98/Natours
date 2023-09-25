// Get locations from HTML
// showing error as cannot read properties of dataset bcoz we appended the script in tour.pug file at starting and hence,
// DOM is not loaded yet, so we need to define it at the bottom of the file

//this line will be added to index.js file
// const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log(locations);

//function to do all of the stuff; it will take in the array of all locations
export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoicmF2aXJhamdob2Rha2U5OCIsImEiOiJjbGx6NDZqdXEwdzgzM2RzeWY4bTNiYmQ1In0.tYFL2w0NrrDkNuwHd503UA';
  var map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/mapbox/streets-v11',
    style: 'mapbox://styles/ravirajghodake98/cllz4ztle00n401nz25rb8rkn',
    scrollZoom: false
    // center: [-118, 34],
    // zoom: 5,
    // interactive: false
  });

  //this bounds object is basically the area that will be displayed on the map
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //Create a marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add a marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'    //point where our marker will attach on screen
    }).setLngLat(loc.coordinates).addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 35,  //since the marker and popup are overlapping each other
      focusAfterOpen: false,
    }).setLngLat(loc.coordinates).setHTML(`<p> Day ${loc.day}: ${loc.description}</p>`).addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  })

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 100,
      left: 100,
      right: 100
    }
  });
}


// mapboxgl.accessToken = 'pk.eyJ1IjoicmF2aXJhamdob2Rha2U5OCIsImEiOiJjbGx6NDZqdXEwdzgzM2RzeWY4bTNiYmQ1In0.tYFL2w0NrrDkNuwHd503UA';
// var map = new mapboxgl.Map({
//   container: 'map',
//   // style: 'mapbox://styles/mapbox/streets-v11',
//   style: 'mapbox://styles/ravirajghodake98/cllz4ztle00n401nz25rb8rkn',
//   scrollZoom: false
//   // center: [-118, 34],
//   // zoom: 5,
//   // interactive: false
// });

// //this bounds object is basically the area that will be displayed on the map
// const bounds = new mapboxgl.LngLatBounds();

// locations.forEach(loc => {
//   //Create a marker
//   const el = document.createElement('div');
//   el.className = 'marker';

//   // Add a marker
//   new mapboxgl.Marker({
//     element: el,
//     anchor: 'bottom'    //point where our marker will attach on screen
//   }).setLngLat(loc.coordinates).addTo(map);

//   // Add popup
//   new mapboxgl.Popup({
//     offset: 35,  //since the marker and popup are overlapping each other
//     focusAfterOpen: false,
//   }).setLngLat(loc.coordinates).setHTML(`<p> Day ${loc.day}: ${loc.description}</p>`).addTo(map);

//   // Extend map bounds to include current location
//   bounds.extend(loc.coordinates);
// })

// map.fitBounds(bounds, {
//   padding: {
//     top: 200,
//     bottom: 100,
//     left: 100,
//     right: 100
//   }
// });