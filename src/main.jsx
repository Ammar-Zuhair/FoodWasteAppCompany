import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Global fetch interceptor to handle 401 Unauthorized (Expired tokens)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [url, config] = args;
  const urlStr = typeof url === 'string' ? url : url.url;

  // If it's an API request (excluding health checks and login), check for local expiration
  if (urlStr && urlStr.includes('/api/v1/') &&
    !urlStr.includes('/auth/login') &&
    !urlStr.includes('/health')) {

    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));

          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn('Global Interceptor: Token expired locally. Blocking request to:', urlStr);
            // Dispatch event for App.jsx to handle logout
            setTimeout(() => window.dispatchEvent(new CustomEvent('auth:expired')), 0);

            // Return a mocked 401 response to avoid the network call
            return new Response(JSON.stringify({ detail: "Signature has expired" }), {
              status: 401,
              statusText: "Unauthorized",
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (e) {
        // If we can't parse it, let the request proceed and be handled by the backend
      }
    }
  }

  try {
    const response = await originalFetch(...args);
    if (response.status === 401 && !urlStr.includes('/auth/login')) {
      console.warn('Global Fetch Interceptor: 401 Unauthorized detected from server');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
