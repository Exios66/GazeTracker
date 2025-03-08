import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import type { GazeData } from '../types/gazeData';
import { format } from 'date-fns';
import { HeadingLevel } from 'docx';

interface SessionData {
  participantId: string;
  sessionType: string;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  totalDataPoints: number;
  gazeData: GazeData[];
}

const getFormattedFilename = (data: SessionData, extension: string): string => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const prefix = data.sessionType === 'pilot' ? 'P' : 'L';
  const participantId = data.participantId.padStart(3, '0');
  return `${prefix}${participantId}_${data.sessionType}_${timestamp}${extension}`;
};

const getDataPath = (data: SessionData): string => {
  return `data/${data.sessionType === 'pilot' ? 'pilot' : 'live'}`;
};

export const exportToJSON = async (data: SessionData) => {
  const filename = getFormattedFilename(data, '.json');
  const path = getDataPath(data);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  
  try {
    const response = await fetch('/api/save-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `${path}/${filename}`,
        content: await blob.text(),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save file');
    }
    
    // Also offer download to user
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error saving file:', error);
    // Fallback to client-side download only
    saveAs(blob, filename);
  }
};

export const exportToCSV = async (data: SessionData) => {
  const filename = getFormattedFilename(data, '.csv');
  const path = getDataPath(data);
  
  const csvData = Papa.unparse({
    fields: ['timestamp', 'x', 'y', 'leftEye', 'rightEye', 'confidence', 'participantId', 'sessionType'],
    data: data.gazeData.map(point => ({
      timestamp: point.timestamp,
      x: point.x,
      y: point.y,
      leftEye: JSON.stringify(point.leftEye),
      rightEye: JSON.stringify(point.rightEye),
      confidence: point.confidence,
      participantId: data.participantId,
      sessionType: data.sessionType
    }))
  });

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  
  try {
    const response = await fetch('/api/save-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `${path}/${filename}`,
        content: await blob.text(),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save file');
    }
    
    // Also offer download to user
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error saving file:', error);
    // Fallback to client-side download only
    saveAs(blob, filename);
  }
};

export const exportToXLSX = async (data: SessionData) => {
  const filename = getFormattedFilename(data, '.xlsx');
  const path = getDataPath(data);
  
  const wb = XLSX.utils.book_new();
  
  // Session Info Sheet
  const sessionInfo = [
    ['Participant ID', data.participantId],
    ['Session Type', data.sessionType],
    ['Start Time', data.startTime],
    ['End Time', data.endTime],
    ['Duration (ms)', data.duration],
    ['Total Data Points', data.totalDataPoints]
  ];
  const sessionWs = XLSX.utils.aoa_to_sheet(sessionInfo);
  XLSX.utils.book_append_sheet(wb, sessionWs, 'Session Info');

  // Gaze Data Sheet
  const gazeDataArray = data.gazeData.map(point => [
    point.timestamp,
    point.x,
    point.y,
    JSON.stringify(point.leftEye),
    JSON.stringify(point.rightEye),
    point.confidence
  ]);
  gazeDataArray.unshift(['Timestamp', 'X', 'Y', 'Left Eye', 'Right Eye', 'Confidence']);
  const gazeWs = XLSX.utils.aoa_to_sheet(gazeDataArray);
  XLSX.utils.book_append_sheet(wb, gazeWs, 'Gaze Data');

  // Generate blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  try {
    const response = await fetch('/api/save-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: `${path}/${filename}`,
        content: await blob.arrayBuffer(),
        isBase64: true
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save file');
    }
    
    // Also offer download to user
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error saving file:', error);
    // Fallback to client-side download only
    saveAs(blob, filename);
  }
};

export const exportToDocx = (data: SessionData) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: 'Gaze Tracking Session Report',
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Session Information', heading: HeadingLevel.HEADING_2 }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Participant ID' })] }),
                new TableCell({ children: [new Paragraph({ text: data.participantId })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Session Type' })] }),
                new TableCell({ children: [new Paragraph({ text: data.sessionType })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Start Time' })] }),
                new TableCell({ children: [new Paragraph({ text: data.startTime || 'N/A' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'End Time' })] }),
                new TableCell({ children: [new Paragraph({ text: data.endTime || 'N/A' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Duration (ms)' })] }),
                new TableCell({ children: [new Paragraph({ text: data.duration.toString() })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Total Data Points' })] }),
                new TableCell({ children: [new Paragraph({ text: data.totalDataPoints.toString() })] })
              ]
            })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Data Summary', heading: HeadingLevel.HEADING_2 }),
        // Add summary statistics or visualizations here if needed
      ]
    }]
  });

  Packer.toBlob(doc).then(blob => {
    saveAs(blob, `gaze-data-${data.participantId}-${data.sessionType}-${format(new Date(), 'yyyyMMdd-HHmmss')}.docx`);
  });
};

export const exportToMarkdown = (data: SessionData) => {
  const markdown = `# Gaze Tracking Session Report

## Session Information

- **Participant ID:** ${data.participantId}
- **Session Type:** ${data.sessionType}
- **Start Time:** ${data.startTime || 'N/A'}
- **End Time:** ${data.endTime || 'N/A'}
- **Duration:** ${data.duration}ms
- **Total Data Points:** ${data.totalDataPoints}

## Data Summary

\`\`\`json
${JSON.stringify(data.gazeData[0], null, 2)}
\`\`\`

*Note: First data point shown as example. Full dataset contains ${data.totalDataPoints} points.*
`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  saveAs(blob, `gaze-data-${data.participantId}-${data.sessionType}-${format(new Date(), 'yyyyMMdd-HHmmss')}.md`);
};

// Helper functions
function calculateDataSummary(gazeData: GazeData[]) {
  const summary = {
    avgConfidence: 0,
    avgPupilD: 0,
    headRange: {
      x: 0,
      y: 0,
      z: 0
    }
  };

  if (gazeData.length === 0) return summary;

  // Calculate averages
  const confidenceSum = gazeData.reduce((sum, point) => sum + (point.confidence || 0), 0);
  const pupilDSum = gazeData.reduce((sum, point) => sum + (point.pupilD || 0), 0);

  // Calculate head movement ranges
  const headX = gazeData.map(point => point.HeadX || 0);
  const headY = gazeData.map(point => point.HeadY || 0);
  const headZ = gazeData.map(point => point.HeadZ || 0);

  summary.avgConfidence = confidenceSum / gazeData.length;
  summary.avgPupilD = pupilDSum / gazeData.length;
  summary.headRange = {
    x: Math.max(...headX) - Math.min(...headX),
    y: Math.max(...headY) - Math.min(...headY),
    z: Math.max(...headZ) - Math.min(...headZ)
  };

  return summary;
}

function generateDataSummary(gazeData: GazeData[]): Paragraph[] {
  const summary = calculateDataSummary(gazeData);
  
  return [
    new Paragraph({
      children: [
        new TextRun({ text: `Average Confidence: ${summary.avgConfidence.toFixed(2)}`, break: 1 }),
        new TextRun({ text: `Average Pupil Diameter: ${summary.avgPupilD.toFixed(2)}`, break: 1 }),
        new TextRun({ text: 'Head Movement Range:', break: 1 }),
        new TextRun({ text: `  X: ${summary.headRange.x.toFixed(2)} units`, break: 1 }),
        new TextRun({ text: `  Y: ${summary.headRange.y.toFixed(2)} units`, break: 1 }),
        new TextRun({ text: `  Z: ${summary.headRange.z.toFixed(2)} units`, break: 1 })
      ]
    })
  ];
}

function generateSampleDataTable(gazeData: GazeData[]): Paragraph[] {
  const table = new Table({
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Timestamp')] }),
          new TableCell({ children: [new Paragraph('X')] }),
          new TableCell({ children: [new Paragraph('Y')] }),
          new TableCell({ children: [new Paragraph('Confidence')] }),
          new TableCell({ children: [new Paragraph('Head Position')] })
        ]
      }),
      // Data rows
      ...gazeData.map(point => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(new Date(point.timestamp).toLocaleTimeString())] }),
          new TableCell({ children: [new Paragraph(point.x.toFixed(2))] }),
          new TableCell({ children: [new Paragraph(point.y.toFixed(2))] }),
          new TableCell({ children: [new Paragraph((point.confidence || 0).toFixed(2))] }),
          new TableCell({ children: [new Paragraph(
            `(${point.HeadX?.toFixed(2) || 0}, ${point.HeadY?.toFixed(2) || 0}, ${point.HeadZ?.toFixed(2) || 0})`
          )] })
        ]
      }))
    ]
  });

  return [new Paragraph({ children: [table] })];
} 