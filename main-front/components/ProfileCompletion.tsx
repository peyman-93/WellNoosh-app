import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface UserData {
  fullName: string;
  email: string;
  country: string;
  postalCode: string;
  age?: number;
  gender?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: number;
  heightInches?: number;
}

interface ProfileCompletionProps {
  onComplete: (userData: UserData) => void;
  userData: UserData | null;
}

export function ProfileCompletion({ onComplete, userData }: ProfileCompletionProps) {
  const [profileData, setProfileData] = useState({
    age: '',
    gender: '',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    height: '',
    heightUnit: 'cm' as 'cm' | 'ft',
    heightFeet: '',
    heightInches: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  const genderOptions = [
    'Male', 'Female', 'Non-binary', 'Prefer not to say'
  ];

  const getUserFirstName = () => {
    if (!userData?.fullName) return 'User';
    return userData.fullName.split(' ')[0];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Age validation
    if (!profileData.age) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(profileData.age);
      if (isNaN(age) || age < 13 || age > 120) {
        newErrors.age = 'Please enter a valid age (13-120)';
      }
    }

    // Gender validation
    if (!profileData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Weight validation
    if (!profileData.weight) {
      newErrors.weight = 'Weight is required';
    } else {
      const weight = parseFloat(profileData.weight);
      const minWeight = profileData.weightUnit === 'kg' ? 30 : 66;
      const maxWeight = profileData.weightUnit === 'kg' ? 300 : 660;
      if (isNaN(weight) || weight < minWeight || weight > maxWeight) {
        newErrors.weight = `Please enter a valid weight (${minWeight}-${maxWeight} ${profileData.weightUnit})`;
      }
    }


    // Height validation
    if (profileData.heightUnit === 'cm') {
      if (!profileData.height) {
        newErrors.height = 'Height is required';
      } else {
        const height = parseFloat(profileData.height);
        if (isNaN(height) || height < 100 || height > 250) {
          newErrors.height = 'Please enter a valid height (100-250 cm)';
        }
      }
    } else {
      if (!profileData.heightFeet || !profileData.heightInches) {
        newErrors.height = 'Height is required';
      } else {
        const feet = parseInt(profileData.heightFeet);
        const inches = parseInt(profileData.heightInches);
        if (isNaN(feet) || isNaN(inches) || feet < 3 || feet > 8 || inches < 0 || inches > 11) {
          newErrors.height = 'Please enter a valid height (3-8 ft, 0-11 in)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const completeUserData: UserData = {
      ...userData!,
      age: profileData.age ? parseInt(profileData.age) : undefined,
      gender: profileData.gender || undefined,
      weight: profileData.weight ? parseFloat(profileData.weight) : undefined,
      weightUnit: profileData.weightUnit,
      height: profileData.heightUnit === 'cm' ? 
        (profileData.height ? parseFloat(profileData.height) : undefined) : 
        (profileData.heightFeet && profileData.heightInches ? 
          (parseInt(profileData.heightFeet) * 12 + parseInt(profileData.heightInches)) * 2.54 : undefined),
      heightUnit: profileData.heightUnit,
      heightFeet: profileData.heightUnit === 'ft' && profileData.heightFeet ? parseInt(profileData.heightFeet) : undefined,
      heightInches: profileData.heightUnit === 'ft' && profileData.heightInches ? parseInt(profileData.heightInches) : undefined
    };

    onComplete(completeUserData);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your nutrition recommendations, {getUserFirstName()}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Age and Gender Row */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[styles.input, errors.age && styles.inputError]}
                placeholder="25"
                value={profileData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdownButton,
                  errors.gender && !profileData.gender && styles.inputError
                ]}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  !profileData.gender && styles.dropdownPlaceholder
                ]}>
                  {profileData.gender || 'Select gender'}
                </Text>
                <Text style={styles.dropdownArrow}>{showGenderDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showGenderDropdown && (
                <View style={styles.dropdownList}>
                  {genderOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        profileData.gender === option && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        handleInputChange('gender', option);
                        setShowGenderDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        profileData.gender === option && styles.dropdownItemTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>
          </View>

          {/* Weight */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weight</Text>
            <View style={styles.weightContainer}>
              <TextInput
                style={[styles.weightInput, errors.weight && styles.inputError]}
                placeholder="70"
                value={profileData.weight}
                onChangeText={(value) => handleInputChange('weight', value)}
                keyboardType="decimal-pad"
              />
              <View style={styles.unitToggleContainer}>
                <TouchableOpacity
                  style={[styles.unitToggle, profileData.weightUnit === 'kg' && styles.unitToggleSelected]}
                  onPress={() => handleInputChange('weightUnit', 'kg')}
                >
                  <Text style={[styles.unitToggleText, profileData.weightUnit === 'kg' && styles.unitToggleTextSelected]}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitToggle, profileData.weightUnit === 'lbs' && styles.unitToggleSelected]}
                  onPress={() => handleInputChange('weightUnit', 'lbs')}
                >
                  <Text style={[styles.unitToggleText, profileData.weightUnit === 'lbs' && styles.unitToggleTextSelected]}>lbs</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
          </View>

          {/* Height */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height</Text>
            <View style={styles.heightContainer}>
              {profileData.heightUnit === 'cm' ? (
                <TextInput
                  style={[styles.heightInput, errors.height && styles.inputError]}
                  placeholder="175"
                  value={profileData.height}
                  onChangeText={(value) => handleInputChange('height', value)}
                  keyboardType="numeric"
                />
              ) : (
                <View style={styles.feetInchesContainer}>
                  <TextInput
                    style={[styles.feetInput, errors.height && styles.inputError]}
                    placeholder="5"
                    value={profileData.heightFeet}
                    onChangeText={(value) => handleInputChange('heightFeet', value)}
                    keyboardType="numeric"
                    maxLength={1}
                  />
                  <Text style={styles.unitLabel}>ft</Text>
                  <TextInput
                    style={[styles.inchesInput, errors.height && styles.inputError]}
                    placeholder="9"
                    value={profileData.heightInches}
                    onChangeText={(value) => handleInputChange('heightInches', value)}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.unitLabel}>in</Text>
                </View>
              )}
              <View style={styles.unitToggleContainer}>
                <TouchableOpacity
                  style={[styles.unitToggle, profileData.heightUnit === 'cm' && styles.unitToggleSelected]}
                  onPress={() => handleInputChange('heightUnit', 'cm')}
                >
                  <Text style={[styles.unitToggleText, profileData.heightUnit === 'cm' && styles.unitToggleTextSelected]}>cm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitToggle, profileData.heightUnit === 'ft' && styles.unitToggleSelected]}
                  onPress={() => handleInputChange('heightUnit', 'ft')}
                >
                  <Text style={[styles.unitToggleText, profileData.heightUnit === 'ft' && styles.unitToggleTextSelected]}>ft</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
          </View>

        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0', // Match dashboard warm off-white background
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6B8E23', // Match dashboard primary green
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6B8E23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 40,
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A', // Match dashboard soft black
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A', // Match dashboard warm charcoal
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  form: {
    gap: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A', // Match dashboard soft black
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  genderOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  genderOptionSelected: {
    backgroundColor: '#6B8E23',
    borderColor: '#6B8E23',
  },
  genderOptionText: {
    fontSize: 13,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  genderOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f9e8',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  dropdownItemTextSelected: {
    color: '#6B8E23',
    fontWeight: '600',
  },
  unitToggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  unitToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  unitToggleSelected: {
    backgroundColor: '#6B8E23',
  },
  unitToggleText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  unitToggleTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  weightContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  heightContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  heightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  feetInchesContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feetInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  inchesInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 14,
    color: '#4A4A4A', // Match dashboard warm charcoal
    fontFamily: 'Inter',
  },
  unitButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 80,
  },
  unitButtonText: {
    fontSize: 16,
    color: '#1A1A1A', // Match dashboard soft black
    fontFamily: 'Inter',
  },
  optionalText: {
    fontSize: 14,
    color: '#4A4A4A', // Match dashboard warm charcoal
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    backgroundColor: '#6B8E23', // Match dashboard primary green
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6B8E23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});