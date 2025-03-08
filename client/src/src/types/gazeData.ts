export interface GazeData {
  x: number;
  y: number;
  timestamp: number;
  confidence: number;
  pupilD?: number;
  docX?: number;
  docY?: number;
  HeadX?: number;
  HeadY?: number;
  HeadZ?: number;
  HeadYaw?: number;
  HeadPitch?: number;
  HeadRoll?: number;
}

export interface SessionConfig {
  participantId: string;
  isPilot: boolean;
}

export interface GazeSession {
  config: SessionConfig;
  gazeData: GazeData[];
}
