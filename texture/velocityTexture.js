/**
 * Created by brenden on 3/2/15.
 */
var VelocityTextureMap = function(options) {
    var self = this instanceof VelocityTextureMap ? this : Object.create(VelocityTextureMap.prototype);

    self.width = options.width;

    //camera
    self.camera = new THREE.Camera();
    self.camera.position.z = 1;

    //scene
    self.scene = new THREE.Scene();

    (function(){
        //make the typed array for the texture
        var textureArray = new Float32Array( self.width * self.width * 4 );

        var negative = function(){
            if(Math.random() < 0.5) return -1;
            else return 1;
        }

        //loop through the data
        for ( var k = 0; k < textureArray.length; k += 4 ) {
            var x = Math.random() * 5 * negative();
            var y = 0;
            var z = Math.random() * 5 * negative();
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

        self.texture = texture;
    })();

    return self;
}