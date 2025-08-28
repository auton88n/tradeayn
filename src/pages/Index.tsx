import { useState, useEffect } from 'react';
import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('ayn_auth_token');
    const userData = localStorage.getItem('ayn_user');
    
    if (authToken && userData) {
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center animate-pulse-glow">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-muted-foreground">Loading AYN...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LandingPage />;
};

export default Index;
