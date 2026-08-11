// UI mock data — no backend endpoint yet for Supplier product orders / purchase orders.

export interface ProductOrderItem {
  id:          number
  supplierId:  number
  /** Links this line item to the PurchaseOrder it belongs to. */
  poId:        number
  productName: string
  quantity:    number
  unitCost:    number
  total:       number
  orderDate:   string
}

export type POStatus = 'Draft' | 'Sent' | 'Received' | 'Cancelled'

export interface PurchaseOrder {
  id:          number
  supplierId:  number
  poNumber:    string
  dateCreated: string
  status:      POStatus
  totalAmount: number
}

export const MOCK_PRODUCT_ORDERS: ProductOrderItem[] = [
  { id: 1, supplierId: 1, poId: 1, productName: 'Bottled Water 500ml', quantity: 200, unitCost: 8.5, total: 1700, orderDate: '2025-05-12' },
  { id: 7, supplierId: 1, poId: 1, productName: 'Paper Cups 8oz',      quantity: 500, unitCost: 3,   total: 1500, orderDate: '2025-05-12' },
  { id: 2, supplierId: 1, poId: 2, productName: 'Instant Noodles',     quantity: 150, unitCost: 12,  total: 1800, orderDate: '2025-05-28' },
  { id: 3, supplierId: 1, poId: 3, productName: 'Canned Sardines',     quantity: 100, unitCost: 22,  total: 2200, orderDate: '2025-06-02' },
  { id: 4, supplierId: 2, poId: 4, productName: 'Wireless Mouse',      quantity: 50,  unitCost: 250, total: 12500, orderDate: '2025-04-18' },
  { id: 5, supplierId: 2, poId: 5, productName: 'USB-C Cable 1m',      quantity: 300, unitCost: 45,  total: 13500, orderDate: '2025-05-20' },
  { id: 6, supplierId: 3, poId: 6, productName: 'Dish Soap 1L',        quantity: 80,  unitCost: 55,  total: 4400, orderDate: '2025-03-05' },
]

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 1, supplierId: 1, poNumber: 'PO-2025-0011', dateCreated: '2025-05-10', status: 'Received',  totalAmount: 3200 },
  { id: 2, supplierId: 1, poNumber: 'PO-2025-0024', dateCreated: '2025-05-26', status: 'Received',  totalAmount: 1800 },
  { id: 3, supplierId: 1, poNumber: 'PO-2025-0031', dateCreated: '2025-06-01', status: 'Sent',      totalAmount: 2200 },
  { id: 4, supplierId: 2, poNumber: 'PO-2025-0008', dateCreated: '2025-04-15', status: 'Received',  totalAmount: 12500 },
  { id: 5, supplierId: 2, poNumber: 'PO-2025-0019', dateCreated: '2025-05-19', status: 'Draft',      totalAmount: 13500 },
  { id: 6, supplierId: 3, poNumber: 'PO-2025-0003', dateCreated: '2025-03-04', status: 'Cancelled',  totalAmount: 4400 },
]
