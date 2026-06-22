import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../services/adminApi";
import { toast } from "react-hot-toast";

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getUsers({
        page,
        limit: 10,
        role,
        verificationStatus,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || "تعذر تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  }, [page, role, verificationStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const changeUserRole = async (userId, newRole) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      toast.success("تم تغيير دور المستخدم بنجاح");
      fetchUsers();
      return true;
    } catch (err) {
      toast.error(err.message || "فشل تغيير دور المستخدم");
      return false;
    }
  };

  const toggleUserActive = async (userId, isActive) => {
    try {
      await adminApi.updateUser(userId, { isActive });
      toast.success(isActive ? "تم تفعيل الحساب بنجاح" : "تم تعطيل الحساب بنجاح");
      fetchUsers();
      return true;
    } catch (err) {
      toast.error(err.message || "فشل تعديل حالة الحساب");
      return false;
    }
  };

  const deactivateUser = async (userId) => {
    try {
      await adminApi.deactivateUser(userId);
      toast.success("تم إلغاء تفعيل الحساب بنجاح");
      fetchUsers();
      return true;
    } catch (err) {
      toast.error(err.message || "فشل إلغاء تفعيل الحساب");
      return false;
    }
  };

  // Verification approvals / rejections
  const approveVerification = async (verificationId) => {
    try {
      await adminApi.approveVerification(verificationId);
      toast.success("تم توثيق الحساب بنجاح");
      fetchUsers();
      return true;
    } catch (err) {
      toast.error(err.message || "فشلت عملية التوثيق");
      return false;
    }
  };

  const rejectVerification = async (verificationId, reason) => {
    try {
      await adminApi.rejectVerification(verificationId, reason);
      toast.success("تم رفض طلب التوثيق بنجاح");
      fetchUsers();
      return true;
    } catch (err) {
      toast.error(err.message || "فشل رفض طلب التوثيق");
      return false;
    }
  };

  return {
    users,
    meta,
    loading,
    error,
    page,
    setPage,
    role,
    setRole: (newRole) => {
      setRole(newRole);
      setPage(1);
    },
    verificationStatus,
    setVerificationStatus: (newStatus) => {
      setVerificationStatus(newStatus);
      setPage(1);
    },
    changeUserRole,
    toggleUserActive,
    deactivateUser,
    approveVerification,
    rejectVerification,
    refreshUsers: fetchUsers,
  };
}
