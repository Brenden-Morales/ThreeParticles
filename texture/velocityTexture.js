/**
 * Created by brenden on 3/2/15.
 */
var VelocityTextureMap = function(options) {
    var self = this instanceof VelocityTextureMap ? this : Object.create(VelocityTextureMap.prototype);
    ShaderTexture.call(self,options);

    self.width = options.width;

    //all we're doing here is creating a static texture (not a RenderTarget)
    //and using it for updating the paticles positions
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
            //2d for now
            var y = 0;
            var z = Math.random() * 5 * negative();
            //rgba
            textureArray[ k + 0 ] = x;
            textureArray[ k + 1 ] = y;
            textureArray[ k + 2 ] = z;
            textureArray[ k + 3 ] = 1;
        }

        texture = new THREE.DataTexture( textureArray, self.width, self.width, THREE.RGBAFormat, THREE.FloatType );
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        texture.flipY = false;
        self.texture = texture;

    })();

    return self;
};

VelocityTextureMap.prototype = Object.create(ShaderTexture.prototype);