import type { AgencyDriverInfo, DriverLocation } from '../../../types';

// Haritada cizilebilen surucu: Surucu Ata ekranindaki AvailableDriver ya da Surucu Haritasindaki havuz surucusu
export interface MapDriver {
  driver: AgencyDriverInfo;
  location: DriverLocation | null;
  // Aktif isi var (Surucu Haritasi); pin "Meşgul" etiketiyle cizilir
  busy?: boolean;
}

export type LocatedDriver = MapDriver & { location: DriverLocation };

export interface MarkerGroup {
  // Uye id'leri sirali; ayni uyeler ayni anahtari uretir
  key: string;
  center: google.maps.LatLngLiteral;
  members: LocatedDriver[];
}

const EARTH_RADIUS_M = 6371000;

// Web Mercator'da verilen enlem ve zoom icin bir pikselin metre karsiligi
function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

// Kisa mesafeler icin yeterli (equirectangular yaklasim)
function distanceMeters(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): number {
  const toRad = Math.PI / 180;
  const x = (b.lng - a.lng) * toRad * Math.cos(((a.lat + b.lat) / 2) * toRad);
  const y = (b.lat - a.lat) * toRad;
  return Math.sqrt(x * x + y * y) * EARTH_RADIUS_M;
}

/**
 * Ekranda birbirine thresholdPx'ten yakin duran suruculeri gruplar (ayni is adresi, ayni garaj).
 * Backend sirasi (en yakin once) korunur; her surucu, ilk uyesine yeterince yakin olan ilk gruba girer.
 */
export function groupDrivers(drivers: MapDriver[], zoom: number, thresholdPx = 44): MarkerGroup[] {
  const groups: { anchor: google.maps.LatLngLiteral; members: LocatedDriver[] }[] = [];

  for (const item of drivers) {
    if (!item.location) continue;
    const point = { lat: item.location.latitude, lng: item.location.longitude };
    const threshold = thresholdPx * metersPerPixel(point.lat, zoom);
    const group = groups.find((g) => distanceMeters(g.anchor, point) <= threshold);
    if (group) group.members.push(item as LocatedDriver);
    else groups.push({ anchor: point, members: [item as LocatedDriver] });
  }

  return groups.map(({ members }) => ({
    key: members.map((m) => m.driver.id).sort((a, b) => a - b).join('-'),
    center: {
      lat: members.reduce((sum, m) => sum + m.location.latitude, 0) / members.length,
      lng: members.reduce((sum, m) => sum + m.location.longitude, 0) / members.length,
    },
    members,
  }));
}

/** Acik gruptaki n pinin merkeze gore piksel kaydirmalari: daire uzerinde, tepeden baslayarak. */
export function fanOffsets(n: number): { x: number; y: number }[] {
  const radius = Math.max(44, (n * 40) / (2 * Math.PI));
  return Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: Math.round(radius * Math.cos(angle)), y: Math.round(radius * Math.sin(angle)) };
  });
}
