import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from 'react-native'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  size?: 'small' | 'medium' | 'large'
  interactive?: boolean
  showRating?: boolean
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  size = 'medium', 
  interactive = false,
  showRating = false 
}: StarRatingProps) {
  const maxStars = 5
  const [pressedStar, setPressedStar] = useState<number | null>(null)
  
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: 16, spacing: 4 }
      case 'large':
        return { fontSize: 28, spacing: 8 }
      default:
        return { fontSize: 24, spacing: 6 }
    }
  }

  const { fontSize, spacing } = getSizeStyle()

  const handleStarPress = (starIndex: number, isHalf: boolean) => {
    if (!interactive || !onRatingChange) return
    
    const newRating = starIndex + (isHalf ? 0.5 : 1)
    onRatingChange(newRating)
  }

  const handleStarPressIn = (starIndex: number) => {
    if (!interactive) return
    setPressedStar(starIndex)
  }

  const handleStarPressOut = () => {
    if (!interactive) return
    setPressedStar(null)
  }

  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 1
    const isFullStar = rating >= starValue
    const isHalfStar = rating >= starValue - 0.5 && rating < starValue
    const isPressed = pressedStar === starIndex
    const currentFontSize = isPressed ? fontSize * 1.2 : fontSize

    if (interactive) {
      const touchTargetSize = Math.max(44, fontSize + 20)
      
      return (
        <View key={starIndex} style={[
          styles.interactiveStarContainer, 
          { 
            marginHorizontal: spacing / 2, 
            width: touchTargetSize,
            height: touchTargetSize
          }
        ]}>
          {/* Background star */}
          <Text style={[styles.starOutline, { fontSize: currentFontSize }]}>
            ☆
          </Text>
          
          {/* Filled overlay */}
          {(isHalfStar || isFullStar) && (
            <View style={styles.starOverlay}>
              {isHalfStar ? (
                <View style={styles.halfStarContainer}>
                  <Text style={[styles.starFilled, { fontSize: currentFontSize }]}>★</Text>
                  <View style={styles.halfStarMask} />
                </View>
              ) : (
                <Text style={[styles.starFilled, { fontSize: currentFontSize }]}>★</Text>
              )}
            </View>
          )}
          
          {/* Touch areas */}
          <TouchableOpacity
            style={[styles.touchArea, { 
              left: 0,
              width: touchTargetSize / 2,
              height: touchTargetSize
            }]}
            onPress={() => handleStarPress(starIndex, true)}
            onPressIn={() => handleStarPressIn(starIndex)}
            onPressOut={handleStarPressOut}
            activeOpacity={1}
          />
          
          <TouchableOpacity
            style={[styles.touchArea, { 
              right: 0,
              width: touchTargetSize / 2,
              height: touchTargetSize
            }]}
            onPress={() => handleStarPress(starIndex, false)}
            onPressIn={() => handleStarPressIn(starIndex)}
            onPressOut={handleStarPressOut}
            activeOpacity={1}
          />
        </View>
      )
    } else {
      // Simple non-interactive display
      let starText = '☆'
      let starColor = '#D1D5DB'
      
      if (isFullStar) {
        starText = '★'
        starColor = '#FFD700'
      } else if (isHalfStar) {
        starText = '⭐'
        starColor = '#FFD700'
      }
      
      return (
        <View key={starIndex} style={{ marginHorizontal: spacing / 2 }}>
          <Text style={[styles.simpleStar, { fontSize, color: starColor }]}>
            {starText}
          </Text>
        </View>
      )
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
      </View>
      {showRating && (
        <Text style={[styles.ratingText, { fontSize: fontSize * 0.6 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactiveStarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starOutline: {
    color: '#D1D5DB',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  starOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starFilled: {
    color: '#FFD700',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  halfStarContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  halfStarMask: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  touchArea: {
    position: 'absolute',
    top: 0,
  },
  simpleStar: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ratingText: {
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 4,
  },
})