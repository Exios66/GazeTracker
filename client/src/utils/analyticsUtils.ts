import type { GazeData } from '../types/gazeData';

interface FixationData {
  x: number;
  y: number;
  duration: number;
  startTime: number;
  endTime: number;
}

interface SaccadeData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  duration: number;
  velocity: number;
  startTime: number;
  endTime: number;
}

export interface AnalyticsResult {
  // Basic Statistics
  totalDuration: number;
  totalDataPoints: number;
  averageConfidence: number;
  samplingRate: number;

  // Fixations
  fixations: FixationData[];
  averageFixationDuration: number;
  fixationsPerMinute: number;
  totalFixationTime: number;
  fixationPercentage: number;

  // Saccades
  saccades: SaccadeData[];
  averageSaccadeLength: number;
  averageSaccadeVelocity: number;
  saccadesPerMinute: number;

  // Head Movement
  headMovementRange: {
    x: { min: number; max: number; range: number };
    y: { min: number; max: number; range: number };
    z: { min: number; max: number; range: number };
  };
  averageHeadDistance: number;

  // Pupil Data
  averagePupilDiameter: number;
  pupilDiameterRange: { min: number; max: number; range: number };

  // Spatial Distribution
  spatialDensity: {
    xRange: { min: number; max: number; range: number };
    yRange: { min: number; max: number; range: number };
    heatmapData: { x: number; y: number; weight: number }[];
  };
}

const FIXATION_THRESHOLD_PX = 30; // pixels
const FIXATION_DURATION_THRESHOLD = 100; // milliseconds
const SACCADE_VELOCITY_THRESHOLD = 30; // pixels per millisecond

export function analyzeGazeData(gazeData: GazeData[]): AnalyticsResult {
  if (!gazeData.length) {
    throw new Error('No gaze data provided for analysis');
  }

  // Sort data by timestamp
  const sortedData = [...gazeData].sort((a, b) => a.timestamp - b.timestamp);
  const totalDuration = sortedData[sortedData.length - 1].timestamp - sortedData[0].timestamp;

  // Basic Statistics
  const confidenceValues = sortedData.map(d => d.confidence).filter((c): c is number => c !== undefined);
  const averageConfidence = confidenceValues.length ? 
    confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length : 0;
  const samplingRate = (sortedData.length / totalDuration) * 1000; // Convert to Hz

  // Identify Fixations
  const fixations: FixationData[] = [];
  let currentFixation: FixationData | null = null;

  for (let i = 0; i < sortedData.length; i++) {
    const point = sortedData[i];
    
    if (!currentFixation) {
      currentFixation = {
        x: point.x,
        y: point.y,
        duration: 0,
        startTime: point.timestamp,
        endTime: point.timestamp
      };
      continue;
    }

    const distance = Math.sqrt(
      Math.pow(point.x - currentFixation.x, 2) + 
      Math.pow(point.y - currentFixation.y, 2)
    );

    if (distance <= FIXATION_THRESHOLD_PX) {
      // Update fixation center with running average
      const pointCount = (point.timestamp - currentFixation.startTime) / (point.timestamp - sortedData[i-1].timestamp);
      currentFixation.x = (currentFixation.x * pointCount + point.x) / (pointCount + 1);
      currentFixation.y = (currentFixation.y * pointCount + point.y) / (pointCount + 1);
      currentFixation.endTime = point.timestamp;
      currentFixation.duration = currentFixation.endTime - currentFixation.startTime;
    } else {
      if (currentFixation && currentFixation.duration >= FIXATION_DURATION_THRESHOLD) {
        fixations.push({ ...currentFixation });
      }
      currentFixation = {
        x: point.x,
        y: point.y,
        duration: 0,
        startTime: point.timestamp,
        endTime: point.timestamp
      };
    }
  }

  if (currentFixation && currentFixation.duration >= FIXATION_DURATION_THRESHOLD) {
    fixations.push({ ...currentFixation });
  }

  // Identify Saccades
  const saccades: SaccadeData[] = [];
  for (let i = 1; i < sortedData.length; i++) {
    const prev = sortedData[i-1];
    const curr = sortedData[i];
    const timeDiff = curr.timestamp - prev.timestamp;
    const distance = Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + 
      Math.pow(curr.y - prev.y, 2)
    );
    const velocity = distance / timeDiff;

    if (velocity >= SACCADE_VELOCITY_THRESHOLD) {
      saccades.push({
        startX: prev.x,
        startY: prev.y,
        endX: curr.x,
        endY: curr.y,
        length: distance,
        duration: timeDiff,
        velocity,
        startTime: prev.timestamp,
        endTime: curr.timestamp
      });
    }
  }

  // Calculate Head Movement Range
  const headX = sortedData.map(d => d.HeadX).filter((x): x is number => x !== undefined);
  const headY = sortedData.map(d => d.HeadY).filter((y): y is number => y !== undefined);
  const headZ = sortedData.map(d => d.HeadZ).filter((z): z is number => z !== undefined);

  const headMovementRange = {
    x: {
      min: Math.min(...headX),
      max: Math.max(...headX),
      range: Math.max(...headX) - Math.min(...headX)
    },
    y: {
      min: Math.min(...headY),
      max: Math.max(...headY),
      range: Math.max(...headY) - Math.min(...headY)
    },
    z: {
      min: Math.min(...headZ),
      max: Math.max(...headZ),
      range: Math.max(...headZ) - Math.min(...headZ)
    }
  };

  // Calculate Pupil Data
  const pupilDiameters = sortedData.map(d => d.pupilD).filter((d): d is number => d !== undefined);
  const pupilDiameterRange = {
    min: Math.min(...pupilDiameters),
    max: Math.max(...pupilDiameters),
    range: Math.max(...pupilDiameters) - Math.min(...pupilDiameters)
  };

  // Generate Heatmap Data
  const heatmapData = generateHeatmapData(sortedData);

  return {
    totalDuration,
    totalDataPoints: sortedData.length,
    averageConfidence,
    samplingRate,

    fixations,
    averageFixationDuration: fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length,
    fixationsPerMinute: (fixations.length / totalDuration) * 60000,
    totalFixationTime: fixations.reduce((sum, f) => sum + f.duration, 0),
    fixationPercentage: (fixations.reduce((sum, f) => sum + f.duration, 0) / totalDuration) * 100,

    saccades,
    averageSaccadeLength: saccades.reduce((sum, s) => sum + s.length, 0) / saccades.length,
    averageSaccadeVelocity: saccades.reduce((sum, s) => sum + s.velocity, 0) / saccades.length,
    saccadesPerMinute: (saccades.length / totalDuration) * 60000,

    headMovementRange,
    averageHeadDistance: calculateAverageHeadDistance(headMovementRange),

    averagePupilDiameter: pupilDiameters.reduce((sum, d) => sum + d, 0) / pupilDiameters.length,
    pupilDiameterRange,

    spatialDensity: {
      xRange: {
        min: Math.min(...sortedData.map(d => d.x)),
        max: Math.max(...sortedData.map(d => d.x)),
        range: Math.max(...sortedData.map(d => d.x)) - Math.min(...sortedData.map(d => d.x))
      },
      yRange: {
        min: Math.min(...sortedData.map(d => d.y)),
        max: Math.max(...sortedData.map(d => d.y)),
        range: Math.max(...sortedData.map(d => d.y)) - Math.min(...sortedData.map(d => d.y))
      },
      heatmapData
    }
  };
}

function generateHeatmapData(gazeData: GazeData[]) {
  const gridSize = 50; // pixels
  const heatmapGrid: Map<string, number> = new Map();

  // Calculate grid cell weights
  gazeData.forEach(point => {
    const cellX = Math.floor(point.x / gridSize);
    const cellY = Math.floor(point.y / gridSize);
    const key = `${cellX},${cellY}`;
    heatmapGrid.set(key, (heatmapGrid.get(key) || 0) + 1);
  });

  // Convert to array format for visualization
  return Array.from(heatmapGrid.entries()).map(([key, weight]) => {
    const [x, y] = key.split(',').map(Number);
    return {
      x: x * gridSize + gridSize / 2,
      y: y * gridSize + gridSize / 2,
      weight: weight / gazeData.length // Normalize weights
    };
  });
}

function calculateAverageHeadDistance(range: AnalyticsResult['headMovementRange']) {
  return Math.sqrt(
    Math.pow(range.x.range, 2) +
    Math.pow(range.y.range, 2) +
    Math.pow(range.z.range, 2)
  ) / 2;
} 