export interface LatLng {
  lat: number;
  lng: number;
}

export interface FieldPolygon {
  id: string;
  name: string;
  vertices: LatLng[];
  color?: string;
}

export interface MapViewport {
  center: LatLng;
  zoom: number;
}

/**
 * MapProvider interface — Strategy pattern.
 * All map operations go through this contract.
 * Swap implementations (Leaflet, Google Maps, Mapbox) without touching UI code.
 */
export interface MapProvider {
  /** Unique identifier for this provider */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Whether this provider supports satellite imagery */
  readonly supportsSatellite: boolean;
}

/** Props passed to the map render component from a provider */
export interface MapComponentProps {
  viewport?: MapViewport;
  polygons?: FieldPolygon[];
  onPolygonClick?: (fieldId: string) => void;
  onMapClick?: (latlng: LatLng) => void;
  drawingVertices?: LatLng[];
  /** Called when a vertex marker is dragged to a new position */
  onVertexMove?: (index: number, latlng: LatLng) => void;
  /** Called when a vertex marker is right-clicked (desktop) or long-pressed (mobile) */
  onVertexDelete?: (index: number) => void;
  showSatellite?: boolean;
  className?: string;
}
