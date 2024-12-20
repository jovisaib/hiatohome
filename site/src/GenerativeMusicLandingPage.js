import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Button = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = "font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700",
    secondary: "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20"
  };
  
  return (
    <button {...props} className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </button>
  );
};

const GenerativeMusicLandingPage = () => {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create multiple shapes for a more complex composition
    const shapes = [];
    
    // Main torus knot
    const mainGeometry = new THREE.TorusKnotGeometry(1.2, 0.3, 300, 50, 2, 5);
    const mainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vNoise;
        
        //	Classic Perlin 3D Noise
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
        
        float noise(vec3 P){
          vec3 Pi0 = floor(P);
          vec3 Pi1 = Pi0 + vec3(1.0);
          Pi0 = mod(Pi0, 289.0);
          Pi1 = mod(Pi1, 289.0);
          vec3 Pf0 = fract(P);
          vec3 Pf1 = Pf0 - vec3(1.0);
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;
          
          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);
          
          vec4 gx0 = ixy0 / 7.0;
          vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);
          
          vec4 gx1 = ixy1 / 7.0;
          vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);
          
          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
          
          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;
          
          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);
          
          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
          return 2.2 * n_xyz;
        }
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          // Create more organic movement
          float slowTime = time * 0.3;
          vec3 p = position;
          
          // Layer multiple noise frequencies
          float noiseScale1 = 2.0;
          float noiseScale2 = 4.0;
          float noiseScale3 = 8.0;
          
          float noise1 = noise(vec3(p.x * noiseScale1 + slowTime, p.y * noiseScale1 + slowTime, p.z * noiseScale1));
          float noise2 = noise(vec3(p.x * noiseScale2 - slowTime, p.y * noiseScale2, p.z * noiseScale2)) * 0.5;
          float noise3 = noise(vec3(p.x * noiseScale3, p.y * noiseScale3 - slowTime, p.z * noiseScale3)) * 0.25;
          
          vNoise = noise1 + noise2 + noise3;
          
          // Apply the layered noise
          p += normal * (vNoise * 0.15);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vNoise;
        
        void main() {
          // Rich, deep color palette that matches the site design
          vec3 color1 = vec3(0.6, 0.0, 1.0);  // Vibrant purple
          vec3 color2 = vec3(0.2, 0.0, 0.8);  // Deep purple
          vec3 color3 = vec3(0.0, 0.4, 1.0);  // Electric blue
          vec3 color4 = vec3(0.8, 0.0, 0.6);  // Magenta
          
          // Create smooth color transitions
          float t1 = sin(vUv.x * 8.0 + time) * 0.5 + 0.5;
          float t2 = cos(vUv.y * 6.0 - time * 0.5) * 0.5 + 0.5;
          float t3 = sin(vNoise * 4.0 + time * 0.3) * 0.5 + 0.5;
          
          // Mix colors based on noise and position
          vec3 baseColor = mix(color1, color2, t1);
          baseColor = mix(baseColor, color3, t2);
          baseColor = mix(baseColor, color4, t3);
          
          // Add subtle rim lighting effect
          vec3 viewDirection = normalize(vPosition);
          float rimLight = 1.0 - max(dot(viewDirection, vec3(0.0, 0.0, 1.0)), 0.0);
          rimLight = pow(rimLight, 3.0);
          
          // Final color with rim light
          vec3 finalColor = mix(baseColor, vec3(1.0), rimLight * 0.3);
          
          // Gradient opacity for better blending
          float opacity = 0.9 - (rimLight * 0.3);
          
          gl_FragColor = vec4(finalColor, opacity);
        }
      `,
      transparent: true,
    });

    const mainShape = new THREE.Mesh(mainGeometry, mainMaterial);
    shapes.push(mainShape);
    scene.add(mainShape);

    // Add ambient particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const positions = new Float32Array(particlesCount * 3);
    const scales = new Float32Array(particlesCount);

    for(let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
      scales[i] = Math.random();
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        size: { value: 15.0 },
      },
      vertexShader: `
        uniform float time;
        uniform float size;
        attribute float scale;
        varying float vScale;
        
        void main() {
          vScale = scale;
          
          // Animate particles in a flowing motion
          vec3 pos = position;
          float movement = time * 0.2;
          pos.x += sin(pos.y * 0.5 + movement) * 0.3;
          pos.y += cos(pos.x * 0.5 + movement) * 0.3;
          pos.z += sin(pos.x * pos.y * 0.1 + movement) * 0.3;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * scale * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vScale;
        
        void main() {
          // Soft particle shape
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float r = length(xy);
          if(r > 0.5) discard;
          
          // Gradient from center
          float alpha = smoothstep(0.5, 0.0, r);
          
          // Color based on scale
          vec3 color = mix(
            vec3(0.6, 0.0, 1.0),  // Purple
            vec3(0.0, 0.4, 1.0),  // Blue
            vScale
          );
          
          gl_FragColor = vec4(color, alpha * 0.5);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    camera.position.z = 4;

    const animate = (time) => {
      requestAnimationFrame(animate);
      
      // Smooth, organic rotation for main shape
      mainShape.rotation.x += 0.001;
      mainShape.rotation.y += 0.002;
      
      // Update uniforms
      const t = time * 0.001;
      mainMaterial.uniforms.time.value = t;
      particlesMaterial.uniforms.time.value = t;
      
      // Gentle floating motion
      mainShape.position.y = Math.sin(t * 0.5) * 0.1;
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-black via-purple-900 to-indigo-900">
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
        <div className="space-y-8 text-center">
          {/* Logo/Brand */}
          <div className="mb-12 relative">
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200 filter drop-shadow-lg">
              Hiato
            </h1>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
          </div>
          
          {/* Tagline */}
          <div className="space-y-4 text-xl md:text-2xl font-light text-white/90 tracking-wide max-w-3xl mx-auto">
            <p className="leading-relaxed">
              From <span className="font-medium text-purple-300">imagination to reality</span>, we shape
              <span className="font-medium text-indigo-300"> living soundscapes</span>
            </p>
            <p className="text-white/70 font-light tracking-wider text-lg md:text-xl">
              Creating moments where music and visuals breathe as one
            </p>
            <p className="text-white/50 text-base md:text-lg font-light mt-4">
              A new way to experience art
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Button variant="primary">
              Discover Works
            </Button>
            <Button variant="secondary">
              Experience Hiato
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white/50 text-sm tracking-widest">
        © 2024 Hiato. Crafting reality through sound and vision
      </div>
    </div>
  );
};

export default GenerativeMusicLandingPage;