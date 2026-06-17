export function AmenitiesSelector({
  amenityOptions,
  selectedAmenities,
  toggleAmenity,
}) {
  return (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "18px",
                    borderRadius: "16px",
                    border: "1px solid #d8dde8",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ marginBottom: "14px" }}>
                    <h3
                      style={{
                        margin: 0,
                        color: "#12213f",
                        fontSize: "17px",
                      }}
                    >
                      وسائل الراحة
                    </h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      اختر وسائل الراحة المتوفرة في الشقة.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    {amenityOptions.map((amenity) => {
                      const checked = selectedAmenities.includes(amenity.key);
                      return (
                        <button
                          key={amenity.key}
                          type="button"
                          onClick={() => toggleAmenity(amenity.key)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "999px",
                            border: checked
                              ? "1px solid #0b69ff"
                              : "1px solid #d8dde8",
                            background: checked ? "#eff6ff" : "#fff",
                            color: checked ? "#1d4ed8" : "#334155",
                            fontSize: "13px",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          {amenity.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
  );
}
