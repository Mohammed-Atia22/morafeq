import { useState } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "../../../shared/services/api";
import { listingsApi } from "../services/listingsApi";
import { Step1Location } from "./Step1Location";
import { Step2Details } from "./Step2Details";
import { Step3Rules } from "./Step3Rules";
import { AMENITY_OPTIONS } from "../../../shared/constants/amenities";
import { useAuth } from "../../auth/hooks/useAuth";
import { DraftSavedVerificationModal } from "./DraftSavedVerificationModal";

export function AddListingForm({ embedded = false, onCreated }) {
  const { user, completeGoogleLogin, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const [mapResult, setMapResult] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedRoomPhotos, setSelectedRoomPhotos] = useState({});
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [showDraftSavedModal, setShowDraftSavedModal] = useState(false);
  const [savedDraftResult, setSavedDraftResult] = useState(null);
  const [hasAttemptedStep2Submit, setHasAttemptedStep2Submit] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors, touchedFields, dirtyFields },
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
      rooms: [],

      // arrival instructions
      arrivalInstructions: "",

      availableFrom: "",

      genderPreference: "ANY",
      smokingPolicy: "NOT_ALLOWED",

      locationPrivacy: "APPROXIMATE",
      currency: "EGP",
    },
  });

  const bedroomCount = Number(watch("bedrooms") || 0);
  const roomType = watch("roomType") || "PRIVATE_ROOM";
  const isEntirePlace = roomType === "ENTIRE_PLACE";

  const [maxTenantsField, bedsField, roomsField] = watch([
    "maxTenants",
    "beds",
    "rooms",
  ]);

  const maxTenants = Number(maxTenantsField || 0);
  const beds = Number(bedsField || 0);
  const rooms = Array.isArray(roomsField) ? roomsField : [];

  const getRoomCapacityFields = () =>
    rooms.map((_, index) => `rooms.${index}.capacity`);

  const getStep2CapacityError = () => {
    if (errors.maxTenants?.message) return errors.maxTenants.message;

    if (Array.isArray(errors.rooms)) {
      for (let index = 0; index < errors.rooms.length; index += 1) {
        const roomError = errors.rooms[index];
        if (roomError?.capacity?.message) return roomError.capacity.message;
      }
    }

    return "";
  };

  const step2CapacityError = getStep2CapacityError();

  const validateStep2Capacities = () => {
    const roomCapacityFields = getRoomCapacityFields();
    const roomCapacitySum = rooms.reduce(
      (sum, room) => sum + Number(room?.capacity || 0),
      0,
    );

    const clearCapacityErrors = () => {
      clearErrors(["maxTenants", ...roomCapacityFields]);
    };

    if (maxTenants <= 0 || beds <= 0) {
      clearCapacityErrors();
      return { valid: false };
    }

    if (maxTenants !== beds) {
      setError("maxTenants", {
        type: "manual",
        message: "يجب أن يكون عدد السكان الأقصى مساوياً لعدد السراير.",
      });
      clearErrors(roomCapacityFields);
      return { valid: false };
    }

    if (!isEntirePlace && rooms.length > 0 && roomCapacitySum !== maxTenants) {
      setError("maxTenants", {
        type: "manual",
        message: "يجب أن يساوي مجموع سعات الغرف عدد السكان الأقصى.",
      });

      rooms.forEach((_, index) => {
        setError(`rooms.${index}.capacity`, {
          type: "manual",
          message: "يجب أن يساوي مجموع سعات الغرف عدد السكان الأقصى.",
        });
      });

      return { valid: false };
    }

    clearCapacityErrors();
    return { valid: true };
  };

  useEffect(() => {
    if (!hasAttemptedStep2Submit) return;

    validateStep2Capacities();
  }, [hasAttemptedStep2Submit, isEntirePlace, maxTenants, beds, rooms]);

  useEffect(() => {
    if (isEntirePlace || !Number.isFinite(bedroomCount) || bedroomCount <= 0)
      return;

    const currentRooms = getValues("rooms") || [];
    for (let index = 0; index < bedroomCount; index += 1) {
      if (!currentRooms[index]?.roomName) {
        setValue(`rooms.${index}.roomName`, `غرفة ${index + 1}`);
      }
      if (!currentRooms[index]?.capacity) {
        setValue(`rooms.${index}.capacity`, "1");
      }
      setValue(`rooms.${index}.roomNumber`, index + 1);
    }
  }, [bedroomCount, getValues, setValue, isEntirePlace]);

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
        message: error.message || "حدث خطأ أثناء تحديد الموقع",
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
        message: "يرجى اختيار الموقع أولاً",
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
        message: "يرجى تأكيد الموقع على الخريطة أولاً",
      });
      return;
    }

    clearErrors("root");
    setCurrentStep(2);
  };

  const goToStep3 = async () => {
    if (selectedPhotos.length === 0) {
      setError("root", {
        message: "صور الشقة مطلوبة",
      });
      return;
    }

    const isStepValid = await trigger([
      "buildingNumber",
      "floorNumber",
      "apartmentNumber",
      "nearbyLandmark",
    ]);

    if (!isStepValid) return;

    setHasAttemptedStep2Submit(true);

    const capacityResult = validateStep2Capacities();
    if (!capacityResult.valid) {
      return;
    }

    clearErrors("root");
    setCurrentStep(3);
  };

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);

    if (files.length !== validFiles.length) {
      setError("root", {
        message: "يجب ألا يتجاوز حجم كل صورة 5 ميجابايت",
      });
    } else {
      clearErrors("root");
    }

    if (event.target.replaceSelection) {
      setSelectedPhotos(validFiles.slice(0, 10));
    } else {
      setSelectedPhotos((currentPhotos) =>
        [...currentPhotos, ...validFiles].slice(0, 10),
      );
    }

    event.target.value = "";
  };

  const removeSelectedPhoto = (photoIndex) => {
    setSelectedPhotos((currentPhotos) =>
      currentPhotos.filter((_, index) => index !== photoIndex),
    );
  };

  const handleRoomPhotoChange = (roomIndex, event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);

    if (files.length !== validFiles.length) {
      setError("root", {
        message: "يجب ألا تتجاوز كل صورة 5 ميغابايت",
      });
    } else {
      clearErrors("root");
    }

    setSelectedRoomPhotos((current) => ({
      ...current,
      [roomIndex]: [...(current[roomIndex] || []), ...validFiles].slice(0, 10),
    }));

    event.target.value = "";
  };

  const removeSelectedRoomPhoto = (roomIndex, photoIndex) => {
    setSelectedRoomPhotos((current) => ({
      ...current,
      [roomIndex]: (current[roomIndex] || []).filter(
        (_, index) => index !== photoIndex,
      ),
    }));
  };

  const toggleAmenity = (amenityKey) => {
    setSelectedAmenities((currentAmenities) =>
      currentAmenities.includes(amenityKey)
        ? currentAmenities.filter((key) => key !== amenityKey)
        : [...currentAmenities, amenityKey],
    );
  };

  const uploadSelectedPhotos = async (listingId) => {
    if (selectedPhotos.length === 0) return null;

    return listingsApi.uploadPhotos(listingId, selectedPhotos);
  };

  const saveSelectedAmenities = async (listingId) => {
    if (selectedAmenities.length === 0) return null;

    return listingsApi.setAmenities(listingId, selectedAmenities);
  };

  const uploadSelectedRoomPhotos = async (listingId) => {
    const rooms = await listingsApi.getRooms(listingId);

    await Promise.all(
      rooms.map((room, index) => {
        const photos = selectedRoomPhotos[index] || [];
        if (photos.length === 0) return null;
        return listingsApi.uploadRoomImages(listingId, room.id, photos);
      }),
    );
  };

  const onSubmit = async (data) => {
    if (!confirmedLocation) {
      setError("root", {
        message: "يرجى تأكيد الموقع على الخريطة أولاً",
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
    if (!step2Valid || selectedPhotos.length === 0) {
      if (selectedPhotos.length === 0) {
        setError("root", {
          message: "صور الشقة مطلوبة",
        });
      }
      setCurrentStep(2);
      return;
    }

    // include dynamic room capacity fields in step3 validation
    const roomValues = getValues("rooms") || [];
    const roomCapacityFields = roomValues.map((_, i) => `rooms.${i}.capacity`);
    const step3Valid = await trigger([
      "title",
      "description",
      "monthlyRent",
      "maxTenants",
      "bedrooms",
      "beds",
      "bathrooms",
      "availableFrom",
      ...roomCapacityFields,
    ]);

    const capacityResult = validateStep2Capacities();
    if (!step3Valid || !capacityResult.valid) {
      setHasAttemptedStep2Submit(true);
      setCurrentStep(2);
      return;
    }

    try {
      setIsSubmittingListing(true);
      clearErrors("root");

      const currentUser = (await refreshUser?.()) ?? user;

      if (currentUser?.role !== "HOST" && currentUser?.role !== "ADMIN") {
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
        rooms: isEntirePlace
          ? []
          : (data.rooms || [])
              .slice(0, Number(data.bedrooms || 0))
              .map((room, index) => ({
                roomNumber: index + 1,
                roomName: room.roomName || `غرفة ${index + 1}`,
                capacity: Number(room.capacity || 1),
              })),

        country: data.country || "Egypt",
        currency: "EGP",
        locationPrivacy: "APPROXIMATE",
      };

      console.log("Final data sent to backend:", finalData);

      const result = await listingsApi.createListing(finalData);

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
          setError("root", { message: "تعذر إنشاء العقار" });
        }

        return;
      }

      const listingId = result?.listing?.id;
      const optionalWarnings = [];

      if (listingId) {
        try {
          await saveSelectedAmenities(listingId);
        } catch (optionalError) {
          optionalWarnings.push(optionalError.message);
        }

        try {
          await uploadSelectedPhotos(listingId);
        } catch (optionalError) {
          optionalWarnings.push(optionalError.message);
        }

        try {
          if (!isEntirePlace) {
            await uploadSelectedRoomPhotos(listingId);
          }
        } catch (optionalError) {
          optionalWarnings.push(optionalError.message);
        }
      }

      if (optionalWarnings.length > 0) {
        setError("root", {
          message: optionalWarnings.join(". "),
        });
        alert("تم إنشاء العقار، لكن تعذر حفظ بعض التفاصيل الاختيارية حالياً");
        onCreated?.(result);
        return;
      }

      const latestUser = (await refreshUser?.()) ?? currentUser;

      if (latestUser?.verificationStatus === "APPROVED") {
        await listingsApi.publishListing(listingId);
        alert("تم نشر العقار بنجاح");
        onCreated?.({
          ...result,
          listing: { ...result.listing, status: "ACTIVE" },
        });
        return;
      }

      setSavedDraftResult(result);
      setShowDraftSavedModal(true);
    } catch (error) {
      console.error(error);

      setError("root", {
        message: error.message || "حدث خطأ أثناء إنشاء العقار",
      });
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const stepTitles = [
    { number: 1, label: "الموقع والتوثيق" },
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
                roomCount={bedroomCount}
                roomType={roomType}
                selectedRoomPhotos={selectedRoomPhotos}
                handleRoomPhotoChange={handleRoomPhotoChange}
                removeSelectedRoomPhoto={removeSelectedRoomPhoto}
                amenityOptions={AMENITY_OPTIONS}
                selectedAmenities={selectedAmenities}
                toggleAmenity={toggleAmenity}
                setCurrentStep={setCurrentStep}
                goToStep3={goToStep3}
                step2CapacityError={step2CapacityError}
              />
            )}

            {currentStep === 3 && (
              <Step3Rules
                sectionTitleStyles={sectionTitleStyles}
                fieldStyles={fieldStyles}
                register={register}
                errors={errors}
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
      <DraftSavedVerificationModal
        open={showDraftSavedModal}
        onContinueLater={() => {
          setShowDraftSavedModal(false);
          onCreated?.(savedDraftResult);
        }}
      />
    </div>
  );
}
