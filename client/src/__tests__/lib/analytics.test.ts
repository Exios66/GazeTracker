import { computeGazeMetrics } from '../../lib/analytics';
import type { GazeData } from '../../types/gazeData';

describe('Analytics Module', () => {
  describe('computeGazeMetrics', () => {
    it('should return zero metrics for empty data', () => {
      const result = computeGazeMetrics([]);
      
      expect(result).toEqual({
        averageConfidence: 0,
        fixationCount: 0,
        averageFixationDuration: 0,
        saccadeCount: 0,
        averageSaccadeLength: 0,
        totalDuration: 0
      });
    });

    it('should calculate metrics for a single fixation', () => {
      const gazeData: GazeData[] = [
        { x: 100, y: 100, timestamp: 0, confidence: 1, docX: 100, docY: 100, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 101, y: 101, timestamp: 100, confidence: 1, docX: 101, docY: 101, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 102, y: 102, timestamp: 200, confidence: 1, docX: 102, docY: 102, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 }
      ];

      const result = computeGazeMetrics(gazeData);

      expect(result.averageConfidence).toBe(1);
      expect(result.fixationCount).toBe(1);
      expect(result.saccadeCount).toBe(0);
      expect(result.totalDuration).toBe(200);
    });

    it('should identify saccades correctly', () => {
      const gazeData: GazeData[] = [
        { x: 100, y: 100, timestamp: 0, confidence: 1, docX: 100, docY: 100, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 300, y: 300, timestamp: 100, confidence: 1, docX: 300, docY: 300, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 }, // Large jump = saccade
        { x: 301, y: 301, timestamp: 200, confidence: 1, docX: 301, docY: 301, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 }
      ];

      const result = computeGazeMetrics(gazeData);

      expect(result.saccadeCount).toBe(1);
      expect(result.averageSaccadeLength).toBeGreaterThan(0);
    });

    it('should filter out low confidence points', () => {
      const gazeData: GazeData[] = [
        { x: 100, y: 100, timestamp: 0, confidence: 0.2, docX: 100, docY: 100, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 }, // Low confidence
        { x: 101, y: 101, timestamp: 100, confidence: 1, docX: 101, docY: 101, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 102, y: 102, timestamp: 200, confidence: 1, docX: 102, docY: 102, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 }
      ];

      const result = computeGazeMetrics(gazeData);

      expect(result.averageConfidence).toBe(1);
      expect(result.totalDuration).toBe(100); // Should only count high confidence points
    });

    it('should calculate fixation durations correctly', () => {
      const gazeData: GazeData[] = [
        // First fixation
        { x: 100, y: 100, timestamp: 0, confidence: 1, docX: 100, docY: 100, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 101, y: 101, timestamp: 150, confidence: 1, docX: 101, docY: 101, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        // Saccade
        { x: 300, y: 300, timestamp: 200, confidence: 1, docX: 300, docY: 300, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        // Second fixation
        { x: 301, y: 301, timestamp: 300, confidence: 1, docX: 301, docY: 301, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 302, y: 302, timestamp: 400, confidence: 1, docX: 302, docY: 302, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 }
      ];

      const result = computeGazeMetrics(gazeData);

      expect(result.fixationCount).toBe(2);
      expect(result.averageFixationDuration).toBeGreaterThan(0);
      expect(result.saccadeCount).toBe(1);
    });

    it('should handle missing confidence values', () => {
      const gazeData: GazeData[] = [
        { x: 100, y: 100, timestamp: 1000, docX: 100, docY: 100, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 101, y: 101, timestamp: 1100, docX: 101, docY: 101, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 },
        { x: 102, y: 102, timestamp: 1200, docX: 102, docY: 102, HeadX: 0, HeadY: 0, HeadZ: 0, HeadYaw: 0, HeadPitch: 0, HeadRoll: 0 }
      ];

      const result = computeGazeMetrics(gazeData);

      expect(result.averageConfidence).toBe(0);
      expect(result.totalDuration).toBe(0); // All points filtered out due to low confidence
      expect(result.fixationCount).toBe(0);
      expect(result.saccadeCount).toBe(0);
    });
  });
}); 