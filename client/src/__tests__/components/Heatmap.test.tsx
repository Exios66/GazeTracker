import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Heatmap from '../../components/Heatmap';
import { fetchApi } from '../../lib/api';

// Mock the API module
jest.mock('../../lib/api', () => ({
  fetchApi: jest.fn()
}));

// Mock d3 modules
const mockD3Selection = {
  attr: jest.fn().mockReturnThis(),
  selectAll: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  append: jest.fn().mockReturnThis(),
  data: jest.fn().mockReturnThis(),
  join: jest.fn().mockReturnThis(),
  style: jest.fn().mockReturnThis(),
  domain: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  call: jest.fn().mockReturnThis(),
  datum: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  transition: jest.fn().mockReturnThis()
};

jest.mock('d3', () => ({
  select: jest.fn(() => mockD3Selection),
  selectAll: jest.fn(() => mockD3Selection),
  scaleSequential: jest.fn(() => (d: number) => `rgba(0,0,${d},1)`),
  interpolateInferno: jest.fn(),
  max: jest.fn().mockReturnValue(10),
  line: jest.fn(() => mockD3Selection),
  axisBottom: jest.fn(() => mockD3Selection),
  axisLeft: jest.fn(() => mockD3Selection),
  scaleLinear: jest.fn(() => mockD3Selection)
}));

// Create hexbin mock function first
const mockHexagon = jest.fn().mockReturnValue('M0,0L0,1L1,1L1,0Z');
const mockHexbinInstance = {
  radius: jest.fn().mockReturnThis(),
  extent: jest.fn().mockReturnThis(),
  hexagon: mockHexagon,
  __data__: []
};

// Then use it in the mock
jest.mock('d3-hexbin', () => ({
  hexbin: jest.fn(() => mockHexbinInstance)
}));

const mockGazeData = [
  { x: 100, y: 100, confidence: 0.8 },
  { x: 200, y: 200, confidence: 0.9 },
  { x: 300, y: 300, confidence: 0.7 }
];

describe('Heatmap Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    (fetchApi as jest.Mock).mockResolvedValue(mockGazeData);
    jest.clearAllMocks();
  });

  const renderWithQuery = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('should render toggle button', () => {
    renderWithQuery(<Heatmap />);
    expect(screen.getByText('Show Heatmap')).toBeInTheDocument();
  });

  it('should toggle visibility on button click', () => {
    renderWithQuery(<Heatmap />);
    const button = screen.getByText('Show Heatmap');
    
    fireEvent.click(button);
    expect(screen.getByText('Hide Heatmap')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(screen.getByText('Show Heatmap')).toBeInTheDocument();
  });

  it('should fetch data when visible', async () => {
    renderWithQuery(<Heatmap />);
    const button = screen.getByText('Show Heatmap');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith('api/sessions/current/gaze');
    });
  });

  it('should not fetch data when hidden', () => {
    renderWithQuery(<Heatmap />);
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it('should render SVG when data is available and visible', async () => {
    renderWithQuery(<Heatmap />);
    const button = screen.getByText('Show Heatmap');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      const svg = screen.getByTestId('heatmap-svg');
      expect(svg).toBeInTheDocument();
    });

    await waitFor(() => {
      const svg = screen.getByTestId('heatmap-svg');
      expect(svg).toHaveStyle({ opacity: '0.6' });
    });
  });

  it('should clear SVG when hidden', async () => {
    renderWithQuery(<Heatmap />);
    const button = screen.getByText('Show Heatmap');
    
    // Show heatmap
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('heatmap-svg')).toBeInTheDocument();
    });
    
    // Hide heatmap
    fireEvent.click(button);
    await waitFor(() => {
      const svg = screen.getByTestId('heatmap-svg');
      expect(svg).toHaveStyle({ opacity: '0' });
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetchApi as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    renderWithQuery(<Heatmap />);
    const button = screen.getByText('Show Heatmap');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      const svg = screen.getByTestId('heatmap-svg');
      expect(within(svg).queryByRole('presentation')).not.toBeInTheDocument();
    });
  });

  it('should filter out low confidence points', async () => {
    const dataWithLowConfidence = [
      ...mockGazeData,
      { x: 400, y: 400, confidence: 0.2 } // Should be filtered out
    ];
    
    (fetchApi as jest.Mock).mockResolvedValue(dataWithLowConfidence);
    
    renderWithQuery(<Heatmap />);
    const button = screen.getByText('Show Heatmap');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      const svg = screen.getByTestId('heatmap-svg');
      expect(mockD3Selection.data).toHaveBeenCalled();
      expect(mockD3Selection.join).toHaveBeenCalled();
    });
  });
}); 