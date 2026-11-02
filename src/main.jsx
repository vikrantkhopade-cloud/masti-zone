import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { BookingProvider } from './context/BookingContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <BookingProvider>
          <App />
        </BookingProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
