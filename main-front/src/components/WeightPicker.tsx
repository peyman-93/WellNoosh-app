import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native'

const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 3 // Show only 3 items (prev, current, next)

interface WeightPickerProps {
  value: number
  onValueChange: (value: number) => void
  minWeight?: number
  maxWeight?: number
}

export function WeightPicker({
  value,
  onValueChange,
  minWeight = 30,
  maxWeight = 200
}: WeightPickerProps) {
  // Split weight into integer and decimal parts
  const integerPart = Math.floor(value)
  const decimalPart = Math.round((value - integerPart) * 10)

  const [selectedInteger, setSelectedInteger] = useState(integerPart)
  const [selectedDecimal, setSelectedDecimal] = useState(decimalPart)

  const integerScrollRef = useRef<ScrollView>(null)
  const decimalScrollRef = useRef<ScrollView>(null)

  // Generate arrays for the rollers
  const integerValues = Array.from({ length: maxWeight - minWeight + 1 }, (_, i) => minWeight + i)
  const decimalValues = Array.from({ length: 10 }, (_, i) => i)

  // Initialize scroll positions on mount
  useEffect(() => {
    setTimeout(() => {
      integerScrollRef.current?.scrollTo({
        y: (selectedInteger - minWeight) * ITEM_HEIGHT,
        animated: false
      })
      decimalScrollRef.current?.scrollTo({
        y: selectedDecimal * ITEM_HEIGHT,
        animated: false
      })
    }, 50)
  }, [])

  // Update external value when internal values change
  useEffect(() => {
    const newValue = selectedInteger + (selectedDecimal / 10)
    if (newValue !== value) {
      onValueChange(newValue)
    }
  }, [selectedInteger, selectedDecimal])

  // Update internal values when external value changes
  useEffect(() => {
    const newInteger = Math.floor(value)
    const newDecimal = Math.round((value - newInteger) * 10)

    if (newInteger !== selectedInteger) {
      setSelectedInteger(newInteger)
      setTimeout(() => {
        integerScrollRef.current?.scrollTo({
          y: (newInteger - minWeight) * ITEM_HEIGHT,
          animated: true
        })
      }, 100)
    }

    if (newDecimal !== selectedDecimal) {
      setSelectedDecimal(newDecimal)
      setTimeout(() => {
        decimalScrollRef.current?.scrollTo({
          y: newDecimal * ITEM_HEIGHT,
          animated: true
        })
      }, 100)
    }
  }, [value])

  const handleIntegerScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    const index = Math.round(offsetY / ITEM_HEIGHT)
    const newValue = Math.max(minWeight, Math.min(maxWeight, minWeight + index))
    setSelectedInteger(newValue)
  }

  const handleDecimalScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y
    const index = Math.round(offsetY / ITEM_HEIGHT)
    const newValue = Math.max(0, Math.min(9, index))
    setSelectedDecimal(newValue)
  }

  const renderPickerItem = (item: number, isSelected: boolean, isInteger: boolean = true) => (
    <View key={item} style={[styles.pickerItem, isSelected && styles.selectedItem]}>
      <Text style={[
        styles.pickerText,
        isSelected && styles.selectedText,
        isInteger && styles.integerText
      ]}>
        {isInteger ? item : item}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight</Text>

      <View style={styles.pickerContainer}>
        {/* Integer Part Picker */}
        <View style={styles.pickerColumn}>
          <ScrollView
            ref={integerScrollRef}
            style={styles.picker}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={handleIntegerScroll}
            contentContainerStyle={{
              paddingTop: ITEM_HEIGHT,
              paddingBottom: ITEM_HEIGHT,
            }}
          >
            {integerValues.map((item) =>
              renderPickerItem(item, item === selectedInteger, true)
            )}
          </ScrollView>
          <View style={styles.selectionIndicator} />
        </View>

        {/* Decimal Point */}
        <View style={styles.decimalPoint}>
          <Text style={styles.decimalPointText}>.</Text>
        </View>

        {/* Decimal Part Picker */}
        <View style={styles.pickerColumn}>
          <ScrollView
            ref={decimalScrollRef}
            style={styles.picker}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={handleDecimalScroll}
            contentContainerStyle={{
              paddingTop: ITEM_HEIGHT,
              paddingBottom: ITEM_HEIGHT,
            }}
          >
            {decimalValues.map((item) =>
              renderPickerItem(item, item === selectedDecimal, false)
            )}
          </ScrollView>
          <View style={styles.selectionIndicator} />
        </View>

        {/* kg unit */}
        <Text style={styles.unitText}>kg</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerColumn: {
    width: 60,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: 'relative',
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: 'transparent',
  },
  pickerText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  selectedText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 22,
  },
  integerText: {
    minWidth: 40,
    textAlign: 'center',
  },
  decimalPoint: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: -2,
  },
  decimalPointText: {
    fontSize: 22,
    color: '#1A1A1A',
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  unitText: {
    fontSize: 16,
    color: '#6B8E23',
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(107, 142, 35, 0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(107, 142, 35, 0.2)',
    pointerEvents: 'none',
    borderRadius: 6,
  },
})