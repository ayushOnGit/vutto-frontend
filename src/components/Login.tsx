import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Call parent onLogin function
        onLogin(data.data.user);
        
        // Navigate to settlement dashboard (matches App.tsx routes)
        navigate('/settlement');
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
    setIsGoogleLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Call parent onLogin function
        onLogin(data.data.user);
        
        // Navigate to settlement dashboard (matches App.tsx routes)
        navigate('/settlement');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith('@vutto.in');
  };

  const isFormValid = email && validateEmail(email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Vutto Company Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in with your @vutto.in Google account
          </p>
        </div>
        
        {/* Google OAuth Login */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3">Recommended: Sign in with Google</p>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="300"
              />
            </div>
            {isGoogleLoading && (
              <div className="mt-3 text-blue-400 text-sm">
                <svg className="animate-spin h-4 w-4 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Google account...
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">Or continue with email</span>
            </div>
          </div>
        </div>
        
        {/* Email Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  email && !validateEmail(email) ? 'border-red-500' : 'border-gray-700'
                } placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email address (@vutto.in)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name (Optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {email && !validateEmail(email) && (
            <div className="text-red-400 text-sm text-center">
              Only @vutto.in email addresses are allowed
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900 bg-opacity-20 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isFormValid && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            <strong>Google Sign-in (Recommended):</strong> Verifies your actual @vutto.in Gmail account
            <br />
            <strong>Email Sign-in:</strong> Basic domain verification only
            <br />
            <br />
            This system is restricted to Vutto company employees only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
