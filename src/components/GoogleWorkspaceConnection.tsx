import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { 
  getGoogleTokenStatus, 
  getGoogleAuthUrl, 
  disconnectGoogleAccount,
  GoogleTokenStatus,
  GoogleAuthResponse 
} from '../lib/google-integration';

const GoogleWorkspaceConnection: React.FC = () => {
  const [tokenStatus, setTokenStatus] = useState<GoogleTokenStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const status = await getGoogleTokenStatus();
      setTokenStatus(status);
    } catch (err) {
      console.error('Error checking Google connection status:', err);
      setError('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response: GoogleAuthResponse = await getGoogleAuthUrl();
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.auth_url) {
        // Redirect to Google OAuth
        window.location.href = response.auth_url;
      }
    } catch (err) {
      setError('Failed to initiate Google connection');
      console.error('Error connecting to Google:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await disconnectGoogleAccount();
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      setTokenStatus({ connected: false });
    } catch (err) {
      setError('Failed to disconnect Google account');
      console.error('Error disconnecting Google:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const isTokenExpired = () => {
    if (!tokenStatus.expires_at) return false;
    return new Date(tokenStatus.expires_at) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Checking connection status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <div>
              <p className="font-medium text-gray-900">Google Workspace</p>
              <p className="text-sm text-gray-600">Export documents to Google Docs & Sheets</p>
            </div>
          </div>
          
          {tokenStatus.connected && (
            <div className="flex items-center space-x-1">
              {isTokenExpired() ? (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className={`text-sm font-medium ${
                isTokenExpired() ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {isTokenExpired() ? 'Token Expired' : 'Connected'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {tokenStatus.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span>{actionLoading ? 'Connecting...' : 'Connect Google'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {tokenStatus.connected && tokenStatus.scope && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Permissions:</strong> {tokenStatus.scope.split(' ').join(', ')}
          </p>
          {tokenStatus.expires_at && (
            <p className="text-xs text-blue-600 mt-1">
              Expires: {new Date(tokenStatus.expires_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleWorkspaceConnection;