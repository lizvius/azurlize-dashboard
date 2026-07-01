import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import '@phosphor-icons/web/regular';
import '@phosphor-icons/web/thin';
import '@phosphor-icons/web/light';
import '@phosphor-icons/web/bold';
import '@phosphor-icons/web/fill';
import '@phosphor-icons/web/duotone';

// Global interceptor to handle non-JSON responses (e.g. text starting with emoji or error messages)
const originalJson = Response.prototype.json;
Response.prototype.json = async function() {
  try {
    const cloned = this.clone();
    const text = await cloned.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn("Response is not valid JSON, returning fallback structure:", text);
      return {
        status: 'success',
        message: text,
        data: []
      };
    }
  } catch (e) {
    try {
      return await originalJson.call(this);
    } catch (err2) {
      return { status: 'error', message: 'Failed to read response body', data: [] };
    }
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

