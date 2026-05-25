export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  maxStock: number
  status: StockStatus
}

export const CATEGORIES = [
  'Footwear',
  'Tops',
  'Bottoms',
  'Accessories',
  'Bags',
]

export const MOCK_PRODUCTS: Product[] = [
  { id: '1',  name: 'Air Force 1',      sku: 'AF1-WHT-42',  category: 'Footwear',    price: 4250,  stock: 12,  maxStock: 50,  status: 'In Stock'     },
  { id: '2',  name: 'Slim Fit Tee',     sku: 'SFT-BLK-M',   category: 'Tops',        price: 890,   stock: 34,  maxStock: 100, status: 'In Stock'     },
  { id: '3',  name: 'Cargo Shorts',     sku: 'CGS-KHK-L',   category: 'Bottoms',     price: 1650,  stock: 3,   maxStock: 40,  status: 'Low Stock'    },
  { id: '4',  name: 'Snapback Cap',     sku: 'SBC-RED-OS',  category: 'Accessories', price: 750,   stock: 0,   maxStock: 30,  status: 'Out of Stock' },
  { id: '5',  name: 'Sling Bag',        sku: 'SLB-BLK-OS',  category: 'Bags',        price: 1290,  stock: 5,   maxStock: 20,  status: 'Low Stock'    },
  { id: '6',  name: 'Sunglasses',       sku: 'SGL-BLK-OS',  category: 'Accessories', price: 2100,  stock: 21,  maxStock: 40,  status: 'In Stock'     },
  { id: '7',  name: 'Running Shorts',   sku: 'RS-GRY-M',    category: 'Bottoms',     price: 1100,  stock: 8,   maxStock: 40,  status: 'Low Stock'    },
  { id: '8',  name: 'Polo Shirt',       sku: 'PS-WHT-L',    category: 'Tops',        price: 1350,  stock: 45,  maxStock: 80,  status: 'In Stock'     },
  { id: '9',  name: 'Canvas Shoes',     sku: 'CS-BLK-41',   category: 'Footwear',    price: 2800,  stock: 0,   maxStock: 30,  status: 'Out of Stock' },
  { id: '10', name: 'Bucket Hat',       sku: 'BH-BEG-OS',   category: 'Accessories', price: 650,   stock: 17,  maxStock: 35,  status: 'In Stock'     },
  { id: '11', name: 'Tote Bag',         sku: 'TB-NAT-OS',   category: 'Bags',        price: 980,   stock: 9,   maxStock: 25,  status: 'Low Stock'    },
  { id: '12', name: 'Jogger Pants',     sku: 'JP-BLK-M',    category: 'Bottoms',     price: 1750,  stock: 22,  maxStock: 50,  status: 'In Stock'     },
  { id: '13', name: 'Graphic Tee',      sku: 'GT-BLU-S',    category: 'Tops',        price: 790,   stock: 6,   maxStock: 60,  status: 'Low Stock'    },
  { id: '14', name: 'Leather Wallet',   sku: 'LW-BRN-OS',   category: 'Accessories', price: 1450,  stock: 30,  maxStock: 50,  status: 'In Stock'     },
  { id: '15', name: 'High-top Sneaker', sku: 'HTS-WHT-43',  category: 'Footwear',    price: 3600,  stock: 0,   maxStock: 20,  status: 'Out of Stock' },
  { id: '16', name: 'Crossbody Bag',    sku: 'CB-TAN-OS',   category: 'Bags',        price: 2200,  stock: 14,  maxStock: 30,  status: 'In Stock'     },
  { id: '17', name: 'Denim Jacket',     sku: 'DJ-BLU-L',    category: 'Tops',        price: 3200,  stock: 4,   maxStock: 25,  status: 'Low Stock'    },
  { id: '18', name: 'Track Pants',      sku: 'TP-GRY-XL',   category: 'Bottoms',     price: 1400,  stock: 28,  maxStock: 45,  status: 'In Stock'     },
  { id: '19', name: 'Wrist Watch',      sku: 'WW-SLV-OS',   category: 'Accessories', price: 5500,  stock: 7,   maxStock: 15,  status: 'Low Stock'    },
  { id: '20', name: 'Slip-on Shoes',    sku: 'SS-BLK-40',   category: 'Footwear',    price: 1900,  stock: 19,  maxStock: 35,  status: 'In Stock'     },
]
