import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native'
import Slider from '@react-native-community/slider'
import DateTimePicker from '@react-native-community/datetimepicker'

interface DailyCheckInScreenProps {
  visible: boolean
  onClose: () => void
  onSave?: (data: DailyCheckInData) => void
}

interface DailyCheckInData {
  date: string
  weight: number
  mood: number
  stress: number
  sleep: number
  energy: number
  mealTimes: {
    breakfast: string
    lunch: string
    dinner: string
  }
  reflection?: string
}

const moodScale = [
  { emoji: '😢', label: 'Very Sad', value: 1 },
  { emoji: '😔', label: 'Sad', value: 2 },
  { emoji: '😕', label: 'Down', value: 3 },
  { emoji: '😐', label: 'Neutral', value: 4 },
  { emoji: '🙂', label: 'Ok', value: 5 },
  { emoji: '😊', label: 'Good', value: 6 },
  { emoji: '😄', label: 'Happy', value: 7 },
  { emoji: '😃', label: 'Very Happy', value: 8 },
  { emoji: '🤗', label: 'Great', value: 9 },
  { emoji: '🤩', label: 'Amazing', value: 10 }
]

const energyScale = [
  { emoji: '😴', label: 'Exhausted', value: 1 },
  { emoji: '😪', label: 'Very Tired', value: 2 },
  { emoji: '🥱', label: 'Tired', value: 3 },
  { emoji: '😌', label: 'Low', value: 4 },
  { emoji: '🙂', label: 'Moderate', value: 5 },
  { emoji: '😊', label: 'Good', value: 6 },
  { emoji: '😃', label: 'Energetic', value: 7 },
  { emoji: '⚡', label: 'Very Energetic', value: 8 },
  { emoji: '💪', label: 'Powerful', value: 9 },
  { emoji: '🚀', label: 'Unstoppable', value: 10 }
]

export default function DailyCheckInScreen({ visible, onClose, onSave }: DailyCheckInScreenProps) {
  const [data, setData] = useState<DailyCheckInData>({
    date: new Date().toISOString().split('T')[0],
    weight: 70,
    mood: 5,
    stress: 3,
    sleep: 7,
    energy: 6,
    mealTimes: {
      breakfast: '08:00',
      lunch: '13:00',
      dinner: '19:00'
    },
    reflection: ''
  })

  const [currentSection, setCurrentSection] = useState(0)
  const sections = ['wellness', 'energy', 'meals', 'reflection']
  const [showTimePicker, setShowTimePicker] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null)
  const [tempTime, setTempTime] = useState(new Date())

  const handleSave = () => {
    onSave?.(data)
    onClose()
  }

  const handleBack = () => {
    if (currentSection === 0) {
      onClose()
    } else {
      setCurrentSection(prev => prev - 1)
    }
  }

  const renderMoodSelector = () => {
    const currentMood = moodScale[data.mood - 1]
    return (
      <View style={styles.sliderSectionContainer}>
        <View style={styles.emojiSliderHeader}>
          <Text style={styles.currentEmoji}>{currentMood.emoji}</Text>
          <Text style={styles.emojiLabel}>{currentMood.label}</Text>
        </View>
        
        <View style={styles.emojiSliderContainer}>
          <Slider
            style={styles.emojiSlider}
            minimumValue={1}
            maximumValue={10}
            value={data.mood}
            onValueChange={(val) => setData(prev => ({ ...prev, mood: Math.round(val) }))}
            minimumTrackTintColor="#EC4899"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#EC4899"
          />
          <View style={styles.emojiIndicators}>
            {[0, 2, 4, 6, 9].map((index) => (
              <View key={index} style={styles.emojiIndicator}>
                <Text style={styles.indicatorEmoji}>{moodScale[index].emoji}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>Very Sad</Text>
          <Text style={styles.sliderLabelText}>Amazing</Text>
        </View>
      </View>
    )
  }

  const renderSlider = (
    value: number, 
    onChange: (val: number) => void, 
    icon: string, 
    label: string, 
    color: string
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={[styles.sliderIcon, { backgroundColor: color }]}>
          <Text style={styles.sliderIconText}>{icon}</Text>
        </View>
        <View style={styles.sliderInfo}>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={styles.sliderValue}>{value}/10</Text>
        </View>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor="#E5E7EB"
        thumbTintColor={color}
      />
    </View>
  )

  const renderWellnessSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Wellness</Text>
        <Text style={styles.sectionSubtitle}>A gentle check on how you're doing</Text>
      </View>

      {renderMoodSelector()}
      
      <View style={styles.sliderSection}>
        {renderSlider(data.sleep, (val) => setData(prev => ({ ...prev, sleep: Math.round(val) })), '🛏️', 'Sleep Quality', '#6366F1')}
        {renderSlider(data.stress, (val) => setData(prev => ({ ...prev, stress: Math.round(val) })), '🧠', 'Stress Level', '#EF4444')}
      </View>
    </View>
  )

  const renderEnergySection = () => {
    const currentEnergy = energyScale[data.energy - 1]
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Energy Level</Text>
          <Text style={styles.sectionSubtitle}>How energized do you feel today?</Text>
        </View>
        
        <View style={styles.sliderSectionContainer}>
          <View style={styles.emojiSliderHeader}>
            <Text style={styles.currentEmoji}>{currentEnergy.emoji}</Text>
            <Text style={styles.emojiLabel}>{currentEnergy.label}</Text>
          </View>
          
          <View style={styles.emojiSliderContainer}>
            <Slider
              style={styles.emojiSlider}
              minimumValue={1}
              maximumValue={10}
              value={data.energy}
              onValueChange={(val) => setData(prev => ({ ...prev, energy: Math.round(val) }))}
              minimumTrackTintColor="#F59E0B"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#F59E0B"
            />
            <View style={styles.emojiIndicators}>
              {[0, 2, 4, 6, 9].map((index) => (
                <View key={index} style={styles.emojiIndicator}>
                  <Text style={styles.indicatorEmoji}>{energyScale[index].emoji}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Exhausted</Text>
            <Text style={styles.sliderLabelText}>Unstoppable</Text>
          </View>
        </View>

        <View style={styles.weightSection}>
          <View style={styles.weightHeader}>
            <Text style={styles.weightIcon}>⚖️</Text>
            <Text style={styles.weightLabel}>Weight Check</Text>
          </View>
          <View style={styles.weightControls}>
            <TouchableOpacity
              onPress={() => setData(prev => ({ ...prev, weight: Math.max(30, prev.weight - 0.5) }))}
              style={styles.weightButton}
            >
              <Text style={styles.weightButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.weightValue}>{data.weight} kg</Text>
            <TouchableOpacity
              onPress={() => setData(prev => ({ ...prev, weight: Math.min(200, prev.weight + 0.5) }))}
              style={styles.weightButton}
            >
              <Text style={styles.weightButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null)
    }
    
    if (selectedDate && showTimePicker) {
      const hours = selectedDate.getHours().toString().padStart(2, '0')
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0')
      const timeString = `${hours}:${minutes}`
      
      setData(prev => ({
        ...prev,
        mealTimes: { ...prev.mealTimes, [showTimePicker]: timeString }
      }))
      
      if (Platform.OS === 'ios') {
        setTempTime(selectedDate)
      }
    }
  }

  const formatTimeDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const renderMealsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Meal Times</Text>
        <Text style={styles.sectionSubtitle}>When did you nourish yourself today?</Text>
      </View>

      <View style={styles.mealsList}>
        {[
          { key: 'breakfast' as const, label: 'Breakfast', icon: '🥐', color: '#F97316', defaultTime: '08:00' },
          { key: 'lunch' as const, label: 'Lunch', icon: '🥗', color: '#10B981', defaultTime: '13:00' },
          { key: 'dinner' as const, label: 'Dinner', icon: '🍽️', color: '#8B5CF6', defaultTime: '19:00' }
        ].map((meal) => {
          const [hours, minutes] = data.mealTimes[meal.key].split(':')
          const mealDate = new Date()
          mealDate.setHours(parseInt(hours))
          mealDate.setMinutes(parseInt(minutes))
          
          return (
            <TouchableOpacity 
              key={meal.key} 
              style={styles.mealItem}
              onPress={() => {
                setTempTime(mealDate)
                setShowTimePicker(meal.key)
              }}
              activeOpacity={0.7}
            >
              <View style={styles.mealInfo}>
                <View style={[styles.mealIcon, { backgroundColor: meal.color }]}>
                  <Text style={styles.mealIconText}>{meal.icon}</Text>
                </View>
                <View>
                  <Text style={styles.mealLabel}>{meal.label}</Text>
                  <Text style={styles.mealTimeHint}>Tap to set time</Text>
                </View>
              </View>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeDisplayText}>{formatTimeDisplay(data.mealTimes[meal.key])}</Text>
                <Text style={styles.timeArrow}>›</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
      
      {showTimePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={!!showTimePicker}
          onRequestClose={() => setShowTimePicker(null)}
        >
          <TouchableOpacity 
            style={styles.timePickerOverlay} 
            activeOpacity={1}
            onPress={() => Platform.OS === 'ios' && setShowTimePicker(null)}
          >
            <View style={styles.timePickerContainer}>
              {Platform.OS === 'ios' && (
                <View style={styles.timePickerHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                    <Text style={styles.timePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.timePickerTitle}>
                    {showTimePicker.charAt(0).toUpperCase() + showTimePicker.slice(1)} Time
                  </Text>
                  <TouchableOpacity onPress={() => {
                    handleTimeChange({ type: 'set' }, tempTime)
                    setShowTimePicker(null)
                  }}>
                    <Text style={styles.timePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={tempTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  )

  const renderReflectionSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.reflectionIcon}>❤️</Text>
        <Text style={styles.sectionTitle}>Daily Reflection</Text>
        <Text style={styles.sectionSubtitle}>What's on your mind today? (optional)</Text>
      </View>

      <View style={styles.reflectionBox}>
        <TextInput
          style={styles.reflectionInput}
          placeholder="Share your thoughts, wins, or challenges..."
          value={data.reflection}
          onChangeText={(text) => setData(prev => ({ ...prev, reflection: text }))}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <Text style={styles.reflectionNote}>
        This reflection is private and helps you track your journey
      </Text>
    </View>
  )

  const renderCurrentSection = () => {
    switch (sections[currentSection]) {
      case 'wellness': return renderWellnessSection()
      case 'energy': return renderEnergySection()
      case 'meals': return renderMealsSection()
      case 'reflection': return renderReflectionSection()
      default: return renderWellnessSection()
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Daily Check-In</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {sections.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentSection && styles.progressDotActive,
                index === currentSection && styles.progressDotCurrent
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentSection()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentSection < sections.length - 1 ? (
            <TouchableOpacity
              onPress={() => setCurrentSection(prev => prev + 1)}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.continueButton, styles.completeButton]}
            >
              <Text style={styles.continueButtonText}>✓ Complete Check-In</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  headerDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'System',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  progressDot: {
    width: 24,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: '#EC4899',
  },
  progressDotCurrent: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingBottom: 40,
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  // Emoji Slider Styles
  sliderSectionContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiSliderHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  emojiSliderContainer: {
    marginBottom: 16,
  },
  emojiSlider: {
    height: 50,
    marginBottom: 8,
  },
  emojiIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  emojiIndicator: {
    alignItems: 'center',
  },
  indicatorEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'System',
  },
  sliderSection: {
    marginTop: 32,
    gap: 24,
  },
  sliderContainer: {
    gap: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderIconText: {
    fontSize: 20,
    color: 'white',
  },
  sliderInfo: {
    flex: 1,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  sliderValue: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  slider: {
    height: 40,
  },
  weightSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  weightIcon: {
    fontSize: 20,
  },
  weightLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  weightButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weightButtonText: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: '600',
  },
  weightValue: {
    fontSize: 32,
    fontWeight: '300',
    color: '#3B82F6',
    fontFamily: 'System',
  },
  mealsList: {
    gap: 16,
  },
  mealItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconText: {
    fontSize: 24,
    color: 'white',
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  timeInput: {
    fontSize: 18,
    fontWeight: '500',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    textAlign: 'center',
    fontFamily: 'System',
  },
  reflectionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  reflectionBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    padding: 20,
  },
  reflectionInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    fontFamily: 'System',
  },
  reflectionNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 16,
    fontFamily: 'System',
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#EC4899',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  mealTimeHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'System',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeDisplayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  timeArrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timePickerCancel: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'System',
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  timePickerDone: {
    fontSize: 16,
    color: '#EC4899',
    fontWeight: '600',
    fontFamily: 'System',
  },
  timePicker: {
    backgroundColor: 'white',
  },
})