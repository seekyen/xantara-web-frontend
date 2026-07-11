// TODO: Replace MOCK_DATA with API call → GET /api/v1/products/

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

export interface Product {
  id: number
  itemcode: string
  itemcode2: string
  itemcode3: string
  itemcode3type: string
  desclong: string
  descshort: string
  querytext: string
  deptcode: string
  classcode: string
  categorycode: string
  subcategorycode: string
  group: string
  size: string
  color: string
  style: string
  item_type: string
  form: string
  sell_price_rp: number
  sell_price_ws: number
  sell_price2: number
  sell_price3: number
  sell_price4: number
  sell_price5: number
  sell_lastdate: string | null
  sell_uom: string
  sell_pack: string
  sell_packconv: number
  sell_dimension: string
  sell_weight: string
  sell_quantity1: number
  sell_quantity2: number
  sell_quantity3: number
  sell_quantity4: number
  pro_allowed: boolean
  pro_datefr: string | null
  pro_timefr: string
  pro_dateto: string | null
  pro_timeto: string
  pro_priceret: number
  pro_pricewhl: number
  pro_cost: number
  suppliercode: string
  markup_rp: number
  markup_ws: number
  acqcost: number
  unitcost: number
  unitcostave: number
  taxcode: string
  glcode: string
  invcode: string
  pricetype: string
  barcodetype: string
  stock_sa: number
  stock_sr: number
  stock_book_sa: number
  stock_book_sr: number
  beg_balance_sa: number
  beg_balance_sr: number
  stock_reserved: number
  stock_rop: number
  stock_limit: number
  stock_onorder: number
  beg_cost: number
  trackinventory: boolean
  active: boolean
  withserial: boolean
  generic: boolean
  measured: boolean
  withalias: boolean
  expirydate: boolean
  lotnumber: boolean
  withautoconv: boolean
  slowfactor: number
  fastfactor: number
  minwhlsaleqty: number
  picturefile: string
  planerid: string
  buyerid: string
  printto: string
  info1: string
  info2: string
  tag: string
  createdby: string
  createddate: string | null
  updatedby: string
  updateddate: string | null
  total_stock: number
  is_below_rop: boolean
  is_on_promo: boolean
}

export function getStatus(p: Product): StockStatus {
  if (p.total_stock === 0)  return 'Out of Stock'
  if (p.total_stock < 50)   return 'Low Stock'
  return 'In Stock'
}

export const CATEGORIES = [
  'Footwear', 'Tops', 'Bottoms', 'Accessories', 'Bags',
]

const BASE: Product = {
  id: 0,
  itemcode: '', itemcode2: '', itemcode3: '', itemcode3type: '',
  desclong: '', descshort: '', querytext: '',
  deptcode: '', classcode: '', categorycode: '', subcategorycode: '',
  group: '', size: '', color: '', style: '', item_type: '', form: '',
  sell_price_rp: 0, sell_price_ws: 0, sell_price2: 0, sell_price3: 0, sell_price4: 0, sell_price5: 0,
  sell_lastdate: null, sell_uom: 'PCS', sell_pack: '', sell_packconv: 0,
  sell_dimension: '', sell_weight: '',
  sell_quantity1: 0, sell_quantity2: 0, sell_quantity3: 0, sell_quantity4: 0,
  pro_allowed: false, pro_datefr: null, pro_timefr: '', pro_dateto: null, pro_timeto: '',
  pro_priceret: 0, pro_pricewhl: 0, pro_cost: 0,
  suppliercode: '', markup_rp: 0, markup_ws: 0, acqcost: 0, unitcost: 0, unitcostave: 0,
  taxcode: '', glcode: '', invcode: '', pricetype: '', barcodetype: '',
  stock_sa: 0, stock_sr: 0, stock_book_sa: 0, stock_book_sr: 0,
  beg_balance_sa: 0, beg_balance_sr: 0, stock_reserved: 0, stock_rop: 0, stock_limit: 0,
  stock_onorder: 0, beg_cost: 0,
  trackinventory: true, active: true,
  withserial: false, generic: false, measured: false, withalias: false,
  expirydate: false, lotnumber: false, withautoconv: false,
  slowfactor: 0, fastfactor: 0, minwhlsaleqty: 0,
  picturefile: '', planerid: '', buyerid: '', printto: '',
  info1: '', info2: '', tag: '',
  createdby: '', createddate: null, updatedby: '', updateddate: null,
  total_stock: 0, is_below_rop: false, is_on_promo: false,
}

export const makeProduct = (overrides: Partial<Product>): Product => ({ ...BASE, ...overrides })

const mk = makeProduct

export const MOCK_PRODUCTS: Product[] = [
  mk({ id:1,  itemcode:'AF1-WHT-42',  descshort:'Air Force 1',       categorycode:'Footwear',    deptcode:'APRL', classcode:'FTWU', sell_price_rp:4250, unitcost:2100, stock_sa:12, stock_rop:5,  stock_limit:50,  total_stock:12,  is_below_rop:false, suppliercode:'SUP001' }),
  mk({ id:2,  itemcode:'SFT-BLK-M',   descshort:'Slim Fit Tee',      categorycode:'Tops',        deptcode:'APRL', classcode:'TOPS', sell_price_rp:890,  unitcost:380,  stock_sa:34, stock_rop:10, stock_limit:100, total_stock:34,  is_below_rop:false, suppliercode:'SUP002' }),
  mk({ id:3,  itemcode:'CGS-KHK-L',   descshort:'Cargo Shorts',      categorycode:'Bottoms',     deptcode:'APRL', classcode:'BTMS', sell_price_rp:1650, unitcost:720,  stock_sa:3,  stock_rop:8,  stock_limit:40,  total_stock:3,   is_below_rop:true,  suppliercode:'SUP001' }),
  mk({ id:4,  itemcode:'SBC-RED-OS',  descshort:'Snapback Cap',      categorycode:'Accessories', deptcode:'APRL', classcode:'ACCS', sell_price_rp:750,  unitcost:280,  stock_sa:0,  stock_rop:5,  stock_limit:30,  total_stock:0,   is_below_rop:true,  suppliercode:'SUP003' }),
  mk({ id:5,  itemcode:'SLB-BLK-OS',  descshort:'Sling Bag',         categorycode:'Bags',        deptcode:'APRL', classcode:'BAGS', sell_price_rp:1290, unitcost:550,  stock_sa:5,  stock_rop:6,  stock_limit:20,  total_stock:5,   is_below_rop:true,  suppliercode:'SUP002' }),
  mk({ id:6,  itemcode:'SGL-BLK-OS',  descshort:'Sunglasses',        categorycode:'Accessories', deptcode:'APRL', classcode:'ACCS', sell_price_rp:2100, unitcost:900,  stock_sa:21, stock_rop:5,  stock_limit:40,  total_stock:21,  is_below_rop:false, suppliercode:'SUP003' }),
  mk({ id:7,  itemcode:'RS-GRY-M',    descshort:'Running Shorts',    categorycode:'Bottoms',     deptcode:'APRL', classcode:'BTMS', sell_price_rp:1100, unitcost:460,  stock_sa:8,  stock_rop:10, stock_limit:40,  total_stock:8,   is_below_rop:true,  suppliercode:'SUP001' }),
  mk({ id:8,  itemcode:'PS-WHT-L',    descshort:'Polo Shirt',        categorycode:'Tops',        deptcode:'APRL', classcode:'TOPS', sell_price_rp:1350, unitcost:580,  stock_sa:45, stock_rop:10, stock_limit:80,  total_stock:45,  is_below_rop:false, suppliercode:'SUP002' }),
  mk({ id:9,  itemcode:'CS-BLK-41',   descshort:'Canvas Shoes',      categorycode:'Footwear',    deptcode:'APRL', classcode:'FTWU', sell_price_rp:2800, unitcost:1200, stock_sa:0,  stock_rop:5,  stock_limit:30,  total_stock:0,   is_below_rop:true,  suppliercode:'SUP001' }),
  mk({ id:10, itemcode:'BH-BEG-OS',   descshort:'Bucket Hat',        categorycode:'Accessories', deptcode:'APRL', classcode:'ACCS', sell_price_rp:650,  unitcost:240,  stock_sa:17, stock_rop:5,  stock_limit:35,  total_stock:17,  is_below_rop:false, suppliercode:'SUP003' }),
  mk({ id:11, itemcode:'TB-NAT-OS',   descshort:'Tote Bag',          categorycode:'Bags',        deptcode:'APRL', classcode:'BAGS', sell_price_rp:980,  unitcost:420,  stock_sa:9,  stock_rop:10, stock_limit:25,  total_stock:9,   is_below_rop:true,  suppliercode:'SUP002' }),
  mk({ id:12, itemcode:'JP-BLK-M',    descshort:'Jogger Pants',      categorycode:'Bottoms',     deptcode:'APRL', classcode:'BTMS', sell_price_rp:1750, unitcost:760,  stock_sa:22, stock_rop:8,  stock_limit:50,  total_stock:22,  is_below_rop:false, suppliercode:'SUP001' }),
  mk({ id:13, itemcode:'GT-BLU-S',    descshort:'Graphic Tee',       categorycode:'Tops',        deptcode:'APRL', classcode:'TOPS', sell_price_rp:790,  unitcost:320,  stock_sa:6,  stock_rop:10, stock_limit:60,  total_stock:6,   is_below_rop:true,  suppliercode:'SUP002' }),
  mk({ id:14, itemcode:'LW-BRN-OS',   descshort:'Leather Wallet',    categorycode:'Accessories', deptcode:'APRL', classcode:'ACCS', sell_price_rp:1450, unitcost:620,  stock_sa:30, stock_rop:5,  stock_limit:50,  total_stock:30,  is_below_rop:false, suppliercode:'SUP003' }),
  mk({ id:15, itemcode:'HTS-WHT-43',  descshort:'High-top Sneaker',  categorycode:'Footwear',    deptcode:'APRL', classcode:'FTWU', sell_price_rp:3600, unitcost:1600, stock_sa:0,  stock_rop:3,  stock_limit:20,  total_stock:0,   is_below_rop:true,  suppliercode:'SUP001' }),
  mk({ id:16, itemcode:'CB-TAN-OS',   descshort:'Crossbody Bag',     categorycode:'Bags',        deptcode:'APRL', classcode:'BAGS', sell_price_rp:2200, unitcost:950,  stock_sa:14, stock_rop:5,  stock_limit:30,  total_stock:14,  is_below_rop:false, suppliercode:'SUP002' }),
  mk({ id:17, itemcode:'DJ-BLU-L',    descshort:'Denim Jacket',      categorycode:'Tops',        deptcode:'APRL', classcode:'TOPS', sell_price_rp:3200, unitcost:1400, stock_sa:4,  stock_rop:5,  stock_limit:25,  total_stock:4,   is_below_rop:true,  suppliercode:'SUP001' }),
  mk({ id:18, itemcode:'TP-GRY-XL',   descshort:'Track Pants',       categorycode:'Bottoms',     deptcode:'APRL', classcode:'BTMS', sell_price_rp:1400, unitcost:600,  stock_sa:28, stock_rop:8,  stock_limit:45,  total_stock:28,  is_below_rop:false, suppliercode:'SUP002' }),
  mk({ id:19, itemcode:'WW-SLV-OS',   descshort:'Wrist Watch',       categorycode:'Accessories', deptcode:'APRL', classcode:'ACCS', sell_price_rp:5500, unitcost:2400, stock_sa:7,  stock_rop:3,  stock_limit:15,  total_stock:7,   is_below_rop:false, suppliercode:'SUP003' }),
  mk({ id:20, itemcode:'SS-BLK-40',   descshort:'Slip-on Shoes',     categorycode:'Footwear',    deptcode:'APRL', classcode:'FTWU', sell_price_rp:1900, unitcost:820,  stock_sa:19, stock_rop:5,  stock_limit:35,  total_stock:19,  is_below_rop:false, suppliercode:'SUP001' }),
]
