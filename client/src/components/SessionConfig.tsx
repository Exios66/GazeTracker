import React from 'react';

export interface SessionConfigData {
  participantId: string;
  isPilot: boolean;
}

interface SessionConfigProps {
  onConfigSubmit: (config: SessionConfigData) => void;
}

const SessionConfig: React.FC<SessionConfigProps> = ({ onConfigSubmit }) => {
  const [participantId, setParticipantId] = React.useState('');
  const [isPilot, setIsPilot] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId.trim()) return;
    onConfigSubmit({ participantId, isPilot });
  };

  return (
    <div className="session-config" style={{ maxWidth: '400px', margin: '20px auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Session Configuration</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="participantId"
            style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
          >
            Participant ID #
          </label>
          <input
            id="participantId"
            type="text"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isPilot}
              onChange={(e) => setIsPilot(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: 'bold' }}>Pilot Session Mode</span>
          </label>
          {isPilot && (
            <div style={{ 
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#fff3cd',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#856404'
            }}>
              Debug logging and live data feed will be enabled
            </div>
          )}
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          Start Session
        </button>
      </form>
    </div>
  );
};

export default SessionConfig; 