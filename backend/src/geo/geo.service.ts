import { Injectable } from '@nestjs/common';
import { ZONES } from './zones.data';

interface LatLng {
  lat: number;
  lng: number;
}

// This is the one swap point for a real routing provider (Google Maps
// Distance Matrix, etc), see docs/architecture.md "the three swap points".
// Every caller depends only on distanceKm() and zonesCompatible(), so
// replacing the body of this class later never requires touching
// RidesService, FareService, or PoolsService.
@Injectable()
export class GeoService {
  // Straight-line distance, not real road distance, sufficient for an
  // MVP fare estimate per Section 4 of the brief.
  distanceKm(a: LatLng, b: LatLng): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(b.lat - a.lat);
    const dLng = this.toRadians(b.lng - a.lng);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);

    const h =
      sinDLat * sinDLat +
      Math.cos(this.toRadians(a.lat)) * Math.cos(this.toRadians(b.lat)) * sinDLng * sinDLng;

    const centralAngle = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
    return earthRadiusKm * centralAngle;
  }

  // Matching rule from docs/specs.md: pickup zones must be identical or
  // adjacent. Dropoff compatibility is intentionally left to the pool
  // acceptance step (feature/tesla-pooling), not this method.
  pickupZonesCompatible(zoneA: string, zoneB: string): boolean {
    if (zoneA === zoneB) {
      return true;
    }
    const zone = ZONES[zoneA];
    return zone ? zone.adjacentTo.includes(zoneB) : false;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
