import { User, UserRole } from '@prisma/client'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// User types
export interface UserWithoutPassword extends Omit<User, 'password'> {
  // Additional user properties can be added here
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

// Dashboard types
export interface DashboardStats {
  totalPowerGeneration: number
  totalCapacity: number
  averageEfficiency: number
  unitsOnline: number
  unitsOffline: number
  unitsInMaintenance: number
  unitsWithErrors: number
}

// Navigation types
export interface NavItem {
  title: string
  href: string
  icon?: string
  children?: NavItem[]
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role?: string
}

// Table types
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: T[keyof T], record: T) => React.ReactNode
}

export interface TableProps<T = Record<string, unknown>> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
}

// Filter types
export interface FilterOption {
  label: string
  value: string | number
}

export interface DateRange {
  start: Date
  end: Date
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// System configuration types
export interface SystemConfig {
  id: string
  key: string
  value: string
  description?: string
}

// Export Prisma types
export type {
  User,
  UserRole,
} from '@prisma/client'