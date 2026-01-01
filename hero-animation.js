/**
 * HIATO — Three.js Liquid Background
 * An immersive, flowing shader-based animation
 */

class LiquidBackground {
    constructor() {
        this.canvas = document.getElementById('hero-canvas');
        if (!this.canvas) return;

        this.mouse = { x: 0.5, y: 0.5 };
        this.targetMouse = { x: 0.5, y: 0.5 };
        this.time = 0;

        this.init();
        this.setupEvents();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shader Material
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uColor1: { value: new THREE.Color(0x6366f1) }, // Indigo/violet
                uColor2: { value: new THREE.Color(0x0a0a0a) }, // Near black
                uColor3: { value: new THREE.Color(0x7c3aed) }, // Purple
                uColor4: { value: new THREE.Color(0xec4899) }, // Magenta/pink
                uColor5: { value: new THREE.Color(0x06b6d4) }  // Cyan
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                uniform vec2 uResolution;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec3 uColor3;
                uniform vec3 uColor4;
                uniform vec3 uColor5;
                
                varying vec2 vUv;
                
                // Simplex noise functions
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                    
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }
                
                // Fractal Brownian Motion
                float fbm(vec3 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    float frequency = 1.0;
                    
                    for (int i = 0; i < 6; i++) {
                        value += amplitude * snoise(p * frequency);
                        amplitude *= 0.5;
                        frequency *= 2.0;
                    }
                    return value;
                }
                
                void main() {
                    vec2 uv = vUv;
                    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
                    
                    // Mouse influence - more reactive
                    vec2 mouseInfluence = (uMouse - 0.5) * 0.4;
                    
                    // Create flowing liquid effect
                    float time = uTime * 0.2;
                    
                    // Multiple layers of noise for organic flow
                    vec3 pos1 = vec3(uv * aspect * 1.8 + mouseInfluence, time);
                    vec3 pos2 = vec3(uv * aspect * 2.5 - mouseInfluence * 0.7, time * 0.8 + 100.0);
                    vec3 pos3 = vec3(uv * aspect * 3.2 + mouseInfluence * 0.4, time * 1.2 + 200.0);
                    vec3 pos4 = vec3(uv * aspect * 1.2, time * 0.5 + 300.0);
                    
                    float noise1 = fbm(pos1);
                    float noise2 = fbm(pos2 + noise1 * 0.6);
                    float noise3 = fbm(pos3 + noise2 * 0.4);
                    float noise4 = fbm(pos4 + noise3 * 0.3);
                    
                    // Combine noises for rich liquid flow
                    float flow1 = noise1 * 0.5 + 0.5;
                    float flow2 = noise2 * 0.5 + 0.5;
                    float flow3 = noise3 * 0.5 + 0.5;
                    float flow4 = noise4 * 0.5 + 0.5;
                    
                    // Start with dark base
                    vec3 color = uColor2;
                    
                    // Layer 1: Deep purple base flow
                    float layer1 = smoothstep(0.3, 0.7, flow1);
                    color = mix(color, uColor3 * 0.8, layer1 * 0.7);
                    
                    // Layer 2: Indigo/violet mid tones
                    float layer2 = smoothstep(0.4, 0.65, flow2);
                    color = mix(color, uColor1, layer2 * 0.6);
                    
                    // Layer 3: Magenta/pink highlights
                    float layer3 = smoothstep(0.5, 0.8, flow3);
                    color = mix(color, uColor4, layer3 * 0.5);
                    
                    // Layer 4: Cyan accents
                    float layer4 = smoothstep(0.6, 0.85, flow4);
                    color = mix(color, uColor5, layer4 * 0.4);
                    
                    // Add iridescent shimmer
                    float shimmer = sin(flow1 * 10.0 + time * 2.0) * 0.5 + 0.5;
                    vec3 shimmerColor = mix(uColor4, uColor5, shimmer);
                    color = mix(color, shimmerColor, smoothstep(0.55, 0.75, flow2) * 0.3);
                    
                    // Mouse glow - purple/magenta blend
                    float mouseGlow = 1.0 - length((uv - uMouse) * aspect * 1.2);
                    mouseGlow = smoothstep(0.0, 0.6, mouseGlow);
                    vec3 glowColor = mix(uColor3, uColor4, sin(time * 3.0) * 0.5 + 0.5);
                    color += glowColor * mouseGlow * 0.25;
                    
                    // Subtle vignette - keeps focus on center
                    float vignette = 1.0 - length((uv - 0.5) * 1.1);
                    vignette = smoothstep(0.0, 0.8, vignette);
                    color *= vignette * 0.85 + 0.15;
                    
                    // Boost saturation slightly
                    float luma = dot(color, vec3(0.299, 0.587, 0.114));
                    color = mix(vec3(luma), color, 1.2);
                    
                    // Very subtle grain
                    float grain = snoise(vec3(uv * 400.0, uTime * 8.0)) * 0.015;
                    color += grain;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        // Fullscreen quad
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.mesh);
    }

    setupEvents() {
        // Mouse move
        window.addEventListener('mousemove', (e) => {
            this.targetMouse.x = e.clientX / window.innerWidth;
            this.targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
        });

        // Touch move
        window.addEventListener('touchmove', (e) => {
            if (e.touches[0]) {
                this.targetMouse.x = e.touches[0].clientX / window.innerWidth;
                this.targetMouse.y = 1.0 - (e.touches[0].clientY / window.innerHeight);
            }
        });

        // Resize
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.016;

        // Smooth mouse movement
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Update uniforms
        this.material.uniforms.uTime.value = this.time;
        this.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LiquidBackground();
});

