import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './supabase-provider';

interface BadgeContextType {
  recipeBadgeCount: number;
  groceryBadgeCount: number;
  refreshBadges: () => Promise<void>;
  clearRecipeBadge: () => void;
  clearGroceryBadge: () => void;
  incrementRecipeBadge: () => void;
  incrementGroceryBadge: (count?: number) => void;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export function BadgeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [recipeBadgeCount, setRecipeBadgeCount] = useState(0);
  const [groceryBadgeCount, setGroceryBadgeCount] = useState(0);
  const hasSeenRecipes = useRef(false);
  const hasSeenGrocery = useRef(false);

  const refreshBadges = useCallback(async () => {
    // Badges only show new items since last visit
    // They start at 0 and only increment when new items are added
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      // Reset badge visibility flags on login
      hasSeenRecipes.current = false;
      hasSeenGrocery.current = false;
      setRecipeBadgeCount(0);
      setGroceryBadgeCount(0);
    }
  }, [session?.user?.id]);

  const clearRecipeBadge = useCallback(() => {
    hasSeenRecipes.current = true;
    setRecipeBadgeCount(0);
  }, []);

  const clearGroceryBadge = useCallback(() => {
    hasSeenGrocery.current = true;
    setGroceryBadgeCount(0);
  }, []);

  const incrementRecipeBadge = useCallback(() => {
    // Only show badge if user hasn't seen the recipes tab yet
    if (!hasSeenRecipes.current) {
      setRecipeBadgeCount(prev => prev + 1);
    }
  }, []);

  const incrementGroceryBadge = useCallback((count: number = 1) => {
    // Only show badge if user hasn't seen the grocery tab yet
    if (!hasSeenGrocery.current) {
      setGroceryBadgeCount(prev => prev + count);
    }
  }, []);

  return (
    <BadgeContext.Provider value={{
      recipeBadgeCount,
      groceryBadgeCount,
      refreshBadges,
      clearRecipeBadge,
      clearGroceryBadge,
      incrementRecipeBadge,
      incrementGroceryBadge,
    }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadge() {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error('useBadge must be used within a BadgeProvider');
  }
  return context;
}
