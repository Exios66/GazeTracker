import React, { useState } from 'react';
import SessionDataUploader from './SessionDataUploader';
import { analyzeGazeData } from '../utils/analyticsUtils';
import type { GazeData } from '../types/gazeData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ZAxis,
  BarChart, Bar,
  ResponsiveContainer
} from 'recharts';

const AnalyticsDashboard: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeGazeData> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fixations' | 'saccades' | 'head' | 'spatial'>('overview');

  const handleDataLoaded = (data: GazeData[]) => {
    try {
      const result = analyzeGazeData(data);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Failed to analyze data:', error);
    }
  };

  const renderOverviewTab = () => (
    <div className="overview-tab">
      <div className="metrics-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {analysisResult && (
          <>
            <MetricCard
              title="Session Duration"
              value={`${(analysisResult.totalDuration / 1000).toFixed(2)}s`}
            />
            <MetricCard
              title="Data Points"
              value={analysisResult.totalDataPoints.toString()}
            />
            <MetricCard
              title="Sampling Rate"
              value={`${analysisResult.samplingRate.toFixed(1)} Hz`}
            />
            <MetricCard
              title="Average Confidence"
              value={`${(analysisResult.averageConfidence * 100).toFixed(1)}%`}
            />
          </>
        )}
      </div>

      {analysisResult && (
        <div style={{ height: '300px', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analysisResult.fixations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="startTime" 
                     label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="duration" stroke="#8884d8" name="Fixation Duration" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderFixationsTab = () => (
    <div className="fixations-tab">
      {analysisResult && (
        <>
          <div className="metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <MetricCard
              title="Total Fixations"
              value={analysisResult.fixations.length.toString()}
            />
            <MetricCard
              title="Average Duration"
              value={`${analysisResult.averageFixationDuration.toFixed(1)}ms`}
            />
            <MetricCard
              title="Fixations/Minute"
              value={analysisResult.fixationsPerMinute.toFixed(1)}
            />
            <MetricCard
              title="Fixation Time %"
              value={`${analysisResult.fixationPercentage.toFixed(1)}%`}
            />
          </div>

          <div style={{ height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="X Position" unit="px" />
                <YAxis type="number" dataKey="y" name="Y Position" unit="px" />
                <ZAxis type="number" dataKey="duration" name="Duration" unit="ms" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter
                  name="Fixations"
                  data={analysisResult.fixations}
                  fill="#8884d8"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );

  const renderSaccadesTab = () => (
    <div className="saccades-tab">
      {analysisResult && (
        <>
          <div className="metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <MetricCard
              title="Total Saccades"
              value={analysisResult.saccades.length.toString()}
            />
            <MetricCard
              title="Average Length"
              value={`${analysisResult.averageSaccadeLength.toFixed(1)}px`}
            />
            <MetricCard
              title="Average Velocity"
              value={`${analysisResult.averageSaccadeVelocity.toFixed(1)}px/ms`}
            />
            <MetricCard
              title="Saccades/Minute"
              value={analysisResult.saccadesPerMinute.toFixed(1)}
            />
          </div>

          <div style={{ height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisResult.saccades}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="startTime" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="length" fill="#82ca9d" name="Saccade Length" />
                <Bar dataKey="velocity" fill="#8884d8" name="Velocity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );

  const renderHeadMovementTab = () => (
    <div className="head-movement-tab">
      {analysisResult && (
        <>
          <div className="metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <MetricCard
              title="X Range"
              value={`${analysisResult.headMovementRange.x.range.toFixed(2)} units`}
            />
            <MetricCard
              title="Y Range"
              value={`${analysisResult.headMovementRange.y.range.toFixed(2)} units`}
            />
            <MetricCard
              title="Z Range"
              value={`${analysisResult.headMovementRange.z.range.toFixed(2)} units`}
            />
            <MetricCard
              title="Average Distance"
              value={`${analysisResult.averageHeadDistance.toFixed(2)} units`}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="analytics-dashboard" style={{ padding: '20px' }}>
      <h2>Session Analytics</h2>
      
      <SessionDataUploader onDataLoaded={handleDataLoaded} />

      {analysisResult && (
        <div className="dashboard-content" style={{ marginTop: '20px' }}>
          <div className="tab-buttons" style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {(['overview', 'fixations', 'saccades', 'head', 'spatial'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeTab === tab ? '#4CAF50' : '#f0f0f0',
                  color: activeTab === tab ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'fixations' && renderFixationsTab()}
            {activeTab === 'saccades' && renderSaccadesTab()}
            {activeTab === 'head' && renderHeadMovementTab()}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div style={{
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>{title}</div>
    <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{value}</div>
  </div>
);

export default AnalyticsDashboard; 