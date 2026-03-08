import Ionicons from '@expo/vector-icons/build/Ionicons'
import type { ComponentProps } from 'react'

export type AppIconName = ComponentProps<typeof Ionicons>['name']

interface AppIconProps extends Omit<ComponentProps<typeof Ionicons>, 'name'> {
  name: AppIconName
}

export function AppIcon({ size = 18, ...props }: AppIconProps) {
  return <Ionicons size={size} {...props} />
}
