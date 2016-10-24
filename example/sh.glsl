vec3 sh(const vec3 sph[9], const in vec3 normal) {
  float x = normal.x;
  float y = normal.y;
  float z = normal.z;

  vec3 result = (
    sph[0] +

    sph[1] * x +
    sph[2] * y +
    sph[3] * z +

    sph[4] * z * x +
    sph[5] * y * z +
    sph[6] * y * x +
    sph[7] * (3.0 * z * z - 1.0) +
    sph[8] * (x*x - y*y)
  );

  return max(result, vec3(0.0));
}

#pragma glslify: export(sh)

