// TODO: Replace MOCK_DATA with API call → GET /api/transactions

export type TxnStatus = 'Completed' | 'Refunded' | 'Voided' | 'Pending'
export type PayMethod = 'Cash' | 'Card' | 'GCash' | 'Maya'

export interface TransactionItem {
  productId: string
  name: string
  sku: string
  qty: number
  price: number
}

export interface Transaction {
  id: string
  txnNo: string
  date: string
  time: string
  cashier: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  payMethod: PayMethod
  status: TxnStatus
  customerId?: string
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id:'txn1', txnNo:'TXN-2026-04782', date:'2026-05-24', time:'09:41 AM',
    cashier:'Clouie Caagbay',
    items:[
      { productId:'1', name:'Air Force 1',  sku:'AF1-WHT-42', qty:1, price:4250 },
      { productId:'2', name:'Slim Fit Tee', sku:'SFT-BLK-M',  qty:2, price:890  },
    ],
    subtotal:6030, discount:200, tax:724, total:6554,
    payMethod:'Card', status:'Completed', customerId:'c1',
  },
  {
    id:'txn2', txnNo:'TXN-2026-04781', date:'2026-05-24', time:'09:15 AM',
    cashier:'Clouie Caagbay',
    items:[{ productId:'6', name:'Sunglasses', sku:'SGL-BLK-OS', qty:1, price:2100 }],
    subtotal:2100, discount:0, tax:252, total:2352,
    payMethod:'GCash', status:'Completed', customerId:'c2',
  },
  {
    id:'txn3', txnNo:'TXN-2026-04780', date:'2026-05-24', time:'08:52 AM',
    cashier:'Ana Reyes',
    items:[
      { productId:'8',  name:'Polo Shirt',  sku:'PS-WHT-L',  qty:2, price:1350 },
      { productId:'10', name:'Bucket Hat',  sku:'BH-BEG-OS', qty:1, price:650  },
    ],
    subtotal:3350, discount:0, tax:402, total:3752,
    payMethod:'Cash', status:'Completed',
  },
  {
    id:'txn4', txnNo:'TXN-2026-04779', date:'2026-05-24', time:'08:30 AM',
    cashier:'Rico Santos',
    items:[{ productId:'19', name:'Wrist Watch', sku:'WW-SLV-OS', qty:1, price:5500 }],
    subtotal:5500, discount:500, tax:660, total:5660,
    payMethod:'Card', status:'Refunded', customerId:'c3',
  },
  {
    id:'txn5', txnNo:'TXN-2026-04778', date:'2026-05-23', time:'05:45 PM',
    cashier:'Clouie Caagbay',
    items:[
      { productId:'12', name:'Jogger Pants', sku:'JP-BLK-M',  qty:1, price:1750 },
      { productId:'13', name:'Graphic Tee',  sku:'GT-BLU-S',  qty:2, price:790  },
    ],
    subtotal:3330, discount:0, tax:400, total:3730,
    payMethod:'Maya', status:'Completed', customerId:'c4',
  },
  {
    id:'txn6', txnNo:'TXN-2026-04777', date:'2026-05-23', time:'04:20 PM',
    cashier:'Ana Reyes',
    items:[{ productId:'16', name:'Crossbody Bag', sku:'CB-TAN-OS', qty:1, price:2200 }],
    subtotal:2200, discount:0, tax:264, total:2464,
    payMethod:'Cash', status:'Completed',
  },
  {
    id:'txn7', txnNo:'TXN-2026-04776', date:'2026-05-23', time:'02:10 PM',
    cashier:'Rico Santos',
    items:[{ productId:'14', name:'Leather Wallet', sku:'LW-BRN-OS', qty:1, price:1450 }],
    subtotal:1450, discount:0, tax:174, total:1624,
    payMethod:'GCash', status:'Voided',
  },
  {
    id:'txn8', txnNo:'TXN-2026-04775', date:'2026-05-22', time:'11:30 AM',
    cashier:'Clouie Caagbay',
    items:[
      { productId:'1', name:'Air Force 1', sku:'AF1-WHT-42',  qty:1, price:4250 },
      { productId:'5', name:'Sling Bag',   sku:'SLB-BLK-OS',  qty:1, price:1290 },
    ],
    subtotal:5540, discount:300, tax:665, total:5905,
    payMethod:'Card', status:'Completed', customerId:'c1',
  },
]
