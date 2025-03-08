interface GazeData {
  docX: number;
  docY: number;
  time: number;
  state: number;
  timestamp: number;
  confidence: number;
  pupilDiameter: number;
  HeadX: number;
  HeadY: number;
  HeadZ: number;
  HeadYaw: number;
  HeadPitch: number;
  HeadRoll: number;
}

declare global {
  interface Window {
    GazeCloudAPI: {
      StartEyeTracking: () => void;
      StopEyeTracking: () => void;
      OnResult: (data: any) => void;
      OnCalibrationComplete: () => void;
      OnError: (error: any) => void;
    };
  }
}

let isTracking = false;
let onGazeData: ((data: GazeData) => void) | null = null;
let onCalibrationComplete: (() => void) | null = null;

export const initGazeCloud = async () => {
  // Load GazeCloud API script
  const script = document.createElement('script');
  script.src = 'https://api.gazerecorder.com/GazeCloudAPI.js';
  script.async = true;
  
  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Initialize GazeCloud handlers
  window.GazeCloudAPI.OnResult = handleGazeData;
  window.GazeCloudAPI.OnCalibrationComplete = handleCalibrationComplete;
  window.GazeCloudAPI.OnError = handleError;
};

export const startTracking = (
  gazeCallback: (data: GazeData) => void,
  calibrationCallback: () => void
) => {
  if (!isTracking) {
    onGazeData = gazeCallback;
    onCalibrationComplete = calibrationCallback;
    window.GazeCloudAPI.StartEyeTracking();
    isTracking = true;
  }
};

export const stopTracking = () => {
  if (isTracking) {
    window.GazeCloudAPI.StopEyeTracking();
    isTracking = false;
    onGazeData = null;
    onCalibrationComplete = null;
  }
};

const handleGazeData = (gazeResponse: any) => {
  if (onGazeData) {
    const gazeData: GazeData = {
      docX: gazeResponse.docX,
      docY: gazeResponse.docY,
      time: gazeResponse.time,
      state: gazeResponse.state,
      timestamp: Date.now(),
      confidence: gazeResponse.state,
      pupilDiameter: gazeResponse.diameter,
      HeadX: gazeResponse.HeadX,
      HeadY: gazeResponse.HeadY,
      HeadZ: gazeResponse.HeadZ,
      HeadYaw: gazeResponse.HeadYaw,
      HeadPitch: gazeResponse.HeadPitch,
      HeadRoll: gazeResponse.HeadRoll
    };
    onGazeData(gazeData);
  }
};

const handleCalibrationComplete = () => {
  if (onCalibrationComplete) {
    onCalibrationComplete();
  }
};

const handleError = (error: any) => {
  console.error('GazeCloud Error:', error);
  isTracking = false;
  onGazeData = null;
  onCalibrationComplete = null;
};
