// The 16 cities + 1 municipality that make up Metro Manila/NCR — none of them belong
// to a province, so a Province field can be safely left blank/hidden when City matches.
export const NCR_CITIES = [
  'Manila', 'Quezon City', 'Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong',
  'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'San Juan',
  'Taguig', 'Valenzuela', 'Pateros',
]

export function isMetroManila(city: string): boolean {
  return NCR_CITIES.some((c) => c.toLowerCase() === city.trim().toLowerCase())
}
