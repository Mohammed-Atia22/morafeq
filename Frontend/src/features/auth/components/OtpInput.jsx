import { useEffect, useRef } from "react";

const OTP_LENGTH = 6;

const toDigits = (value) => String(value || "").replace(/\D/g, "").slice(0, OTP_LENGTH);

export function OtpInput({ value = "", onChange, onBlur, disabled = false }) {
  const refs = useRef([]);
  const digits = toDigits(value).padEnd(OTP_LENGTH, " ").split("");

  useEffect(() => {
    refs.current = refs.current.slice(0, OTP_LENGTH);
  }, []);

  const updateDigit = (index, nextDigit) => {
    const next = toDigits(value).padEnd(OTP_LENGTH, " ").split("");
    next[index] = nextDigit;
    onChange?.(next.join("").replace(/\s/g, ""));
  };

  const handleChange = (index, event) => {
    const nextValue = toDigits(event.target.value);

    if (nextValue.length > 1) {
      onChange?.(nextValue);
      refs.current[Math.min(nextValue.length, OTP_LENGTH) - 1]?.focus();
      return;
    }

    updateDigit(index, nextValue);

    if (nextValue && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index].trim() && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = toDigits(event.clipboardData.getData("text"));
    onChange?.(pasted);
    refs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <div dir="ltr" className="flex w-full justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digits[index].trim()}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`رقم ${index + 1} من رمز التحقق`}
          onBlur={onBlur}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-14 w-12 rounded-2xl border border-slate-200 bg-white text-center text-xl font-black text-slate-900 shadow-sm outline-none transition focus:border-[#075ed8] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 sm:h-16 sm:w-14"
        />
      ))}
    </div>
  );
}
