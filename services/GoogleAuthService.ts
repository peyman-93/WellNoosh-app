// services/GoogleAuthService.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Configure WebBrowser for iOS
WebBrowser.maybeCompleteAuthSession();

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface GoogleAuthResponse {
  success: boolean;
  user?: GoogleUser;
  error?: string;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    // TODO: Replace with your actual Google OAuth client IDs from Google Cloud Console
    this.clientId = Platform.select({
      ios: '64071118838-acupsgn06eua6vabsud6eurm5rejvp21.apps.googleusercontent.com',
      android: '64071118838-acupsgn06eua6vabsud6eurm5rejvp21.apps.googleusercontent.com',
      default: '64071118838-acupsgn06eua6vabsud6eurm5rejvp21.apps.googleusercontent.com',
    }) as string;
    
    // Fixed: Removed useProxy parameter
    this.redirectUri = AuthSession.makeRedirectUri({
      scheme: 'wellnoosh',
    });
  }

  async signInWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      // Fixed: Removed additionalParameters
      const request = new AuthSession.AuthRequest({
        clientId: this.clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: this.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: { 
          access_type: 'offline' 
        },
      });

      // Fixed: Simplified promptAsync call
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: this.clientId,
            code: result.params.code,
            redirectUri: this.redirectUri,
            extraParams: { 
              code_verifier: request.codeVerifier || '' 
            },
          },
          { 
            tokenEndpoint: 'https://oauth2.googleapis.com/token' 
          }
        );

        const userInfo = await this.getUserInfo(tokenResponse.accessToken);
        return { success: true, user: userInfo };
      } else if (result.type === 'cancel') {
        return { success: false, error: 'User cancelled' };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return await response.json();
  }

  isConfigured(): boolean {
    return !this.clientId.includes('YOUR_');
  }
}

export default new GoogleAuthService();