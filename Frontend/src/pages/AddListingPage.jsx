import { useState } from "react";
import { useForm } from "react-hook-form";
import LocationPickerMap from "../components/location/LocationPickerMap";

const API_BASE_URL = "http://localhost:3001/api/v1";

export default function AddListingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const [mapResult, setMapResult] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [confirmedLocation, setConfirmedLocation] = useState(null);

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

      const response = await fetch(
        `${API_BASE_URL}/locations/geocode-address`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            governorate: addressData.governorate,
            city: addressData.city,
            areaName: addressData.areaName,
            streetName: addressData.streetName,
            country: addressData.country || "Egypt",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError("root", {
          message: data.message || "Could not find this address",
        });
        return;
      }

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
        message: "Something went wrong while finding location",
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

  const onSubmit = async (data) => {
    if (!confirmedLocation) {
      setError("root", {
        message: "Please confirm the location on the map first",
      });
      setCurrentStep(1);
      return;
    }

    try {
      setIsSubmittingListing(true);
      clearErrors("root");

      const token = localStorage.getItem("morafeq_access_token");

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

      const response = await fetch(`${API_BASE_URL}/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError("root", {
          message: result.message || "Failed to create listing",
        });
        return;
      }

      alert("Listing created successfully");
      console.log("Created listing:", result);
    } catch (error) {
      console.error(error);

      setError("root", {
        message: "Something went wrong while creating listing",
      });
    } finally {
      setIsSubmittingListing(false);
    }
  };

  return (
    <div style={{ maxWidth: "850px", margin: "40px auto" }}>
      <div
        style={{
          padding: "24px",
          border: "1px solid #ddd",
          borderRadius: "16px",
          background: "#fff",
        }}
      >
        <h1>Add Property</h1>

        <p>
          Step {currentStep} of 3
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && (
            <div>
              <h2>Step 1: Map Address</h2>

              <p>
                اكتب المدينة والمنطقة والشارع عشان نفتح الخريطة على مكان
                قريب، وبعدها حرّك الـ pin لمكان العقار الحقيقي.
              </p>

              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <input
                    placeholder="Governorate مثل الإسكندرية"
                    {...register("governorate", {
                      required: "Governorate is required",
                    })}
                  />
                  {errors.governorate && (
                    <p style={{ color: "red" }}>
                      {errors.governorate.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="City مثل الإسكندرية"
                    {...register("city", {
                      required: "City is required",
                    })}
                  />
                  {errors.city && (
                    <p style={{ color: "red" }}>{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Area مثل باكوس أو سموحة"
                    {...register("areaName", {
                      required: "Area is required",
                    })}
                  />
                  {errors.areaName && (
                    <p style={{ color: "red" }}>
                      {errors.areaName.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Street Name مثل شارع مصطفى كامل"
                    {...register("streetName", {
                      required: "Street name is required",
                    })}
                  />
                  {errors.streetName && (
                    <p style={{ color: "red" }}>
                      {errors.streetName.message}
                    </p>
                  )}
                </div>

                <input type="hidden" {...register("country")} />
                <input type="hidden" {...register("lat")} />
                <input type="hidden" {...register("lng")} />
                <input type="hidden" {...register("googleFormattedAddress")} />
                <input type="hidden" {...register("googlePlaceId")} />

                <button
                  type="button"
                  onClick={findOnMap}
                  disabled={isFindingLocation}
                >
                  {isFindingLocation ? "Finding location..." : "Find on Map"}
                </button>
              </div>

              {mapResult && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                >
                  <p>
                    <strong>Match Level:</strong> {mapResult.matchLevel}
                  </p>

                  <p>
                    <strong>Found Address:</strong>{" "}
                    {mapResult.formattedAddress}
                  </p>

                  {mapResult.matchLevel !== "STREET" && (
                    <p style={{ color: "orange" }}>
                      الموقع تقريبي. من فضلك حرّك العلامة على الخريطة لمكان
                      العقار بدقة.
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginTop: "24px" }}>
                {selectedLocation ? (
                  <>
                    <LocationPickerMap
                      position={selectedLocation}
                      onChange={handleMapChange}
                    />

                    <p>
                      <strong>Selected Location:</strong>{" "}
                      {selectedLocation.lat}, {selectedLocation.lng}
                    </p>

                    {confirmedLocation && (
                      <p style={{ color: "green" }}>
                        <strong>Confirmed Location:</strong>{" "}
                        {confirmedLocation.lat}, {confirmedLocation.lng}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={confirmLocation}
                      style={{ marginTop: "12px" }}
                    >
                      Confirm Location
                    </button>

                    {confirmedLocation && (
                      <p style={{ color: "green" }}>
                        Location confirmed successfully.
                      </p>
                    )}
                  </>
                ) : (
                  <p>اضغط Find on Map عشان نعرض الخريطة.</p>
                )}
              </div>

              <button
                type="button"
                onClick={goToStep2}
                style={{ marginTop: "24px" }}
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2>Step 2: Detailed Apartment Address</h2>

              <p>
                هنا اكتب التفاصيل اللي تساعد في الوصول للشقة نفسها.
              </p>

              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <input
                    placeholder="Building Number"
                    {...register("buildingNumber", {
                      required: "Building number is required",
                    })}
                  />
                  {errors.buildingNumber && (
                    <p style={{ color: "red" }}>
                      {errors.buildingNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Floor Number"
                    {...register("floorNumber", {
                      required: "Floor number is required",
                    })}
                  />
                  {errors.floorNumber && (
                    <p style={{ color: "red" }}>
                      {errors.floorNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Apartment Number"
                    {...register("apartmentNumber", {
                      required: "Apartment number is required",
                    })}
                  />
                  {errors.apartmentNumber && (
                    <p style={{ color: "red" }}>
                      {errors.apartmentNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    placeholder="Nearby Landmark"
                    {...register("nearbyLandmark", {
                      required: "Nearby landmark is required",
                    })}
                  />
                  {errors.nearbyLandmark && (
                    <p style={{ color: "red" }}>
                      {errors.nearbyLandmark.message}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setCurrentStep(1)}>
                  Back
                </button>

                <button type="button" onClick={goToStep3}>
                  Next
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2>Step 3: Property Details</h2>

              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <input
                    placeholder="Title"
                    {...register("title", {
                      required: "Title is required",
                    })}
                  />
                  {errors.title && (
                    <p style={{ color: "red" }}>{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <textarea
                    placeholder="Description"
                    {...register("description", {
                      required: "Description is required",
                    })}
                  />
                  {errors.description && (
                    <p style={{ color: "red" }}>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <select
                  {...register("propertyType", {
                    required: "Property type is required",
                  })}
                >
                  <option value="APARTMENT">Apartment</option>
                  <option value="HOUSE">House</option>
                  <option value="VILLA">Villa</option>
                  <option value="STUDIO">Studio</option>
                  <option value="OTHER">Other</option>
                </select>

                <select
                  {...register("roomType", {
                    required: "Room type is required",
                  })}
                >
                  <option value="ENTIRE_PLACE">Entire Place</option>
                  <option value="PRIVATE_ROOM">Private Room</option>
                  <option value="SHARED_ROOM">Shared Room</option>
                </select>

                <div>
                  <input
                    type="number"
                    placeholder="Monthly Rent"
                    {...register("monthlyRent", {
                      required: "Monthly rent is required",
                    })}
                  />
                  {errors.monthlyRent && (
                    <p style={{ color: "red" }}>
                      {errors.monthlyRent.message}
                    </p>
                  )}
                </div>

                <input
                  type="number"
                  placeholder="Deposit Amount"
                  {...register("depositAmount")}
                />

                <div>
                  <input
                    type="number"
                    placeholder="Max Tenants"
                    {...register("maxTenants", {
                      required: "Max tenants is required",
                    })}
                  />
                  {errors.maxTenants && (
                    <p style={{ color: "red" }}>
                      {errors.maxTenants.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="number"
                    placeholder="Bedrooms"
                    {...register("bedrooms", {
                      required: "Bedrooms is required",
                    })}
                  />
                  {errors.bedrooms && (
                    <p style={{ color: "red" }}>
                      {errors.bedrooms.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="number"
                    placeholder="Beds"
                    {...register("beds", {
                      required: "Beds is required",
                    })}
                  />
                  {errors.beds && (
                    <p style={{ color: "red" }}>{errors.beds.message}</p>
                  )}
                </div>

                <div>
                  <input
                    type="number"
                    placeholder="Bathrooms"
                    {...register("bathrooms", {
                      required: "Bathrooms is required",
                    })}
                  />
                  {errors.bathrooms && (
                    <p style={{ color: "red" }}>
                      {errors.bathrooms.message}
                    </p>
                  )}
                </div>

                <div>
                  <label>Available From</label>
                  <input
                    type="date"
                    {...register("availableFrom", {
                      required: "Available from date is required",
                    })}
                  />
                  {errors.availableFrom && (
                    <p style={{ color: "red" }}>
                      {errors.availableFrom.message}
                    </p>
                  )}
                </div>

                <select {...register("genderPreference")}>
                  <option value="ANY">Any</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>

                <select {...register("smokingPolicy")}>
                  <option value="NOT_ALLOWED">Smoking Not Allowed</option>
                  <option value="ALLOWED">Smoking Allowed</option>
                </select>
              </div>

              <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setCurrentStep(2)}>
                  Back
                </button>

                <button type="submit" disabled={isSubmittingListing}>
                  {isSubmittingListing ? "Saving..." : "Save Listing"}
                </button>
              </div>
            </div>
          )}

          {errors.root && (
            <p style={{ color: "red", marginTop: "16px" }}>
              {errors.root.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}