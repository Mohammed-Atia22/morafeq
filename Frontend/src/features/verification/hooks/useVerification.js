import { useCallback, useEffect, useState } from "react";
import { verificationApi } from "../services/verificationApi";

const EMPTY_VERIFICATION = {
  status: "NOT_STARTED",
  rejectionReason: null,
};

export function useVerification({ autoLoad = true, onSubmitted } = {}) {
  const [verification, setVerification] = useState(EMPTY_VERIFICATION);
  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadVerification = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await verificationApi.getMine();
      setVerification(data ?? EMPTY_VERIFICATION);
      return data;
    } catch (err) {
      setError(err.message || "تعذر تحميل حالة التوثيق");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    loadVerification();
  }, [autoLoad, loadVerification]);

  const submitDocuments = useCallback(
    async (payload) => {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      try {
        const result = await verificationApi.submitDocuments(payload);
        setVerification(result?.verification ?? EMPTY_VERIFICATION);
        setSuccessMsg("تم إرسال مستندات التوثيق للمراجعة");
        onSubmitted?.(result);
        return result;
      } catch (err) {
        setError(err.message || "تعذر إرسال مستندات التوثيق");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmitted],
  );

  return {
    verification,
    status: verification?.status ?? "NOT_STARTED",
    loading,
    submitting,
    error,
    successMsg,
    loadVerification,
    submitDocuments,
    clearMessages: () => {
      setError(null);
      setSuccessMsg(null);
    },
  };
}
