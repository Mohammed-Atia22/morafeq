import { useState } from "react";
import { useForm } from "react-hook-form";
import LocationPickerMap from "../components/location/LocationPickerMap";
import { apiRequest } from "../services/api";
import { useAuth } from "../features/auth/hooks/useAuth";

const API_BASE_URL = "http://localhost:3001/api/v1";
const AMENITY_OPTIONS = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "kitchen", label: "Kitchen" },
  { key: "parking", label: "Parking" },
  { key: "air_conditioning", label: "Air conditioning" },
  { key: "washing_machine", label: "Washing machine" },
  { key: "workspace", label: "Workspace" },
];

export function AddListingForm({ embedded = false, onCreated }) {
  const { user, token, completeGoogleLogin } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const [mapResult, setMapResult] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      // Step 1 - map address
      governorate: "",
      city: "",
      areaName: "",
      streetName: "",
      country: "Egypt",

      lat: "",
      lng: "",
      googleFormattedAddress: "",
      googlePlaceId: "",

      // Step 2 - detailed address
      buildingNumber: "",
      floorNumber: "",
      apartmentNumber: "",
      nearbyLandmark: "",

      // Step 3 - listing details
      title: "",
      description: "",
      propertyType: "APARTMENT",
      roomType: "PRIVATE_ROOM",

      monthlyRent: "",
      depositAmount: "",

      maxTenants: "",
      bedrooms: "",
      beds: "",
      bathrooms: "",

      availableFrom: "",

      genderPreference: "ANY",
      smokingPolicy: "NOT_ALLOWED",

      locationPrivacy: "APPROXIMATE",
      currency: "EGP",
    },
  });

  const findOnMap = async () => {
    const isStepValid = await trigger([
      "governorate",
      "city",
      "areaName",
      "streetName",
    ]);

    if (!isStepValid) return;

    try {
      setIsFindingLocation(true);
      setMapResult(null);
      setSelectedLocation(null);
      setConfirmedLocation(null);
      clearErrors("root");

      const addressData = getValues();

      const data = await apiRequest("/locations/geocode-address", {
        method: "POST",
        body: JSON.stringify({
          governorate: addressData.governorate,
          city: addressData.city,
          areaName: addressData.areaName,
          streetName: addressData.streetName,
          country: addressData.country || "Egypt",
        }),
      });

      setMapResult(data);

      const initialLocation = {
        lat: data.lat,
        lng: data.lng,
      };

      setSelectedLocation(initialLocation);

      setValue("googleFormattedAddress", data.formattedAddress);
      setValue("googlePlaceId", data.placeId);
    } catch (error) {
      console.error(error);

      setError("root", {
        message: error.message || "Something went wrong while finding location",
      });
    } finally {
      setIsFindingLocation(false);
    }
  };

  const handleMapChange = (newPosition) => {
    setSelectedLocation(newPosition);
    setConfirmedLocation(null);
  };

  const confirmLocation = () => {
    if (!selectedLocation) {
      setError("root", {
        message: "Please select location first",
      });
      return;
    }

    clearErrors("root");

    setConfirmedLocation(selectedLocation);

    setValue("lat", selectedLocation.lat);
    setValue("lng", selectedLocation.lng);

    console.log("Confirmed location:", selectedLocation);
  };

  const goToStep2 = () => {
    if (!confirmedLocation) {
      setError("root", {
        message: "Please confirm the location on the map first",
      });
      return;
    }

    clearErrors("root");
    setCurrentStep(2);
  };

  const goToStep3 = async () => {
    const isStepValid = await trigger([
      "buildingNumber",
      "floorNumber",
      "apartmentNumber",
      "nearbyLandmark",
    ]);

    if (!isStepValid) return;

    clearErrors("root");
    setCurrentStep(3);
  };

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);

    if (files.length !== validFiles.length) {
      setError("root", {
        message: "Each photo must be 5MB or less",
      });
    } else {
      clearErrors("root");
    }

    setSelectedPhotos((currentPhotos) =>
      [...currentPhotos, ...validFiles].slice(0, 10),
    );

    event.target.value = "";
  };

  const removeSelectedPhoto = (photoIndex) => {
    setSelectedPhotos((currentPhotos) =>
      currentPhotos.filter((_, index) => index !== photoIndex),
    );
  };

  const toggleAmenity = (amenityKey) => {
    setSelectedAmenities((currentAmenities) =>
      currentAmenities.includes(amenityKey)
        ? currentAmenities.filter((key) => key !== amenityKey)
        : [...currentAmenities, amenityKey],
    );
  };

  const uploadSelectedPhotos = async (listingId, token) => {
    if (selectedPhotos.length === 0) return null;

    const photoData = new FormData();
    selectedPhotos.forEach((photo) => {
      photoData.append("photos", photo);
    });

    const response = await fetch(
      `${API_BASE_URL}/listings/${listingId}/photos`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: photoData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Listing created, but photo upload failed",
      );
    }

    return response.json();
  };

  const saveSelectedAmenities = async (listingId, token) => {
    if (selectedAmenities.length === 0) return null;

    const response = await fetch(
      `${API_BASE_URL}/listings/${listingId}/amenities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amenities: selectedAmenities }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Listing created, but amenities were not saved",
      );
    }

    return response.json();
  };

  const onSubmit = async (data) => {
    if (!confirmedLocation) {
      setError("root", {
        message: "Please confirm the location on the map first",
      });
      setCurrentStep(1);
      return;
    }

    // client-side per-step validation to avoid backend 400 for missing required fields
    const step1Valid = await trigger([
      "governorate",
      "city",
      "areaName",
      "streetName",
    ]);
    if (!step1Valid) {
      setCurrentStep(1);
      return;
    }

    const step2Valid = await trigger([
      "buildingNumber",
      "floorNumber",
      "apartmentNumber",
      "nearbyLandmark",
    ]);
    if (!step2Valid) {
      setCurrentStep(2);
      return;
    }

    const step3Valid = await trigger([
      "title",
      "description",
      "monthlyRent",
      "maxTenants",
      "bedrooms",
      "beds",
      "bathrooms",
      "availableFrom",
    ]);
    if (!step3Valid) {
      setCurrentStep(3);
      return;
    }

    try {
      setIsSubmittingListing(true);
      clearErrors("root");

      if (user?.role !== "HOST" && user?.role !== "ADMIN") {
        const hostSession = await apiRequest("/users/me/become-host", {
          method: "POST",
        });

        if (hostSession?.accessToken) {
          await completeGoogleLogin(hostSession.accessToken);
        }
      }

      const finalData = {
        ...data,

        lat: confirmedLocation.lat,
        lng: confirmedLocation.lng,

        monthlyRent: Number(data.monthlyRent),
        depositAmount: Number(data.depositAmount || 0),
        maxTenants: Number(data.maxTenants),
        bedrooms: Number(data.bedrooms),
        beds: Number(data.beds),
        bathrooms: Number(data.bathrooms),

        country: data.country || "Egypt",
        currency: "EGP",
        locationPrivacy: "APPROXIMATE",
      };

      console.log("Final data sent to backend:", finalData);

      const result = await apiRequest("/listings", {
        method: "POST",
        body: JSON.stringify(finalData),
      });

      console.log("Create listing response:", result);
      console.log("Create listing response messages:", result?.message);

      if (!result || result.error) {
        const msg = result?.message;

        // If backend returned validation messages array (Nest validation), map them to form fields
        if (Array.isArray(msg)) {
          const fieldSteps = {
            1: ["governorate", "city", "areaName", "streetName"],
            2: [
              "buildingNumber",
              "floorNumber",
              "apartmentNumber",
              "nearbyLandmark",
            ],
            3: [
              "title",
              "description",
              "propertyType",
              "roomType",
              "monthlyRent",
              "depositAmount",
              "maxTenants",
              "bedrooms",
              "beds",
              "bathrooms",
              "availableFrom",
            ],
          };

          const errorFields = [];

          msg.forEach((m) => {
            // try to extract field name at start of message (e.g. "title should not be empty")
            const match = String(m).match(/^([a-zA-Z0-9_]+)/);
            if (match) {
              const field = match[1];
              errorFields.push(field);
              try {
                setError(field, { message: m });
              } catch (e) {
                // ignore if field not registered
              }
            } else {
              // fallback to root
              setError("root", { message: m });
            }
          });

          // jump to the earliest step that contains an error field
          const stepsWithErrors = [1, 2, 3].filter((s) =>
            fieldSteps[s].some((f) => errorFields.includes(f)),
          );
          if (stepsWithErrors.length)
            setCurrentStep(Math.min(...stepsWithErrors));
        } else if (typeof msg === "string") {
          setError("root", { message: msg });
        } else {
          setError("root", { message: "Failed to create listing" });
        }

        return;
      }

      const listingId = result?.listing?.id;
      const optionalWarnings = [];

      if (listingId) {
        try {
          await saveSelectedAmenities(listingId, token);
        } catch (optionalError) {
          optionalWarnings.push(optionalError.message);
        }

        try {
          await uploadSelectedPhotos(listingId, token);
        } catch (optionalError) {
          optionalWarnings.push(optionalError.message);
        }
      }

      if (optionalWarnings.length > 0) {
        setError("root", {
          message: optionalWarnings.join(". "),
        });
        alert("Listing created, but some optional details were not saved yet");
      } else {
        alert("Listing created successfully");
      }
      console.log("Created listing:", result);
      onCreated?.(result);
    } catch (error) {
      console.error(error);

      setError("root", {
        message: error.message || "Something went wrong while creating listing",
      });
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const stepTitles = [
    { number: 1, label: "الصور والتوثيق" },
    { number: 2, label: "تفاصيل الشقة" },
    { number: 3, label: "القواعد والموقع" },
  ];

  const stepHeaderStyles = {
    padding: "18px 24px",
    borderRadius: "16px",
    background: "#fff",
    boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
  };

  const fieldStyles = {
    width: "100%",
    minHeight: "44px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d8dde8",
    background: "#f8fafd",
    outline: "none",
    fontSize: "14px",
  };

  const sectionTitleStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "8px",
  };

  return (
    <div
      style={{
        padding: embedded ? 0 : "32px 16px",
        minHeight: embedded ? "auto" : "100vh",
        background: embedded ? "transparent" : "#eef4fc",
      }}
      dir="rtl"
    >
      <div style={{ maxWidth: embedded ? "100%" : "980px", margin: "0 auto" }}>
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              color: "#12213f",
            }}
          >
            إضافة شقة
          </h1>
        </div>

        <div
          style={{
            ...stepHeaderStyles,
            marginBottom: "22px",
            padding: "18px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {stepTitles.map((step) => {
              const active = step.number === currentStep;
              const completed = step.number < currentStep;
              return (
                <div
                  key={step.number}
                  style={{
                    flex: 1,
                    minWidth: "130px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      color: active
                        ? "#fff"
                        : completed
                          ? "#0b69ff"
                          : "#6b7280",
                      background: active
                        ? "#0b69ff"
                        : completed
                          ? "#dbe7ff"
                          : "#f3f4f6",
                    }}
                  >
                    {completed ? "✓" : step.number}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      الخطوة {step.number}
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: active ? "#0b69ff" : "#172033",
                      }}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...stepHeaderStyles }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {currentStep === 1 && (
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
            )}

            {currentStep === 2 && (
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
                      Optional amenities
                    </h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      Select only what applies. Leaving this empty is allowed.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    {AMENITY_OPTIONS.map((amenity) => {
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
            )}

            {currentStep === 3 && (
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
            )}

            {errors.root && (
              <p style={{ color: "#dc2626", marginTop: "16px" }}>
                {errors.root.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddListingPage() {
  return <AddListingForm />;
}
