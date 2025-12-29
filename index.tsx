
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("🚀 Initializing application...");

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ App rendered successfully.");
  } catch (err) {
    console.error("❌ Rendering failed:", err);
    container.innerHTML = `<div style="color: white; text-align: center; padding: 50px;">
      <h2>שגיאה בטעינת המערכת</h2>
      <p>${err.message}</p>
    </div>`;
  }
} else {
  console.error("❌ Root container not found!");
}
