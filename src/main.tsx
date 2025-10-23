import React from 'react'
import ReactDOM from 'react-dom/client'
import Sidebar from './ui/sidebar/Sidebar'
import './index.css'
import "./ui/theme/globals.css";




// Determine if we're in popup or options context
const isPopup = window.location.pathname.includes('index.html');
const isOptions = window.location.pathname.includes('options.html');

if (isPopup) {
  // Load popup component
  import('./ui/overlay/Popup').then(({ default: Popup }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <Popup />
      </React.StrictMode>
    );
  });
} else if (isOptions) {
  // Load sidebar component
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Sidebar />
    </React.StrictMode>
  );
} else {
  // Default to sidebar
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Sidebar />
    </React.StrictMode>
  );
}
