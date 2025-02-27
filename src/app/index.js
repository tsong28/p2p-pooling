import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './deposit';
import DelegatorSummary from './stats'; // Import the DelegatorSummary component

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <DelegatorSummary />
  </React.StrictMode>
);
