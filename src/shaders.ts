export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uPressure;
uniform float uMode;
uniform sampler2D uFrom;
uniform sampler2D uTo;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float value = 0.0, amplitude = 0.5;
  for (int i = 0; i < 4; i++) { value += amplitude * noise(p); p = p * 2.03 + 7.1; amplitude *= 0.5; }
  return value;
}
// Stable 4x4 ordered Bayer dithering, not temporal flashing.
float bayer(vec2 pixel) {
  vec2 p = mod(floor(pixel), 4.0), a = mod(p, 2.0), b = floor(p / 2.0);
  return (4.0 * (2.0 * a.x + 3.0 * a.y - 4.0 * a.x * a.y) + 2.0 * b.x + 3.0 * b.y - 4.0 * b.x * b.y + 0.5) / 16.0;
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) - uPointer * 0.025;
  p.y += sin(p.x * 18.0 + uTime * 1.5) * uPressure * 0.035;
  float t = uTime * 0.12, light;
  if (uMode < 0.5) {
    p *= mat2(0.98, -0.20, 0.20, 0.98);
    vec2 q = p * vec2(1.0, 2.1);
    float r = length(q) * (1.0 - uPressure * 0.3), warp = fbm(q * 3.0 + vec2(t, -t)) - 0.5;
    float ring = exp(-abs(r - 0.39 - warp * 0.04) * 32.0);
    float threads = 0.55 + 0.45 * sin(r * 240.0 + warp * 24.0 - t * 5.0);
    float halo = exp(-abs(r - 0.4) * 9.0) * 0.28;
    float disk = exp(-abs(p.y + sin(p.x * 3.0) * 0.025) * 100.0) * exp(-abs(p.x) * 1.8) * smoothstep(0.16, 0.28, abs(p.x));
    float horizon = smoothstep(0.24, 0.30, r);
    float dust = fbm(p * 8.0 + t) * exp(-abs(r - 0.45) * 7.0);
    light = (ring * threads + halo + disk * 0.65 + dust * 0.22) * horizon;
    light += pow(hash(floor(vUv * uResolution / 2.0)), 90.0) * 0.22;
    light *= 0.85 + uPressure * 1.4;
  } else {
    float progress = clamp(uPressure + sin(t * 1.3) * 0.12, 0.0, 1.0);
    vec2 uv = vUv;
    float tear = noise(vec2(floor(uv.y * 32.0), floor(t * 2.0)));
    uv.x += (sin(uv.y * 18.0 + t * 2.0) * 0.018 + (tear - 0.5) * 0.1) * sin(progress * 3.14159);
    float from = texture2D(uFrom, uv).r;
    float to = texture2D(uTo, uv + vec2(sin(uv.y * 12.0 + t) * 0.008, 0.0)).r;
    float mask = smoothstep(progress - 0.22, progress + 0.22, fbm(uv * 6.0));
    light = mix(to, from, mask) * (0.7 + noise(uv * 260.0) * 0.4);
  }
  float poster = floor(clamp(light, 0.0, 1.0) * 3.0 + bayer(gl_FragCoord.xy / 1.5)) / 3.0;
  gl_FragColor = vec4(vec3(poster * 0.94), 1.0);
}`;
