// TODO: Replace MOCK_DATA with API call → GET /api/products

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  cost: number
  stock: number
  maxStock: number
  status: StockStatus
  sold: number
  createdAt: string
}

export const CATEGORIES = [
  'Footwear', 'Tops', 'Bottoms', 'Accessories', 'Bags',
]

export const MOCK_PRODUCTS: Product[] = [
  { id:'1',  name:'Air Force 1',      sku:'AF1-WHT-42',  category:'Footwear',    price:4250,  cost:2100, stock:12,  maxStock:50,  status:'In Stock',     sold:89,  createdAt:'2026-01-10' },
  { id:'2',  name:'Slim Fit Tee',     sku:'SFT-BLK-M',   category:'Tops',        price:890,   cost:380,  stock:34,  maxStock:100, status:'In Stock',     sold:142, createdAt:'2026-01-12' },
  { id:'3',  name:'Cargo Shorts',     sku:'CGS-KHK-L',   category:'Bottoms',     price:1650,  cost:720,  stock:3,   maxStock:40,  status:'Low Stock',    sold:55,  createdAt:'2026-01-15' },
  { id:'4',  name:'Snapback Cap',     sku:'SBC-RED-OS',  category:'Accessories', price:750,   cost:280,  stock:0,   maxStock:30,  status:'Out of Stock', sold:77,  createdAt:'2026-01-18' },
  { id:'5',  name:'Sling Bag',        sku:'SLB-BLK-OS',  category:'Bags',        price:1290,  cost:550,  stock:5,   maxStock:20,  status:'Low Stock',    sold:33,  createdAt:'2026-02-01' },
  { id:'6',  name:'Sunglasses',       sku:'SGL-BLK-OS',  category:'Accessories', price:2100,  cost:900,  stock:21,  maxStock:40,  status:'In Stock',     sold:61,  createdAt:'2026-02-03' },
  { id:'7',  name:'Running Shorts',   sku:'RS-GRY-M',    category:'Bottoms',     price:1100,  cost:460,  stock:8,   maxStock:40,  status:'Low Stock',    sold:48,  createdAt:'2026-02-05' },
  { id:'8',  name:'Polo Shirt',       sku:'PS-WHT-L',    category:'Tops',        price:1350,  cost:580,  stock:45,  maxStock:80,  status:'In Stock',     sold:99,  createdAt:'2026-02-07' },
  { id:'9',  name:'Canvas Shoes',     sku:'CS-BLK-41',   category:'Footwear',    price:2800,  cost:1200, stock:0,   maxStock:30,  status:'Out of Stock', sold:29,  createdAt:'2026-02-10' },
  { id:'10', name:'Bucket Hat',       sku:'BH-BEG-OS',   category:'Accessories', price:650,   cost:240,  stock:17,  maxStock:35,  status:'In Stock',     sold:83,  createdAt:'2026-02-12' },
  { id:'11', name:'Tote Bag',         sku:'TB-NAT-OS',   category:'Bags',        price:980,   cost:420,  stock:9,   maxStock:25,  status:'Low Stock',    sold:41,  createdAt:'2026-02-14' },
  { id:'12', name:'Jogger Pants',     sku:'JP-BLK-M',    category:'Bottoms',     price:1750,  cost:760,  stock:22,  maxStock:50,  status:'In Stock',     sold:66,  createdAt:'2026-02-15' },
  { id:'13', name:'Graphic Tee',      sku:'GT-BLU-S',    category:'Tops',        price:790,   cost:320,  stock:6,   maxStock:60,  status:'Low Stock',    sold:110, createdAt:'2026-02-18' },
  { id:'14', name:'Leather Wallet',   sku:'LW-BRN-OS',   category:'Accessories', price:1450,  cost:620,  stock:30,  maxStock:50,  status:'In Stock',     sold:52,  createdAt:'2026-03-01' },
  { id:'15', name:'High-top Sneaker', sku:'HTS-WHT-43',  category:'Footwear',    price:3600,  cost:1600, stock:0,   maxStock:20,  status:'Out of Stock', sold:18,  createdAt:'2026-03-03' },
  { id:'16', name:'Crossbody Bag',    sku:'CB-TAN-OS',   category:'Bags',        price:2200,  cost:950,  stock:14,  maxStock:30,  status:'In Stock',     sold:37,  createdAt:'2026-03-05' },
  { id:'17', name:'Denim Jacket',     sku:'DJ-BLU-L',    category:'Tops',        price:3200,  cost:1400, stock:4,   maxStock:25,  status:'Low Stock',    sold:24,  createdAt:'2026-03-07' },
  { id:'18', name:'Track Pants',      sku:'TP-GRY-XL',   category:'Bottoms',     price:1400,  cost:600,  stock:28,  maxStock:45,  status:'In Stock',     sold:71,  createdAt:'2026-03-10' },
  { id:'19', name:'Wrist Watch',      sku:'WW-SLV-OS',   category:'Accessories', price:5500,  cost:2400, stock:7,   maxStock:15,  status:'Low Stock',    sold:19,  createdAt:'2026-03-12' },
  { id:'20', name:'Slip-on Shoes',    sku:'SS-BLK-40',   category:'Footwear',    price:1900,  cost:820,  stock:19,  maxStock:35,  status:'In Stock',     sold:58,  createdAt:'2026-03-14' },
]
