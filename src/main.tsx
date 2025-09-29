// Force rebuild to clear Vite cache after dependency changes
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecureConsole } from './lib/consoleOverride';

// Initialize secure console override for production
initializeSecureConsole();

createRoot(document.getElementById("root")!).render(<App />);
