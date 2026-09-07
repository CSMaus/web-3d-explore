export const vert = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const frag = /* glsl */ `
precision highp float;

uniform vec2 uSize;
uniform vec2 uCentre;
uniform float uSpan;
uniform vec2 uC;
uniform int uKind;
uniform int uIters;
uniform float uRadius;
uniform vec3 uRamp[5];
uniform vec3 uBody;
uniform float uShift;

const int CAP = 900;

vec3 rampAt(float t) {
  float x = clamp(t, 0.0, 1.0) * 4.0;
  int i = int(floor(x));
  float f = fract(x);
  vec3 a = uRamp[0];
  vec3 b = uRamp[1];
  if (i == 1) { a = uRamp[1]; b = uRamp[2]; }
  else if (i == 2) { a = uRamp[2]; b = uRamp[3]; }
  else if (i >= 3) { a = uRamp[3]; b = uRamp[4]; }
  return mix(a, b, f);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uSize) / min(uSize.x, uSize.y);
  vec2 p = uCentre + uv * uSpan;

  vec2 z = uKind == 0 ? p : vec2(0.0);
  vec2 c = uKind == 0 ? uC : p;

  float r2 = uRadius * uRadius;
  int n = -1;
  float mag = 0.0;
  for (int i = 0; i < CAP; i++) {
    if (i >= uIters) break;
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    mag = dot(z, z);
    if (mag > r2) { n = i + 1; break; }
  }

  vec3 col;
  if (n < 0) {
    col = uBody;
  } else {
    float smoothed = float(n) + 1.0 - log2(max(log(sqrt(mag)) / log(uRadius), 1e-6));
    float t = pow(clamp(smoothed / float(uIters), 0.0, 1.0), 0.45);
    col = rampAt(fract(t + uShift));
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
