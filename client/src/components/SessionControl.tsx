import React, { useState, useCallback, useEffect } from 'react';
import { startTracking, stopTracking } from '../lib/gazecloud';
import type { GazeData } from '../types/gazeData';
import RecordingSession from './RecordingSession';
import SessionConfig, { SessionConfigData } from './SessionConfig';
import { format } from 'date-fns';

interface EnhancedGazeData extends GazeData {
  participantId: string;
  sessionType: 'pilot' | 'live';
  formattedTime: string;
  formattedDate: string;
  sessionTime: number;
  sessionTimeFormatted: string;
}

const SessionControl: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [gazeData, setGazeData] = useState<EnhancedGazeData[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionConfig, setSessionConfig] = useState<SessionConfigData | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [lastLoggedCount, setLastLoggedCount] = useState<number>(0);

  // Add periodic logging effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isTracking && !isPaused && sessionConfig?.isPilot) {
      intervalId = setInterval(() => {
        const currentCount = gazeData.length;
        if (currentCount > lastLoggedCount) {
          const now = new Date();
          const rate = ((currentCount - lastLoggedCount) / 5).toFixed(1); // points per second
          setDebugLog(prev => [
            ...prev,
            `[${format(now, 'HH:mm:ss.SSS')}] Collection Status: ${currentCount} total points (${rate} pts/sec)`
          ].slice(-100));
          setLastLoggedCount(currentCount);
        }
      }, 5000); // Log every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTracking, isPaused, sessionConfig, gazeData.length, lastLoggedCount]);

  const handleGazeData = useCallback((data: GazeData) => {
    if (!startTime || !sessionConfig || isPaused) return;

    try {
      const now = new Date();
      const sessionDuration = Date.now() - startTime;
      
      const enhancedData: EnhancedGazeData = {
        ...data,
        participantId: sessionConfig.participantId,
        sessionType: sessionConfig.isPilot ? 'pilot' : 'live',
        formattedTime: format(now, 'HH:mm:ss.SSS'),
        formattedDate: format(now, 'yyyy-MM-dd'),
        sessionTime: sessionDuration,
        sessionTimeFormatted: format(sessionDuration, 'mm:ss.SSS')
      };

      setGazeData(prev => {
        const newData = [...prev, enhancedData];
        
        if (sessionConfig.isPilot && newData.length % 100 === 0) {
          setDebugLog(prevLog => [
            ...prevLog,
            `[${enhancedData.formattedTime}] Collected ${newData.length} data points`
          ].slice(-100));
        }
        
        return newData;
      });

      if (sessionConfig.isPilot) {
        setDebugLog(prev => [
          ...prev,
          `[${enhancedData.formattedTime}] Gaze position: (${Math.round(data.x)}, ${Math.round(data.y)}) | Confidence: ${(data.confidence || 0).toFixed(2)}`
        ].slice(-100));
      }
    } catch (error) {
      console.error('Error processing gaze data:', error);
      if (sessionConfig.isPilot) {
        setDebugLog(prev => [
          ...prev,
          `[${format(new Date(), 'HH:mm:ss.SSS')}] Error processing gaze data: ${error}`
        ].slice(-100));
      }
    }
  }, [startTime, sessionConfig, isPaused]);

  const handleStartTracking = () => {
    if (!sessionConfig) return;
    
    setGazeData([]);
    setDebugLog([]);
    setLastLoggedCount(0);
    setStartTime(Date.now());
    setIsPaused(false);
    startTracking(
      handleGazeData,
      () => {
        setCalibrationComplete(true);
        if (sessionConfig.isPilot) {
          setDebugLog(prev => [...prev, `[${format(new Date(), 'HH:mm:ss.SSS')}] Calibration complete`]);
        }
      }
    );
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    stopTracking();
    setIsTracking(false);
    setIsPaused(false);
    setCalibrationComplete(false);
    if (sessionConfig?.isPilot) {
      setDebugLog(prev => [...prev, `[${format(new Date(), 'HH:mm:ss.SSS')}] Session stopped`]);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (sessionConfig?.isPilot) {
      setDebugLog(prev => [...prev, `[${format(new Date(), 'HH:mm:ss.SSS')}] Session paused`]);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    if (sessionConfig?.isPilot) {
      setDebugLog(prev => [...prev, `[${format(new Date(), 'HH:mm:ss.SSS')}] Session resumed`]);
    }
  };

  const handleKillswitch = () => {
    stopTracking();
    setIsTracking(false);
    setIsPaused(false);
    setCalibrationComplete(false);
    setGazeData([]);
    if (sessionConfig?.isPilot) {
      setDebugLog(prev => [
        ...prev, 
        `[${format(new Date(), 'HH:mm:ss.SSS')}] Session terminated by killswitch`
      ]);
    }
  };

  const handleDiscardSession = () => {
    setGazeData([]);
    setStartTime(null);
    setDebugLog([]);
    if (sessionConfig?.isPilot) {
      setDebugLog(prev => [...prev, `[${format(new Date(), 'HH:mm:ss.SSS')}] Session data discarded`]);
    }
  };

  const handleExport = () => {
    const exportData = {
      sessionInfo: {
        startTime: startTime,
        endTime: Date.now(),
        duration: startTime ? Date.now() - startTime : 0,
        totalDataPoints: gazeData.length
      },
      gazeData: gazeData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gaze-tracking-session-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!sessionConfig) {
    return <SessionConfig onConfigSubmit={setSessionConfig} />;
  }

  return (
    <div className="session-control" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>Session Control</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={isTracking ? handleStopTracking : handleStartTracking}
            style={{
              padding: '10px 20px',
              backgroundColor: isTracking ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isTracking ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>Participant ID: {sessionConfig.participantId}</div>
          <div>Mode: {sessionConfig.isPilot ? 'Pilot' : 'Live'}</div>
          {calibrationComplete && <div style={{ color: '#4CAF50' }}>✓ Calibration Complete</div>}
        </div>
      </div>

      {sessionConfig.isPilot && debugLog.length > 0 && (
        <div
          className="debug-log"
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Debug Log:</div>
          {debugLog.map((log, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>{log}</div>
          ))}
        </div>
      )}

      <RecordingSession
        isRecording={isTracking}
        isPaused={isPaused}
        startTime={startTime}
        gazeData={gazeData}
        onExport={handleExport}
        isPilot={sessionConfig.isPilot}
        participantId={sessionConfig.participantId}
        onDiscard={handleDiscardSession}
        onPause={handlePause}
        onResume={handleResume}
        onKillswitch={sessionConfig.isPilot ? handleKillswitch : undefined}
      />
    </div>
  );
};

export default SessionControl;