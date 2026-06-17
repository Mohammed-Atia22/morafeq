import { useState, useCallback } from "react";
import { locationsApi } from "../../../shared/services/locationsApi";

/**
 * Manages the destination search flow:
 * 1. User types a place name → destinationName state
 * 2. User clicks Confirm → calls /locations/search-place → sets confirmedDestination
 * 3. confirmedDestination is cleared whenever destinationName changes after confirmation
 */
export function useDestinationSearch() {
  const [destinationName, setDestinationName] = useState("");
  const [confirmedDestination, setConfirmedDestination] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  // When user types, clear any previously confirmed destination
  const handleDestinationChange = useCallback((value) => {
    setDestinationName(value);
    if (confirmedDestination) {
      setConfirmedDestination(null);
      setConfirmError(null);
    }
  }, [confirmedDestination]);

  const confirmDestination = useCallback(
    async ({ city, governorate, country } = {}) => {
      if (!destinationName.trim()) return;

      setConfirmLoading(true);
      setConfirmError(null);

      try {
        const result = await locationsApi.searchPlace({
          q: destinationName.trim(),
          city,
          governorate,
          country,
        });

        const firstPlace = result?.places?.[0];

        if (!firstPlace) {
          setConfirmError("لم يتم العثور على هذا المكان، حاول بكتابة أوضح");
          setConfirmedDestination(null);
          return;
        }

        setConfirmedDestination({
          name: firstPlace.name,
          formattedAddress: firstPlace.formattedAddress,
          lat: firstPlace.lat,
          lng: firstPlace.lng,
        });
      } catch (err) {
        setConfirmError(err.message || "حدث خطأ أثناء البحث عن المكان");
        setConfirmedDestination(null);
      } finally {
        setConfirmLoading(false);
      }
    },
    [destinationName]
  );

  const clearDestination = useCallback(() => {
    setDestinationName("");
    setConfirmedDestination(null);
    setConfirmError(null);
  }, []);

  return {
    destinationName,
    confirmedDestination,
    confirmLoading,
    confirmError,
    handleDestinationChange,
    confirmDestination,
    clearDestination,
  };
}