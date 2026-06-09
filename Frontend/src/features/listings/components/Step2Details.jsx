import { AmenitiesSelector } from "./AmenitiesSelector";
import { PhotoUploader } from "./PhotoUploader";
export function Step2Details({
  sectionTitleStyles,
  fieldStyles,
  register,
  errors,
  selectedPhotos,
  handlePhotoChange,
  removeSelectedPhoto,
  amenityOptions,
  selectedAmenities,
  toggleAmenity,
  setCurrentStep,
  goToStep3,
}) {
  return (
<div>
                <div style={sectionTitleStyles}>
                  <div>
                    <h2
                      style={{ margin: 0, fontSize: "20px", color: "#12213f" }}
                    >
                      تفاصيل الشقة
                    </h2>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#4b5563",
                        fontSize: "14px",
                      }}
                    >
                      اكمل بيانات الشقة والتجهيزات المطلوبة مثل الإيجار
                      والمساحة.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "14px" }}>
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
                      سعر الإيجار الشهري (ج.م)
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 3500"
                        type="number"
                        {...register("monthlyRent", {
                          required: "السعر مطلوب",
                        })}
                      />
                      {errors.monthlyRent && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.monthlyRent.message}
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
                      مبلغ التأمين
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 5000"
                        type="number"
                        {...register("depositAmount")}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
                      عدد الغرف
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 3"
                        type="number"
                        {...register("bedrooms", {
                          required: "عدد الغرف مطلوب",
                        })}
                      />
                      {errors.bedrooms && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.bedrooms.message}
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
                      عدد الحمامات
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 2"
                        type="number"
                        {...register("bathrooms", {
                          required: "عدد الحمامات مطلوب",
                        })}
                      />
                      {errors.bathrooms && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.bathrooms.message}
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
                      عدد السكان الأقصى
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 4"
                        type="number"
                        {...register("maxTenants", {
                          required: "الحد الأقصى مطلوب",
                        })}
                      />
                      {errors.maxTenants && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.maxTenants.message}
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
                      عدد الأسرة
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 3"
                        type="number"
                        {...register("beds", { required: "عدد الأسرة مطلوب" })}
                      />
                      {errors.beds && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.beds.message}
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
                      متاح من
                      <input
                        style={fieldStyles}
                        type="date"
                        {...register("availableFrom", {
                          required: "التاريخ مطلوب",
                        })}
                      />
                      {errors.availableFrom && (
                        <span style={{ color: "#dc2626" }}>
                          {errors.availableFrom.message}
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
                      نوع العقار
                      <select style={fieldStyles} {...register("propertyType")}>
                        <option value="APARTMENT">شقة</option>
                        <option value="HOUSE">منزل</option>
                        <option value="VILLA">فيلا</option>
                        <option value="STUDIO">ستوديو</option>
                        <option value="OTHER">آخر</option>
                      </select>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        color: "#344050",
                      }}
                    >
                      نوع الوحدة
                      <select style={fieldStyles} {...register("roomType")}>
                        <option value="ENTIRE_PLACE">الوحدة كاملة</option>
                        <option value="PRIVATE_ROOM">غرفة خاصة</option>
                        <option value="SHARED_ROOM">غرفة مشتركة</option>
                      </select>
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
                      تفضيل الجنس
                      <select
                        style={fieldStyles}
                        {...register("genderPreference")}
                      >
                        <option value="ANY">أي</option>
                        <option value="MALE">للرجال فقط</option>
                        <option value="FEMALE">للنساء فقط</option>
                      </select>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        color: "#344050",
                      }}
                    >
                      التدخين
                      <select
                        style={fieldStyles}
                        {...register("smokingPolicy")}
                      >
                        <option value="NOT_ALLOWED">ممنوع</option>
                        <option value="ALLOWED">مسموح</option>
                      </select>
                    </label>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      color: "#344050",
                    }}
                  >
                    وصف الشقة
                    <textarea
                      style={{
                        ...fieldStyles,
                        minHeight: "120px",
                        resize: "vertical",
                      }}
                      placeholder="اكتب وصفًا مختصرًا للشقة"
                      {...register("description", { required: "الوصف مطلوب" })}
                    />
                    {errors.description && (
                      <span style={{ color: "#dc2626" }}>
                        {errors.description.message}
                      </span>
                    )}
                  </label>
                </div>

                <div
                  style={{
                    marginTop: "18px",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "13px",
                    }}
                  >
                    ممنوع التدخين
                  </span>
                  <span
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "13px",
                    }}
                  >
                    الإنترنت مش شامل
                  </span>
                  <span
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "13px",
                    }}
                  >
                    مفروش
                  </span>
                  <span
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontSize: "13px",
                    }}
                  >
                    تكييف
                  </span>
                </div>

                <PhotoUploader
                  fieldStyles={fieldStyles}
                  selectedPhotos={selectedPhotos}
                  handlePhotoChange={handlePhotoChange}
                  removeSelectedPhoto={removeSelectedPhoto}
                />

                <AmenitiesSelector
                  amenityOptions={amenityOptions}
                  selectedAmenities={selectedAmenities}
                  toggleAmenity={toggleAmenity}
                />

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
                    onClick={() => setCurrentStep(1)}
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
                    type="button"
                    onClick={goToStep3}
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
                    التالي
                  </button>
                </div>
              </div>
  );
}
