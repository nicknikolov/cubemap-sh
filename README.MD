# cubemap-sh

[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

![alt text](https://github.com/nicknikolov/cubemap-sh/blob/master/example/snowden.jpg "Snowden")

Generate spherical harmonics from a cubemap. The example screenshot shows them used to cheaply generate environmental diffuse light for a mesh.

## installing
`$ npm i cubemap-sh`

## usage
You pass in:
- an array of faces in the shown order (opengl order)
- size of each face (default is `128`)
- number of channels (3 for rgb or 4 for rgba, default is `4`)
```
const coefficients = sh([posx, negx, posy, negy, posz, negz], CUBE_MAP_SIZE, NUM_CHANNELS)
```
What you get back is an array of 9 `vec3`s (an array of arrays, each one having 3 elements for r g and b).
To use them for example to light up your mesh, you can use the corresponding `glsl-sh` module and pass them to a shader
that looks like this:
```
precision mediump float;
#pragma glslify: sh = require('./assets/glsl/sh.glsl') // import using glslify
varying vec3 vViewNormal;
uniform vec3 coefficients[9]; // this is what you get from the function above, pass it straight to the shader
uniform vec3 color;
void main() {
  vec3 n = normalize(vViewNormal);
  vec3 shColor = sh(harmonics, n) * color; // here we get diffuse light calculated by the sperhical harmonics multiplied by the color of the mesh
  gl_FragColor = vec4(shColor, 1.0);
  gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0 / 2.2)); // gamma correction
}
```
Please note this example uses `glslify`.

## api
`const sh = require('cubemap-sh')`
### sh([faces], cubemapSize=128, numberOfChannels=4)
(array, int?, int?) -> array

## License
MIT
