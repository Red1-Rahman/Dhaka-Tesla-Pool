// Predefined Dhaka zones, per docs/specs.md. Deliberately not backed by a
// real map API, see Section 4 of the brief: "do not spend the challenge
// fighting map APIs." Lat/lng values are approximate zone centroids,
// precise enough for haversine distance estimates, not for turn-by-turn
// routing.

export interface Zone {
  name: string;
  lat: number;
  lng: number;
  // Zones a rider from this zone can realistically be pooled with.
  adjacentTo: string[];
}

export const ZONES: Record<string, Zone> = {
  Banani: { name: 'Banani', lat: 23.7937, lng: 90.4066, adjacentTo: ['Gulshan', 'Mohakhali'] },
  Gulshan: { name: 'Gulshan', lat: 23.7925, lng: 90.4078, adjacentTo: ['Banani', 'Mohakhali', 'Bashundhara'] },
  Mohakhali: { name: 'Mohakhali', lat: 23.7806, lng: 90.4074, adjacentTo: ['Banani', 'Gulshan', 'Farmgate'] },
  Dhanmondi: { name: 'Dhanmondi', lat: 23.7461, lng: 90.3742, adjacentTo: ['Farmgate', 'Mirpur'] },
  Mirpur: { name: 'Mirpur', lat: 23.8223, lng: 90.3654, adjacentTo: ['Dhanmondi', 'Uttara'] },
  Uttara: { name: 'Uttara', lat: 23.8759, lng: 90.3795, adjacentTo: ['Mirpur'] },
  Farmgate: { name: 'Farmgate', lat: 23.7580, lng: 90.3897, adjacentTo: ['Mohakhali', 'Dhanmondi'] },
  Bashundhara: { name: 'Bashundhara', lat: 23.8146, lng: 90.4344, adjacentTo: ['Gulshan'] },
};

export const ZONE_NAMES = Object.keys(ZONES);
