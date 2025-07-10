import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text } from 'react-native'

// Import tab screens
import V3DashboardScreen from '@/screens/tabs/V3DashboardScreen'
import V3InspirationScreen from '@/screens/tabs/V3InspirationScreen'
import V3CommunityScreen from '@/screens/tabs/V3CommunityScreen'
import V3GroceryListScreen from '@/screens/tabs/V3GroceryListScreen'
import V3ProfileScreen from '@/screens/tabs/V3ProfileScreen'

// Tab icon components
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8 }}>🏠</Text>
  </View>
)

const CuisinesIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8 }}>🌍</Text>
  </View>
)

const CommunityIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8 }}>👥</Text>
  </View>
)

const GroceryIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8 }}>🛒</Text>
  </View>
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
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: 'System',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={V3DashboardScreen}
        options={{
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Cuisines"
        component={V3InspirationScreen}
        options={{
          tabBarIcon: CuisinesIcon,
        }}
      />
      <Tab.Screen
        name="Community"
        component={V3CommunityScreen}
        options={{
          tabBarIcon: CommunityIcon,
        }}
      />
      <Tab.Screen
        name="GroceryList"
        component={V3GroceryListScreen}
        options={{
          tabBarIcon: GroceryIcon,
          tabBarLabel: 'Grocery List',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={V3ProfileScreen}
        options={{
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  )
}