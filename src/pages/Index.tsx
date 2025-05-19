
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// This page simply redirects to the login or dashboard
const Index = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  
  // Auto-login with admin credentials for demo purposes
  useEffect(() => {
    const autoLogin = async () => {
      if (!isLoading && !isAuthenticated) {
        try {
          await login('davidtorreslopez190924@gmail.com', 'djfainali');
        } catch (error) {
          console.error('Auto login failed:', error);
        }
      }
    };
    
    autoLogin();
  }, [isLoading, isAuthenticated, login]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Loading ProxVPS</h1>
          <p className="text-muted-foreground">Please wait while we set up your environment...</p>
        </div>
      </div>
    );
  }
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

export default Index;
