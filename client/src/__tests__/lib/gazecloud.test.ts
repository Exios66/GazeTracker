import { initGazeCloud, startTracking, stopTracking } from '../../lib/gazecloud';
import type { GazeData } from '../../types/gazeData';

jest.setTimeout(30000); // Increase timeout to 30 seconds for slower environments

describe('GazeCloud API Integration', () => {
  let mockScript: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset GazeCloud API mock with more comprehensive mock implementation
    const mockAPI = {
      StartEyeTracking: jest.fn(),
      StopEyeTracking: jest.fn(),
      OnResult: jest.fn(),
      OnCalibrationComplete: jest.fn(),
      OnError: jest.fn(),
    };
    window.GazeCloudAPI = mockAPI;

    // Mock script element
    mockScript = {
      src: '',
      async: false,
      onload: null,
      onerror: null,
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockScript);
    jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript);
    jest.spyOn(document.head, 'removeChild').mockImplementation(() => mockScript);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initGazeCloud', () => {
    it('should initialize GazeCloud API successfully', async () => {
      const initPromise = initGazeCloud();
      mockScript.onload(); // Simulate script load
      await initPromise;

      expect(document.createElement).toHaveBeenCalledWith('script');
      expect(document.head.appendChild).toHaveBeenCalled();
      expect(window.GazeCloudAPI!.OnResult).toBeDefined();
      expect(window.GazeCloudAPI!.OnCalibrationComplete).toBeDefined();
      expect(window.GazeCloudAPI!.OnError).toBeDefined();
    });

    it('should handle script load error', async () => {
      const initPromise = initGazeCloud();
      mockScript.onerror(new Error('Script load failed'));

      await expect(initPromise).rejects.toThrow('Script load failed');
    });

    it('should handle multiple initialization attempts', async () => {
      const firstInit = initGazeCloud();
      mockScript.onload();
      await firstInit;

      const secondInit = initGazeCloud();
      await secondInit;

      expect(document.createElement).toHaveBeenCalledTimes(1);
    });

    it('should clean up on initialization failure', async () => {
      const initPromise = initGazeCloud();
      mockScript.onerror(new Error('Network error'));

      await expect(initPromise).rejects.toThrow();
      expect(document.head.removeChild).toHaveBeenCalled();
    });
  });

  describe('startTracking', () => {
    const mockGazeCallback = jest.fn();
    const mockCalibrationCallback = jest.fn();

    beforeEach(() => {
      mockGazeCallback.mockClear();
      mockCalibrationCallback.mockClear();
    });

    it('should start tracking when not already tracking', async () => {
      await initGazeCloud().catch(() => {}); // Initialize first
      startTracking(mockGazeCallback, mockCalibrationCallback);
      expect(window.GazeCloudAPI!.StartEyeTracking).toHaveBeenCalled();
    });

    it('should not start tracking when already tracking', async () => {
      await initGazeCloud().catch(() => {}); // Initialize first
      startTracking(mockGazeCallback, mockCalibrationCallback);
      startTracking(mockGazeCallback, mockCalibrationCallback);
      expect(window.GazeCloudAPI!.StartEyeTracking).toHaveBeenCalledTimes(1);
    });

    it('should handle gaze data with all possible fields', async () => {
      await initGazeCloud().catch(() => {});
      startTracking(mockGazeCallback, mockCalibrationCallback);

      const mockGazeResponse: GazeData = {
        x: 100,
        y: 200,
        timestamp: Date.now(),
        docX: 100,
        docY: 200,
        confidence: 0.95,
        pupilD: 3.5,
        HeadX: 0.1,
        HeadY: 0.2,
        HeadZ: 0.3,
        HeadYaw: 10,
        HeadPitch: 20,
        HeadRoll: 30
      };

      window.GazeCloudAPI!.OnResult(mockGazeResponse);

      expect(mockGazeCallback).toHaveBeenCalledWith(expect.objectContaining({
        x: 100,
        y: 200,
        confidence: 0.95,
        pupilD: 3.5,
        HeadX: 0.1,
        HeadY: 0.2,
        HeadZ: 0.3,
        HeadYaw: 10,
        HeadPitch: 20,
        HeadRoll: 30,
        timestamp: expect.any(Number)
      }));
    });

    it('should handle missing optional gaze data fields', async () => {
      await initGazeCloud().catch(() => {});
      startTracking(mockGazeCallback, mockCalibrationCallback);

      const minimalGazeResponse: GazeData = {
        x: 100,
        y: 200,
        timestamp: Date.now(),
        docX: 100,
        docY: 200
      };

      window.GazeCloudAPI!.OnResult(minimalGazeResponse);

      expect(mockGazeCallback).toHaveBeenCalledWith(expect.objectContaining({
        x: 100,
        y: 200,
        docX: 100,
        docY: 200,
        timestamp: expect.any(Number)
      }));
    });

    it('should handle calibration completion', async () => {
      await initGazeCloud().catch(() => {});
      startTracking(mockGazeCallback, mockCalibrationCallback);

      const onCalibrationCallback = (window.GazeCloudAPI!.OnCalibrationComplete as jest.Mock).mock.calls[0][0];
      onCalibrationCallback();

      expect(mockCalibrationCallback).toHaveBeenCalled();
    });
  });

  describe('stopTracking', () => {
    it('should stop tracking when currently tracking', async () => {
      await initGazeCloud().catch(() => {});
      startTracking(jest.fn(), jest.fn());
      stopTracking();
      expect(window.GazeCloudAPI!.StopEyeTracking).toHaveBeenCalled();
    });

    it('should not stop tracking when not tracking', () => {
      stopTracking();
      expect(window.GazeCloudAPI!.StopEyeTracking).not.toHaveBeenCalled();
    });

    it('should clean up callbacks when stopping', async () => {
      await initGazeCloud().catch(() => {});
      const mockGazeCallback = jest.fn();
      startTracking(mockGazeCallback, jest.fn());
      stopTracking();

      // Try to trigger callbacks after stopping
      const onResultCallback = (window.GazeCloudAPI!.OnResult as jest.Mock).mock.calls[0][0];
      onResultCallback({ docX: 100, docY: 100 });

      expect(mockGazeCallback).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors', async () => {
      const mockError = new Error('Initialization failed');
      const initPromise = initGazeCloud();
      mockScript.onerror(mockError);

      await expect(initPromise).rejects.toThrow('Initialization failed');
    });

    it('should handle runtime errors and reset tracking state', async () => {
      await initGazeCloud().catch(() => {});
      const mockGazeCallback = jest.fn();
      const mockCalibrationCallback = jest.fn();
      
      startTracking(mockGazeCallback, mockCalibrationCallback);

      // Simulate various types of runtime errors
      const errors = [
        'No face detected',
        'Camera access denied',
        'Network error',
        'Calibration failed'
      ];

      for (const errorMessage of errors) {
        const api = window.GazeCloudAPI!;
        api.OnError(new Error(errorMessage));
        
        // Verify tracking state is reset with valid GazeData
        api.OnResult({
          x: 100,
          y: 200,
          timestamp: Date.now(),
          docX: 100,
          docY: 200
        });
        expect(mockGazeCallback).not.toHaveBeenCalled();
      }
    });

    it('should handle errors during calibration', async () => {
      await initGazeCloud().catch(() => {});
      const mockGazeCallback = jest.fn();
      const mockCalibrationCallback = jest.fn();
      
      startTracking(mockGazeCallback, mockCalibrationCallback);

      // Simulate calibration error
      window.GazeCloudAPI!.OnError(new Error('Calibration failed'));
      
      const onCalibrationCallback = (window.GazeCloudAPI!.OnCalibrationComplete as jest.Mock).mock.calls[0][0];
      onCalibrationCallback();

      expect(mockCalibrationCallback).not.toHaveBeenCalled();
    });
  });
}); 