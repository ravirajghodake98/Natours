export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoicmF2aXJhamdob2Rha2U5OCIsImEiOiJjbGx6NDZqdXEwdzgzM2RzeWY4bTNiYmQ1In0.tYFL2w0NrrDkNuwHd503UA';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ravirajghodake98/cllz4ztle00n401nz25rb8rkn',
    scrollZoom: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //Create a marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add a marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 35,
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