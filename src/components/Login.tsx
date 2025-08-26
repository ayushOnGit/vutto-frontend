import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    console.log('🔐 Google OAuth Success:', credentialResponse);
    setIsGoogleLoading(true);
    setError('');

    try {
      console.log('📡 Making API call to /api/auth/google-login...');
      const response = await fetch('https://test.fitstok.com/api/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      console.log('📡 API Response Status:', response.status);
      const data = await response.json();
      console.log('📡 API Response Data:', data);

      if (data.success) {
        console.log('✅ Login successful, storing data...');
        // Store token in localStorage
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        console.log('💾 Data stored in localStorage');
        console.log('Token:', localStorage.getItem('authToken'));
        console.log('User:', localStorage.getItem('user'));
        
        // Call parent onLogin function
        console.log('🔄 Calling onLogin function...');
        onLogin(data.data.user);
        
        console.log('🧭 Navigating to /settlement...');
        // Navigate to settlement dashboard (matches App.tsx routes)
        navigate('/settlement');
        console.log('✅ Navigation completed');
      } else {
        console.log('❌ Login failed:', data.message);
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
    setIsGoogleLoading(false);
  };

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
            <p className="text-sm text-gray-400 mb-3">Sign in with Google</p>
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
          
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="text-red-400 text-sm text-center bg-red-900 bg-opacity-20 p-3 rounded">
            {error}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            <strong>Google Sign-in Required:</strong> Verifies your actual @vutto.in Gmail account
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
