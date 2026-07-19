# Add Product V2 — Field Mapping (Legacy ITEM2 → Database → UI)

Source: `components/inventory/AddProductDialogV2.tsx` (UI-only preview, 4 tabs: Item Definitions, Item Information, Purchasing, Pricing — no backend wiring yet)

This maps the legacy desktop POS `ITEM2` field list (86 fields) against:
- the `items` MySQL table (`DESCRIBE items`, 76 fields incl. new `id` surrogate key)
- the Django models (`Product`, `ProductStock`, `StockMovement`, `Branch`, `Category`)
- the current AddProductDialogV2 UI fields

Every legacy field maps 1:1 to the Django backend except for a `TYPE` → `item_type` rename (SQL reserved word). The 11 stock/beginning-balance fields absent from `items`/`Product` live in a separate `ProductStock` model instead (see [Stock fields](#stock-fields-productstock) below).

## Item Definitions tab

### Row 1 — Identification
| Legacy (ITEM2) | Django (`Product`) | UI field |
|---|---|---|
| `ITEMCODE` | `itemcode` | Item Code |
| `ITEMCODE2` | `itemcode2` | Alternate Code |
| `DESCLONG` | `desclong` | Full Description (Long) |
| `DESCSHORT` | `descshort` | POS Description |
| `QUERYTEXT` | `querytext` | Query Text |
| `PICTUREFILE` | `picturefile` | Upload Image button (+ "Picture File" on Item Information tab) |
| `BARCODETYPE` | `barcodetype` | ⚠️ No per-item field yet — barcode format is currently a **global Settings default** (`lib/barcodeFormat.ts`), not stored per product |
| `ITEMCODE3` | `itemcode3` | ❌ No UI field |
| `ITEMCODE3TYPE` | `itemcode3type` | ❌ No UI field |

### Row 2 — Item Info
| Legacy (ITEM2) | Django (`Product`) | UI field |
|---|---|---|
| `DEPTCODE` | `deptcode` | Department |
| `CLASSCODE` | `classcode` | Class |
| `CATEGORYCODE` | `categorycode` | Category |
| `SUBCATEGORYCODE` | `subcategorycode` | Sub-Category |
| `SIZE` | `size` | Size |
| `COLOR` | `color` | Color |
| `TYPE` | `item_type` | Type (Retail/Wholesale) |
| `FORM` | `form` | Form (Solid/Liquid) |
| `SELL:UOM` | `sell_uom` | Units |
| `SELL:PACK` | `sell_pack` | Packing |
| `SELL:PACKCONV` | `sell_packconv` | Conversion |
| `SELL:DIMENSION` | `sell_dimension` | Dimension |
| `STYLE` | `style` | ❌ No UI field |
| `SELL:WEIGHT` | `sell_weight` | ⚠️ No "Weight" field here — only on Purchasing tab (likely the same underlying field, shown on a different tab) |

### Row 3 — Options / Stocks on Hand
| Legacy (ITEM2) | Django | UI field |
|---|---|---|
| `TRACKINVENTORY` | `Product.trackinventory` | Track Inventory checkbox |
| `WITHALIAS` | `Product.withalias` | Alternate Codes checkbox |
| `MEASURED` | `Product.measured` | Weighted / Measured checkbox |
| `WITHSERIAL` | `Product.withserial` | Serial Numbers checkbox |
| `GENERIC` | `Product.generic` | Generic checkbox |
| `PRO:ALLOWED` | `Product.pro_allowed` | Allow Promo checkbox |
| `EXPIRYDATE` | `Product.expirydate` | Expiry Date checkbox |
| `STOCK:SA` | `ProductStock.stock_sa` | Selling Area |
| `STOCK:SR` | `ProductStock.stock_sr` | Stock Room |
| `STOCK:ONORDER` | `ProductStock.stock_onorder` | On-order |
| `SELL:LASTDATE` | `Product.sell_lastdate` | Date Last Sold |
| `CREATEDDATE` | `Product.createddate` | Entry Date (approximate match) |
| `UPDATEDDATE` | `Product.updateddate` | Last Update |
| `LOTNUMBER` | `Product.lotnumber` | ❌ No checkbox yet |
| `WITHAUTOCONV` | `Product.withautoconv` | ❌ No toggle yet |
| `STOCK:BOOK:SA` | `ProductStock.stock_book_sa` | ❌ No UI field |
| `STOCK:BOOK:SR` | `ProductStock.stock_book_sr` | ❌ No UI field |
| `STOCK:RESERVED` | `ProductStock.stock_reserved` | ❌ No UI field |
| `BEG:BALANCE:SA` | `ProductStock.beg_balance_sa` | ❌ No UI field |
| `BEG:BALANCE:SR` | `ProductStock.beg_balance_sr` | ❌ No UI field |
| `BEG:COST` | `ProductStock.beg_cost` | ❌ No UI field |

"Total Stocks" in the UI is a derived/display value, not a direct field (see `ProductStock.total_stock` property).

## Item Information tab
| Legacy (ITEM2) | Django (`Product`) | UI field |
|---|---|---|
| `GLCODE` | `glcode` | General Ledger Code |
| `INVCODE` | `invcode` | Inventory Code |
| `PICTUREFILE` | `picturefile` | Picture File |
| `ACTIVE` | `active` | Item Status (Active/Inactive) |
| `GROUP` | `group` | ⚠️ Possibly "Parent/Group Code" — not a confirmed exact match |
| `PLANERID` | `planerid` | ❌ No UI field |
| `BUYERID` | `buyerid` | ❌ No UI field |
| `PRINTTO` | `printto` | ⚠️ "Signage Printing" is an action button, not a data field bound to this |
| `INFO1` | `info1` | ❌ No UI field |
| `INFO2` | `info2` | ❌ No UI field |
| `TAG` | `tag` | ❌ No UI field |

## Purchasing tab
`SupplierInfoBox` + `OrderingInformationBox` + `AlternateSupplierBox` (Cost fields are on the **Pricing** tab, not here — see below).

| Legacy (ITEM2) | Django | UI field |
|---|---|---|
| `SUPPLIERCODE` | `Product.suppliercode` | Supplier Code |
| `STOCK:ROP` | `ProductStock.stock_rop` | Re-Order Point (ROP) |
| `STOCK:LIMIT` | `ProductStock.stock_limit` | Maximum Stock |
| `SELL:PACK` / `SELL:PACKCONV` / `SELL:DIMENSION` / `SELL:WEIGHT` | `Product.sell_*` | Packing / Conversion / Dimension / Weight in Ordering Information (⚠️ likely duplicate display of the Row 2 fields, not separate data) |
| — | — | Company Name, Order Terms — disabled, would be resolved from a Supplier model (not reviewed yet) |
| — | — | Origin, Country Code, Supplier Minimum Order — ❌ no matching legacy/Django field found |

## Pricing tab
`CostBox` (Supplier First Cost, Tax Code, Unit Cost, Net Landed Cost) is on **this** tab, not Purchasing:

| Legacy (ITEM2) | Django | UI field |
|---|---|---|
| `ACQCOST` | `Product.acqcost` | Supplier First Cost (likely) |
| `UNITCOST` | `Product.unitcost` | Unit Cost |
| `TAXCODE` | `Product.taxcode` | Tax Code |
| `UNITCOSTAVE` | `Product.unitcostave` | ⚠️ Not confirmed — UI shows "Net Landed Cost", unclear if same concept |

| Legacy (ITEM2) | Django (`Product`) | UI field |
|---|---|---|
| `SELL:PRICE:RP` | `sell_price_rp` | Unit Retail |
| `SELL:PRICE:WS` | `sell_price_ws` | Wholesale (Selling Price) |
| `MARKUP:RP` | `markup_rp` | Retail % markup |
| `MARKUP:WS` | `markup_ws` | Wholesale % markup |
| `PRICETYPE` | `pricetype` | Price Type radio |
| `SLOWFACTOR` | `slowfactor` | Slow Movement |
| `FASTFACTOR` | `fastfactor` | Fast |
| `MINWHLSALEQTY` | `minwhlsaleqty` | Min. Wholesale Qty |
| `SELL:PRICE2` | `sell_price2` | Retail Price 2 |
| `SELL:PRICE3` | `sell_price3` | Retail Price 3 |
| `PRO:DATEFR` | `pro_datefr` | Beginning of Promo |
| `PRO:DATETO` | `pro_dateto` | Promo End Date |
| `PRO:PRICERET` | `pro_priceret` | Promo Price Retail |
| `PRO:TIMEFR` + `PRO:TIMETO` | `pro_timefr` + `pro_timeto` | ⚠️ Only one "Promo Time" field in the UI — backend has separate from/to times |
| `SELL:PRICE4` | `sell_price4` | ❌ No UI field |
| `SELL:PRICE5` | `sell_price5` | ❌ No UI field |
| `SELL:QUANTITY1`–`4` | `sell_quantity1`–`4` | ❌ No UI fields |
| `PRO:PRICEWHL` | `pro_pricewhl` | ❌ No UI field (no "Promo Price Wholesale") |
| `PRO:COST` | `pro_cost` | ❌ No UI field (no "Promo Cost") |

## Stock fields (`ProductStock`)

The 11 legacy `STOCK:*` / `BEG:*` fields have **no column on `Product`/`items`** — they live in a separate `ProductStock` model, keyed by `itemcode` + `branch_code` (no FK, code-based linking — matches the app's multi-branch design):

| Field | Model | Notes |
|---|---|---|
| `stock_sa`, `stock_sr` | `ProductStock` | Selling Area / Stock Room UI fields |
| `stock_book_sa`, `stock_book_sr` | `ProductStock` | No UI field yet |
| `stock_reserved` | `ProductStock` | No UI field yet |
| `stock_rop` | `ProductStock` | Re-Order Point UI field (Purchasing tab) |
| `stock_limit` | `ProductStock` | Maximum Stock UI field (Purchasing tab) |
| `stock_onorder` | `ProductStock` | On-order UI field |
| `beg_balance_sa`, `beg_balance_sr`, `beg_cost` | `ProductStock` | No UI field yet |

`ProductStock` also exposes `total_stock`, `available_stock`, `is_below_rop` properties, and `deduct()` / `restock()` methods. A related `StockMovement` model records an audit trail of stock changes (sale/return/void/receive/adjustment/transfer in-out/write-off) with `qty_before`/`qty_after`.

## Fields with no UI counterpart yet (summary)

`itemcode3`, `itemcode3type`, `style`, `sell_price4`, `sell_price5`, `sell_quantity1`–`4`, `pro_pricewhl`, `pro_cost`, `pro_timeto` (partial — one merged "Promo Time" field), `unitcostave` (ambiguous), `lotnumber`, `withautoconv`, `planerid`, `buyerid`, `printto` (ambiguous), `info1`, `info2`, `tag`, `createdby`, `updatedby` (audit — expected, no auth/backend wiring yet), `barcodetype` (per-item — currently global-only in Settings), plus the 6 `ProductStock` fields with no UI field (`stock_book_sa`, `stock_book_sr`, `stock_reserved`, `beg_balance_sa`, `beg_balance_sr`, `beg_cost`).

## Open question

The Django snippet reviewed only showed a `Category` model (`name` field only) — no `SubCategory` model, even though `lib/api/categories.ts` already imports/uses a `SubCategory` type. Not yet confirmed whether `SubCategory` exists in a different file/app or hasn't been modeled on the backend yet.
