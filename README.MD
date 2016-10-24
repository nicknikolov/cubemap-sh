# cubemap-sh

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

![alt text](https://github.com/nicknikolov/cubemap-sh/blob/master/example/snowden.jpg "Snowden")

Generate spherical harmonics from a cubemap. The example screenshot shows them used to cheaply generate environmental diffuse light for a mesh.

## Installing
`$ npm i -S cubemap-sh`

## Usage
You pass in:
- an array of faces in the shown order (opengl order)
- size of each face (default is `128`)
- number of channels (3 for rgb or 4 for rgba, default is `4`)
```javascript
const coefficients = sh([posx, negx, posy, negy, posz, negz], CUBE_MAP_SIZE, NUM_CHANNELS)
```
What you get back is an array of 9 `vec3`s (an array of arrays, each one having 3 elements for r g and b).
To use them for example to light up your mesh, you can use the corresponding [glsl-sh](https://github.com/nicknikolov/glsl-sh) module and pass them to a shader
that looks like this:
```glsl
precision mediump float;
#pragma glslify: sh = require('glsl-sh') // import using glslify
varying vec3 vWorldNormal;
uniform vec3 c[9]; // this is what you get from the function above, pass it straight to the shader
uniform vec3 color;
void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 shColor = sh(c, n) * color; // here we get diffuse light calculated by the sperhical harmonics multiplied by the color of the mesh
  gl_FragColor = vec4(shColor, 1.0);
  gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0 / 2.2)); // gamma correction
}
```
Please note this example uses [glslify](https://github.com/stackgl/glslify).

## API
`const sh = require('cubemap-sh')`
### sh([faces], cubemapSize=128, numberOfChannels=4)
faces:
- faces: array of 6 cubemap faces in opengl order ([psx, negx, posy, negy, posz, negz]), each face is an array of pixels
- cubemapSize: size of each face, default is `128`
- numberOfChannels: 3 for rgb textures, 4, for rgba. defaults to `4`

returns array of 9 `vec3`s which correspond to the spherical harmonics coefficients for the first 2 bands (3 levels) for each of the color channels (RGB) in linear color space

## License
MIT
