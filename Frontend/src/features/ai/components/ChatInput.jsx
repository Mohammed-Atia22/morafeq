import { useState } from "react";

export function ChatInput({ onSend }) {
  const [value, setValue] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    await onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.target.form.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="ai-chat-input" className="sr-only">
        اكتب رسالتك هنا...
      </label>
      <textarea
        id="ai-chat-input"
        dir="rtl"
        rows={2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اكتب رسالتك هنا..."
        className="min-h-[72px] w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#4f5be8] focus:ring-2 focus:ring-[#4f5be8]/10"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-3xl bg-[#4f5be8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3c47d5]"
      >
        إرسال
      </button>
    </form>
  );
}
