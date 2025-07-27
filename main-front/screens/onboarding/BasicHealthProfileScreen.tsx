import React, { useState } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useUserData } from '../../src/context/user-data-provider'

interface BasicHealthProfileScreenProps {
  navigation: any
}

export default function BasicHealthProfileScreen({ navigation }: BasicHealthProfileScreenProps) {
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')
  const [heightFeet, setHeightFeet] = useState('')
  const [heightInches, setHeightInches] = useState('')
  const [weight, setWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)
  const { updateUserData } = useUserData()

  const genderOptions = [
    { id: 'male', name: 'Male' },
    { id: 'female', name: 'Female' },
    { id: 'non-binary', name: 'Non-binary' },
  ]

  const validateInputs = () => {
    const ageNum = parseInt(age)
    if (!age || ageNum < 13 || ageNum > 120) {
      Alert.alert('Invalid Age', 'Please enter an age between 13 and 120')
      return false
    }

    if (!gender) {
      Alert.alert('Missing Gender', 'Please select your gender')
      return false
    }

    if (heightUnit === 'cm') {
      const heightNum = parseInt(height)
      if (!height || heightNum < 100 || heightNum > 250) {
        Alert.alert('Invalid Height', 'Please enter a height between 100-250 cm')
        return false
      }
    } else {
      const feet = parseInt(heightFeet)
      const inches = parseInt(heightInches)
      if (!heightFeet || feet < 3 || feet > 8) {
        Alert.alert('Invalid Height', 'Please enter feet between 3-8')
        return false
      }
      if (!heightInches || inches < 0 || inches > 11) {
        Alert.alert('Invalid Height', 'Please enter inches between 0-11')
        return false
      }
    }

    const weightNum = parseInt(weight)
    if (weightUnit === 'kg') {
      if (!weight || weightNum < 30 || weightNum > 300) {
        Alert.alert('Invalid Weight', 'Please enter a weight between 30-300 kg')
        return false
      }
    } else {
      if (!weight || weightNum < 66 || weightNum > 660) {
        Alert.alert('Invalid Weight', 'Please enter a weight between 66-660 lbs')
        return false
      }
    }

    return true
  }

  const handleContinue = async () => {
    if (!validateInputs()) return

    const healthData = {
      age: parseInt(age),
      gender,
      height: heightUnit === 'cm' ? parseInt(height) : undefined,
      heightUnit,
      heightFeet: heightUnit === 'ft' ? parseInt(heightFeet) : undefined,
      heightInches: heightUnit === 'ft' ? parseInt(heightInches) : undefined,
      weight: parseInt(weight),
      weightUnit,
    }

    try {
      await updateUserData(healthData)
      console.log('📚 BasicHealthProfileScreen: Saved health data:', healthData)
      navigation.navigate('Allergies')
    } catch (error) {
      console.error('📚 BasicHealthProfileScreen: Error saving health data:', error)
      Alert.alert('Error', 'Failed to save health data. Please try again.')
    }
  }

  const goBack = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>👤</Text>
          </View>
          <Text style={styles.title}>Basic Health Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your nutrition plan
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Age and Gender Row */}
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>📅 Age</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.label}>👥 Gender</Text>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setShowGenderDropdown(true)}
              >
                <Text style={[
                  styles.dropdownText,
                  !gender && styles.dropdownPlaceholder
                ]}>
                  {gender ? genderOptions.find(opt => opt.id === gender)?.name : 'Select Gender'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </Pressable>
            </View>
          </View>

          {/* Height */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelWithToggle}>
              <Text style={styles.label}>📏 Height</Text>
              <View style={styles.unitToggle}>
                <Pressable
                  style={[
                    styles.unitOption,
                    heightUnit === 'cm' && styles.selectedUnitOption
                  ]}
                  onPress={() => setHeightUnit('cm')}
                >
                  <Text style={[
                    styles.unitOptionText,
                    heightUnit === 'cm' && styles.selectedUnitOptionText
                  ]}>cm</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.unitOption,
                    heightUnit === 'ft' && styles.selectedUnitOption
                  ]}
                  onPress={() => setHeightUnit('ft')}
                >
                  <Text style={[
                    styles.unitOptionText,
                    heightUnit === 'ft' && styles.selectedUnitOptionText
                  ]}>ft/in</Text>
                </Pressable>
              </View>
            </View>
            
            {heightUnit === 'cm' ? (
              <TextInput
                style={styles.input}
                placeholder="170"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                maxLength={3}
              />
            ) : (
              <View style={styles.heightFeetInches}>
                <TextInput
                  style={[styles.input, styles.feetInput]}
                  placeholder="5"
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  keyboardType="numeric"
                  maxLength={1}
                />
                <Text style={styles.unitLabel}>ft</Text>
                <TextInput
                  style={[styles.input, styles.inchesInput]}
                  placeholder="8"
                  value={heightInches}
                  onChangeText={setHeightInches}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.unitLabel}>in</Text>
              </View>
            )}
          </View>

          {/* Weight */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelWithToggle}>
              <Text style={styles.label}>⚖️ Weight</Text>
              <View style={styles.unitToggle}>
                <Pressable
                  style={[
                    styles.unitOption,
                    weightUnit === 'kg' && styles.selectedUnitOption
                  ]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text style={[
                    styles.unitOptionText,
                    weightUnit === 'kg' && styles.selectedUnitOptionText
                  ]}>kg</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.unitOption,
                    weightUnit === 'lbs' && styles.selectedUnitOption
                  ]}
                  onPress={() => setWeightUnit('lbs')}
                >
                  <Text style={[
                    styles.unitOptionText,
                    weightUnit === 'lbs' && styles.selectedUnitOptionText
                  ]}>lbs</Text>
                </Pressable>
              </View>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder={weightUnit === 'kg' ? '70' : '154'}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable 
          style={styles.buttonContainer}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Gender Dropdown Modal */}
      <Modal
        visible={showGenderDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGenderDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Gender</Text>
            {genderOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.dropdownOption,
                  gender === option.id && styles.selectedDropdownOption
                ]}
                onPress={() => {
                  setGender(option.id)
                  setShowGenderDropdown(false)
                }}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  gender === option.id && styles.selectedDropdownOptionText
                ]}>
                  {option.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    gap: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  fieldContainer: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  labelWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  genderContainer: {
    gap: 8,
  },
  genderOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedGenderOption: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedGenderOptionText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  unitOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  selectedUnitOption: {
    backgroundColor: '#3B82F6',
  },
  unitOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedUnitOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heightFeetInches: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feetInput: {
    flex: 1,
  },
  inchesInput: {
    flex: 1,
  },
  unitLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  gradientButton: {
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    color: '#6B7280',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 280,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedDropdownOption: {
    backgroundColor: '#3B82F6',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  selectedDropdownOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})