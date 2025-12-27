import { supabase } from './supabase'

interface DailyWellness {
  id?: string
  user_id: string
  date: string
  water_glasses: number
  breathing_exercises: number
}

export const wellnessService = {
  async getTodaysWellness(userId: string): Promise<DailyWellness | null> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_wellness')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    
    if (error) {
      console.error('Error fetching wellness data:', error)
      return null
    }
    
    return data
  },

  async updateWaterGlasses(userId: string, count: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase
      .from('daily_wellness')
      .upsert({
        user_id: userId,
        date: today,
        water_glasses: count,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      })
    
    if (error) {
      console.error('Error updating water glasses:', error)
      return false
    }
    
    return true
  },

  async updateBreathingExercises(userId: string, count: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase
      .from('daily_wellness')
      .upsert({
        user_id: userId,
        date: today,
        breathing_exercises: count,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      })
    
    if (error) {
      console.error('Error updating breathing exercises:', error)
      return false
    }
    
    return true
  }
}
