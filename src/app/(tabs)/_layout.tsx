import { Tabs } from 'expo-router'

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
          height: 68,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '市场',
          headerTitle: '市场',
          tabBarLabel: '市场',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: '账户',
          headerTitle: '账户',
          tabBarLabel: '账户',
        }}
      />
    </Tabs>
  )
}
