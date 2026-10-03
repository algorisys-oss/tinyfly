/**
 * Major world cities, for picking places without looking up coordinates.
 * Longitude and latitude in degrees (city centres, to about 1 km).
 */
export interface City {
  name: string
  country: string
  lon: number
  lat: number
}

const city = (name: string, country: string, lat: number, lon: number): City => ({ name, country, lon, lat })

export const WORLD_CITIES: City[] = [
  // South Asia
  city('Delhi', 'India', 28.61, 77.21),
  city('Mumbai', 'India', 19.08, 72.88),
  city('Kolkata', 'India', 22.57, 88.36),
  city('Chennai', 'India', 13.08, 80.27),
  city('Bengaluru', 'India', 12.97, 77.59),
  city('Hyderabad', 'India', 17.39, 78.49),
  city('Ahmedabad', 'India', 23.02, 72.57),
  city('Pune', 'India', 18.52, 73.86),
  city('Jaipur', 'India', 26.91, 75.79),
  city('Lucknow', 'India', 26.85, 80.95),
  city('Varanasi', 'India', 25.32, 82.97),
  city('Kathmandu', 'Nepal', 27.72, 85.32),
  city('Dhaka', 'Bangladesh', 23.81, 90.41),
  city('Karachi', 'Pakistan', 24.86, 67.01),
  city('Lahore', 'Pakistan', 31.55, 74.34),
  city('Islamabad', 'Pakistan', 33.68, 73.05),
  city('Colombo', 'Sri Lanka', 6.93, 79.86),
  city('Kabul', 'Afghanistan', 34.56, 69.21),
  // Middle East and Africa
  city('Tehran', 'Iran', 35.69, 51.39),
  city('Dubai', 'United Arab Emirates', 25.2, 55.27),
  city('Riyadh', 'Saudi Arabia', 24.71, 46.68),
  city('Doha', 'Qatar', 25.29, 51.53),
  city('Istanbul', 'Türkiye', 41.01, 28.98),
  city('Cairo', 'Egypt', 30.04, 31.24),
  city('Nairobi', 'Kenya', -1.29, 36.82),
  city('Addis Ababa', 'Ethiopia', 9.03, 38.74),
  city('Lagos', 'Nigeria', 6.52, 3.38),
  city('Accra', 'Ghana', 5.6, -0.19),
  city('Casablanca', 'Morocco', 33.57, -7.59),
  city('Johannesburg', 'South Africa', -26.2, 28.05),
  city('Cape Town', 'South Africa', -33.92, 18.42),
  // Europe
  city('London', 'United Kingdom', 51.51, -0.13),
  city('Paris', 'France', 48.86, 2.35),
  city('Berlin', 'Germany', 52.52, 13.4),
  city('Madrid', 'Spain', 40.42, -3.7),
  city('Rome', 'Italy', 41.9, 12.5),
  city('Amsterdam', 'Netherlands', 52.37, 4.9),
  city('Zurich', 'Switzerland', 47.38, 8.54),
  city('Vienna', 'Austria', 48.21, 16.37),
  city('Warsaw', 'Poland', 52.23, 21.01),
  city('Stockholm', 'Sweden', 59.33, 18.07),
  city('Dublin', 'Ireland', 53.35, -6.26),
  city('Lisbon', 'Portugal', 38.72, -9.14),
  city('Athens', 'Greece', 37.98, 23.73),
  city('Moscow', 'Russia', 55.76, 37.62),
  city('Reykjavík', 'Iceland', 64.15, -21.94),
  // The Americas
  city('New York', 'United States', 40.71, -74.01),
  city('Washington', 'United States', 38.91, -77.04),
  city('Chicago', 'United States', 41.88, -87.63),
  city('Los Angeles', 'United States', 34.05, -118.24),
  city('San Francisco', 'United States', 37.77, -122.42),
  city('Honolulu', 'United States', 21.31, -157.86),
  city('Toronto', 'Canada', 43.65, -79.38),
  city('Vancouver', 'Canada', 49.28, -123.12),
  city('Mexico City', 'Mexico', 19.43, -99.13),
  city('Havana', 'Cuba', 23.11, -82.37),
  city('Bogotá', 'Colombia', 4.71, -74.07),
  city('Lima', 'Peru', -12.05, -77.04),
  city('Santiago', 'Chile', -33.45, -70.67),
  city('Buenos Aires', 'Argentina', -34.6, -58.38),
  city('São Paulo', 'Brazil', -23.55, -46.63),
  city('Rio de Janeiro', 'Brazil', -22.91, -43.17),
  // East and Southeast Asia, Oceania
  city('Beijing', 'China', 39.9, 116.41),
  city('Shanghai', 'China', 31.23, 121.47),
  city('Hong Kong', 'China', 22.32, 114.17),
  city('Tokyo', 'Japan', 35.68, 139.69),
  city('Seoul', 'South Korea', 37.57, 126.98),
  city('Bangkok', 'Thailand', 13.76, 100.5),
  city('Hanoi', 'Vietnam', 21.03, 105.85),
  city('Ho Chi Minh City', 'Vietnam', 10.82, 106.63),
  city('Singapore', 'Singapore', 1.35, 103.82),
  city('Kuala Lumpur', 'Malaysia', 3.14, 101.69),
  city('Jakarta', 'Indonesia', -6.21, 106.85),
  city('Manila', 'Philippines', 14.6, 120.98),
  city('Sydney', 'Australia', -33.87, 151.21),
  city('Melbourne', 'Australia', -37.81, 144.96),
  city('Auckland', 'New Zealand', -36.85, 174.76),
]

/** A city by name (case-insensitive). */
export function findCity(name: string): City | undefined {
  const key = name.trim().toLowerCase()
  return WORLD_CITIES.find((c) => c.name.toLowerCase() === key)
}
