var mapboxgl = require('mapbox-gl');
var queue = require('queue-async');
var request = require('request');
var stylePrep = require('guidance-geojson').stylePrep;
var styleRoute = require('guidance-geojson').styleRoute;

var config = require('./configuration.json');
var run = require('../index.js');
var util = require('../lib/util.js');

var camAngleInc = 5;
var zoomInc = 1;

var directionResponse = JSON.parse(JSON.stringify(require('./route.json')));

//process.env.MapboxAccessToken = 'pk.eyJ1Ijoic2hyaWthbnRkIiwiYSI6ImNpbmk1YjNjbTB3anh1a2x5ZDZrbnk2dngifQ.CazxW295AwiDbsTw_IMoSw'
process.env.MapboxAccessToken = 'pk.eyJ1IjoiZHJpZnR0ZWsiLCJhIjoiY2luamN4ZWYwMHhucnVpa2pkZmh0YWt1MCJ9.7ZmolbHioS3K246D2kg84Q'
// Ensure that access token is set locally
if (!process.env.MapboxAccessToken) {
  throw new Error('An API access token is required to use Mapbox GL. See https://www.mapbox.com/developers/api/#access-tokens');
} else {
  mapboxgl.accessToken = process.env.MapboxAccessToken;
}

config.route = directionResponse

// Initiate the map using the guidance-geojson stylePrep function
var style = JSON.parse(JSON.stringify(require('./style.json')));

var map = new mapboxgl.Map({
  hash: false,
  container: 'map',
  zoom: config.zoom,
  style: stylePrep(style, 'route'),
  interactive: false
}).setPitch(config.pitch);

// Enables keyboard interaction when map has focus
// + and - gives zoom level 1
// Shift + and Shift = is zoom level 2
// Shift UpArrow and Shift DownArrow = change pitch by 5
map.keyboard.enable();

// Pass default values to HTML file for display & run the simulation when the map style is loaded
if (document.getElementById('step-pitch') != null)
  document.getElementById('step-pitch').innerHTML = 'pitch: ' + util.isInteger(config.pitch) + '°';

if (document.getElementById('step-zoom') != null)
  document.getElementById('step-zoom').innerHTML = 'zoom: ' + util.isInteger(config.zoom);

if (config.spacing === 'acceldecel') {
 if (document.getElementById('step-speed') != null)
    { document.getElementById('step-speed').innerHTML = 'speed: ' + 0 + ' mph'; }
}

map.on('style.load', function () {
  var res = run(map, config);
  // Add the stylized route to the map
  styleRoute(mapboxgl, map, config.route);

  document.getElementById('zoomV').innerHTML = parseInt(config.zoom);
  document.getElementById('pitchV').innerHTML = parseInt(config.pitch);

  // Display updated simulation parameters
  res.on('update', function(data) {
    console.log("update event")
    if (document.getElementById('step-pitch') != null)
      document.getElementById('step-pitch').innerHTML = 'pitch: ' + util.isInteger(data.pitch) + '°';
    if (document.getElementById('step-zoom') != null)
      document.getElementById('step-zoom').innerHTML = 'zoom: ' + util.isInteger(data.zoom);
    if (data.speed) { document.getElementById('step-speed').innerHTML = 'speed: ' + util.isInteger(data.speed) + ' mph'; }
  });
});

document.getElementById("zoomin").addEventListener("click", function(){
  console.log("Zoom " + map.getZoom());
  
  map.zoomIn({
    easing: function(v) { return v;},
    animate: true })

  document.getElementById("zoomSlider").value = map.getZoom();
  document.getElementById('zoomV').innerHTML = parseInt(map.getZoom());
})

document.getElementById("zoomout").addEventListener("click", function(){
  console.log("Zoom " + map.getZoom());
  
  map.zoomOut({
    easing: function(v) { return v;},
    animate: true })

  document.getElementById("zoomSlider").value = map.getZoom();
  document.getElementById('zoomV').innerHTML = parseInt(map.getZoom());
})

document.getElementById("camup").addEventListener("click", function(){
  console.log("Cam " + map.getPitch());
  
  var pitchVal = map.getPitch() + camAngleInc;
  if (pitchVal <= 60) {
    map.easeTo({
    pitch: pitchVal,
    easing: function (v) { return v; }
    })

    document.getElementById("pitchSlider").value = pitchVal;
    document.getElementById('pitchV').innerHTML = parseInt(map.pitchVal);
  }
})

document.getElementById("camdown").addEventListener("click", function(){
  console.log("Cam " + map.getPitch());
  
  var pitchVal = map.getPitch() - camAngleInc;
  if (pitchVal >= 0) {
    map.easeTo({
    pitch: pitchVal,
    easing: function (v) { return v; }
    })

    document.getElementById("pitchSlider").value = pitchVal;
    document.getElementById('pitchV').innerHTML = parseInt(pitchVal);
  }
})

document.getElementById("zoomSlider").addEventListener("input", function(e){
  console.log("Zoom " + map.getZoom());
  var zoomValue = parseInt(e.target.value, 10);

  map.easeTo({
  zoom: zoomValue,
  easing: function (v) { return v; }
  })

  document.getElementById('zoomV').innerHTML = parseInt(zoomValue);
})

document.getElementById("pitchSlider").addEventListener("input", function(e){
  console.log("Cam " + map.getPitch());
  var pitchVal = parseInt(e.target.value, 10);
  
  map.easeTo({
  pitch: pitchVal,
  easing: function (v) { return v; }
  })

  document.getElementById('pitchV').innerHTML = parseInt(pitchVal);
})
