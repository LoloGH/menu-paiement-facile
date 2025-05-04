
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase, setupRealtimeTables } from '@/integrations/supabase/client';

// Initialize realtime functionality for important tables
setupRealtimeTables().then(success => {
  if (success) {
    console.log("Realtime functionality enabled for important tables");
  } else {
    console.warn("Could not enable realtime for some tables. Some features may not work correctly.");
  }
});

createRoot(document.getElementById("root")!).render(<App />);
