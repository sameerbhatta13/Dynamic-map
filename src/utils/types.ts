export interface TemplateField {
  key: string;
  label: string;
  type:
    | "text"
    | "number"
    | "date"
    | "time"
    | "image"
    | "document"
    | "place"
    | "link";
  required: boolean;
  description?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  markerIcon: string;
  fixedFields: TemplateField[];
  dynamicFields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

export interface Form {
  id: string;
  templateId: string;
  status: "created" | "ongoing" | "completed";
  data: {
    place: {
      lat: number;
      lng: number;
    };
    [key: string]: string | number | { lat: number; lng: number } | File;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocationFormData {
  place: {
    latitude: number;
    longitude: number;
  };
  status: "created" | "ongoing" | "completed";
  [key: string]:
    | string
    | number
    | File
    | { latitude: number; longitude: number }
    | null;
}

export interface GeoJSONFeatureCollection {
  type: string;
  features: Array<{
    type: string;
    properties: {
      shapeName: string;
      [key: string]: string | number | boolean;
    };
    geometry: {
      type: string;
      coordinates: number[][] | number[][][] | number[][][][];
    };
  }>;
}
