import { useEffect, useRef, useState } from 'react';

export default function AnimatedCity() {
  const svgRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSVG = async () => {
      try {
        const response = await fetch('/assets/isometric_city.svg');
        const svgText = await response.text();

        if (svgRef.current) {
          svgRef.current.innerHTML = svgText;
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Erreur de chargement du SVG:', error);
      }
    };

    loadSVG();
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        ref={svgRef}
        className="w-full h-full"
        style={{
          filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))'
        }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xl font-bold">
            Chargement de la ville...
          </div>
        </div>
      )}
    </div>
  );
}