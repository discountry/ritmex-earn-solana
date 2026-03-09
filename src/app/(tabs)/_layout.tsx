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
          fontSize: 15,
          fontWeight: '700',
        },
        tabBarActiveTintColor: '#171512',
        tabBarInactiveTintColor: '#7c7468',
        tabBarStyle: {
          backgroundColor: '#f0e7d7',
          borderTopColor: '#dbcfb8',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
        },
        tabBarIconStyle: {
          marginBottom: 1,
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
