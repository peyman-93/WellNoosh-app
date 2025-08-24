import React from 'react'
import Svg, { Path, G } from 'react-native-svg'

interface MealPlannerIconProps {
  width?: number
  height?: number
  color?: string
}

export function MealPlannerIcon({ width = 24, height = 24, color = '#6B8E23' }: MealPlannerIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      {/* Simple meal planner calendar icon */}
      <Path
        d="M7 3V1H9V3H15V1H17V3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7ZM4 9V19H20V9H4ZM7 11H9V13H7V11ZM11 11H13V13H11V11ZM15 11H17V13H15V11ZM7 15H9V17H7V15ZM11 15H13V17H11V15Z"
        fill={color}
      />
    </Svg>
  )
}