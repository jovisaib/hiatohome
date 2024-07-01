import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Button = ({ children, ...props }) => (
  <button {...props} className="bg-white text-purple-600 font-bold py-3 px-6 rounded-full text-lg transition-all duration-300 hover:bg-opacity-90 hover:scale-105 shadow-lg">
    {children}
  </button>
);

const Alert = ({ children }) => (
  <div className="absolute bottom-4 left-4 right-4 bg-purple-900 bg-opacity-80 text-white max-w-md mx-auto p-4 rounded-lg shadow-lg">
    {children}
  </div>
);

const GenerativeMusicLandingPage = () => {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xfff0e6); // Light peach background
    mountRef.current.appendChild(renderer.domElement);

    // Create fluid shape
    const geometry = new THREE.TorusGeometry(1, 0.3, 128, 128);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          float noise = sin(8.0 * p.x + time) * cos(8.0 * p.y + time) * sin(8.0 * p.z + time) * 0.1;
          p += normal * noise;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec3 color1 = vec3(0.4, 0.2, 0.8); // Purple
          vec3 color2 = vec3(0.2, 0.4, 0.8); // Blue
          vec3 color3 = vec3(0.8, 0.2, 0.6); // Pink
          
          float t = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
          vec3 color = mix(color1, color2, t);
          color = mix(color, color3, sin(vUv.y * 10.0 + time * 0.5) * 0.5 + 0.5);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const fluidShape = new THREE.Mesh(geometry, material);
    scene.add(fluidShape);

    camera.position.z = 3;

    // Animation
    const animate = (time) => {
      requestAnimationFrame(animate);
      fluidShape.rotation.x += 0.005;
      fluidShape.rotation.y += 0.005;
      material.uniforms.time.value = time * 0.001;
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
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

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ backgroundColor: '#fff0e6' }}>
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-8xl font-extrabold mb-4 text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] animate-pulse">
          Hiato
        </h1>
        <div className="text-2xl lg:text-4xl mb-8 text-center font-semibold tracking-wide max-w-4xl">
          <span className="block">We are catalysts for music</span>
          <span className="block">and film production</span>
          <span className="block">with pure silicon and AI.</span>
        </div>
      </div>
    </div>
  );
};

export default GenerativeMusicLandingPage;