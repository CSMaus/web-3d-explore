export const vert = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const frag = /* glsl */ `
precision highp float;

uniform vec2 uSize;
uniform float uPhase;
uniform int uSteps;
uniform vec3 uRamp[5];
uniform vec3 uBack;
uniform float uPower;
uniform int uInner;
uniform float uZoom;
uniform float uPulse;
uniform float uSpin;
uniform float uElev;
uniform float uKey;
uniform float uFill;
uniform float uShine;
uniform float uGlow;
uniform float uHaze;

const int INNER_CAP = 20;
const int MAX_STEPS = 110;
const float FAR = 7.0;
const float TAU = 6.28318530718;

float bulb(vec3 p, out float escape) {
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  int used = 0;
  for (int i = 0; i < INNER_CAP; i++) {
    if (i >= uInner) break;
    r = length(z);
    if (r > 2.0) break;
    used = i;
    float theta = acos(clamp(z.z / r, -1.0, 1.0));
    float phi = atan(z.y, z.x);
    dr = pow(r, uPower - 1.0) * uPower * dr + 1.0;
    float zr = pow(r, uPower);
    theta *= uPower;
    phi *= uPower;
    z = zr * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta)) + p;
  }
  escape = float(used) / max(float(uInner - 1), 1.0);
  return 0.5 * log(max(r, 1e-6)) * r / max(dr, 1e-6);
}

float dist(vec3 p) {
  float e;
  return bulb(p, e);
}

vec3 normalAt(vec3 p, float eps) {
  vec3 dx = vec3(eps, 0.0, 0.0);
  vec3 dy = vec3(0.0, eps, 0.0);
  vec3 dz = vec3(0.0, 0.0, eps);
  return normalize(vec3(
    dist(p + dx) - dist(p - dx),
    dist(p + dy) - dist(p - dy),
    dist(p + dz) - dist(p - dz)
  ));
}

vec3 rampAt(float t) {
  float x = clamp(t, 0.0, 1.0) * 4.0;
  int i = int(floor(x));
  float f = fract(x);
  if (i >= 4) return uRamp[4];
  vec3 a = uRamp[0];
  vec3 b = uRamp[1];
  if (i == 1) { a = uRamp[1]; b = uRamp[2]; }
  else if (i == 2) { a = uRamp[2]; b = uRamp[3]; }
  else if (i == 3) { a = uRamp[3]; b = uRamp[4]; }
  return mix(a, b, f);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uSize) / min(uSize.x, uSize.y);

  float breath = 0.5 + 0.5 * sin(TAU * uPhase * uPulse);
  float ca = cos(uSpin);
  float sa = sin(uSpin);
  float reach = 2.45 / uZoom;
  vec3 eye = reach * vec3(cos(uElev) * ca, cos(uElev) * sa, sin(uElev));
  vec3 fwd = normalize(-eye);
  vec3 side = normalize(cross(vec3(0.0, 0.0, 1.0), fwd));
  vec3 up = cross(fwd, side);
  vec3 rd = normalize(fwd * 1.55 + side * uv.x + up * uv.y);

  float t = 0.35;
  float escape = 0.0;
  bool hit = false;
  float haze = 0.0;
  int used = uSteps;
  for (int s = 0; s < MAX_STEPS; s++) {
    if (s >= uSteps) break;
    vec3 p = eye + rd * t;
    float d = bulb(p, escape);
    haze += 0.020 / (1.0 + 30.0 * d * d);
    if (d < 0.0009 * t) { hit = true; used = s; break; }
    t += max(d, 0.0007);
    if (t > FAR) break;
  }

  vec3 col = uBack;
  if (hit) {
    vec3 p = eye + rd * t;
    vec3 n = normalAt(p, 0.0022 * t);
    float facing = max(dot(n, -rd), 0.0);
    float sheen = pow(1.0 - facing, 3.0);
    float core = 1.0 / (1.0 + 5.5 * dot(p, p));
    float thick = escape;

    vec3 key = normalize(vec3(0.55 * ca - 0.62 * sa, 0.55 * sa + 0.62 * ca, 0.62));
    float lam = max(dot(n, key), 0.0);

    float ao = clamp(1.0 - float(used) / float(uSteps) * 1.7, 0.0, 1.0);
    float inFold = pow(1.0 - ao, 1.6);
    vec3 hv = normalize(key - rd);
    float tight = pow(max(dot(n, hv), 0.0), 14.0);
    float wide = pow(max(dot(n, hv), 0.0), 3.0);
    float spec = tight + 0.35 * wide;

    vec3 ice = rampAt(0.22 + 0.26 * thick);
    vec3 lamp = rampAt(0.54 + 0.20 * inFold);
    float through = inFold * (0.22 + 0.78 * breath) * 1.35 + core * 0.25 * breath;

    col = ice * (uFill + uKey * lam) * (0.40 + 0.60 * ao);
    col += lamp * through * uGlow * (0.35 + 0.65 * facing);
    col += rampAt(0.86) * spec * uShine;
    col += rampAt(0.72) * sheen * 0.14;
    col *= 1.0 - clamp((t - 1.5) * 0.20, 0.0, 0.45);
  }

  col += rampAt(0.50) * haze * uHaze * (0.40 + 0.60 * breath);

  col = pow(clamp(col, 0.0, 1.0), vec3(0.94));
  gl_FragColor = vec4(col, 1.0);
}
`;
