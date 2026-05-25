// TODO: Replace MOCK_DATA with API call → GET /api/staff

export type StaffRole   = 'Admin' | 'Manager' | 'Cashier' | 'Stock Clerk'
export type StaffStatus = 'Active' | 'Inactive' | 'On Leave'

export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: StaffRole
  branch: string
  status: StaffStatus
  joinedAt: string
  lastLogin: string
  salesCount: number
  avatar: string
}

export const MOCK_STAFF: Staff[] = [
  { id:'s1', name:'Clouie Caagbay', email:'ck@xantara.com',   phone:'09171112233', role:'Admin',       branch:'Makati',  status:'Active',   joinedAt:'2024-01-10', lastLogin:'2026-05-24', salesCount:412, avatar:'CK' },
  { id:'s2', name:'Ana Reyes',      email:'ana@xantara.com',  phone:'09282223344', role:'Cashier',     branch:'Makati',  status:'Active',   joinedAt:'2024-03-15', lastLogin:'2026-05-24', salesCount:289, avatar:'AR' },
  { id:'s3', name:'Rico Santos',    email:'rico@xantara.com', phone:'09393334455', role:'Cashier',     branch:'Makati',  status:'Active',   joinedAt:'2024-05-20', lastLogin:'2026-05-23', salesCount:201, avatar:'RS' },
  { id:'s4', name:'Maya Cruz',      email:'maya@xantara.com', phone:'09454445566', role:'Manager',     branch:'BGC',     status:'Active',   joinedAt:'2023-11-01', lastLogin:'2026-05-24', salesCount:0,   avatar:'MC' },
  { id:'s5', name:'Ben Lim',        email:'ben@xantara.com',  phone:'09565556677', role:'Stock Clerk', branch:'Makati',  status:'Active',   joinedAt:'2025-01-08', lastLogin:'2026-05-22', salesCount:0,   avatar:'BL' },
  { id:'s6', name:'Rose Tan',       email:'rose@xantara.com', phone:'09676667788', role:'Cashier',     branch:'BGC',     status:'On Leave', joinedAt:'2024-07-14', lastLogin:'2026-05-01', salesCount:178, avatar:'RT' },
  { id:'s7', name:'Jun Dela Cruz',  email:'jun@xantara.com',  phone:'09787778899', role:'Cashier',     branch:'Quezon',  status:'Active',   joinedAt:'2025-03-22', lastLogin:'2026-05-24', salesCount:95,  avatar:'JD' },
  { id:'s8', name:'Cris Bautista',  email:'cris@xantara.com', phone:'09898889900', role:'Stock Clerk', branch:'Quezon',  status:'Inactive', joinedAt:'2025-06-01', lastLogin:'2026-04-15', salesCount:0,   avatar:'CB' },
]
