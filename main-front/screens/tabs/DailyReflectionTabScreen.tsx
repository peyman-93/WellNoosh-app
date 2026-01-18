import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'
import { useAuth } from '../../src/context/supabase-provider'
import { supabase } from '../../src/services/supabase'
import { getLocalDateString } from '../../src/services/nutritionService'

interface DailyReflection {
  id: string
  user_id: string
  reflection_date: string
  mood_rating: number
  energy_level: number
  sleep_quality: number
  water_intake: number
  notes: string
  wins: string
  gratitude: string
  created_at: string
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' }
]

const ENERGY_OPTIONS = [
  { value: 1, emoji: '🪫', label: 'Exhausted' },
  { value: 2, emoji: '😴', label: 'Tired' },
  { value: 3, emoji: '⚡', label: 'Normal' },
  { value: 4, emoji: '💪', label: 'Energized' },
  { value: 5, emoji: '🔥', label: 'On Fire' }
]

const SLEEP_OPTIONS = [
  { value: 1, emoji: '😵', label: 'Terrible' },
  { value: 2, emoji: '😪', label: 'Poor' },
  { value: 3, emoji: '😌', label: 'Okay' },
  { value: 4, emoji: '😴', label: 'Good' },
  { value: 5, emoji: '🌙', label: 'Excellent' }
]

export default function DailyReflectionTabScreen() {
  const { session } = useAuth()
  const userId = session?.user?.id
  const today = getLocalDateString()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reflection, setReflection] = useState<Partial<DailyReflection>>({
    mood_rating: 3,
    energy_level: 3,
    sleep_quality: 3,
    water_intake: 0,
    notes: '',
    wins: '',
    gratitude: ''
  })

  useEffect(() => {
    loadTodayReflection()
  }, [userId])

  const loadTodayReflection = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', userId)
        .eq('reflection_date', today)
        .single()

      if (data && !error) {
        setReflection(data)
      }
    } catch (error) {
      console.log('No reflection found for today, starting fresh')
    } finally {
      setLoading(false)
    }
  }

  const saveReflection = async () => {
    if (!userId) return
    setSaving(true)
    try {
      const reflectionData = {
        user_id: userId,
        reflection_date: today,
        mood_rating: reflection.mood_rating,
        energy_level: reflection.energy_level,
        sleep_quality: reflection.sleep_quality,
        water_intake: reflection.water_intake || 0,
        notes: reflection.notes || '',
        wins: reflection.wins || '',
        gratitude: reflection.gratitude || '',
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('daily_reflections')
        .upsert(reflectionData, { onConflict: 'user_id,reflection_date' })

      if (error) throw error
      Alert.alert('Saved!', 'Your daily reflection has been saved.')
    } catch (error) {
      console.error('Error saving reflection:', error)
      Alert.alert('Error', 'Could not save your reflection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateValue = (key: keyof DailyReflection, value: any) => {
    setReflection(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B8E23" />
          <Text style={styles.loadingText}>Loading your reflection...</Text>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Reflection</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          <View style={styles.optionsRow}>
            {MOOD_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  reflection.mood_rating === option.value && styles.optionButtonActive
                ]}
                onPress={() => updateValue('mood_rating', option.value)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  reflection.mood_rating === option.value && styles.optionLabelActive
                ]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy Level</Text>
          <View style={styles.optionsRow}>
            {ENERGY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  reflection.energy_level === option.value && styles.optionButtonActive
                ]}
                onPress={() => updateValue('energy_level', option.value)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  reflection.energy_level === option.value && styles.optionLabelActive
                ]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Quality</Text>
          <View style={styles.optionsRow}>
            {SLEEP_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  reflection.sleep_quality === option.value && styles.optionButtonActive
                ]}
                onPress={() => updateValue('sleep_quality', option.value)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  reflection.sleep_quality === option.value && styles.optionLabelActive
                ]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Water Intake (glasses)</Text>
          <View style={styles.waterRow}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.waterButton,
                  (reflection.water_intake || 0) >= num && num > 0 && styles.waterButtonFilled
                ]}
                onPress={() => updateValue('water_intake', num)}
              >
                <Text style={styles.waterEmoji}>{num === 0 ? '❌' : '💧'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.waterCount}>{reflection.water_intake || 0} glasses</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Wins</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What went well today?"
            placeholderTextColor="#9CA3AF"
            value={reflection.wins || ''}
            onChangeText={(text) => updateValue('wins', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gratitude</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What are you grateful for?"
            placeholderTextColor="#9CA3AF"
            value={reflection.gratitude || ''}
            onChangeText={(text) => updateValue('gratitude', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Any other thoughts or reflections..."
            placeholderTextColor="#9CA3AF"
            value={reflection.notes || ''}
            onChangeText={(text) => updateValue('notes', text)}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveReflection}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Reflection</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#6B8E23',
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  optionLabelActive: {
    color: '#6B8E23',
    fontWeight: '600',
  },
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterButtonFilled: {
    backgroundColor: '#DBEAFE',
  },
  waterEmoji: {
    fontSize: 18,
  },
  waterCount: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  bottomPadding: {
    height: 100,
  },
})
