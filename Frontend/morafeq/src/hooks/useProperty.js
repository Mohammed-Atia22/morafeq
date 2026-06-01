// src/hooks/useProperty.js
// --------------------------------------------------
// Fetches a single property by ID.
// usage: const { property, loading, error } = useProperty("prop_001");
// --------------------------------------------------

import { useState, useEffect } from "react";
import propertyService from "../services/propertyService";

const useProperty = (id) => {
  const [property, setProperty] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await propertyService.getById(id);
        if (!cancelled) setProperty(response.data);
      } catch (err) {
        if (!cancelled) setError(err.message || "فشل تحميل العقار");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProperty();
    return () => { cancelled = true; };
  }, [id]);

  return { property, loading, error };
};

export default useProperty;