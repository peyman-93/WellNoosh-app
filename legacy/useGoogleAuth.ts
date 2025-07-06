// hooks/useGoogleAuth.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import GoogleAuthService from '../services/GoogleAuthService';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface UseGoogleAuthReturn {
  isLoading: boolean;
  user: GoogleUser | null;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => void;
}

export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!GoogleAuthService.isConfigured()) {
      Alert.alert(
        'Setup Required',
        'Google Sign In needs to be configured. Please check the GoogleAuthService.ts file.'
      );
      return false;
    }

    setIsLoading(true);
    
    try {
      const result = await GoogleAuthService.signInWithGoogle();
      
      if (result.success && result.user) {
        setUser(result.user);
        console.log('Google Sign In Success:', result.user);
        return true;
      } else {
        if (result.error && result.error !== 'User cancelled') {
          Alert.alert('Sign In Failed', result.error);
        }
        return false;
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      Alert.alert('Sign In Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  return {
    isLoading,
    user,
    signInWithGoogle,
    signOut,
  };
};