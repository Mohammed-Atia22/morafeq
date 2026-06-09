export function Step3Rules({
  sectionTitleStyles,
  fieldStyles,
  register,
  errors,
  getValues,
  selectedLocation,
  setCurrentStep,
  isSubmittingListing,
}) {
  return (
<div>
                <div style={sectionTitleStyles}>
                  <div>
                    <h2
                      style={{ margin: 0, fontSize: "20px", color: "#12213f" }}
                    >
                      قواعد السكن والموقع
                    </h2>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#4b5563",
                        fontSize: "14px",
                      }}
                    >
                      اضبط شروط السكن ثم تأكد العنوان النهائي قبل النشر.
                    </p>
                  </div>
                </div>

                <div
                  style={{ display: "grid", gap: "14px", marginBottom: "12px" }}
                >
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      color: "#344050",
                    }}
                  >
                    عنوان الشقة
                    <input
                      style={fieldStyles}
                      placeholder="مثال: شقة في التحرير"
                      {...register("title", { required: "العنوان مطلوب" })}
                    />
                    {errors.title && (
                      <span style={{ color: "#dc2626" }}>
                        {errors.title.message}
                      </span>
                    )}
                  </label>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                  }}
                >
                  <span
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "#eef2ff",
                      color: "#4338ca",
                      fontSize: "13px",
                    }}
                  >
                    ممنوع التدخين
                  </span>
                  <span
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "#eef2ff",
                      color: "#4338ca",
                      fontSize: "13px",
                    }}
                  >
                    {getValues("genderPreference") === "MALE"
                      ? "دخول الرجال فقط"
                      : getValues("genderPreference") === "FEMALE"
                        ? "دخول النساء فقط"
                        : "أي جنس"}
                  </span>
                  <span
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "#eef2ff",
                      color: "#4338ca",
                      fontSize: "13px",
                    }}
                  >
                    أطفال مسموح
                  </span>
                </div>

                <div
                  style={{ display: "grid", gap: "14px", marginBottom: "22px" }}
                >
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
                      رقم العمارة
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 15"
                        {...register("buildingNumber", {
                          required: "رقم العمارة مطلوب",
                        })}
                      />
                      {errors.buildingNumber && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.buildingNumber.message}
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
                      رقم الطابق
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 3"
                        {...register("floorNumber", {
                          required: "رقم الطابق مطلوب",
                        })}
                      />
                      {errors.floorNumber && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.floorNumber.message}
                        </span>
                      )}
                    </label>
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
                      رقم الشقة
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 5"
                        {...register("apartmentNumber", {
                          required: "رقم الشقة مطلوب",
                        })}
                      />
                      {errors.apartmentNumber && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.apartmentNumber.message}
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
                      معلم قريب
                      <input
                        style={fieldStyles}
                        placeholder="مثال: أمام مول"
                        {...register("nearbyLandmark", {
                          required: "المعلم مطلوب",
                        })}
                      />
                      {errors.nearbyLandmark && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.nearbyLandmark.message}
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "18px",
                    border: "1px dashed #cbd5e1",
                    minHeight: "220px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8fafc",
                  }}
                >
                  {selectedLocation ? (
                    <div style={{ textAlign: "center", color: "#475569" }}>
                      <p
                        style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}
                      >
                        تم تحديد موقع الشقة
                      </p>
                      <p style={{ margin: "10px 0 0" }}>
                        احداثيات: {selectedLocation.lat.toFixed(6)},{" "}
                        {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", color: "#64748b" }}>
                      <p
                        style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}
                      >
                        اضغط لتحديد موقع الشقة
                      </p>
                      <p style={{ margin: "8px 0 0" }}>
                        تأكد من تأكيد الموقع في الخطوة الأولى
                      </p>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
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
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingListing}
                    style={{
                      flex: "1 1 220px",
                      minHeight: "46px",
                      border: "none",
                      borderRadius: "12px",
                      background: "#10b981",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {isSubmittingListing ? "جاري النشر..." : "نشر الشقة الآن"}
                  </button>
                </div>
              </div>
  );
}
