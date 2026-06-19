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
  roomCount = 0,
  roomType = "PRIVATE_ROOM",
  selectedRoomPhotos = {},
  handleRoomPhotoChange,
  removeSelectedRoomPhoto,
  amenityOptions,
  selectedAmenities,
  toggleAmenity,
  setCurrentStep,
  goToStep3,
}) {
  const nonNegativeNumberProps = {
    type: "number",
    min: "0",
    onKeyDown: (event) => {
      if (event.key === "-") {
        event.preventDefault();
      }
    },
    onInput: (event) => {
      if (Number(event.currentTarget.value) < 0) {
        event.currentTarget.value = "";
      }
    },
  };

  const nonNegativeRule = {
    value: 0,
    message: "لا يمكن إدخال قيمة سالبة",
  };

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
                        {...nonNegativeNumberProps}
                        {...register("monthlyRent", {
                          required: "السعر مطلوب",
                          min: nonNegativeRule,
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
                        {...nonNegativeNumberProps}
                        {...register("depositAmount", {
                          min: nonNegativeRule,
                        })}
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
                        {...nonNegativeNumberProps}
                        {...register("bedrooms", {
                          required: "عدد الغرف مطلوب",
                          min: nonNegativeRule,
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
                        {...nonNegativeNumberProps}
                        {...register("bathrooms", {
                          required: "عدد الحمامات مطلوب",
                          min: nonNegativeRule,
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
                        {...nonNegativeNumberProps}
                        {...register("maxTenants", {
                          required: "الحد الأقصى مطلوب",
                          min: nonNegativeRule,
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
                     عدد السراير
                      <input
                        style={fieldStyles}
                        placeholder="مثال: 3"
                        {...nonNegativeNumberProps}
                        {...register("beds", {
                          required: "عدد السراير مطلوب",
                          min: nonNegativeRule,
                        })}
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

     

                <PhotoUploader
                  fieldStyles={fieldStyles}
                  selectedPhotos={selectedPhotos}
                  handlePhotoChange={handlePhotoChange}
                  removeSelectedPhoto={removeSelectedPhoto}
                  required
                />

                {roomCount > 0 && roomType !== "ENTIRE_PLACE" && (
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
                        تفاصيل الغرف
                      </h3>
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: "#64748b",
                          fontSize: "13px",
                        }}
                      >
                        يتم إنشاء الغرف تلقائيا حسب عدد الغرف. أضف اسم كل غرفة وسعتها وصورها.
                      </p>
                    </div>

                    <div style={{ display: "grid", gap: "14px" }}>
                      {Array.from({ length: roomCount }).map((_, roomIndex) => {
                        const photos = selectedRoomPhotos[roomIndex] || [];

                        return (
                          <div
                            key={roomIndex}
                            style={{
                              padding: "14px",
                              borderRadius: "14px",
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                            }}
                          >
                            <h4
                              style={{
                                margin: "0 0 12px",
                                color: "#12213f",
                                fontSize: "15px",
                              }}
                            >
                              غرفة {roomIndex + 1}
                            </h4>

                            <input
                              type="hidden"
                              value={roomIndex + 1}
                              {...register(`rooms.${roomIndex}.roomNumber`)}
                            />

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                gap: "12px",
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
                                اسم الغرفة
                                <input
                                  style={fieldStyles}
                                  placeholder={`مثال: غرفة ${roomIndex + 1}`}
                                  {...register(`rooms.${roomIndex}.roomName`, {
                                    required: "اسم الغرفة مطلوب",
                                  })}
                                />
                                {errors.rooms?.[roomIndex]?.roomName && (
                                  <span style={{ color: "#dc2626" }}>
                                    {errors.rooms[roomIndex].roomName.message}
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
                                السعة
                                <input
                                  style={fieldStyles}
                                  placeholder="مثال: 2"
                                  {...nonNegativeNumberProps}
                                  {...register(`rooms.${roomIndex}.capacity`, {
                                    required: "سعة الغرفة مطلوبة",
                                    min: { value: 1, message: "السعة يجب أن تكون 1 على الأقل" },
                                  })}
                                />
                                {errors.rooms?.[roomIndex]?.capacity && (
                                  <span style={{ color: "#dc2626" }}>
                                    {errors.rooms[roomIndex].capacity.message}
                                  </span>
                                )}
                              </label>
                            </div>

                            <label
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                color: "#344050",
                                marginTop: "12px",
                              }}
                            >
                              صور الغرفة
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(event) =>
                                  handleRoomPhotoChange?.(roomIndex, event)
                                }
                                style={fieldStyles}
                              />
                            </label>

                            {photos.length > 0 && (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                                  gap: "10px",
                                  marginTop: "12px",
                                }}
                              >
                                {photos.map((photo, photoIndex) => (
                                  <div
                                    key={`${photo.name}-${photo.lastModified}`}
                                    style={{
                                      border: "1px solid #e2e8f0",
                                      borderRadius: "12px",
                                      overflow: "hidden",
                                      background: "#fff",
                                    }}
                                  >
                                    <img
                                      src={URL.createObjectURL(photo)}
                                      alt={photo.name}
                                      style={{
                                        width: "100%",
                                        height: "82px",
                                        objectFit: "cover",
                                        display: "block",
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeSelectedRoomPhoto?.(
                                          roomIndex,
                                          photoIndex,
                                        )
                                      }
                                      style={{
                                        width: "100%",
                                        border: "none",
                                        background: "#fee2e2",
                                        color: "#b91c1c",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                        padding: "8px",
                                      }}
                                    >
                                      حذف الصورة
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
