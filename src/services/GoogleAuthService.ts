import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/config/supabase';

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
}

export interface GoogleAuthResult {
  type: 'success' | 'error' | 'cancel';
  session?: any;
  error?: string;
}

export class GoogleAuthService {
  private config: GoogleAuthConfig;
  
  constructor(config: GoogleAuthConfig) {
    this.config = config;
  }

  /**
   * Initiate Google OAuth flow
   */
  async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      console.log('Starting Google OAuth flow...');
      
      // Create a random state for security
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36),
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      );

      // Configure the OAuth request
      const request = new AuthSession.AuthRequest({
        clientId: this.config.clientId,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri: this.config.redirectUri,
        state,
        additionalParameters: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      });

      // Start the OAuth flow
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        showInRecents: true,
      });

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        const { code } = result.params;
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for tokens with Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: this.config.redirectUri,
          },
        });

        if (error) {
          console.error('Supabase OAuth error:', error);
          throw error;
        }

        console.log('Google sign-in successful:', data);
        
        return {
          type: 'success',
          session: data.session,
        };
      } else if (result.type === 'cancel') {
        console.log('Google sign-in cancelled');
        return {
          type: 'cancel',
        };
      } else {
        console.log('Google sign-in error:', result);
        return {
          type: 'error',
          error: 'Authentication failed',
        };
      }
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      return {
        type: 'error',
        error: error.message || 'Authentication failed',
      };
    }
  }

  /**
   * Alternative method using Supabase's direct OAuth with proper web browser flow
   */
  async signInWithGoogleDirect(): Promise<GoogleAuthResult> {
    try {
      console.log('Starting direct Google OAuth with Supabase...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: this.config.redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('Supabase direct OAuth error:', error);
        throw error;
      }

      console.log('Google direct sign-in initiated:', data);
      
      // For OAuth, we need to open the URL in a browser and handle the callback
      if (data.url) {
        console.log('Opening OAuth URL:', data.url);
        
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          this.config.redirectUri,
          {
            showInRecents: true,
          }
        );
        
        console.log('WebBrowser result:', result);
        
        if (result.type === 'success') {
          // The callback should trigger Supabase's auth state change
          // We'll get the session from the auth state listener
          return {
            type: 'success',
          };
        } else if (result.type === 'cancel') {
          return {
            type: 'cancel',
          };
        } else {
          return {
            type: 'error',
            error: 'Authentication was not completed',
          };
        }
      }
      
      return {
        type: 'success',
        session: data.session,
      };
    } catch (error: any) {
      console.error('Google direct OAuth error:', error);
      return {
        type: 'error',
        error: error.message || 'Authentication failed',
      };
    }
  }
}

// Default configuration
export const createGoogleAuthService = (): GoogleAuthService => {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  
  // For development, use the Expo development server URL
  // For production, use your app's custom scheme
  const redirectUri = AuthSession.makeRedirectUri({
    // Use default Expo scheme for development
    useProxy: true,
  });

  console.log('Google OAuth redirect URI:', redirectUri);

  if (!clientId) {
    throw new Error('Google Client ID not configured. Please add EXPO_PUBLIC_GOOGLE_CLIENT_ID to your .env file');
  }

  // Safety check: prevent using placeholder or invalid client IDs
  if (clientId.includes('your-own-google-client-id') || clientId.includes('your-google-client-id')) {
    throw new Error('Please replace the placeholder Google Client ID with your actual Client ID from Google Cloud Console');
  }

  return new GoogleAuthService({
    clientId,
    redirectUri,
  });
};

export default GoogleAuthService;