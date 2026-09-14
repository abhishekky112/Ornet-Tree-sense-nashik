import React from 'react';
import { createRoot } from 'react-dom/client';
import 'ol/ol.css';
import './styles/global.css';
import './styles/tailwind.css';
import App from './app/App';

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
