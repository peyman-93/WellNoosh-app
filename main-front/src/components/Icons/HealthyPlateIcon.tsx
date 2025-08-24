import React from 'react'
import { Image } from 'react-native'

interface HealthyPlateIconProps {
  width?: number
  height?: number
  color?: string
}

export function HealthyPlateIcon({ width = 24, height = 24, color = '#8BA654' }: HealthyPlateIconProps) {
  return (
    <Image
      source={require('./Meal_planner_icon.png')}
      style={{
        width: width,
        height: height,
        resizeMode: 'contain',
        tintColor: color
      }}
    />
  )
}