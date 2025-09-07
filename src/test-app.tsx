// Simple test component to verify app is working
import React from 'react';

export const TestApp: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>
        ✅ Application is Working!
      </h1>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Test Results:</h2>
        <ul>
          <li>✅ React is loading</li>
          <li>✅ TypeScript is working</li>
          <li>✅ Vite build is successful</li>
          <li>✅ CSS is loading</li>
          <li>✅ Components are rendering</li>
        </ul>
        <p>
          If you can see this message, the basic application structure is working correctly.
          The main app should now be accessible at the root URL.
        </p>
      </div>
    </div>
  );
};
