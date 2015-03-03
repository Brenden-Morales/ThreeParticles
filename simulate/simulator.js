/**
 * Created by brenden on 2/27/15.
 */
var ParticleSimulator = function(options){
    var self = this instanceof ParticleSimulator ? this : Object.create(ParticleSimulator.prototype);
    //call ShaderTexture, because this is one of those
    ShaderTexture.call(self,options);

    //passed in variables
    self.particles =options.width * options.width;
    self.bounds = options.bounds;
    self.width = options.width;
    self.particleShaderId = options.particleShaderId;


    //the two textures we'll be using for "ping ponging"
    self.pingTexture;
    self.pongTexture;
    //ping/pong flag
    self.ping = true;
    //the texture that's currently active / has been pinged / ponged to
    self.activeTexture;


    //actual shader for the particles
    self.particleShader = new THREE.ShaderMaterial( {
        uniforms: {
            time: { type: "f", value: 1.0 },
            delta: { type: "f", value: 0.0 },
            bounds : {type : "f", value : self.bounds / 2},
            resolution: { type: "v2", value: new THREE.Vector2( self.width, self.width ) },
            texture: { type: "t", value: null },
            velocityField : { type : "t", value : velocityField.texture},
            velocityBounds : {type : "f", value : velocityField.width}
        },
        vertexShader: document.getElementById( 'passThroughVertex' ).textContent,
        fragmentShader: document.getElementById( self.particleShaderId ).textContent

    } );

    //make a rtt target
    self.makeTexture = function(){
        //parse out options
        var halfBounds = this.bounds / 2;

        //make the typed array for the texture
        var textureArray = new Float32Array( this.particles * 4 );

        //loop through the data
        for ( var k = 0; k < textureArray.length; k += 4 ) {
            var x = Math.random() * this.bounds - halfBounds;
            var y = Math.random() * this.bounds - halfBounds;
            var z = Math.random() * this.bounds - halfBounds
            //rgba
            textureArray[ k + 0 ] = x;
            textureArray[ k + 1 ] = y;
            textureArray[ k + 2 ] = z;
            textureArray[ k + 3 ] = 1;
        }

        var texture = new THREE.DataTexture( textureArray, Math.sqrt(this.particles), Math.sqrt(this.particles), THREE.RGBAFormat, THREE.FloatType );
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        texture.flipY = false;

        return texture;
    };

    //render function
    self.renderTexture = function(data) {
        //set the global mesh to our shader
        this.mesh.material = this.particleShader;
        if(this.ping){
            //we take from pong, render to ping
            this.particleShader.uniforms.texture.value = this.pongTexture;
        }
        else{
            //take from ping, render to pong
            this.particleShader.uniforms.texture.value = this.pingTexture;
        }
        //update all the uniforms
        for(var prop in data){
            if(data.hasOwnProperty(prop)){
                if(this.particleShader.uniforms[prop] !== undefined){
                    this.particleShader.uniforms[prop].value = data[prop];
                }
            }
        }
        if(this.ping){
            this.ping = false;
            this.renderer.render(this.scene,this.camera,this.pingTexture);
            this.activeTexture = this.pingTexture;

        }
        else{
            this.ping = true;
            this.renderer.render(this.scene,this.camera,this.pongTexture);
            this.activeTexture = this.pongTexture;
        }
    };

    self.initialize = function(){

        //create the initial texture
        var initialParticleTexture = this.makeTexture();

        //create the render targets
        this.pingTexture = this.getRenderTarget(THREE.RGBAFormat,this.width);
        this.pongTexture = this.pingTexture.clone();

        //render them once for some reason?
        this.initializeTexture(initialParticleTexture,this.pingTexture);
        this.initializeTexture(this.pingTexture,this.pongTexture);
    };

    return self;
};

ParticleSimulator.prototype = Object.create(ShaderTexture.prototype);