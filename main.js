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
var velocitySim;

var previousTime;

var mouse = new THREE.Vector3();
document.onmousemove = function(event) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouse.z = 0.5;
};
var intersectPlane = new THREE.Plane(new THREE.Vector3(0,1,0));

var textureLength = 512;
var particleCount = textureLength * textureLength;
var gridSize = 320;
var spaceBetweenGridCells = 5;
var velocityMapWidth = gridSize / spaceBetweenGridCells ;

var simulate = false;



//when the user hits the spacebar stop/start the simulation
document.onkeypress = function(e){
    if(e.charCode === 32){
        if(simulate){
            simulate = false;
        }
        else{
            simulate = true;
        }
    }
    else if (e.charCode === 101){
        mouse.unproject(camera);
        var ray = new THREE.Ray( camera.position, mouse.sub( camera.position ).normalize() );
        var intersect = ray.intersectPlane(intersectPlane);
        console.log(intersect);
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
        width : velocityMapWidth,
        renderer : renderer
    });

    //simulator
    sim = new ParticleSimulator({
        width : textureLength,
        bounds : gridSize,
        renderer:renderer,
        particleShaderId : "particleFragment"
    });
    sim.initialize();

    velocitySim = new VelocitySimulator({
        width : textureLength,
        bounds : gridSize,
        renderer:renderer,
        particleShaderId : "velocityFragment"
    });
    velocitySim.initialize();
    velocitySim.renderTexture({
        delta : 0.5,
        positionField : sim.activeTexture
    });

    //so it looks nice at initialization
    sim.renderTexture({
        delta : 0.5,
        particleVelocities : velocitySim.activeTexture
    });



    //camera
    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight,1,1000);
    camera.position.z = 100;

    camera.position.y = 100;
    //controls
    controls = new THREE.OrbitControls( camera );
    controls.damping = 0.2;

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
    //scene.add(new THREE.GridHelper(gridSize / 2, spaceBetweenGridCells));

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
            //nevermind that's actually pretty smart?

            //whatever, copypasta'ed code
            values_size[ v ] = 0.3;

            //positions don't matter since we'll be taking those from the texture anyways
            positions[ v * 3 ] = Math.random() * gridSize - gridSize / 2;
            positions[ v * 3 + 1 ] = Math.random() * gridSize - gridSize / 2;
            positions[ v * 3 + 2 ] = Math.random() * gridSize - gridSize / 2;

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
        geometry.computeBoundingBox();

        cloud = new THREE.PointCloud( geometry, cloudMaterial );

        scene.add( cloud );
    }

    makeParticles();


    previousTime = window.performance.now();
    render();
    animate();
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
    var now = window.performance.now();
    var delta = previousTime - now;
    var previousTime = now;

    requestAnimationFrame(animate);
    if(simulate){
        velocitySim.renderTexture({
            delta : delta,
            positionField : sim.activeTexture
        });
        sim.renderTexture({
            delta : delta,
            particleVelocities : velocitySim.activeTexture
        });
        cloudUniforms.texture.value = sim.activeTexture;
    }
    renderer.render(scene,camera);
    stats.update();
    controls.update();
}