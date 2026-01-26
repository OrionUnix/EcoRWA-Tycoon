import { useEffect, useRef, useState } from 'react';

export default function AnimatedCity() {
  const svgRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAndAnimateSVG = async () => {
      try {
        const response = await fetch('/assets/isometric_city.svg');
        const svgText = await response.text();

        if (svgRef.current) {
          svgRef.current.innerHTML = svgText;
          setIsLoaded(true);

          // Attendre que le SVG soit dans le DOM
          setTimeout(() => {
            const car = document.getElementById('car_01') as SVGElement | null;
            if (car) {
              animateCar(car);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Erreur de chargement du SVG:', error);
      }
    };

    loadAndAnimateSVG();
  }, []);

  const animateCar = (car: SVGElement) => {
    // Position initiale de la voiture (extraite du SVG)
    const initialX = 53.63;
    const initialY = -37.22;

    // Trajectoire : avancer puis tourner à droite
    const path = [
      { x: 53.63, y: -37.22, rotation: 0 },     // Départ
      { x: 53.63, y: -10, rotation: 0 },        // Avancer vers le haut
      { x: 53.63, y: 0, rotation: 0 },          // Continue
      { x: 53.63, y: 10, rotation: 0 },         // Continue
      { x: 55, y: 15, rotation: 15 },           // Début du virage
      { x: 60, y: 18, rotation: 45 },           // Virage à droite
      { x: 70, y: 20, rotation: 90 },           // Virage complet
      { x: 85, y: 20, rotation: 90 },           // Continue à droite
      { x: 100, y: 20, rotation: 90 },          // Continue
      { x: 120, y: 20, rotation: 90 }           // Sortie
    ];

    let currentStep = 0;
    const duration = 8000; // 8 secondes pour le parcours complet
    const steps = path.length - 1;
    const stepDuration = duration / steps;

    const animate = () => {
      if (currentStep >= steps) {
        // Recommencer l'animation
        currentStep = 0;
        setTimeout(animate, 1000); // Pause de 1 seconde
        return;
      }

      const start = path[currentStep];
      const end = path[currentStep + 1];
      const startTime = Date.now();

      const step = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / stepDuration, 1);

        // Interpolation douce (easing)
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const x = start.x + (end.x - start.x) * easeProgress;
        const y = start.y + (end.y - start.y) * easeProgress;
        const rotation = start.rotation + (end.rotation - start.rotation) * easeProgress;

        // Appliquer la transformation
        car.setAttribute('transform', `translate(${x}, ${y}) rotate(${rotation})`);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          currentStep++;
          animate();
        }
      };

      requestAnimationFrame(step);
    };

    animate();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={svgRef}
        className="w-full h-full"
        style={{
          filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
          animation: isLoaded ? 'float 6s ease-in-out infinite' : 'none'
        }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xl font-bold animate-pulse">
            Chargement de la ville...
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}