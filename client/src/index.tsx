import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

console.log('index.tsx is being evaluated');
console.log('Looking for root element:', document.getElementById('root'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

const root = ReactDOM.createRoot(rootElement);
console.log('Created React root');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
