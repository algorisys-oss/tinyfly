/**
 * The WebGL2 renderer's shaders (GLSL ES 3.0). The light is the stylized
 * light of `shading.ts`, per pixel: ambient, directional, point and spot
 * lights fading at their range, unlit / flat / smooth / toon, then fog.
 */

export const MAX_LIGHTS = 8

/** Shading modes as the fragment shader numbers them. */
export const SHADING_CODE = { unlit: 0, flat: 1, lambert: 2, toon: 3 } as const

/** Light kinds as the fragment shader numbers them. */
export const LIGHT_CODE = { ambient: 0, directional: 1, point: 2, spot: 3 } as const

export const SURFACE_VERTEX = `#version 300 es
in vec3 a_position;
in vec3 a_normal;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
out vec3 v_world;
out vec3 v_normal;
void main() {
  vec4 world = u_model * vec4(a_position, 1.0);
  v_world = world.xyz;
  v_normal = u_normalMatrix * a_normal;
  gl_Position = u_projection * u_view * world;
}
`

export const SURFACE_FRAGMENT = `#version 300 es
precision highp float;
#define MAX_LIGHTS ${MAX_LIGHTS}
uniform int u_lightCount;
uniform int u_lightKind[MAX_LIGHTS];
uniform vec3 u_lightColor[MAX_LIGHTS];
uniform float u_lightIntensity[MAX_LIGHTS];
uniform vec3 u_lightPosition[MAX_LIGHTS];
uniform vec3 u_lightDirection[MAX_LIGHTS];
uniform float u_lightRange[MAX_LIGHTS];
uniform vec2 u_lightCone[MAX_LIGHTS];
uniform vec3 u_color;
uniform float u_opacity;
uniform int u_shading;
uniform float u_bands;
uniform vec3 u_eye;
uniform vec3 u_forward;
uniform bool u_orthographic;
uniform bool u_fog;
uniform vec3 u_fogColor;
uniform vec2 u_fogRange;
in vec3 v_world;
in vec3 v_normal;
out vec4 outColor;

vec3 lightAt(vec3 p, vec3 n) {
  vec3 total = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= u_lightCount) break;
    float amount;
    int kind = u_lightKind[i];
    if (kind == 0) {
      amount = u_lightIntensity[i];
    } else if (kind == 1) {
      amount = u_lightIntensity[i] * max(0.0, -dot(n, u_lightDirection[i]));
    } else {
      vec3 toLight = u_lightPosition[i] - p;
      float distance = length(toLight);
      vec3 l = distance > 0.0 ? toLight / distance : n;
      float fade = u_lightRange[i] > 0.0 ? pow(max(0.0, 1.0 - distance / u_lightRange[i]), 2.0) : 1.0;
      amount = u_lightIntensity[i] * max(0.0, dot(n, l)) * fade;
      if (kind == 3) amount *= smoothstep(u_lightCone[i].x, u_lightCone[i].y, -dot(l, u_lightDirection[i]));
    }
    total += u_lightColor[i] * amount;
  }
  return total;
}

void main() {
  vec3 rgb = u_color;
  if (u_shading != 0) {
    // Flat: the face's own normal, from the surface's slope; otherwise the smooth one.
    vec3 n = u_shading == 1 ? normalize(cross(dFdx(v_world), dFdy(v_world))) : normalize(v_normal);
    vec3 toEye = u_orthographic ? -u_forward : normalize(u_eye - v_world);
    if (dot(n, toEye) < 0.0) n = -n;
    vec3 light = lightAt(v_world, n);
    if (u_shading == 3) {
      // Band the brightness, not each channel, so coloured lights keep their hue.
      float level = max(light.r, max(light.g, light.b));
      float steps = max(2.0, floor(u_bands + 0.5));
      float banded = min(1.2, ceil(min(1.0, level) * steps - 1e-6) / steps);
      light = level > 0.0 ? light * (banded / level) : vec3(0.0);
    }
    rgb *= light;
  }
  if (u_fog) {
    float amount = clamp((distance(v_world, u_eye) - u_fogRange.x) / (u_fogRange.y - u_fogRange.x), 0.0, 1.0);
    rgb = mix(rgb, u_fogColor, amount);
  }
  outColor = vec4(clamp(rgb, 0.0, 1.0), u_opacity);
}
`

/**
 * Ink outlines by the inverted hull: each mesh again, its back faces only,
 * pushed out along their normals by the outline's width in pixels, in the
 * ink colour. Behind the surface, only the rim shows: a silhouette.
 */
export const OUTLINE_VERTEX = `#version 300 es
in vec3 a_position;
in vec3 a_normal;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;
uniform vec2 u_viewport;
uniform float u_width;
void main() {
  mat4 viewProjection = u_projection * u_view;
  vec4 clip = viewProjection * u_model * vec4(a_position, 1.0);
  vec3 worldNormal = normalize(u_normalMatrix * a_normal);
  vec4 tip = viewProjection * (u_model * vec4(a_position, 1.0) + vec4(worldNormal * 0.01, 0.0));
  vec2 direction = tip.xy / tip.w - clip.xy / clip.w;
  float length2 = dot(direction, direction);
  vec2 push = length2 > 0.0 ? direction * inversesqrt(length2) : vec2(0.0);
  clip.xy += push * u_width * 2.0 / u_viewport * clip.w;
  gl_Position = clip;
}
`

export const OUTLINE_FRAGMENT = `#version 300 es
precision highp float;
uniform vec4 u_ink;
out vec4 outColor;
void main() {
  outColor = u_ink;
}
`
