import express from 'express';
import cors from 'cors';
import net from 'net';
import gazeRoutes from './routes/gaze';
import path from 'path';
import fs from 'fs/promises';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { validationResult } from 'express-validator';

const app = express();
const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const MAX_PORT_ATTEMPTS = 10;

// Function to check if a port is available
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        resolve(false);
      })
      .once('listening', () => {
        server.close();
        resolve(true);
      })
      .listen(port);
  });
}

// Function to find an available port
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + MAX_PORT_ATTEMPTS; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + MAX_PORT_ATTEMPTS - 1}`);
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGIN 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '50mb' }));

// API Routes
app.use('/api', gazeRoutes);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message
  });
});

// Ensure data directories exist
async function ensureDirectories() {
  const directories = ['data', 'data/pilot', 'data/live'];
  for (const dir of directories) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

// Initialize directories when server starts
ensureDirectories().catch(console.error);

// Endpoint to save files
app.post('/api/save-file', async (req, res) => {
  try {
    const { path: filePath, content, isBase64 } = req.body;
    
    // Ensure the path is within the data directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith('data/')) {
      throw new Error('Invalid file path');
    }
    
    // Create directories if they don't exist
    const dir = path.dirname(normalizedPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the file
    if (isBase64) {
      const buffer = Buffer.from(content);
      await fs.writeFile(normalizedPath, buffer);
    } else {
      await fs.writeFile(normalizedPath, content, 'utf8');
    }
    
    res.json({ success: true, path: normalizedPath });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Start server with automatic port selection
async function startServer() {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      if (port !== DEFAULT_PORT) {
        console.log(`Note: Default port ${DEFAULT_PORT} was in use, automatically switched to port ${port}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize server
startServer().catch(console.error); 