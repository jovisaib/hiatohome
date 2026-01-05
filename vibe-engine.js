/**
 * HIATO — Generative Art Engine
 *
 * A shader-based generative art system with real-time parameter control
 */

class VibeEngine {
    constructor() {
        this.canvas = document.getElementById('vibe-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.material = null;
        this.particles = null;

        // State
        this.params = {
            speed: 0.3,
            complexity: 0.5,
            form: 0.5,
            particles: 0.4,
            mood: 'calm',
            palette: 'aurora'
        };

        // Animation
        this.time = 0;
        this.mouse = { x: 0.5, y: 0.5 };
        this.targetMouse = { x: 0.5, y: 0.5 };
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();

        // Palettes
        this.palettes = {
            aurora: {
                colors: ['#00a8ff', '#7c3aed', '#ec4899', '#06b6d4', '#0a0a0a'],
                accent: '#00a8ff'
            },
            ember: {
                colors: ['#ff6b35', '#f7931e', '#ffcc02', '#ff4757', '#1a0a05'],
                accent: '#ff6b35'
            },
            forest: {
                colors: ['#2d5a27', '#5a8f3e', '#8bc34a', '#c8e6c9', '#0a1208'],
                accent: '#5a8f3e'
            },
            ocean: {
                colors: ['#0077b6', '#00b4d8', '#90e0ef', '#023e8a', '#001219'],
                accent: '#00b4d8'
            },
            monochrome: {
                colors: ['#ffffff', '#888888', '#444444', '#222222', '#000000'],
                accent: '#ffffff'
            },
            neon: {
                colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#0a0012'],
                accent: '#ff00ff'
            }
        };

        // Mood presets
        this.moods = {
            calm: { speed: 0.2, complexity: 0.3, form: 0.3, turbulence: 0.2 },
            dreamy: { speed: 0.15, complexity: 0.5, form: 0.2, turbulence: 0.4 },
            chaotic: { speed: 0.8, complexity: 0.9, form: 0.7, turbulence: 0.9 },
            cosmic: { speed: 0.4, complexity: 0.7, form: 0.5, turbulence: 0.6 },
            aggressive: { speed: 1.0, complexity: 0.8, form: 0.9, turbulence: 0.85 }
        };

        this.init();
        this.setupControls();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.updateSize();

        // Create main shader plane
        this.createShaderPlane();

        // Create particle system
        this.createParticles();

        // Events
        window.addEventListener('resize', () => this.updateSize());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    }

    createShaderPlane() {
        const geometry = new THREE.PlaneGeometry(2, 2);

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;

            uniform float uTime;
            uniform vec2 uMouse;
            uniform vec2 uResolution;
            uniform float uSpeed;
            uniform float uComplexity;
            uniform float uForm;
            uniform float uTurbulence;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            uniform vec3 uColorBg;

            varying vec2 vUv;

            // Simplex 3D Noise
            vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);

                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);

                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;

                i = mod(i, 289.0);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

                float n_ = 1.0/7.0;
                vec3 ns = n_ * D.wyz - D.xzx;

                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);

                vec4 x = x_ * ns.x + ns.yyyy;
                vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);

                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);

                vec4 s0 = floor(b0) * 2.0 + 1.0;
                vec4 s1 = floor(b1) * 2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));

                vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

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
            float fbm(vec3 p, int octaves) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                float maxValue = 0.0;

                for (int i = 0; i < 8; i++) {
                    if (i >= octaves) break;
                    value += amplitude * snoise(p * frequency);
                    maxValue += amplitude;
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }

                return value / maxValue;
            }

            // Domain warping
            float domainWarp(vec3 p, float strength) {
                vec3 q = vec3(
                    fbm(p + vec3(0.0, 0.0, 0.0), 4),
                    fbm(p + vec3(5.2, 1.3, 2.8), 4),
                    fbm(p + vec3(2.1, 7.8, 4.5), 4)
                );

                vec3 r = vec3(
                    fbm(p + strength * q + vec3(1.7, 9.2, 3.1), 4),
                    fbm(p + strength * q + vec3(8.3, 2.8, 5.4), 4),
                    fbm(p + strength * q + vec3(4.2, 5.1, 7.8), 4)
                );

                return fbm(p + strength * r, 6);
            }

            // SDF shapes for geometric mode
            float sdBox(vec2 p, vec2 b) {
                vec2 d = abs(p) - b;
                return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
            }

            float sdCircle(vec2 p, float r) {
                return length(p) - r;
            }

            float sdTriangle(vec2 p, float r) {
                const float k = sqrt(3.0);
                p.x = abs(p.x) - r;
                p.y = p.y + r / k;
                if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
                p.x -= clamp(p.x, -2.0 * r, 0.0);
                return -length(p) * sign(p.y);
            }

            // Blend colors
            vec3 palette(float t, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
                t = clamp(t, 0.0, 1.0);
                if (t < 0.33) {
                    return mix(c1, c2, t * 3.0);
                } else if (t < 0.66) {
                    return mix(c2, c3, (t - 0.33) * 3.0);
                } else {
                    return mix(c3, c4, (t - 0.66) * 3.0);
                }
            }

            void main() {
                vec2 uv = vUv;
                vec2 st = (uv - 0.5) * 2.0;
                st.x *= uResolution.x / uResolution.y;

                float t = uTime * uSpeed * 0.5;

                // Mouse influence
                vec2 mouseInfluence = (uMouse - 0.5) * 2.0;
                float mouseDist = length(st - mouseInfluence);
                float mouseGlow = smoothstep(1.5, 0.0, mouseDist) * 0.3;

                // Create base noise
                int octaves = int(3.0 + uComplexity * 5.0);
                vec3 noiseCoord = vec3(st * (1.0 + uComplexity * 2.0), t);

                // Domain warping based on turbulence
                float warpStrength = uTurbulence * 4.0;
                float n = domainWarp(noiseCoord, warpStrength);

                // Add layers
                float n2 = fbm(vec3(st * 3.0 + n * 0.5, t * 1.5), octaves);
                float n3 = fbm(vec3(st * 5.0 - n2 * 0.3, t * 0.7), octaves);

                // Geometric vs Organic blending
                float geo = 0.0;
                if (uForm > 0.3) {
                    float geoScale = 2.0 + uComplexity * 4.0;
                    vec2 gp = st * geoScale;
                    vec2 gridId = floor(gp);
                    vec2 gridUv = fract(gp) - 0.5;

                    float randomVal = fract(sin(dot(gridId, vec2(12.9898, 78.233))) * 43758.5453);
                    float pulse = sin(t * 2.0 + randomVal * 6.28) * 0.5 + 0.5;

                    if (randomVal < 0.33) {
                        geo = smoothstep(0.02, 0.0, abs(sdCircle(gridUv, 0.2 + pulse * 0.1)));
                    } else if (randomVal < 0.66) {
                        geo = smoothstep(0.02, 0.0, abs(sdBox(gridUv, vec2(0.15 + pulse * 0.05))));
                    } else {
                        geo = smoothstep(0.02, 0.0, abs(sdTriangle(gridUv, 0.25 + pulse * 0.08)));
                    }
                }

                // Mix organic and geometric
                float shape = mix(n + n2 * 0.5 + n3 * 0.25, n + geo * 0.5, uForm);

                // Color mapping
                float colorVal = shape * 0.5 + 0.5;
                colorVal += mouseGlow;

                vec3 color = palette(colorVal, uColor1, uColor2, uColor3, uColor4);

                // Add shimmer
                float shimmer = snoise(vec3(st * 20.0, t * 3.0)) * 0.5 + 0.5;
                shimmer = pow(shimmer, 4.0) * 0.15 * uComplexity;
                color += shimmer;

                // Mouse glow effect
                vec3 glowColor = mix(uColor1, uColor3, 0.5);
                color += glowColor * mouseGlow * (0.5 + uTurbulence * 0.5);

                // Vignette
                float vignette = 1.0 - smoothstep(0.5, 1.5, length(st));
                color = mix(uColorBg, color, vignette * 0.7 + 0.3);

                // Subtle grain
                float grain = (fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
                color += grain;

                // Tone mapping
                color = color / (color + vec3(1.0));
                color = pow(color, vec3(0.95));

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const palette = this.palettes[this.params.palette];

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uSpeed: { value: this.params.speed },
                uComplexity: { value: this.params.complexity },
                uForm: { value: this.params.form },
                uTurbulence: { value: this.moods[this.params.mood].turbulence },
                uColor1: { value: new THREE.Color(palette.colors[0]) },
                uColor2: { value: new THREE.Color(palette.colors[1]) },
                uColor3: { value: new THREE.Color(palette.colors[2]) },
                uColor4: { value: new THREE.Color(palette.colors[3]) },
                uColorBg: { value: new THREE.Color(palette.colors[4]) }
            }
        });

        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);
    }

    createParticles() {
        const count = 2000;
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 2] = Math.random() * 0.5;

            velocities[i * 3] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 2] = 0;

            sizes[i] = Math.random() * 3 + 1;
            phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const palette = this.palettes[this.params.palette];

        const particleMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                attribute float phase;
                uniform float uTime;
                uniform float uSpeed;
                uniform float uParticleIntensity;
                varying float vAlpha;
                varying float vPhase;

                void main() {
                    vPhase = phase;
                    vAlpha = uParticleIntensity;

                    vec3 pos = position;
                    pos.x += sin(uTime * uSpeed + phase) * 0.1;
                    pos.y += cos(uTime * uSpeed * 0.7 + phase) * 0.1;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * uParticleIntensity * (200.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uParticleColor;
                varying float vAlpha;
                varying float vPhase;

                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;

                    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * 0.6;
                    gl_FragColor = vec4(uParticleColor, alpha);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uSpeed: { value: this.params.speed },
                uParticleIntensity: { value: this.params.particles },
                uParticleColor: { value: new THREE.Color(palette.accent) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, particleMaterial);
        this.particles.position.z = 0.1;
        this.scene.add(this.particles);
        this.particleMaterial = particleMaterial;
    }

    updateSize() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.renderer.setSize(width, height);

        if (this.material) {
            this.material.uniforms.uResolution.value.set(width, height);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.targetMouse.x = (e.clientX - rect.left) / rect.width;
        this.targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;

        // Update coords display
        const coordsDisplay = document.getElementById('mouse-coords');
        if (coordsDisplay) {
            coordsDisplay.textContent = `${this.targetMouse.x.toFixed(2)}, ${this.targetMouse.y.toFixed(2)}`;
        }
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.targetMouse.x = (e.touches[0].clientX - rect.left) / rect.width;
            this.targetMouse.y = 1 - (e.touches[0].clientY - rect.top) / rect.height;
        }
    }

    setParam(param, value) {
        this.params[param] = value;
        this.updateShaderUniforms();
        this.updateCodePreview();
    }

    setMood(mood) {
        this.params.mood = mood;
        const moodParams = this.moods[mood];

        // Animate transition
        this.animateParam('speed', moodParams.speed);
        this.animateParam('complexity', moodParams.complexity);
        this.animateParam('form', moodParams.form);

        // Update turbulence uniform directly
        if (this.material) {
            this.material.uniforms.uTurbulence.value = moodParams.turbulence;
        }

        // Update sliders
        document.getElementById('speed-slider').value = moodParams.speed * 100;
        document.getElementById('complexity-slider').value = moodParams.complexity * 100;
        document.getElementById('form-slider').value = moodParams.form * 100;

        // Update display
        document.getElementById('mood-display').textContent = mood.toUpperCase();
        this.updateCodePreview();
    }

    setPalette(paletteName) {
        this.params.palette = paletteName;
        const palette = this.palettes[paletteName];

        if (this.material) {
            this.animateColor('uColor1', palette.colors[0]);
            this.animateColor('uColor2', palette.colors[1]);
            this.animateColor('uColor3', palette.colors[2]);
            this.animateColor('uColor4', palette.colors[3]);
            this.animateColor('uColorBg', palette.colors[4]);
        }

        if (this.particleMaterial) {
            this.particleMaterial.uniforms.uParticleColor.value = new THREE.Color(palette.accent);
        }

        document.getElementById('palette-display').textContent = paletteName.toUpperCase();
        this.updateCodePreview();
    }

    animateParam(param, targetValue) {
        const startValue = this.params[param];
        const startTime = performance.now();
        const duration = 800;

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.params[param] = startValue + (targetValue - startValue) * eased;
            this.updateShaderUniforms();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    animateColor(uniformName, targetHex) {
        const startColor = this.material.uniforms[uniformName].value.clone();
        const targetColor = new THREE.Color(targetHex);
        const startTime = performance.now();
        const duration = 600;

        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.material.uniforms[uniformName].value.lerpColors(startColor, targetColor, eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    updateShaderUniforms() {
        if (this.material) {
            this.material.uniforms.uSpeed.value = this.params.speed;
            this.material.uniforms.uComplexity.value = this.params.complexity;
            this.material.uniforms.uForm.value = this.params.form;
        }

        if (this.particleMaterial) {
            this.particleMaterial.uniforms.uSpeed.value = this.params.speed;
            this.particleMaterial.uniforms.uParticleIntensity.value = this.params.particles;
        }
    }

    updateCodePreview() {
        const codePreview = document.getElementById('code-preview');
        if (codePreview) {
            const code = `// HIATO Generative Art
// ${this.params.mood} · ${this.params.palette}
speed: ${this.params.speed.toFixed(2)}
complexity: ${this.params.complexity.toFixed(2)}
form: ${this.params.form.toFixed(2)}
particles: ${this.params.particles.toFixed(2)}`;
            codePreview.querySelector('code').textContent = code;
        }
    }

    randomize() {
        const moods = Object.keys(this.moods);
        const palettes = Object.keys(this.palettes);

        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
        const randomParticles = Math.random();

        // Update UI
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mood === randomMood);
        });
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.palette === randomPalette);
        });
        document.getElementById('particles-slider').value = randomParticles * 100;

        this.setMood(randomMood);
        this.setPalette(randomPalette);
        this.setParam('particles', randomParticles);

        this.showToast('Randomized!');
    }

    exportImage() {
        this.renderer.render(this.scene, this.camera);

        // Create a temporary canvas for watermarking
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;

        // Draw the rendered scene
        ctx.drawImage(this.canvas, 0, 0);

        // Add HIATO watermark
        const fontSize = Math.max(24, tempCanvas.width * 0.035);
        ctx.font = `800 ${fontSize}px Syne, sans-serif`;
        ctx.letterSpacing = `${fontSize * 0.3}px`;

        // Position: bottom right with padding
        const padding = fontSize * 1.5;
        const text = 'HIATO';
        const metrics = ctx.measureText(text);
        const x = tempCanvas.width - metrics.width - padding - (fontSize * 0.3 * text.length);
        const y = tempCanvas.height - padding;

        // Subtle shadow for visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = fontSize * 0.3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // White text with slight transparency
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(text, x, y);

        const link = document.createElement('a');
        link.download = `hiato-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();

        this.showToast('Image exported!', 'success');
    }

    showToast(message, type = '') {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast ${type}`;

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update time
        this.time += 0.016;

        // Smooth mouse
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

        // Update uniforms
        if (this.material) {
            this.material.uniforms.uTime.value = this.time;
            this.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
        }

        if (this.particleMaterial) {
            this.particleMaterial.uniforms.uTime.value = this.time;
        }

        // Update particles positions
        if (this.particles && this.params.particles > 0.1) {
            const positions = this.particles.geometry.attributes.position.array;
            const velocities = this.particles.geometry.attributes.velocity.array;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * this.params.speed;
                positions[i + 1] += velocities[i + 1] * this.params.speed;

                // Wrap around
                if (positions[i] > 2) positions[i] = -2;
                if (positions[i] < -2) positions[i] = 2;
                if (positions[i + 1] > 2) positions[i + 1] = -2;
                if (positions[i + 1] < -2) positions[i + 1] = 2;
            }

            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // FPS counter
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate >= 500) {
            this.fps = Math.round(this.frameCount / ((now - this.lastFpsUpdate) / 1000));
            this.frameCount = 0;
            this.lastFpsUpdate = now;

            const fpsDisplay = document.getElementById('fps-display');
            if (fpsDisplay) {
                fpsDisplay.textContent = this.fps;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    setupControls() {
        // Mood presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setMood(btn.dataset.mood);
            });
        });

        // Palette buttons
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setPalette(btn.dataset.palette);
            });
        });

        // Sliders
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.setParam('speed', e.target.value / 100);
        });

        document.getElementById('complexity-slider').addEventListener('input', (e) => {
            this.setParam('complexity', e.target.value / 100);
        });

        document.getElementById('form-slider').addEventListener('input', (e) => {
            this.setParam('form', e.target.value / 100);
        });

        document.getElementById('particles-slider').addEventListener('input', (e) => {
            this.setParam('particles', e.target.value / 100);
        });

        // Action buttons
        document.getElementById('randomize-btn').addEventListener('click', () => {
            this.randomize();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportImage();
        });

        document.getElementById('record-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.classList.toggle('recording');
            const isRecording = btn.classList.contains('recording');
            btn.querySelector('span').textContent = isRecording ? 'Stop' : 'Record';
            this.showToast(isRecording ? 'Recording started' : 'Recording stopped');
        });

        // Copy code
        document.getElementById('copy-code').addEventListener('click', () => {
            const code = document.querySelector('.code-preview code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                this.showToast('Copied to clipboard!', 'success');
            });
        });

        // Panel toggle
        document.getElementById('panel-toggle').addEventListener('click', () => {
            document.querySelector('.control-panel').classList.toggle('collapsed');
            document.querySelector('.vibe-canvas-container').classList.toggle('fullscreen');
            setTimeout(() => this.updateSize(), 500);
        });

        // Mobile panel toggle
        document.getElementById('mobile-toggle').addEventListener('click', (e) => {
            const panel = document.querySelector('.control-panel');
            const toggle = e.currentTarget;
            panel.classList.toggle('mobile-open');
            toggle.classList.toggle('active');
        });

        // Fullscreen
        document.getElementById('fullscreen-toggle').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.randomize();
            } else if (e.key === 'e' || e.key === 'E') {
                this.exportImage();
            } else if (e.key === 'f' || e.key === 'F') {
                document.getElementById('fullscreen-toggle').click();
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.vibeEngine = new VibeEngine();
});
