import '@testing-library/jest-dom';
import type { GazeData } from './types/gazeData';
import type { GazeCloudAPIType } from './types/global';

// Mock GazeCloudAPI
const mockAPI: GazeCloudAPIType = {
  StartEyeTracking: jest.fn(),
  StopEyeTracking: jest.fn(),
  OnResult: jest.fn(),
  OnCalibrationComplete: jest.fn(),
  OnError: jest.fn(),
};
window.GazeCloudAPI = mockAPI;

// Mock ResizeObserver
class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

window.ResizeObserver = ResizeObserver;

// Mock canvas context
const createMockContext = () => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  putImageData: jest.fn(),
});

// @ts-ignore - Ignore type checking for canvas mock
HTMLCanvasElement.prototype.getContext = jest.fn((contextId: string) => {
  if (contextId === '2d') return createMockContext();
  return null;
}); 