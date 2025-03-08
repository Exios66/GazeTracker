import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Heatmap from './components/Heatmap';
import GazeTracker from './components/GazeTracker';
import SessionControl from './components/SessionControl';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { initGazeCloud } from './lib/gazecloud';
import './index.css';

console.log('App.tsx is being evaluated');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  }
});

function App() {
  console.log('App component is rendering');

  useEffect(() => {
    console.log('App useEffect is running');
    // Initialize GazeCloud when component mounts
    initGazeCloud().catch(error => {
      console.error('Failed to initialize GazeCloud:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="App" style={{ padding: '20px', background: '#f0f0f0' }}>
          <h1 style={{ color: '#333', marginBottom: '20px' }}>GazeTracker</h1>
          <SessionControl />
          <div className="visualization-container">
            <div className="gaze-container">
              <GazeTracker />
              <Heatmap />
            </div>
            <AnalyticsDashboard />
          </div>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;