# Add Product Dialog

Source: `ProductFormDialog.tsx` (centered modal — replaces the slide-in drawer)

Same form is reused for both **Add Product** and **Edit Product** — the title and submit button label switch based on `editingProduct`. Submit is disabled until `Description (Short)` and `Item Code` are filled.

Unlike the old drawer, this version renders as a **centered dialog with backdrop overlay**:
- Click outside the panel → closes
- `Esc` key → closes
- Header and footer are sticky; only the middle section scrolls

## Identification
| Field | Type | Notes |
|---|---|---|
| Description (Short) * | text | required |
| Item Code * | text | required, monospace |
| Item Code 2 | text | monospace |
| Item Code 3 | text | monospace |
| Item Code 3 Type | text | |
| Tag | text | |
| Description (Long) | text | |
| Query Text | text | |

## Classification
| Field | Type | Notes |
|---|---|---|
| Department | text | |
| Class | text | |
| Category | select | options from `catOptions` |
| Sub-Category | select | filtered by selected Category, disabled until Category chosen |
| Group | text | |
| Size | text | |
| Color | text | |
| Style | text | |
| Item Type | text | |
| Form | text | |

## Pricing
| Field | Type | Notes |
|---|---|---|
| Retail Price (₱) * | number | required |
| Wholesale Price (₱) | number | |
| Price 2–5 (₱) | number | |
| UOM | text | |
| Pack | text | |
| Pack Conversion | number | |
| Last Price Date | date | native `<input type="date">` |
| Dimension | text | |
| Weight | text | |

## Stock
| Field | Type |
|---|---|
| Stock (SA) | number |
| Reorder Point | number |
| Stock Limit | number |
| On Order | number |

## Cost
| Field | Type |
|---|---|
| Unit Cost (₱) | number |
| Avg. Unit Cost (₱) | number |
| Acquisition Cost (₱) | number |
| Markup (Retail) (₱) | number |
| Markup (Wholesale) (₱) | number |

## Promotion
| Field | Type | Notes |
|---|---|---|
| Promo Price (Retail) (₱) | number | |
| Promo Price (Wholesale) (₱) | number | |
| Promo Cost (₱) | number | |
| Date From | date | native `<input type="date">` |
| Time From | time | native `<input type="time" step={1}>` |
| Date To | date | native `<input type="date">` |
| Time To | time | native `<input type="time" step={1}>` |

## Supplier & Codes
| Field | Type |
|---|---|
| Supplier Code | text |
| Tax Code | text |
| GL Code | text |
| Inv. Code | text |
| Price Type | text |
| Barcode Type | text |

## Quantities & Misc
| Field | Type |
|---|---|
| Qty 1–4 | number |
| Min. Wholesale Qty | number |
| Slow Factor | number |
| Fast Factor | number |
| Planner ID | text |
| Buyer ID | text |
| Print To | text |
| Picture File | text |
| Info 1 | text |
| Info 2 | text |

## Flags
- Active
- Track Inventory
- With Serial
- Generic
- Measured
- With Alias
- Expiry Date
- Lot Number
- Auto Conversion
- Promo Allowed

## Actions
- **Cancel** — closes the dialog without saving (also triggered by backdrop click / `Esc`)
- **Add Product / Save Changes** — calls `onSave(form)`, shows a spinner while `isSaving`

## Props

| Prop | Type | Notes |
|---|---|---|
| `open` | `boolean` | controls visibility |
| `onClose` | `() => void` | called on Cancel, backdrop click, or `Esc` |
| `onSave` | `(data: ProductFormData) => void \| Promise<void>` | called on submit |
| `editingProduct` | `Partial<ProductFormData> \| null` | `null`/omitted → Add mode; populated → Edit mode |
| `isSaving` | `boolean` | shows spinner, disables buttons |
| `catOptions` | `{ value, label, subCategories: { value, label }[] }[]` | drives Category/Sub-Category selects |

## API (insert / update)

`onSave` is expected to call the following from [lib/api/products.ts](../lib/api/products.ts):

| Mode | Function | Request |
|---|---|---|
| Add Product (insert) | `createProduct(data, token)` | `POST /api/v1/products/` |
| Edit Product | `updateProduct(id, data, token)` | `PATCH /api/v1/products/{id}/` |

Both accept a `Partial<ProductWritePayload>` — `Product` minus server-managed fields (`id`, `total_stock`, `is_below_rop`, `is_on_promo`, `createdby`, `createddate`, `updatedby`, `updateddate`, `stock_book_sa`, `stock_book_sr`, `beg_balance_sa`, `beg_balance_sr`, `beg_cost`).
