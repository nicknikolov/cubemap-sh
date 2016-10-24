const glsl = require('glslify')
const mat4 = require('gl-mat4')
const vec3 = require('gl-vec3')
const regl = require('regl')({ pixelRatio: 1 })
const sh = require('../index.js')
const snowden = require('snowden')
const normals = require('angle-normals')(snowden.cells, snowden.positions)

const setupEnvMap = regl({
  frag: `
  precision mediump float;
  uniform samplerCube envmap;
  varying vec3 reflectDir;
  void main () {
    gl_FragColor = textureCube(envmap, normalize(reflectDir));
  }`,
  uniforms: {
    envmap: regl.prop('cube'),
    view: regl.context('view'),
    projection: ({viewportWidth, viewportHeight}) =>
      mat4.perspective([],
        Math.PI / 3,
        viewportWidth / viewportHeight,
        0.01,
        1000),
    invProj: ({viewportWidth, viewportHeight}) =>
      mat4.invert([], mat4.perspective([],
        Math.PI / 3,
        viewportWidth / viewportHeight,
        0.01,
        1000)
      ),
    invView: ({view}) => {
      return mat4.invert([], view)
    }
  }
})

const drawBackground = regl({
  vert: `
  precision mediump float;
  attribute vec2 position;
  uniform mat4 invView;
  uniform mat4 invProj;
  varying vec3 reflectDir;
  void main() {
    vec3 unprojected = vec3(invProj * vec4(position, 0, 1));
    reflectDir =  normalize(vec3(invView * vec4(unprojected, 0)));
    gl_Position = vec4(position, 0, 1);
  }`,
  attributes: {
    position: [
      -1, -1,
      -1, 1,
      1, 1,
      -1, -1,
      1, 1,
      1, -1
    ]
  },
  depth: {
    mask: false,
    enable: false
  },
  count: 6
})

const camera = require('regl-camera')(regl, {
  center: [0, 0, 0],
  theta: Math.PI / 2
})

const drawSnowden = regl({
  vert: `
  precision mediump float;
  attribute vec3 position, normal;
  uniform mat4 projection, view, invView;
  varying vec3 reflectDir;
  varying vec3 vWorldNormal;
  void main() {
    vWorldNormal = normal;
    gl_Position = projection * view * vec4(position, 1);
  }`,
  frag: glsl`
  precision mediump float;
  #pragma glslify: sh = require('./sh.glsl')
  varying vec3 vWorldNormal;
  uniform vec3 c[9];
  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 color = sh(c, n);
    gl_FragColor = vec4(color, 1.0);
    gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0 / 2.2)); // bring color back to gamma space
  }`,
  attributes: {
    position: snowden.positions,
    normal: normals
  },
  elements: snowden.cells,
  uniforms: {
    projection: ({viewportWidth, viewportHeight}) =>
      mat4.perspective([],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        100),
    'c[0]': (context, props) => props.c[0],
    'c[1]': (context, props) => props.c[1],
    'c[2]': (context, props) => props.c[2],
    'c[3]': (context, props) => props.c[3],
    'c[4]': (context, props) => props.c[4],
    'c[5]': (context, props) => props.c[5],
    'c[6]': (context, props) => props.c[6],
    'c[7]': (context, props) => props.c[7],
    'c[8]': (context, props) => props.c[8]
  }
})

require('resl')({
  manifest: {
    posx: {
      type: 'image',
      src: 'cubemap/posx.jpg'
    },
    negx: {
      type: 'image',
      src: 'cubemap/negx.jpg'
    },
    posy: {
      type: 'image',
      src: 'cubemap/posy.jpg'
    },
    negy: {
      type: 'image',
      src: 'cubemap/negy.jpg'
    },
    posz: {
      type: 'image',
      src: 'cubemap/posz.jpg'
    },
    negz: {
      type: 'image',
      src: 'cubemap/negz.jpg'
    }
  },

  onDone: ({ posx, negx, posy, negy, posz, negz }) => {
    const cube = regl.cube({
      faces: [
        posx, negx,
        posy, negy,
        posz, negz
      ],
      mag: 'linear'
    })

    const faces = [
      getPixels(posx),
      getPixels(negx),
      getPixels(posy),
      getPixels(negy),
      getPixels(posz),
      getPixels(negz),
    ]

    const coeffiecents = sh(faces)
    regl.frame(() => {
      camera(() => {
        setupEnvMap({ cube: cube }, () => {
          drawBackground()
          drawSnowden({ c: coeffiecents})
        })
      })
    })
  }
})

function getPixels (image) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = image.width
  canvas.height = image.height
  context.drawImage(image, 0, 0, image.width, image.height)
  return context.getImageData(0, 0, image.width, image.height).data
}

