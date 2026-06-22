import { useEffect, useState } from "react";

export function ChatInput({ onSend, disabled = false, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = value.trim();

    if (!trimmed || disabled) {
      return;
    }

    setValue("");
    await onSend(trimmed);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.target.form.requestSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/5 transition focus-within:border-[#4f5be8] focus-within:ring-4 focus-within:ring-[#4f5be8]/10"
    >
      <label htmlFor="ai-chat-input" className="sr-only">
        اكتب رسالتك هنا
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="ai-chat-input"
          dir="rtl"
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اسأل عن سكن، ميزانية، منطقة، أو زملاء سكن متوافقين..."
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#4f5be8] text-white transition hover:bg-[#3c47d5] focus:outline-none focus:ring-2 focus:ring-[#4f5be8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
