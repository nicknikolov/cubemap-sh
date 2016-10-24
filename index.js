const vec3 = require('gl-vec3')
const assert = require('assert')

const cubemapFaceNormals = [
  [ [0, 0, -1], [0, -1, 0], [1, 0, 0] ],  // posx
  [ [0, 0, 1], [0, -1, 0], [-1, 0, 0] ],  // negx

  [ [1, 0, 0], [0, 0, 1], [0, 1, 0] ],    // posy
  [ [1, 0, 0], [0, 0, -1], [0, -1, 0] ],  // negy

  [ [1, 0, 0], [0, -1, 0], [0, 0, 1] ],   // posz
  [ [-1, 0, 0], [0, -1, 0], [0, 0, -1] ]  // negz
]

// give me a cubemap, its size and number of channels
// and i'll give you spherical harmonics
module.exports = function (faces, cubemapSize, ch) {
  assert.ok(Array.isArray(faces), 'cubemap-sh: faces should be an array')
  assert.equal(faces.length, 6, 'cubemap-sh: faces should have 6 elements')
  const size = cubemapSize || 128
  const channels = ch || 4
  const cubeMapVecs = []

  // generate cube map vectors
  faces.forEach((face, index) => {
    const faceVecs = []
    for (let v = 0; v < size; v++) {
      for (let u = 0; u < size; u++) {
        const fU = (2.0 * u / (size - 1.0)) - 1.0
        const fV = (2.0 * v / (size - 1.0)) - 1.0

        const vecX = []
        vec3.scale(vecX, cubemapFaceNormals[index][0], fU)
        const vecY = []
        vec3.scale(vecY, cubemapFaceNormals[index][1], fV)
        const vecZ = cubemapFaceNormals[index][2]

        const res = []
        vec3.add(res, vecX, vecY)
        vec3.add(res, res, vecZ)
        vec3.normalize(res, res)

        faceVecs.push(res)
      }
    }
    cubeMapVecs.push(faceVecs)
  })

  // generate shperical harmonics
  let sh = [
    new Float32Array(3),
    new Float32Array(3),
    new Float32Array(3),
    new Float32Array(3),
    new Float32Array(3),
    new Float32Array(3),
    new Float32Array(3),
    new Float32Array(3),
    new Float32Array(3)
  ]
  let weightAccum = 0

  faces.forEach((face, index) => {
    const pixels = face
    let gammaCorrect = true
    if (Object.prototype.toString.call(pixels) === '[object Float32Array]') gammaCorrect = false // this is probably HDR image, already in linear space
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const texelVect = cubeMapVecs[index][y * size + x]

        const weight = texelSolidAngle(x, y, size, size)
        // forsyths weights
        const weight1 = weight * 4 / 17
        const weight2 = weight * 8 / 17
        const weight3 = weight * 15 / 17
        const weight4 = weight * 5 / 68
        const weight5 = weight * 15 / 68

        let dx = texelVect[0]
        let dy = texelVect[1]
        let dz = texelVect[2]

        for (let c = 0; c < 3; c++) {
          let value = pixels[y * size * channels + x * channels + c] / 255
          if (gammaCorrect) value = Math.pow(value, 2.2)

          // indexed by coeffiecent + color
          sh[0][c] += value * weight1
          sh[1][c] += value * weight2 * dx
          sh[2][c] += value * weight2 * dy
          sh[3][c] += value * weight2 * dz

          sh[4][c] += value * weight3 * dx * dz
          sh[5][c] += value * weight3 * dz * dy
          sh[6][c] += value * weight3 * dy * dx

          sh[7][c] += value * weight4 * (3.0 * dz * dz - 1.0)
          sh[8][c] += value * weight5 * (dx * dx - dy * dy)

          weightAccum += weight
        }
      }
    }
  })

  for (let i = 0; i < sh.length; i++) {
    sh[i][0] *= 4 * Math.PI / weightAccum
    sh[i][1] *= 4 * Math.PI / weightAccum
    sh[i][2] *= 4 * Math.PI / weightAccum
  }

  return sh
}

function texelSolidAngle (aU, aV, width, height) {
  // transform from [0..res - 1] to [- (1 - 1 / res) .. (1 - 1 / res)]
  // ( 0.5 is for texel center addressing)
  const U = (2.0 * (aU + 0.5) / width) - 1.0
  const V = (2.0 * (aV + 0.5) / height) - 1.0

  // shift from a demi texel, mean 1.0 / size  with U and V in [-1..1]
  const invResolutionW = 1.0 / width
  const invResolutionH = 1.0 / height

  // U and V are the -1..1 texture coordinate on the current face.
  // get projected area for this texel
  const x0 = U - invResolutionW
  const y0 = V - invResolutionH
  const x1 = U + invResolutionW
  const y1 = V + invResolutionH
  const angle = areaElement(x0, y0) - areaElement(x0, y1) - areaElement(x1, y0) + areaElement(x1, y1)

  return angle
}

function areaElement (x, y) {
  return Math.atan2(x * y, Math.sqrt(x * x + y * y + 1.0))
}
