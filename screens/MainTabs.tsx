import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text } from 'react-native'

// Import tab screens
import V3HomeScreen from '@/screens/tabs/V3HomeScreen'
import V3PlannerScreen from '@/screens/tabs/V3PlannerScreen'
import V3PantryScreen from '@/screens/tabs/V3PantryScreen'
import V3InspirationScreen from '@/screens/tabs/V3InspirationScreen'
import V3ProfileScreen from '@/screens/tabs/V3ProfileScreen'

// Simple icon components (replacing lucide for now)
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color, fontSize: size * 0.6 }}>🏠</Text>
  </View>
)

const CalendarIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color, fontSize: size * 0.6 }}>📅</Text>
  </View>
)

const ShoppingCartIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color, fontSize: size * 0.6 }}>🛒</Text>
  </View>
)

const BookIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color, fontSize: size * 0.6 }}>📖</Text>
  </View>
)

const UserIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color, fontSize: size * 0.6 }}>👤</Text>
  </View>
)

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={V3HomeScreen}
        options={{
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Planner"
        component={V3PlannerScreen}
        options={{
          tabBarIcon: CalendarIcon,
        }}
      />
      <Tab.Screen
        name="Pantry"
        component={V3PantryScreen}
        options={{
          tabBarIcon: ShoppingCartIcon,
        }}
      />
      <Tab.Screen
        name="Inspiration"
        component={V3InspirationScreen}
        options={{
          tabBarIcon: BookIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={V3ProfileScreen}
        options={{
          tabBarIcon: UserIcon,
        }}
      />
    </Tab.Navigator>
  )
}