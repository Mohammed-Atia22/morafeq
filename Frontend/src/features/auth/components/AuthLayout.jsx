import Container from "../../../../images/Container.png";

export function AuthLayout({ children }) {
  return (
    <main className="relative min-h-screen bg-[#0e2a45]" dir="rtl">
      <img
        src={Container}
        alt=""
        className="fixed inset-0 h-screen w-full scale-105 object-cover"
      />
      <div className="fixed inset-0 h-screen bg-gradient-to-b from-[#0f3154]/85 via-[#12375b]/75 to-black/70" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-28 sm:px-6">
        {children}
      </section>
    </main>
  );
}
