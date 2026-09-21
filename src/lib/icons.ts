import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Cloud,
  Code2,
  Database,
  Dumbbell,
  Globe2,
  Layers3,
  Mail,
  MessageCircle,
  Phone,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** Ícones que a dashboard permite escolher (nome guardado na base de dados). */
export const iconMap = {
  globe: Globe2,
  smartphone: Smartphone,
  chart: BarChart3,
  workflow: Workflow,
  database: Database,
  cloud: Cloud,
  code: Code2,
  zap: Zap,
  layers: Layers3,
  cart: ShoppingCart,
  store: Store,
  truck: Truck,
  users: Users,
  building: Building2,
  scissors: Scissors,
  dumbbell: Dumbbell,
  shield: ShieldCheck,
  settings: Settings,
  briefcase: BriefcaseBusiness,
  message: MessageCircle,
  mail: Mail,
  phone: Phone,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof iconMap
export const iconNames = Object.keys(iconMap) as [IconName, ...IconName[]]

export function getIcon(name: string): LucideIcon {
  return iconMap[name as IconName] ?? Layers3
}
