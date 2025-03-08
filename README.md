# Real-Time online Eye-Tracking

## Quick Start

To start the development environment with all necessary services:

```bash
npm run start:dev
```

This command will:

1. Install all dependencies (both client and server)
2. Start the server with auto-reload
3. Start the client development server
4. Handle automatic port selection if default ports are in use

## Development Commands

- `npm run dev` - Start both client and server in development mode
- `npm run dev:server` - Start only the server with auto-reload
- `npm run dev:client` - Start only the client development server
- `npm run dev:setup` - Install all dependencies
- `npm run dev:clean` - Remove all node_modules
- `npm run dev:reset` - Clean and reinstall all dependencies
- `npm run build` - Build the client for production

## Port Configuration

The application automatically handles port selection:

- Server default port: 3001 (will automatically find next available port if in use)
- Client default port: 3000

You can configure the ports using environment variables:

- Server: `PORT` environment variable
- Client: `PORT` environment variable (when starting the client)

## GazeCloudAPI Integration details

Register origin domain address of your web page: <https://api.gazerecorder.com/register/>

### Include JavaScript

<script src="https://api.gazerecorder.com/GazeCloudAPI.js" ></script>
Start eye tracking GazeCloudAPI.StartEyeTracking();

#### Define your results data

callback GazeCloudAPI.OnResult = function (GazeData) { GazeData.state // 0: valid gaze data; -1 : face tracking lost, 1 : gaze data uncalibrated GazeData.docX // gaze x in document coordinates GazeData.docY // gaze y in document coordinates GazeData.time // timestamp }

#### After you finish your test stop eye tracking GazeCloudAPI.StopEyeTracking()

optional callbacks: GazeCloudAPI.OnCalibrationComplete =function(){ console.log('gaze Calibration Complete') }

GazeCloudAPI.OnCamDenied = function(){ console.log('camera access denied') }

GazeCloudAPI.OnError = function(msg){ console.log('err: ' + msg) }

Disable/Enable click recalibration GazeCloudAPI.UseClickRecalibration = true;

Simple Example: <https://api.gazerecorder.com/>

#### Supported browsers: Chrome 53+ | Edge 12+ | Firefox 42+ | Opera 40+ | Safari 11+

##### Read More: <https://gazerecorder.com/gazecloudapi/>
