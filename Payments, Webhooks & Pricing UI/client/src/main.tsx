import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><AuthProvider><ToastProvider><App/></ToastProvider></AuthProvider></BrowserRouter></React.StrictMode>);
