import LocationPickerMap from "../../../shared/components/maps/LocationPickerMap";
export function Step1Location({
  sectionTitleStyles,
  fieldStyles,
  register,
  errors,
  findOnMap,
  isFindingLocation,
  goToStep2,
  mapResult,
  selectedLocation,
  handleMapChange,
  confirmedLocation,
  confirmLocation,
}) {
  return (
<div>
                <div style={sectionTitleStyles}>
                  <div>
                    <h2
                      style={{ margin: 0, fontSize: "20px", color: "#12213f" }}
                    >
                      الموقع والتوثيق
                    </h2>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#4b5563",
                        fontSize: "14px",
                      }}
                    >
                      اكتب بيانات المنطقة ثم اضغط بحث عن الخريطة لتحديد موقع
                      العقار بدقة.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      color: "#344050",
                    }}
                  >
                    المحافظة
                    <input
                      style={fieldStyles}
                      placeholder="مثال: الإسكندرية"
                      {...register("governorate", {
                        required: "المحافظة مطلوبة",
                      })}
                    />
                    {errors.governorate && (
                      <span style={{ color: "#dc2626" }}>
                        {errors.governorate.message}
                      </span>
                    )}
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      color: "#344050",
                    }}
                  >
                    المدينة
                    <input
                      style={fieldStyles}
                      placeholder="مثال: الإسكندرية"
                      {...register("city", {
                        required: "المدينة مطلوبة",
                      })}
                    />
                    {errors.city && (
                      <span style={{ color: "#dc2626" }}>
                        {errors.city.message}
                      </span>
                    )}
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      color: "#344050",
                    }}
                  >
                    المنطقة
                    <input
                      style={fieldStyles}
                      placeholder="مثال: سموحة"
                      {...register("areaName", {
                        required: "المنطقة مطلوبة",
                      })}
                    />
                    {errors.areaName && (
                      <span style={{ color: "#dc2626" }}>
                        {errors.areaName.message}
                      </span>
                    )}
                  </label>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      color: "#344050",
                    }}
                  >
                    اسم الشارع
                    <input
                      style={fieldStyles}
                      placeholder="مثال: شارع مصطفى كامل"
                      {...register("streetName", {
                        required: "اسم الشارع مطلوب",
                      })}
                    />
                    {errors.streetName && (
                      <span style={{ color: "#dc2626" }}>
                        {errors.streetName.message}
                      </span>
                    )}
                  </label>
                </div>

                <input type="hidden" {...register("country")} />
                <input type="hidden" {...register("lat")} />
                <input type="hidden" {...register("lng")} />
                <input type="hidden" {...register("googleFormattedAddress")} />
                <input type="hidden" {...register("googlePlaceId")} />

                <div
                  style={{
                    marginTop: "18px",
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={findOnMap}
                    disabled={isFindingLocation}
                    style={{
                      flex: "1 1 220px",
                      minHeight: "46px",
                      border: "none",
                      borderRadius: "12px",
                      background: "#0b69ff",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {isFindingLocation ? "جاري البحث..." : "بحث على الخريطة"}
                  </button>
                  <button
                    type="button"
                    onClick={goToStep2}
                    style={{
                      flex: "1 1 220px",
                      minHeight: "46px",
                      border: "1px solid #d2dce8",
                      borderRadius: "12px",
                      background: "#fff",
                      color: "#1e293b",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    التالي
                  </button>
                </div>

                {mapResult && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "18px",
                      borderRadius: "16px",
                      background: "#f8fbff",
                      border: "1px solid #d8e3f4",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "10px",
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      العنوان المقترح
                    </div>
                    <p style={{ margin: 0, color: "#334155" }}>
                      {mapResult.formattedAddress}
                    </p>
                    {mapResult.matchLevel !== "STREET" && (
                      <p style={{ margin: "10px 0 0", color: "#b45309" }}>
                        الموقع تقريبي. حرّك العلامة على الخريطة لمكان العقار
                        بدقة.
                      </p>
                    )}
                  </div>
                )}

                <div style={{ marginTop: "20px" }}>
                  {selectedLocation ? (
                    <>
                      <div
                        style={{
                          borderRadius: "16px",
                          overflow: "hidden",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        <LocationPickerMap
                          position={selectedLocation}
                          onChange={handleMapChange}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          color: "#334155",
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          <strong>الإحداثيات:</strong> {selectedLocation.lat},{" "}
                          {selectedLocation.lng}
                        </p>
                        {confirmedLocation && (
                          <p style={{ margin: 0, color: "#16a34a" }}>
                            <strong>تم تأكيد الموقع.</strong>
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={confirmLocation}
                        style={{
                          marginTop: "12px",
                          minHeight: "44px",
                          border: "none",
                          borderRadius: "12px",
                          background: "#10b981",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        تأكيد الموقع
                      </button>
                    </>
                  ) : (
                    <p style={{ margin: 0, color: "#475569" }}>
                      اضغط على بحث على الخريطة لعرض الموقع.
                    </p>
                  )}
                </div>
              </div>
  );
}
