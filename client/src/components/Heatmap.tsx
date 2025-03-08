import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GazeData } from '../types/gazeData';

const Heatmap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch or receive gaze data
  const { data: gazeData } = useQuery<GazeData[]>({
    queryKey: ['gaze-data'],
    queryFn: async () => {
      // Mock data for now
      return [];
    }
  });

  useEffect(() => {
    if (!canvasRef.current || !gazeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear previous heatmap
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create heatmap data
    const heatmapData = new Uint8ClampedArray(canvas.width * canvas.height * 4);

    // Process gaze points
    gazeData.forEach(point => {
      const x = Math.floor(point.x);
      const y = Math.floor(point.y);

      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const radius = 30;
        const intensity = (point.confidence || 0.5) * 255;

        // Add gaussian blur around each point
        for (let i = -radius; i <= radius; i++) {
          for (let j = -radius; j <= radius; j++) {
            const currentX = x + i;
            const currentY = y + j;

            if (currentX >= 0 && currentX < canvas.width && currentY >= 0 && currentY < canvas.height) {
              const distance = Math.sqrt(i * i + j * j);
              const gaussianFactor = Math.exp(-(distance * distance) / (2 * (radius / 2) * (radius / 2)));
              const index = (currentY * canvas.width + currentX) * 4;

              heatmapData[index] = Math.min(255, heatmapData[index] + intensity * gaussianFactor); // Red
              heatmapData[index + 1] = 0; // Green
              heatmapData[index + 2] = 0; // Blue
              heatmapData[index + 3] = Math.min(255, heatmapData[index + 3] + intensity * gaussianFactor); // Alpha
            }
          }
        }
      }
    });

    // Create and draw image data
    const imageData = new ImageData(heatmapData, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
  }, [gazeData]);

  return (
    <div className="heatmap">
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          opacity: 0.6,
          zIndex: 9998
        }}
      />
    </div>
  );
};

export default Heatmap; 