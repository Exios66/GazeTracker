import type { GazeData } from '../types/gazeData';

declare global {
  interface Window {
    GazeCloudAPI?: {
      OnResult: (data: GazeData) => void;
      StartEyeTracking: () => void;
      StopEyeTracking: () => void;
      OnCalibrationComplete: () => void;
      OnError: (error: any) => void;
    };
  }
}

export const initGazeCloud = async (): Promise<void> => {
  if (!window.GazeCloudAPI) {
    throw new Error('GazeCloudAPI not found. Make sure the script is loaded properly.');
  }
};

export const startTracking = (
  onGazeData: (data: GazeData) => void,
  onCalibrationComplete: () => void
): void => {
  if (!window.GazeCloudAPI) {
    console.error('GazeCloudAPI not found. Make sure the script is loaded properly.');
    return;
  }

  window.GazeCloudAPI.OnResult = onGazeData;
  window.GazeCloudAPI.OnCalibrationComplete = onCalibrationComplete;
  window.GazeCloudAPI.StartEyeTracking();
};

export const stopTracking = (): void => {
  if (!window.GazeCloudAPI) {
    console.error('GazeCloudAPI not found. Make sure the script is loaded properly.');
    return;
  }

  window.GazeCloudAPI.StopEyeTracking();
};
