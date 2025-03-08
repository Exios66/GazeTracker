import type { GazeData } from '../types/gazeData';

export interface GazeMetrics {
  averageConfidence: number;
  fixationCount: number;
  averageFixationDuration: number;
  saccadeCount: number;
  averageSaccadeLength: number;
  totalDuration: number;
}

const FIXATION_THRESHOLD = 30; // pixels
const SACCADE_THRESHOLD = 100; // pixels
const MIN_CONFIDENCE = 0.3;

export function computeGazeMetrics(gazeData: GazeData[]): GazeMetrics {
  if (!gazeData.length) {
    return {
      averageConfidence: 0,
      fixationCount: 0,
      averageFixationDuration: 0,
      saccadeCount: 0,
      averageSaccadeLength: 0,
      totalDuration: 0
    };
  }

  // Filter out low confidence points
  const validPoints = gazeData.filter(d => (d.confidence || 0) > MIN_CONFIDENCE);
  
  if (validPoints.length === 0) {
    return {
      averageConfidence: 0,
      fixationCount: 0,
      averageFixationDuration: 0,
      saccadeCount: 0,
      averageSaccadeLength: 0,
      totalDuration: 0
    };
  }

  // Calculate average confidence
  const averageConfidence = validPoints.reduce((sum, d) => sum + (d.confidence || 0), 0) / validPoints.length;

  // Identify fixations and saccades
  let fixationCount = 0;
  let totalFixationDuration = 0;
  let currentFixationStart = validPoints[0].timestamp || 0;
  let saccadeCount = 0;
  let totalSaccadeLength = 0;

  validPoints.forEach((point, i) => {
    if (i === 0) return;

    const prev = validPoints[i - 1];
    const distance = Math.sqrt(
      Math.pow((point.x - prev.x), 2) + 
      Math.pow((point.y - prev.y), 2)
    );

    if (distance < FIXATION_THRESHOLD) {
      // Continue current fixation
      if (i === validPoints.length - 1) {
        // End of data, count the last fixation
        const duration = (point.timestamp || 0) - currentFixationStart;
        if (duration > 100) { // Minimum 100ms for a fixation
          fixationCount++;
          totalFixationDuration += duration;
        }
      }
    } else {
      // End of fixation, start of saccade
      const fixationDuration = (prev.timestamp || 0) - currentFixationStart;
      if (fixationDuration > 100) {
        fixationCount++;
        totalFixationDuration += fixationDuration;
      }

      if (distance > SACCADE_THRESHOLD) {
        saccadeCount++;
        totalSaccadeLength += distance;
      }

      currentFixationStart = point.timestamp || 0;
    }
  });

  const totalDuration = (validPoints[validPoints.length - 1].timestamp || 0) - (validPoints[0].timestamp || 0);

  return {
    averageConfidence,
    fixationCount,
    averageFixationDuration: fixationCount ? totalFixationDuration / fixationCount : 0,
    saccadeCount,
    averageSaccadeLength: saccadeCount ? totalSaccadeLength / saccadeCount : 0,
    totalDuration
  };
} 