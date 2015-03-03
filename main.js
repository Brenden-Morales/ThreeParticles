/**
 * Created by brenden on 2/26/15.
 */
//necessary global variables
var camera;
var controls;
var scene;
var renderer;
var stats;
var sim;
var cloudUniforms;
var cloudMaterial;
var cloud;
var velocityField;

var st;

var textureLength = 64;
var particleCount = textureLength * textureLength;

document.onkeypress = function(e){
    //spacebar
    if(e.charCode === 32){
        sim.renderTexture({delta : 0.5});
        cloudUniforms.texture.value = sim.activeTexture;
        render();
    }
}

var initialize = function(){
    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild(renderer.domElement);

    //velocity texture map for simulation
    velocityField = new VelocityTextureMap({
        width : 16,
        renderer : renderer
    });

    //simulator
    sim = new ParticleSimulator({
        width : 64,
        bounds : 160,
        renderer:renderer,
        particleShaderId : "particleFragment"
    });

    sim.initialize();

    //camera
    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight,1,1000);
    camera.position.z = 100;

    camera.position.y = 100;
    //controls
    controls = new THREE.OrbitControls( camera );
    controls.damping = 0.2;

    controls.addEventListener( 'change', render );

    //scene
    scene = new THREE.Scene();

    //stats
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild( stats.domElement );
    window.addEventListener( 'resize', onWindowResize, false );

    //GridHelper
    scene.add(new THREE.GridHelper(80,10));

    //windsocks
    //var makeWindSock = function(x,z){
    //    var dir = new THREE.Vector3( 1, 0, 0 );
    //    var origin = new THREE.Vector3( 0, 0, 0 );
    //    var length = 3;
    //    var hex = 0xffff00;
    //    var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    //    scene.add( arrowHelper );
    //    arrowHelper.position.x = x;
    //    arrowHelper.position.z = z;
    //}
    //for(var x = -8; x < 8; x ++){
    //    for(var z = -8; z < 8; z ++){
    //        makeWindSock(x * 10, z * 10);
    //    }
    //}

    var cloudAttributes = {
        size:        { type: 'f', value: null },
        customColor: { type: 'c', value: null },
        reference :  { type: 'v2', value: null}
    };

    cloudUniforms = {
        color:     { type: "c", value: new THREE.Color( 0xffffff ) },
        texture:   { type: "t", value: null }
    };

    cloudMaterial = new THREE.ShaderMaterial( {
        uniforms:       cloudUniforms,
        attributes:     cloudAttributes,
        vertexShader:   document.getElementById( 'cloudVertex' ).textContent,
        fragmentShader: document.getElementById( 'cloudFragment' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        transparent:    true
    });

    var makeParticles = function(){
        //make a particle system with buffer geometry
        var geometry = new THREE.BufferGeometry();

        var positions = new Float32Array( particleCount * 3 );
        var values_color = new Float32Array( particleCount * 3 );
        var values_size = new Float32Array( particleCount );
        var references = new Float32Array(particleCount * 2);

        var color = new THREE.Color();

        for( var v = 0; v < particleCount; v++ ) {

            //wow this is dumb, this is how glsl indexes texture positions, as a fraction of the overall length
            //instead of something sane like an integer based index
            references[v * 2] = (Math.floor(v / textureLength)) / textureLength;
            references[(v * 2) + 1] = (v % textureLength) / textureLength;

            //whatever, copypasta'ed code
            values_size[ v ] = 1;

            //positions don't matter since we'll be taking those from the texture anyways
            positions[ v * 3 ] = 0;
            positions[ v * 3 + 1 ] = 0;
            positions[ v * 3 + 2 ] = 0;

            //color, whatever
            color.setHSL( v / particleCount, 1.0, 0.5 );
            values_color[ v * 3 ] = color.r;
            values_color[ v * 3 + 1 ] = color.g;
            values_color[ v * 3 + 2 ] = color.b;

        }

        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'customColor', new THREE.BufferAttribute( values_color, 3 ) );
        geometry.addAttribute( 'size', new THREE.BufferAttribute( values_size, 1 ) );
        geometry.addAttribute( 'reference', new THREE.BufferAttribute( references, 2 ) );

        cloud = new THREE.PointCloud( geometry, cloudMaterial );

        scene.add( cloud );
    }

    makeParticles();


    render();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();
}


function render() {
    renderer.render( scene, camera );
    stats.update();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
}