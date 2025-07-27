import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text } from 'react-native'
import Svg, { Path, Circle, Rect, G } from 'react-native-svg'
import { MealPlannerIcon } from '@/components/Icons/MealPlannerIcon'

// Import tab screens
import DashboardScreen from '@/screens/tabs/DashboardScreen'
import InspirationScreen from '@/screens/tabs/InspirationScreen'
import PlannerScreen from '@/screens/tabs/PlannerScreen'
import CommunityScreen from '@/screens/tabs/CommunityScreen'
import GroceryListScreen from '@/screens/tabs/GroceryListScreen'
import FridgeScreen from '@/screens/tabs/FridgeScreen'
import ProfileScreen from '@/screens/ProfileScreen'

// Tab icon components with organic wellness style
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V9Z"
      fill={color}
    />
  </Svg>
)

const CuisinesIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 7C11.7348 7 11.4804 7.10536 11.2929 7.29289C11.1054 7.48043 11 7.73478 11 8V11H8C7.73478 11 7.48043 11.1054 7.29289 11.2929C7.10536 11.4804 7 11.7348 7 12C7 12.2652 7.10536 12.5196 7.29289 12.7071C7.48043 12.8946 7.73478 13 8 13H11V16C11 16.2652 11.1054 16.5196 11.2929 16.7071C11.4804 16.8946 11.7348 17 12 17C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16V13H16C16.2652 13 16.5196 12.8946 16.7071 12.7071C16.8946 12.5196 17 12.2652 17 12C17 11.7348 16.8946 11.4804 16.7071 11.2929C16.5196 11.1054 16.2652 11 16 11H13V8C13 7.73478 12.8946 7.48043 12.7071 7.29289C12.5196 7.10536 12.2652 7 12 7Z"
      fill={color}
    />
  </Svg>
)

const PlannerIcon = ({ color, size }: { color: string; size: number }) => (
  <MealPlannerIcon width={size} height={size} color={color} />
)

const CommunityIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 17V19C16 20.1046 15.1046 21 14 21H5C3.89543 21 3 20.1046 3 19V17C3 15.3431 4.34315 14 6 14H13C14.6569 14 16 15.3431 16 17ZM9.5 3C11.7091 3 13.5 4.79086 13.5 7C13.5 9.20914 11.7091 11 9.5 11C7.29086 11 5.5 9.20914 5.5 7C5.5 4.79086 7.29086 3 9.5 3ZM18 6H21V8H18V11H16V8H13V6H16V3H18V6Z"
      fill={color}
    />
  </Svg>
)

const GroceryIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 18C5.9 18 5.01 18.9 5.01 20C5.01 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20C9 18.9 8.1 18 7 18ZM1 2V4H3L6.6 11.59L5.24 14.04C5.09 14.32 5 14.65 5 15C5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.59 17.3 11.97L20.88 5.48C20.96 5.34 21 5.17 21 5C21 4.45 20.55 4 20 4H5.21L4.27 2H1ZM17 18C15.9 18 15.01 18.9 15.01 20C15.01 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20C19 18.9 18.1 18 17 18Z"
      fill={color}
    />
  </Svg>
)

const FridgeIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 2C5.9 2 5 2.9 5 4V19C5 20.1 5.9 21 7 21V22H9V21H15V22H17V21C18.1 21 19 20.1 19 19V4C19 2.9 18.1 2 17 2H7ZM7 4H17V9H7V4ZM7 11H17V19H7V11ZM9 5V8H11V5H9ZM9 12V15H11V12H9Z"
      fill={color}
    />
  </Svg>
)

const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8 }}>👤</Text>
  </View>
)

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 2,
          paddingTop: 2,
          paddingHorizontal: 16,
          height: 75,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          justifyContent: 'flex-start',
        },
        tabBarActiveTintColor: '#6B8E23',
        tabBarInactiveTintColor: '#4A4A4A',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: 'Inter',
          marginTop: 1,
          marginBottom: 2,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 4,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Cooking"
        component={InspirationScreen}
        options={{
          tabBarIcon: CuisinesIcon,
        }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{
          tabBarIcon: PlannerIcon,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: CommunityIcon,
        }}
      />
      <Tab.Screen
        name="GroceryList"
        component={GroceryListScreen}
        options={{
          tabBarIcon: GroceryIcon,
          tabBarLabel: 'Grocery List',
        }}
      />
      <Tab.Screen
        name="Fridge"
        component={FridgeScreen}
        options={{
          tabBarIcon: FridgeIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarIconStyle: { display: 'none' },
          tabBarLabelStyle: { display: 'none' },
          tabBarBadgeStyle: { display: 'none' },
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // Prevent default tab behavior
          },
        }}
      />
    </Tab.Navigator>
  )
}