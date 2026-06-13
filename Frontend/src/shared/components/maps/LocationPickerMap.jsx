import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterMap({ position }) {
  const map = useMap();

  map.setView([position.lat, position.lng], 15);

  return null;
}

function ClickToMoveMarker({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

export default function LocationPickerMap({
  position,
  onChange,
  height = "360px",
}) {
  if (!position) return null;

  return (
    <div className="flex flex-col" style={{ height }}>
      <div className="mb-3 text-sm text-slate-600">
        الموقع تقريبي. حرّك العلامة أو اضغط على الخريطة لتحديد مكان العقار بدقة.
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          className="h-full w-full"
          style={{ height: "100%" }}
        >
          <RecenterMap position={position} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker
            position={[position.lat, position.lng]}
            icon={markerIcon}
            draggable={true}
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target;
                const newPosition = marker.getLatLng();

                onChange({
                  lat: newPosition.lat,
                  lng: newPosition.lng,
                });
              },
            }}
          />

          <ClickToMoveMarker onChange={onChange} />
        </MapContainer>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        الموقع المحدد: {position.lat}, {position.lng}
      </p>
    </div>
  );
}
