import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { DataStorageService, SessionConfig } from '../services/dataStorage';
import { GazeData } from '../types/gazeData';

const router = Router();
const dataStorage = new DataStorageService();

// Validation middleware
const validateSession = [
  body('participantId').isString().trim().notEmpty(),
  body('isPilot').isBoolean(),
];

const validateGazeData = [
  body('x').isFloat(),
  body('y').isFloat(),
  body('confidence').optional().isFloat(),
  body('pupilD').optional().isFloat(),
  body('docX').optional().isFloat(),
  body('docY').optional().isFloat(),
  body('HeadX').optional().isFloat(),
  body('HeadY').optional().isFloat(),
  body('HeadZ').optional().isFloat(),
  body('HeadYaw').optional().isFloat(),
  body('HeadPitch').optional().isFloat(),
  body('HeadRoll').optional().isFloat(),
];

// Validation error handler middleware
const handleValidationErrors = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Initialize a new session
router.post('/sessions', validateSession, handleValidationErrors, (req: Request, res: Response) => {
  const config: SessionConfig = {
    participantId: req.body.participantId,
    isPilot: req.body.isPilot
  };
  
  dataStorage.initializeSession(config);
  res.status(201).json({ message: 'Session initialized' });
});

// Get all gaze data for current session
router.get('/sessions/current/gaze', (req: Request, res: Response) => {
  try {
    const data = dataStorage.getCurrentSession();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Add new gaze data point
router.post('/sessions/current/gaze', validateGazeData, handleValidationErrors, (req: Request, res: Response) => {
  try {
    const gazeData: GazeData = {
      x: req.body.x,
      y: req.body.y,
      timestamp: Date.now(),
      confidence: req.body.confidence,
      pupilD: req.body.pupilD,
      docX: req.body.docX,
      docY: req.body.docY,
      HeadX: req.body.HeadX,
      HeadY: req.body.HeadY,
      HeadZ: req.body.HeadZ,
      HeadYaw: req.body.HeadYaw,
      HeadPitch: req.body.HeadPitch,
      HeadRoll: req.body.HeadRoll
    };
    
    dataStorage.addGazeData(gazeData);
    res.status(201).json(gazeData);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Save current session to CSV
router.post('/sessions/current/save', (req: Request, res: Response) => {
  try {
    const filename = dataStorage.saveSession();
    res.json({ filename });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Clear current session
router.delete('/sessions/current', (req: Request, res: Response) => {
  try {
    dataStorage.clearSession();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router; 