interface EyeData {
  x: number;
  y: number;
  pupilD?: number;
}

export interface GazeData {
  // Basic gaze data
  x: number;
  y: number;
  timestamp: number;         // Absolute timestamp (Unix timestamp)
  sessionTime?: number;       // Time since session start in milliseconds
  formattedTime?: string;     // Formatted absolute time (HH:mm:ss)
  formattedDate?: string;     // Formatted date (MM/DD/YYYY)
  sessionTimeFormatted?: string; // Formatted session time (mm:ss.SSS)
  
  // Eye tracking confidence and quality
  confidence?: number;
  state?: number;  // 0: valid gaze data; -1: face tracking lost, 1: gaze uncalibrated
  
  // Pupil data
  pupilD?: number;
  pupilX?: number;
  pupilY?: number;
  
  // Document/screen coordinates
  docX?: number;
  docY?: number;
  screenX?: number;
  screenY?: number;
  
  // Head pose data
  HeadX?: number;
  HeadY?: number;
  HeadZ?: number;
  HeadYaw?: number;
  HeadPitch?: number;
  HeadRoll?: number;
  
  // Additional eye tracking metrics
  fixationDuration?: number;
  avgFixationDuration?: number;
  fixationsPerMinute?: number;
  saccadeLength?: number;
  avgSaccadeLength?: number;
  saccadesPerMinute?: number;
  gazeDistance?: number;
  gazeVelocity?: number;
  blinkRate?: number;
  
  leftEye?: EyeData;
  rightEye?: EyeData;
}

export interface SessionConfig {
  participantId: string;
  isPilot: boolean;
} 