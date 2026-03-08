import { Tabs } from 'expo-router'

import { AppIcon } from '@/components/ui/app-icon'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#f6f1e7',
        },
        headerTintColor: '#171512',
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarActiveTintColor: '#171512',
        tabBarInactiveTintColor: '#7c7468',
        tabBarStyle: {
          backgroundColor: '#f0e7d7',
          borderTopColor: '#dbcfb8',
          height: 76,
          paddingBottom: 14,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Markets',
          headerTitle: 'Markets',
          tabBarLabel: 'Markets',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon color={color} name={focused ? 'compass' : 'compass-outline'} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Portfolio',
          headerTitle: 'Portfolio',
          tabBarLabel: 'Portfolio',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon color={color} name={focused ? 'wallet' : 'wallet-outline'} size={20} />
          ),
        }}
      />
    </Tabs>
  )
}
