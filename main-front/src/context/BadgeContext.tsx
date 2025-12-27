import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { recipeCacheService } from '../services/recipeCacheService';
import { groceryListService } from '../services/groceryListService';
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

  const refreshBadges = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      recipeCacheService.setUserId(session.user.id);
      const likedRecipes = await recipeCacheService.getLikedRecipes();
      setRecipeBadgeCount(likedRecipes.length);

      try {
        const groceryItems = await groceryListService.getGroceryList();
        const uncheckedItems = groceryItems.filter(item => !item.completed).length;
        setGroceryBadgeCount(uncheckedItems);
      } catch (error) {
        console.log('Could not fetch grocery list for badge:', error);
      }
    } catch (error) {
      console.error('Error refreshing badges:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      refreshBadges();
    }
  }, [session?.user?.id, refreshBadges]);

  const clearRecipeBadge = useCallback(() => {
    setRecipeBadgeCount(0);
  }, []);

  const clearGroceryBadge = useCallback(() => {
    setGroceryBadgeCount(0);
  }, []);

  const incrementRecipeBadge = useCallback(() => {
    setRecipeBadgeCount(prev => prev + 1);
  }, []);

  const incrementGroceryBadge = useCallback((count: number = 1) => {
    setGroceryBadgeCount(prev => prev + count);
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
