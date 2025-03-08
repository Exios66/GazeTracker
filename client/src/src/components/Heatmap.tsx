import React, { useEffect, useRef } from 'react';
import { GazeData } from '../types/gazeData';

interface HeatmapProps {
  gazeData: GazeData[];
  width: number;
  height: number;
}

const Heatmap: React.FC<HeatmapProps> = ({ gazeData, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || gazeData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create heatmap data
    const heatmapData = new Uint8ClampedArray(width * height * 4);

    // Plot gaze points
    gazeData.forEach(point => {
      const x = Math.floor(point.x);
      const y = Math.floor(point.y);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        // Add gaussian blur around each point
        const radius = 30;
        const intensity = point.confidence * 255;

        for (let i = -radius; i <= radius; i++) {
          for (let j = -radius; j <= radius; j++) {
            const currentX = x + i;
            const currentY = y + j;

            if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
              const distance = Math.sqrt(i * i + j * j);
              const gaussianFactor = Math.exp(-(distance * distance) / (2 * (radius / 2) * (radius / 2)));
              const index = (currentY * width + currentX) * 4;

              heatmapData[index] = Math.min(255, heatmapData[index] + intensity * gaussianFactor); // Red
              heatmapData[index + 1] = 0; // Green
              heatmapData[index + 2] = 0; // Blue
              heatmapData[index + 3] = Math.min(255, heatmapData[index + 3] + intensity * gaussianFactor); // Alpha
            }
          }
        }
      }
    });

    // Create ImageData and put it on canvas
    const imageData = new ImageData(heatmapData, width, height);
    ctx.putImageData(imageData, 0, 0);

  }, [gazeData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        opacity: 0.6
      }}
    />
  );
};

export default Heatmap;
