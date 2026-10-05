/**
 * <pf-smoke>: full-screen smoke made with Three.js.
 *
 * Performance strategy
 *  - `three` is dynamically imported (separate chunk, tree-shaken) after idle,
 *    except during the intro where it is needed immediately.
 *  - One full-screen triangle-quad + fragment shader, rendered at a fraction of
 *    the CSS resolution (smoke is soft, so it is indistinguishable).
 *  - Adaptive resolution: drops the render scale if frames take too long.
 *  - Paused when the tab is hidden or the hero is scrolled out of view.
 *  - 30fps cap on touch devices; no WebGL / reduced motion => nothing runs.
 */

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
precision mediump float;
varying vec2 vUv;
uniform vec2 uRes, uMouse;
uniform float uTime, uReveal, uIntro, uFade, uLight, uVel;
uniform vec3 uColA, uColB, uBg;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < OCT; i++) { v += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.06;

  // The cursor pushes the smoke away; stronger the faster it moves.
  vec2 d = p - m;
  float md = length(d);
  p += normalize(d + 1e-4) * exp(-md * md * 7.0) * uVel * 0.35;

  // Domain-warped fbm = billowing smoke.
  vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 + vec2(5.2, 1.3) - t));
  float n = fbm(p * 1.8 + q * 1.7 + vec2(t * 2.0, -t));
  float dens = smoothstep(0.28, 0.85, n);

  vec3 idleCol = mix(uColA, uColB, smoothstep(0.2, 0.8, q.x));
  float idleA = dens * 0.42 * uFade * (1.0 - 0.4 * uLight);
  idleA += exp(-md * md * 9.0) * 0.12 * uFade;

  // Intro: opaque smoke over the page that dissolves outward from the centre.
  float R = mix(-0.7, 2.0, uReveal);
  float cover = smoothstep(R - 0.45, R + 0.05, length(p) + (n - 0.5) * 0.6);
  float introA = cover * uIntro;
  vec3 introCol = mix(uBg, idleCol, dens * 0.5);

  float a = max(introA, idleA);
  float w = introA / (introA + idleA + 1e-4);
  vec3 col = mix(idleCol, introCol, w);
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 160.0; // dithering, avoids banding
  gl_FragColor = vec4(col * a, a);
}`;

const root = document.documentElement;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const coarse = () => matchMedia('(pointer: coarse)').matches || innerWidth < 768;

function endIntro() {
  root.classList.remove('intro', 'intro-live', 'intro-leaving');
  document.querySelector('.intro-splash')?.remove();
}

class PfSmoke extends HTMLElement {
  private raf = 0;
  private running = false;
  private cleanup: (() => void)[] = [];

  async connectedCallback() {
    const intro = root.classList.contains('intro');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = document.createElement('canvas').getContext('webgl');
    if (reduced || !gl) return endIntro();

    // Failsafe: never keep the visitor behind the splash if loading stalls.
    const failsafe = intro ? setTimeout(endIntro, 6000) : 0;
    if (!intro) await new Promise<void>((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 300)));

    try {
      const THREE = await import('three');
      clearTimeout(failsafe);
      this.start(THREE, intro);
    } catch {
      clearTimeout(failsafe);
      endIntro();
    }
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.raf);
    this.cleanup.forEach((fn) => fn());
  }

  private start(THREE: typeof import('three'), intro: boolean) {
    const mobile = coarse();
    const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 4 || ((navigator as any).deviceMemory ?? 8) <= 2;
    let scale = mobile ? 0.35 : lowEnd ? 0.4 : 0.5; // render scale relative to CSS pixels
    const minInterval = mobile ? 1000 / 30 : 0;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    this.append(renderer.domElement);

    const color = (name: string) => new THREE.Color(getComputedStyle(root).getPropertyValue(name).trim() || '#888888');
    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uReveal: { value: intro ? 0 : 1 },
      uIntro: { value: intro ? 1 : 0 },
      uFade: { value: 1 },
      uLight: { value: 0 },
      uVel: { value: 0 },
      uColA: { value: color('--accent') },
      uColB: { value: color('--accent-2') },
      uBg: { value: color('--bg') },
    };
    const syncTheme = () => {
      uniforms.uColA.value = color('--accent');
      uniforms.uColB.value = color('--accent-2');
      uniforms.uBg.value = color('--bg');
      uniforms.uLight.value = root.dataset.theme === 'light' ? 1 : 0;
    };
    syncTheme();
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: `#define OCT ${mobile ? 4 : 5}\n${FRAG}`,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let w = 0;
    let h = 0;
    const resize = () => {
      // Ignore small height-only changes (mobile URL bar) to avoid reallocating buffers.
      if (w && innerWidth === w && Math.abs(innerHeight - h) < 150) return;
      w = innerWidth;
      h = innerHeight;
      renderer.setPixelRatio(scale);
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    };
    resize();
    addEventListener('resize', resize);

    // Pointer (mouse + touch)
    const target = new THREE.Vector2(0.5, 0.5);
    let lastX = -1;
    let lastY = -1;
    const onMove = (e: PointerEvent) => {
      target.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight);
      if (lastX >= 0) uniforms.uVel.value = Math.min(1.5, uniforms.uVel.value + Math.hypot(e.clientX - lastX, e.clientY - lastY) / 60);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    addEventListener('pointermove', onMove, { passive: true });

    // Intro
    let introStart = 0;
    let skipAt = 0;
    const splash = document.querySelector<HTMLElement>('.intro-splash');
    const skip = () => (skipAt ||= performance.now());
    if (intro && splash) {
      splash.addEventListener('pointerdown', skip);
      addEventListener('keydown', skip, { once: true });
      scrollTo(0, 0);
    }

    // Visibility: pause when tab hidden or hero scrolled away.
    const visible = () => !document.hidden && (introStart > 0 && uniforms.uIntro.value ? true : scrollY < innerHeight * 1.3);
    const wake = () => {
      if (!this.running && visible()) {
        this.running = true;
        this.raf = requestAnimationFrame(frame);
      }
    };
    addEventListener('scroll', wake, { passive: true });
    document.addEventListener('visibilitychange', wake);

    // Adaptive resolution
    let slow = 0;
    let frames = 0;
    let last = 0;
    let acc = 0;
    let t0 = performance.now();

    const frame = (now: number) => {
      if (!visible()) {
        this.running = false;
        return;
      }
      this.raf = requestAnimationFrame(frame);
      if (now - last < minInterval) return;
      const dt = now - last;
      last = now;

      uniforms.uTime.value = (now - t0) / 1000;
      uniforms.uFade.value = clamp01(1 - scrollY / (innerHeight * 1.1));
      uniforms.uVel.value *= 0.93;
      uniforms.uMouse.value.lerp(target, 0.08);

      if (intro && uniforms.uIntro.value) {
        if (!introStart) {
          introStart = now;
          root.classList.add('intro-live');
        }
        const natural = clamp01((now - introStart - 700) / 2800);
        const skipped = skipAt ? clamp01((now - skipAt) / 600) : 0;
        const r = Math.max(ease(natural), ease(skipped));
        uniforms.uReveal.value = r;
        if (r > 0.45) root.classList.add('intro-leaving');
        if (r >= 1) {
          uniforms.uIntro.value = 0;
          endIntro();
        }
      }

      renderer.render(scene, camera);

      // Frame-time watchdog: step the render scale down if we are consistently slow.
      if (frames++ > 10 && dt > 0) {
        acc += dt;
        if (frames % 30 === 0) {
          slow = acc / 30 > (mobile ? 45 : 24) ? slow + 1 : 0;
          acc = 0;
          if (slow >= 2 && scale > 0.22) {
            scale *= 0.8;
            w = 0;
            resize();
            slow = 0;
          }
        }
      }
    };
    wake();

    this.cleanup.push(() => {
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onMove);
      removeEventListener('scroll', wake);
      document.removeEventListener('visibilitychange', wake);
      themeObserver.disconnect();
      renderer.dispose();
      material.dispose();
    });
  }
}

customElements.define('pf-smoke', PfSmoke);
