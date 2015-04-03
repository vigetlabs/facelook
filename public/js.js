var container;

var camera, scene, renderer;

var eyeX = 0, eyeY = 0, eyeZ = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


init();
animate();


function init() {

  container = document.createElement( 'div' );
  document.body.insertBefore( container, document.body.firstChild);

  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.rotation.order = 'YXZ'

  // scene

  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight( 0x0033CC );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xccffff, 0.5 );
  directionalLight.position.set( 1, 0.2, 1);
  scene.add( directionalLight );

  var directionalLight = new THREE.DirectionalLight( 0xff6699, 0.8 );
  directionalLight.position.set( 0.5, 0.75, 0.3);
  scene.add( directionalLight );


  // texture

  var manager = new THREE.LoadingManager();
  manager.onProgress = function ( item, loaded, total ) {

    console.log( item, loaded, total );

  };

  var texture = new THREE.Texture();

  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };

  var loader = new THREE.ImageLoader( manager );
    loader.load( 'UV_Grid_Sm.jpg', function ( image ) {

      texture.image = image;
      texture.needsUpdate = true;

    } );

  // model

  var loader = new THREE.OBJLoader( manager );
  loader.load( 'interior.obj', function ( object ) {

    object.traverse( function ( child ) {

      if ( child instanceof THREE.Mesh ) {

        // child.material.map = texture;

      }

    } );

    // object.rotation.x = 90 * (Math.PI/180)
    // object.rotation.y = 25 * (Math.PI/180)
    object.position.z = 150;
    object.position.x = - 40;
    object.position.y = - 90;
    scene.add( object );

  }, onProgress );

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0x9734ec, 1);
  container.appendChild( renderer.domElement );

  //

  window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}


//

function animate() {

  requestAnimationFrame( animate );
  render();

}

function render() {
  camera.position.x += ( - eyeX - camera.position.x ) * .065 * ((eyeZ - 20) * 0.08);
  camera.position.y += ( - (eyeY * 1.5) - camera.position.y ) * .8 * ((eyeZ - 20) * 0.08);
  camera.position.z = 450;

  camera.rotation.y = -eyeX * 0.0022 * ((40 - eyeZ) * 0.15)
  camera.rotation.x =  eyeY * 0.0022 * ((40 - eyeZ) * 0.15)

  camera.position.z += ( (eyeZ * 5) - camera.position.z ) * 0.3;
  // camera.fov = 100 - eyeZ;
  // camera.updateProjectionMatrix();

  renderer.render( scene, camera );
}

// helper functions

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           return window.setTimeout(callback, 1000/60);
         };
})();

/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 */
window.cancelRequestAnimFrame = (function() {
  return window.cancelCancelRequestAnimationFrame ||
         window.webkitCancelRequestAnimationFrame ||
         window.mozCancelRequestAnimationFrame ||
         window.oCancelRequestAnimationFrame ||
         window.msCancelRequestAnimationFrame ||
         window.clearTimeout;
})();

// video support utility functions
function supports_video() {
  return !!document.createElement('video').canPlayType;
}

function supports_h264_baseline_video() {
  if (!supports_video()) { return false; }
  var v = document.createElement("video");
  return v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
}

function supports_ogg_theora_video() {
  if (!supports_video()) { return false; }
  var v = document.createElement("video");
  return v.canPlayType('video/ogg; codecs="theora, vorbis"');
}


var vid = document.getElementById('video');
var overlay = document.getElementById('canvas');
var overlayCC = overlay.getContext('2d');

var ctrack = new clm.tracker({useWebGL : true});
ctrack.init(pModel);

var insertAltVideo = function(video) {
  if (supports_video()) {
    if (supports_ogg_theora_video()) {
      video.src = "./media/cap12_edit.ogv";
    } else if (supports_h264_baseline_video()) {
      video.src = "./media/cap12_edit.mp4";
    } else {
      return false;
    }
    //video.play();
    return true;
  } else return false;
}
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// check for camerasupport
if (navigator.getUserMedia) {
  // set up stream

  var videoSelector = {video : true};
  if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
    var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
    if (chromeVersion < 20) {
      videoSelector = "video";
    }
  };

  navigator.getUserMedia(videoSelector, function( stream ) {
    if (vid.mozCaptureStream) {
      vid.mozSrcObject = stream;
    } else {
      vid.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }
    vid.play();
  }, function() {})
}

function startVideo() {
  // start video
  vid.play();
  // start tracking
  ctrack.start(vid);
  // start loop to draw face
  drawLoop();
}

function drawLoop() {
  requestAnimFrame(drawLoop);
  overlayCC.clearRect(0, 0, 400, 300);
  if (ctrack.getCurrentPosition()) {
    var position = ctrack.getCurrentPosition()
    var left = position[27]
    var right = position[32]
    eyeY = left[1] + ((right[1] - left[1]) / 2) - (160 / 2)
    eyeX = left[0] + ((right[0] - left[0]) / 2) - (120 / 2)

    var distanceX = left[1] - right[1]
    var distanceY = left[0] - right[0]

    eyeZ = 50 - Math.sqrt((distanceX * distanceX) + (distanceY * distanceY))

    ctrack.draw(overlay);
  }
}

startVideo()
