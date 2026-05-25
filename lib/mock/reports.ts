// TODO: Replace MOCK_DATA with API call → GET /api/reports

export const WEEKLY_SALES = [
  { day:'Mon', sales:24500, txns:12 },
  { day:'Tue', sales:31200, txns:18 },
  { day:'Wed', sales:19800, txns:9  },
  { day:'Thu', sales:42100, txns:24 },
  { day:'Fri', sales:56700, txns:31 },
  { day:'Sat', sales:38450, txns:47 },
  { day:'Sun', sales:28300, txns:15 },
]

export const MONTHLY_SALES = [
  { month:'Jan', sales:420000, txns:198 },
  { month:'Feb', sales:385000, txns:174 },
  { month:'Mar', sales:510000, txns:231 },
  { month:'Apr', sales:467000, txns:210 },
  { month:'May', sales:298450, txns:156 },
]

export const CATEGORY_BREAKDOWN = [
  { category:'Footwear',    revenue:312000, percentage:36 },
  { category:'Tops',        revenue:198000, percentage:23 },
  { category:'Bottoms',     revenue:154000, percentage:18 },
  { category:'Accessories', revenue:129000, percentage:15 },
  { category:'Bags',        revenue:69000,  percentage:8  },
]

export const PAYMENT_BREAKDOWN = [
  { method:'Card',  amount:192270, percentage:50, color:'#1A5FD6' },
  { method:'Cash',  amount:115362, percentage:30, color:'#1A9E5C' },
  { method:'GCash', amount:57681,  percentage:15, color:'#D68910' },
  { method:'Maya',  amount:19227,  percentage:5,  color:'#C0392B' },
]

export const HOURLY_SALES = [
  { hour:'8AM',  sales:4200  },
  { hour:'9AM',  sales:8900  },
  { hour:'10AM', sales:14500 },
  { hour:'11AM', sales:18200 },
  { hour:'12PM', sales:22800 },
  { hour:'1PM',  sales:19600 },
  { hour:'2PM',  sales:16400 },
  { hour:'3PM',  sales:21000 },
  { hour:'4PM',  sales:25300 },
  { hour:'5PM',  sales:31200 },
  { hour:'6PM',  sales:28700 },
  { hour:'7PM',  sales:12400 },
]
