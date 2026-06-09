export function PhotoUploader({
  fieldStyles,
  selectedPhotos,
  handlePhotoChange,
  removeSelectedPhoto,
}) {
  return (
                <div
                  style={{
                    marginTop: "22px",
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
                      Optional photos
                    </h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      You can add up to 10 photos now, or skip this until upload
                      is active.
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    style={fieldStyles}
                  />

                  {selectedPhotos.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gap: "10px",
                        marginTop: "14px",
                      }}
                    >
                      {selectedPhotos.map((photo, photoIndex) => (
                        <div
                          key={`${photo.name}-${photo.lastModified}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            padding: "10px 12px",
                            borderRadius: "12px",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <span style={{ color: "#334155", fontSize: "14px" }}>
                            {photo.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedPhoto(photoIndex)}
                            style={{
                              border: "none",
                              borderRadius: "10px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              cursor: "pointer",
                              fontWeight: 700,
                              padding: "8px 12px",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
  );
}
