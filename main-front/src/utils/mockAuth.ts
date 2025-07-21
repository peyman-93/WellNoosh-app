import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock authentication for testing backend integration
export const mockAuth = {
  // Create a mock session for testing
  async createMockSession(): Promise<void> {
    const mockSession = {
      access_token: 'mock-jwt-token-for-testing',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@wellnoosh.com',
        fullName: 'Test User'
      },
      expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
    };

    await AsyncStorage.setItem('wellnoosh_session', JSON.stringify(mockSession));
    console.log('🔑 Mock authentication session created for testing');
  },

  // Check if user has a session (real or mock)
  async hasSession(): Promise<boolean> {
    try {
      const session = await AsyncStorage.getItem('wellnoosh_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        return parsedSession.expires_at > Date.now();
      }
      return false;
    } catch {
      return false;
    }
  },

  // Get session for debugging
  async getSession(): Promise<any> {
    try {
      const session = await AsyncStorage.getItem('wellnoosh_session');
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  },

  // Clear session
  async clearSession(): Promise<void> {
    await AsyncStorage.removeItem('wellnoosh_session');
    console.log('🔑 Session cleared');
  }
};