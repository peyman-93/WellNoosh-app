import { supabase } from './supabase';

export interface GroceryItem {
  id: string;
  user_id: string;
  name: string;
  amount: string;
  category: string;
  from_recipe?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGroceryItem {
  name: string;
  amount?: string;
  category?: string;
  from_recipe?: string;
}

export const groceryListService = {
  async getGroceryList(): Promise<GroceryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching grocery list:', error);
      throw error;
    }

    return data || [];
  },

  async addItem(item: CreateGroceryItem): Promise<GroceryItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('grocery_list')
      .insert({
        user_id: user.id,
        name: item.name,
        amount: item.amount || '1',
        category: item.category || 'Other',
        from_recipe: item.from_recipe,
        completed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding grocery item:', error);
      throw error;
    }

    return data;
  },

  async addMultipleItems(items: CreateGroceryItem[]): Promise<GroceryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const itemsToInsert = items.map(item => ({
      user_id: user.id,
      name: item.name,
      amount: item.amount || '1',
      category: item.category || 'Other',
      from_recipe: item.from_recipe,
      completed: false
    }));

    const { data, error } = await supabase
      .from('grocery_list')
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error('Error adding grocery items:', error);
      throw error;
    }

    return data || [];
  },

  async toggleItemCompletion(itemId: string, completed: boolean): Promise<void> {
    const { error } = await supabase
      .from('grocery_list')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) {
      console.error('Error toggling item completion:', error);
      throw error;
    }
  },

  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('grocery_list')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error removing grocery item:', error);
      throw error;
    }
  },

  async clearCompletedItems(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('grocery_list')
      .delete()
      .eq('user_id', user.id)
      .eq('completed', true);

    if (error) {
      console.error('Error clearing completed items:', error);
      throw error;
    }
  },

  async updateItem(itemId: string, updates: Partial<Pick<GroceryItem, 'name' | 'amount' | 'category'>>): Promise<void> {
    const { error } = await supabase
      .from('grocery_list')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating grocery item:', error);
      throw error;
    }
  }
};
