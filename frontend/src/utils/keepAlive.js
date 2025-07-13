/**
 * Keep-Alive Service for Render.com Backend
 * Prevents the free tier backend from sleeping after 15 minutes
 */

let keepAliveInterval = null;

export const startKeepAlive = () => {
  // Only run keep-alive in production
  if (import.meta.env.DEV) {
    console.log('Keep-alive disabled in development mode');
    return;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    console.warn('VITE_API_URL not configured - keep-alive disabled');
    return;
  }

  // Ping every 10 minutes (600,000 ms)
  keepAliveInterval = setInterval(async () => {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        console.log('✅ Keep-alive ping successful');
      } else {
        console.warn('⚠️ Keep-alive ping failed:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Keep-alive ping error:', error.message);
    }
  }, 10 * 60 * 1000); // 10 minutes

  console.log('🔄 Keep-alive service started (pinging every 10 minutes)');
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('⏹️ Keep-alive service stopped');
  }
};

export const getKeepAliveStatus = () => {
  return {
    isRunning: keepAliveInterval !== null,
    apiUrl: import.meta.env.VITE_API_URL,
    isDev: import.meta.env.DEV,
  };
}; 