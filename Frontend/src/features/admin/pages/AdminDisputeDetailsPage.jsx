import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { adminApi } from "../services/adminApi";
import { useAdminDisputeDetail } from "../hooks/useAdminDisputeDetail";
import {
  DisputeOverviewCard,
  DisputeBookingTimeline,
} from "../components/disputes/DisputeOverviewCard";
import { DisputePaymentBreakdown } from "../components/disputes/DisputePaymentBreakdown";
import { DisputePartyProfile } from "../components/disputes/DisputePartyProfile";
import { DisputeListingSection } from "../components/disputes/DisputeListingSection";
import { OriginalConversationEvidence } from "../../dispute-chat/components/OriginalConversationEvidence";
import { DisputePrivateChatPanel } from "../../dispute-chat/components/DisputePrivateChatPanel";
import { DisputeResolutionActions } from "../components/disputes/DisputeResolutionActions";
import { canResolveDispute } from "../components/disputes/DisputeResolutionDialog";

const TABS = [
  { id: "overview", label: "نظرة عامة" },
  { id: "guest", label: "المستأجر" },
  { id: "host", label: "المالك" },
  { id: "listing", label: "العقار" },
  { id: "evidence", label: "المحادثة الأصلية" },
  { id: "chat-guest", label: "محادثة المستأجر" },
  { id: "chat-host", label: "محادثة المالك" },
];

export default function AdminDisputeDetailsPage() {
  const { bookingId } = useParams();
  const { detail, loading, error, refresh } = useAdminDisputeDetail(bookingId);
  const [activeTab, setActiveTab] = useState("overview");
  const [guestConversationId, setGuestConversationId] = useState(null);
  const [hostConversationId, setHostConversationId] = useState(null);
  const [openingGuest, setOpeningGuest] = useState(false);
  const [openingHost, setOpeningHost] = useState(false);

  const fetchAdminMessages = useCallback(
    (conversationId, params) =>
      adminApi.getPrivateDisputeMessages(conversationId, params),
    [],
  );

  const sendAdminRestMessage = useCallback(
    (conversationId, content) =>
      adminApi.sendPrivateDisputeMessage(conversationId, content),
    [],
  );

  const closeConversation = useCallback(
    (conversationId) => adminApi.closeDisputeConversation(conversationId),
    [],
  );

  const openGuestConversation = async () => {
    setOpeningGuest(true);
    try {
      const result = await adminApi.openDisputeConversation(bookingId, "GUEST");
      setGuestConversationId(result.conversation.id);
      setActiveTab("chat-guest");
    } catch (err) {
      toast.error(err.message || "تعذر فتح محادثة المستأجر");
    } finally {
      setOpeningGuest(false);
    }
  };

  const openHostConversation = async () => {
    setOpeningHost(true);
    try {
      const result = await adminApi.openDisputeConversation(bookingId, "HOST");
      setHostConversationId(result.conversation.id);
      setActiveTab("chat-host");
    } catch (err) {
      toast.error(err.message || "تعذر فتح محادثة المالك");
    } finally {
      setOpeningHost(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1752F0] border-t-transparent" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div dir="rtl" className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error || "النزاع غير موجود"}</div>
        <Link to="/admin/disputes" className="text-sm font-bold text-[#1752F0]">
          العودة للنزاعات
        </Link>
      </div>
    );
  }

  const { booking, guest, host, listing, payment } = detail;

  return (
    <div dir="rtl" className="min-h-screen space-y-5 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <nav className="text-xs text-slate-400">
        <Link to="/admin/disputes" className="hover:text-[#1752F0]">
          النزاعات
        </Link>
        <span className="mx-1.5">/</span>
        <span className="font-semibold text-slate-600">حجز #{booking.id}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-black text-[#0f172a]">تفاصيل النزاع #{booking.id}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openGuestConversation}
            disabled={openingGuest}
            className="rounded-xl bg-[#1752F0] px-4 py-2 text-xs font-black text-white disabled:opacity-60"
          >
            {openingGuest ? "..." : "مراسلة المستأجر"}
          </button>
          <button
            type="button"
            onClick={openHostConversation}
            disabled={openingHost}
            className="rounded-xl border border-[#1752F0] px-4 py-2 text-xs font-black text-[#1752F0] disabled:opacity-60"
          >
            {openingHost ? "..." : "مراسلة المالك"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
              activeTab === tab.id
                ? "bg-[#1752F0] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          {canResolveDispute({ ...booking, payment }) && (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
              <h3 className="mb-1 text-sm font-black text-[#0f172a]">إصدار قرار النزاع</h3>
              <p className="mb-4 text-xs text-slate-500">
                اختر بين قبول استرجاع المستأجر أو رفض الشكوى وصرف المبالغ لصالح المالك
              </p>
              <DisputeResolutionActions
                dispute={{ ...booking, payment }}
                onResolved={refresh}
                layout="detail"
              />
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <DisputeOverviewCard booking={booking} listing={listing} guest={guest} host={host} />
            <DisputeBookingTimeline booking={booking} />
            <div className="xl:col-span-2">
              <DisputePaymentBreakdown payment={payment} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "guest" && (
        <DisputePartyProfile party={guest} title="ملف المستأجر" />
      )}

      {activeTab === "host" && (
        <DisputePartyProfile party={host} title="ملف المالك" />
      )}

      {activeTab === "listing" && <DisputeListingSection listing={listing} />}

      {activeTab === "evidence" && (
        <OriginalConversationEvidence bookingId={booking.id} />
      )}

      {activeTab === "chat-guest" && (
        <>
          {!guestConversationId ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">لم تُفتح محادثة المستأجر بعد</p>
              <button
                type="button"
                onClick={openGuestConversation}
                className="mt-4 rounded-xl bg-[#1752F0] px-5 py-2 text-xs font-black text-white"
              >
                فتح المحادثة
              </button>
            </div>
          ) : (
            <DisputePrivateChatPanel
              conversationId={guestConversationId}
              fetchMessages={fetchAdminMessages}
              sendRestMessage={sendAdminRestMessage}
              onCloseConversation={closeConversation}
              showCloseButton
              title="محادثة خاصة مع المستأجر"
            />
          )}
        </>
      )}

      {activeTab === "chat-host" && (
        <>
          {!hostConversationId ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">لم تُفتح محادثة المالك بعد</p>
              <button
                type="button"
                onClick={openHostConversation}
                className="mt-4 rounded-xl bg-[#1752F0] px-5 py-2 text-xs font-black text-white"
              >
                فتح المحادثة
              </button>
            </div>
          ) : (
            <DisputePrivateChatPanel
              conversationId={hostConversationId}
              fetchMessages={fetchAdminMessages}
              sendRestMessage={sendAdminRestMessage}
              onCloseConversation={closeConversation}
              showCloseButton
              title="محادثة خاصة مع المالك"
            />
          )}
        </>
      )}
    </div>
  );
}
