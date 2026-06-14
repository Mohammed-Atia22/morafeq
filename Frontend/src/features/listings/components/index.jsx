import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "../../../shared/services/api";
import { Step1Location } from "./Step1Location";
import { Step2Details } from "./Step2Details";
import { Step3Rules } from "./Step3Rules";
import { useAuth } from "../../auth/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";
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

    const response = await fetch(`${API_URL}/listings/${listingId}/photos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: photoData,
    });

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

    const response = await fetch(`${API_URL}/listings/${listingId}/amenities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amenities: selectedAmenities }),
    });

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
              <Step1Location
                sectionTitleStyles={sectionTitleStyles}
                fieldStyles={fieldStyles}
                register={register}
                errors={errors}
                findOnMap={findOnMap}
                isFindingLocation={isFindingLocation}
                goToStep2={goToStep2}
                mapResult={mapResult}
                selectedLocation={selectedLocation}
                handleMapChange={handleMapChange}
                confirmedLocation={confirmedLocation}
                confirmLocation={confirmLocation}
              />
            )}

            {currentStep === 2 && (
              <Step2Details
                sectionTitleStyles={sectionTitleStyles}
                fieldStyles={fieldStyles}
                register={register}
                errors={errors}
                selectedPhotos={selectedPhotos}
                handlePhotoChange={handlePhotoChange}
                removeSelectedPhoto={removeSelectedPhoto}
                amenityOptions={AMENITY_OPTIONS}
                selectedAmenities={selectedAmenities}
                toggleAmenity={toggleAmenity}
                setCurrentStep={setCurrentStep}
                goToStep3={goToStep3}
              />
            )}

            {currentStep === 3 && (
              <Step3Rules
                sectionTitleStyles={sectionTitleStyles}
                fieldStyles={fieldStyles}
                register={register}
                errors={errors}
                getValues={getValues}
                selectedLocation={selectedLocation}
                setCurrentStep={setCurrentStep}
                isSubmittingListing={isSubmittingListing}
              />
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
