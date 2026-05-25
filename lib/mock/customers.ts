// TODO: Replace MOCK_DATA with API call → GET /api/customers

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalSpent: number
  totalOrders: number
  lastVisit: string
  joinedAt: string
  status: 'Active' | 'Inactive'
  loyaltyPoints: number
}

export const MOCK_CUSTOMERS: Customer[] = [
  { id:'c1',  name:'Maria Santos',   email:'maria.santos@email.com',  phone:'09171234567', totalSpent:62459, totalOrders:18, lastVisit:'2026-05-24', joinedAt:'2025-01-15', status:'Active',   loyaltyPoints:624 },
  { id:'c2',  name:'Jose Reyes',     email:'jose.reyes@email.com',    phone:'09281234567', totalSpent:34820, totalOrders:11, lastVisit:'2026-05-24', joinedAt:'2025-02-20', status:'Active',   loyaltyPoints:348 },
  { id:'c3',  name:'Ana Cruz',       email:'ana.cruz@email.com',      phone:'09391234567', totalSpent:98700, totalOrders:29, lastVisit:'2026-05-24', joinedAt:'2024-11-05', status:'Active',   loyaltyPoints:987 },
  { id:'c4',  name:'Carlo Mendoza',  email:'carlo.mendoza@email.com', phone:'09451234567', totalSpent:15600, totalOrders:5,  lastVisit:'2026-05-23', joinedAt:'2026-01-10', status:'Active',   loyaltyPoints:156 },
  { id:'c5',  name:'Lea Villanueva', email:'lea.villa@email.com',     phone:'09561234567', totalSpent:8900,  totalOrders:3,  lastVisit:'2026-05-10', joinedAt:'2026-03-01', status:'Active',   loyaltyPoints:89  },
  { id:'c6',  name:'Mark Aquino',    email:'mark.aquino@email.com',   phone:'09671234567', totalSpent:4500,  totalOrders:2,  lastVisit:'2026-04-15', joinedAt:'2026-02-14', status:'Inactive', loyaltyPoints:45  },
  { id:'c7',  name:'Grace Ocampo',   email:'grace.ocampo@email.com',  phone:'09781234567', totalSpent:72300, totalOrders:22, lastVisit:'2026-05-20', joinedAt:'2025-03-08', status:'Active',   loyaltyPoints:723 },
  { id:'c8',  name:'Paolo Ramos',    email:'paolo.ramos@email.com',   phone:'09891234567', totalSpent:29800, totalOrders:9,  lastVisit:'2026-05-18', joinedAt:'2025-06-22', status:'Active',   loyaltyPoints:298 },
  { id:'c9',  name:'Isabel Garcia',  email:'isabel.garcia@email.com', phone:'09121234567', totalSpent:51200, totalOrders:15, lastVisit:'2026-05-22', joinedAt:'2025-04-14', status:'Active',   loyaltyPoints:512 },
  { id:'c10', name:'Ryan Torres',    email:'ryan.torres@email.com',   phone:'09231234567', totalSpent:6700,  totalOrders:2,  lastVisit:'2026-03-30', joinedAt:'2026-02-28', status:'Inactive', loyaltyPoints:67  },
]
