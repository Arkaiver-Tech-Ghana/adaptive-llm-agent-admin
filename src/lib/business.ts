// The two Businesses are fixed by project design (adaptive-llm-agent's
// CLAUDE.md "Resolved decisions"): KampusCrave (food ordering, menu items)
// and the hotel (booking, rooms). Staff/owner accounts are scoped to
// exactly one Business, so the frontend can pick the right data-row screen
// straight from business_id without a config round-trip staff can't make
// (the config endpoint is owner-only).
export type DataRowKind = 'menu-items' | 'rooms'

const BUSINESS_DATA_ROW_KIND: Record<string, DataRowKind> = {
  kampuscrave: 'menu-items',
  hotel: 'rooms',
}

export function dataRowKindFor(businessId: string | null): DataRowKind | null {
  if (!businessId) return null
  return BUSINESS_DATA_ROW_KIND[businessId] ?? null
}
