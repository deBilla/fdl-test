import React from "react";
import ReactDOM from "react-dom/client"; // Import createRoot from react-dom/client for React 18+

import App from "./App"; // Import the main App component

// Find the root DOM element where the React app will be mounted
// This ID must match the div ID in your public/index.html file
const rootElement = document.getElementById("root");

// Create a root instance using the modern Concurrent Mode API (React 18+)
const root = ReactDOM.createRoot(rootElement);

// Render the main App component into the root element
// React.StrictMode is a wrapper that helps identify potential problems in an application during development.
// It does not affect the production build.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to measure performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// Optional: import reportWebVitals from './reportWebVitals';
// reportWebVitals();
