import { apiFetch, fetchAll } from '../client'

export type POStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled'

export interface PurchaseOrderLine {
  id:                number
  product:           number
  product_name:      string
  quantity:          number
  unit_cost:         string
  expiry_date:       string | null
  received_quantity: number
  remaining:         number
  total:             number
}

export interface PurchaseOrder {
  id:           number
  po_number:    string
  supplier_id:  number
  status:       POStatus
  status_display: string
  notes:        string
  lines:        PurchaseOrderLine[]
  total_amount: number
  created_at:   string
  created_by:   number | null
  updated_at:   string
  updated_by:   number | null
  received_at:  string | null
}

export interface PurchaseOrderLineWriteData {
  product:      number
  quantity:     number
  unit_cost:    number
  expiry_date?: string | null
}

export interface PurchaseOrderCreateData {
  supplier_id: number
  notes?:      string
  lines:       PurchaseOrderLineWriteData[]
}

// Not linked by a DB foreign key — always filter/fetch by supplier_id yourself
// (same convention as the other supplier sub-resources).
export const getPurchaseOrders = (supplierId: number, token?: string) =>
  fetchAll<PurchaseOrder>(`/api/v1/purchase-orders/?supplier_id=${supplierId}`, token)

export const getPurchaseOrder = (id: number, token?: string) =>
  apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/`, {}, token)

export const createPurchaseOrder = (data: PurchaseOrderCreateData, token?: string) =>
  apiFetch<PurchaseOrder>('/api/v1/purchase-orders/', { method: 'POST', body: JSON.stringify(data) }, token)

export const sendPurchaseOrder = (id: number, token?: string) =>
  apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/send/`, { method: 'POST' }, token)

export const cancelPurchaseOrder = (id: number, token?: string) =>
  apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/cancel/`, { method: 'POST' }, token)

export interface ReceiveLineInput {
  id:                number
  quantity_received: number
  /** The real expiry as read off the delivered goods — overrides whatever estimate
   *  (if any) was entered back when the PO line was created. */
  expiry_date?:      string | null
}

/** Records an actual delivery — a short/split shipment only lists the lines (and
 *  quantities) that actually showed up. Creates a real InventoryBatch per line with
 *  quantity_received > 0 and updates stock-on-hand. The PO moves to 'partially_received'
 *  until every line's cumulative received_quantity reaches its ordered quantity. */
export const receivePurchaseOrder = (id: number, lines: ReceiveLineInput[], receivedDate?: string, token?: string) =>
  apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/receive/`, {
    method: 'POST',
    body: JSON.stringify({ lines, ...(receivedDate ? { received_date: receivedDate } : {}) }),
  }, token)

/** Finalizes a PO as done even though some lines never fully arrived — use when the
 *  supplier confirms the shortfall isn't coming. What was actually received stays on
 *  record via each line's received_quantity. */
export const closePurchaseOrder = (id: number, token?: string) =>
  apiFetch<PurchaseOrder>(`/api/v1/purchase-orders/${id}/close/`, { method: 'POST' }, token)
