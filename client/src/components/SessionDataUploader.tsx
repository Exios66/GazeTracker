import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { GazeData } from '../types/gazeData';

interface SessionDataUploaderProps {
  onDataLoaded: (data: GazeData[]) => void;
}

const SessionDataUploader: React.FC<SessionDataUploaderProps> = ({ onDataLoaded }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let data: GazeData[] = [];

      switch (extension) {
        case 'json':
          const text = await file.text();
          const jsonData = JSON.parse(text);
          data = Array.isArray(jsonData) ? jsonData : jsonData.gazeData || [];
          break;

        case 'csv':
          const csvResult = await new Promise((resolve, reject) => {
            Papa.parse(file, {
              header: true,
              dynamicTyping: true,
              complete: (result) => resolve(result.data),
              error: reject
            });
          });
          data = csvResult as GazeData[];
          break;

        case 'xlsx':
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer);
          const worksheet = workbook.Sheets[workbook.SheetNames[1] || workbook.SheetNames[0]]; // Try Gaze Data sheet first
          data = XLSX.utils.sheet_to_json(worksheet) as GazeData[];
          break;

        default:
          throw new Error('Unsupported file format. Please upload JSON, CSV, or XLSX files.');
      }

      if (!data.length) {
        throw new Error('No valid gaze tracking data found in the file.');
      }

      // Validate and normalize data
      data = data.map(point => ({
        x: Number(point.x),
        y: Number(point.y),
        timestamp: Number(point.timestamp),
        confidence: point.confidence !== undefined ? Number(point.confidence) : undefined,
        pupilD: point.pupilD !== undefined ? Number(point.pupilD) : undefined,
        HeadX: point.HeadX !== undefined ? Number(point.HeadX) : undefined,
        HeadY: point.HeadY !== undefined ? Number(point.HeadY) : undefined,
        HeadZ: point.HeadZ !== undefined ? Number(point.HeadZ) : undefined,
        HeadYaw: point.HeadYaw !== undefined ? Number(point.HeadYaw) : undefined,
        HeadPitch: point.HeadPitch !== undefined ? Number(point.HeadPitch) : undefined,
        HeadRoll: point.HeadRoll !== undefined ? Number(point.HeadRoll) : undefined,
      }));

      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  return (
    <div className="session-data-uploader">
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#4CAF50' : '#ccc'}`,
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f0f9f0' : '#f8f9fa',
          transition: 'all 0.3s ease'
        }}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div>Processing file...</div>
        ) : (
          <div>
            <p style={{ margin: '0 0 10px 0' }}>
              {isDragActive
                ? 'Drop the file here...'
                : 'Drag & drop a session data file here, or click to select'}
            </p>
            <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
              Supported formats: JSON, CSV, XLSX
            </p>
          </div>
        )}
      </div>
      {error && (
        <div style={{ color: '#f44336', marginTop: '10px', fontSize: '0.9em' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default SessionDataUploader; 