import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { expatriateListingsApi } from "../features/expatriate/services/expatriateListingsApi";
import { RatingSummary } from "../features/reviews/components/RatingSummary";
import heroBackground from "../../images/for the background.jpg";
import ownerImage from "../../images/chosse onwer.png";
import studentImage from "../../images/std.png";
import personOne from "../../images/person 1.jpg";
import personTwo from "../../images/person 2.jpg";
import personThree from "../../images/person 3.jpg";
import logo from "../../images/w_logo.png";

const heroFeatures = [
  { label: "شقق موثقة", icon: ShieldIcon },
  { label: "معاينة بسهولة", icon: CalendarIcon },
  { label: "أسعار واضحة", icon: TagIcon },
  { label: "دعم على مدار الساعة", icon: HeadsetIcon },
];

const stats = [
  { value: "98%", label: "تجارب إيجابية بدون مشاكل", icon: StarIcon },
  { value: "15,000+", label: "طالب لقى سكنه مع مرافق", icon: UsersIcon },
  { value: "5,000+", label: "عقار موثق وصالح", icon: HomeIcon },
  { value: "24 / 7", label: "دعم وخدمة على مدار الساعة", icon: HeadsetIcon },
];

const testimonials = [
  {
    name: "أحمد محمد",
    university: "جامعة عين شمس",
    text: "سكنت من خلال مرافق في مدينة نصر، التجربة كانت سهلة وآمنة جدا.",
    image: personOne,
  },
  {
    name: "نورهان علي",
    university: "جامعة القاهرة",
    text: "أخيرا لقيت شقة قريبة من جامعتي وبسعر مناسب وجودة ممتازة.",
    image: personTwo,
  },
  {
    name: "محمود سامي",
    university: "جامعة 6 أكتوبر",
    text: "الدعم كان سريع جدا وساعدوني في كل خطوة.",
    image: personThree,
  },
];

const footerFeatures = [
  { label: "عقود إلكترونية آمنة", icon: LockIcon },
  { label: "عقارات موثقة", icon: ShieldIcon },
  { label: "دفع آمن 100%", icon: CardIcon },
  { label: "ذكاء اصطناعي للمساعدة", icon: BotIcon },
  { label: "دعم على مدار 24/7", icon: HeadsetIcon },
];

export function LandingPage() {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFeaturedListings = async () => {
      setFeaturedLoading(true);
      setFeaturedError("");

      try {
        const result = await expatriateListingsApi.search({
          limit: 4,
          sortBy: "newest",
        });

        if (isMounted) {
          setFeaturedListings(result.data ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setFeaturedError(
            error.message || "تعذر تحميل الشقق المميزة في الوقت الحالي.",
          );
          setFeaturedListings([]);
        }
      } finally {
        if (isMounted) {
          setFeaturedLoading(false);
        }
      }
    };

    loadFeaturedListings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="bg-[#f7f9fc] text-[#111827]">
      <section className="relative isolate overflow-hidden bg-[#0b3569] pt-[76px] text-white">
        <img
          src={heroBackground}
          alt=""
          className="absolute inset-x-0 top-[76px] h-[405px] w-full object-cover opacity-70"
        />
        <div className="absolute inset-x-0 top-[76px] h-[405px] bg-[#082f61]/75" />

        <div className="relative z-10 mx-auto flex min-h-[405px] max-w-6xl flex-col items-center justify-center px-4 pb-14 pt-10 text-center">
          <h1 className="text-[34px] font-black leading-tight sm:text-[48px]">
            اعثر على سكنك المثالي
            <span className="block text-[#67a7ff]">بالقرب من جامعتك</span>
          </h1>
          <p className="mt-4 text-lg font-semibold leading-8 text-blue-50">
            ابحث عن شقق موثقة وآمنة تناسب ميزانيتك
            <span className="block">واحجز معاينة بكل سهولة</span>
          </p>

          <div className="mt-6 flex w-full max-w-[520px] flex-col gap-3 sm:flex-row">
            <Link
              to="#listings"
              className="inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-xl border-2 border-white bg-[#075fd6] px-6 text-base font-black text-white shadow-lg shadow-blue-950/25 transition hover:bg-[#0754bd]"
            >
              ابدأ البحث الآن
              <SearchIcon className="h-6 w-6" />
            </Link>
            <a
              href="#areas"
              className="inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-xl bg-white px-6 text-base font-black text-[#123d70] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50"
            >
              استكشف المناطق
              <PinIcon className="h-6 w-6" />
            </a>
          </div>

          <div className="mt-7 grid w-full max-w-3xl grid-cols-2 gap-4 text-sm font-bold sm:grid-cols-4">
            {heroFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="flex items-center justify-center gap-2 text-blue-50"
                >
                  <Icon className="h-6 w-6 text-white" />
                  <span>{feature.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-[-1px] left-0 right-0 z-20 text-[#f7f9fc]">
          <svg
            viewBox="0 0 1440 88"
            className="block h-[70px] w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M0 28c205 47 445 63 720 47 240-14 445-43 720-75v88H0z"
            />
          </svg>
        </div>
      </section>

      <section className="px-4 pb-6 pt-5">
        <div className="mx-auto max-w-[820px]">
          <h2 className="mb-5 text-center text-2xl font-black text-[#0f2744]">
            <span className="text-slate-400">—</span> أنت هنا لتبحث عن ماذا؟{" "}
            <span className="text-slate-400">—</span>
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <RoleCard
              title="أنا صاحب عقار"
              text="أضف عقارك ووصل لآلاف الطلاب الباحثين عن سكن"
              button="أضف عقارك الآن"
              to="/owner"
              color="green"
              image={ownerImage}
            />
            <RoleCard
              title="أنا مغترب (طالب)"
              text="أبحث عن سكن مناسب بالقرب من جامعتي"
              button="ابحث عن سكن"
              to="/expatriate"
              color="blue"
              image={studentImage}
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-4">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-xl bg-[#073f86] text-white shadow-lg md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.value}
                className="flex items-center justify-center gap-4 border-white/20 px-6 py-5 md:border-l last:md:border-l-0"
              >
                <Icon className="h-9 w-9 shrink-0 text-[#ffd24a]" />
                <div>
                  <p className="text-3xl font-black leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-2 max-w-[125px] text-sm leading-6 text-blue-50">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="listings" className="px-4 py-2">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <a
              href="#listings"
              className="inline-flex items-center gap-2 text-sm font-black text-[#075fd6]"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              عرض كل الشقق
            </a>
            <h2 className="text-2xl font-black text-[#0f2744]">
              الشقق المتاحه 
            </h2>
          </div>

          {featuredLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <PropertyCardSkeleton key={index} />
              ))}
            </div>
          ) : featuredError ? (
            <ListingsState message={featuredError} />
          ) : featuredListings.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <ListingsState message="لا توجد شقق متاحة للعرض حالياً." />
          )}
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-5 text-center text-2xl font-black text-[#0f2744]">
            ماذا يقول عملاؤنا 
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <QuoteIcon className="mb-2 h-7 w-7 text-[#6ca5e8]" />
                <div className="flex items-start gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                  <p className="min-h-14 flex-1 text-sm leading-7 text-slate-700">
                    {item.text}
                  </p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="font-black text-[#10233f]">{item.name}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {item.university}
                    </p>
                  </div>
                  <div className="flex text-[#ffc531]" aria-label="5 نجوم">
                    {"★★★★★"}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-4 py-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mb-7 text-2xl font-black text-[#0f2744]">
            كيف يعمل مرافق؟
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Step
              icon={MapSearchIcon}
              title="دور على منطقتك"
              text="اختر المدينة أو الجامعة التي تريد السكن بالقرب منها"
            />
            <Step
              icon={ApartmentIcon}
              title="اختر الشقة المناسبة"
              text="تصفح الشقق المتاحة وقارن الأسعار والمزايا بسهولة."
            />
            <Step
              icon={BookingIcon}
              title="احجز أو اطلب معاينة"
              text="تواصل مع المالك مباشرة واحجز معاينة في الوقت المناسب"
            />
          </div>
          <Link
            to="#listings"
            className="mt-8 inline-flex h-12 min-w-[280px] items-center justify-center gap-3 rounded-lg bg-[#075fd6] px-8 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-[#0754bd]"
          >
            ابدأ البحث عن سكنك
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-l from-[#159B72] via-[#0F7F5E] to-[#0A5C46] px-4 py-14 text-white">
        {/* Content */}
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="mb-2 text-sm font-bold text-green-100">صاحب عقار؟</p>

          <h2 className="text-2xl font-black leading-relaxed sm:text-3xl">
            أضف عقارك ووصل لآلاف الطلاب الباحثين عن سكن
          </h2>

          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm font-bold text-green-50">
            <span className="inline-flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              إعلانات مميزة
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              تواصل مباشر مع الطلاب
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              إدارة سهلة وسريعة
            </span>
          </div>

          <Link
            to="/owner"
            className="mt-8 inline-flex h-12 items-center justify-center gap-3 rounded-lg bg-white px-8 font-black text-[#087545] shadow-lg transition hover:bg-green-50 hover:scale-[1.02]"
          >
            <PlusIcon className="h-5 w-5" />
            أضف عقارك الآن
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-bold text-slate-700">
          {footerFeatures.map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.label} className="inline-flex items-center gap-2">
                <Icon className="h-6 w-6 text-slate-700" />
                {item.label}
              </span>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function RoleCard({ title, text, button, to, color, image }) {
  const isGreen = color === "green";
  return (
    <Link
      to={to}
      className={[
        "grid min-h-[158px] grid-cols-[1fr_170px] overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md max-sm:grid-cols-1",
        isGreen
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-blue-200 bg-blue-50/80",
      ].join(" ")}
    >
      <div className="flex flex-col items-center justify-center p-5 text-center">
        <h3
          className={[
            "text-2xl font-black",
            isGreen ? "text-[#0b8b57]" : "text-[#0b56ad]",
          ].join(" ")}
        >
          {title}
        </h3>
        <p className="mt-2 max-w-[210px] text-base font-semibold leading-7 text-[#1f2937]">
          {text}
        </p>
        <span
          className={[
            "mt-4 rounded-lg px-7 py-2 text-sm font-black text-white",
            isGreen ? "bg-[#0d9a5d]" : "bg-[#075fd6]",
          ].join(" ")}
        >
          {button}
        </span>
      </div>
      <img
        src={image}
        alt=""
        className="h-full min-h-[150px] w-full object-contain object-center p-2 max-sm:hidden"
      />
    </Link>
  );
}

const roomTypeLabels = {
  ENTIRE_PLACE: "شقة كاملة",
  PRIVATE_ROOM: "غرفة خاصة",
  SHARED_ROOM: "غرفة مشتركة",
};

const propertyTypeLabels = {
  APARTMENT: "شقة",
  VILLA: "فيلا",
  STUDIO: "ستوديو",
  ROOM: "غرفة",
  DORM: "سكن طلابي",
};

function formatListingPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "السعر غير محدد";
  }

  return `${amount.toLocaleString("ar-EG")} ج.م`;
}

function PropertyCard({ listing }) {
  const coverPhoto = listing.photos?.[0]?.url;
  const roomLabel =
    roomTypeLabels[listing.roomType] ||
    propertyTypeLabels[listing.propertyType] ||
    "وحدة";
  const location = [listing.area?.name, listing.city, listing.governorate]
    .filter(Boolean)
    .join(" - ");
  const meta = [
    roomLabel,
    listing.bathrooms ? `${listing.bathrooms} حمام` : null,
    listing.bedrooms ? `${listing.bedrooms} غرفة` : null,
  ].filter(Boolean);
  const reviewCount = listing._count?.reviews ?? 0;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
      <div className="relative h-44 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-slate-100 text-slate-300">
            <ApartmentIcon className="h-14 w-14" />
          </div>
        )}
        <button
          className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 shadow"
          aria-label="إضافة للمفضلة"
        >
          <HeartIcon className="h-6 w-6" />
        </button>
        <span className="absolute right-3 top-3 rounded-md bg-[#5c7bf2] px-3 py-1 text-xs font-black text-white">
          {roomLabel}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black text-[#172033]">
            {listing.title}
          </h3>
          <p className="whitespace-nowrap text-lg font-black text-[#075fd6]">
            {formatListingPrice(listing.monthlyRent)}
          </p>
        </div>
        {location && (
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-500">
            <PinIcon className="h-4 w-4" />
            {location}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-600">
          {meta.map((meta) => (
            <span key={meta}>{meta}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Link
            to={`/expatriate/listings/${listing.id}`}
            className="rounded-md border border-[#aac6e9] px-5 py-2 text-sm font-black text-[#0750a8]"
          >
            عرض التفاصيل
          </Link>

        </div>
      </div>
    </article>
  );
}

function PropertyCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-6 w-20 rounded bg-slate-200" />
        </div>
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="flex justify-between">
          <div className="h-4 w-14 rounded bg-slate-200" />
          <div className="h-4 w-14 rounded bg-slate-200" />
          <div className="h-4 w-14 rounded bg-slate-200" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-9 w-24 rounded-md bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-200" />
        </div>
      </div>
    </article>
  );
}

function ListingsState({ message }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm font-bold text-slate-500 shadow-sm">
      {message}
    </div>
  );
}

function Step({ icon: Icon, title, text }) {
  return (
    <article className="relative px-4">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-4 border-[#bdd6f6] bg-[#075fd6] text-white shadow-lg">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="mt-4 text-lg font-black text-[#0f2744]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[230px] text-sm font-semibold leading-7 text-slate-600">
        {text}
      </p>
    </article>
  );
}

function Footer() {
  return (
    <footer id="contact" className="bg-[#071832] px-4 py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="مرافق" className="h-11 w-auto" />
            <span className="text-3xl font-black">مرافق</span>
          </Link>
          <p className="mt-4 max-w-xs text-xl font-semibold leading-9 text-slate-300">
            اللي يساعدك تسكن بسهولة وأمان في أي مدينة
          </p>
        </div>
        <FooterColumn
          title="عن مرافق"
          links={["من نحن", "كيف يعمل", "المدونة", "تواصل معنا"]}
        />
        <FooterColumn
          title="للمستخدمين"
          links={[
            "استكشف العقارات",
            "المناطق",
            "الأسئلة الشائعة",
            "الشروط والأحكام",
          ]}
        />
        <FooterColumn
          title="للملاك"
          links={["أضف عقارك", "إدارة عقاراتك", "سياسة الخصوصية"]}
        />
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center justify-between gap-5 border-t border-white/10 pt-7 md:flex-row">
        <p className="text-sm text-slate-400">
          © 2025 مرافق. جميع الحقوق محفوظة.
        </p>
        <div className="flex items-center gap-3">
          {["f", "ig", "x", "yt"].map((social) => (
            <a
              key={social}
              href="#contact"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/30 text-xs font-black text-white"
            >
              {social}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="font-black">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-300">
        {links.map((link) => (
          <li key={link}>
            <a href="#contact" className="transition hover:text-white">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" d="m21 21-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}
function PinIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z"
      />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function ShieldIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3 5 6v5c0 4.7 3 8.8 7 10 4-1.2 7-5.3 7-10V6l-7-3Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-5" />
    </svg>
  );
}
function CalendarIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="4" y="5" width="16" height="17" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}
function TagIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12V5h7l9 9-7 7-9-9Z"
      />
      <circle cx="8.5" cy="8.5" r="1" />
    </svg>
  );
}
function HeadsetIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13h4v6H6a2 2 0 0 1-2-2v-4ZM20 13h-4v6h2a2 2 0 0 0 2-2v-4Z" />
      <path strokeLinecap="round" d="M16 19c0 1.5-1.4 2-4 2" />
    </svg>
  );
}
function StarIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="m12 2.5 3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1 3-6.1Z" />
    </svg>
  );
}
function UsersIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8.5.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM8 13c-3.3 0-6 1.8-6 4v2h12v-2c0-2.2-2.7-4-6-4Zm8.5.5c-.8 0-1.5.1-2.2.3 1.1.9 1.7 2 1.7 3.2v2h8v-1.5c0-2.2-2.5-4-5.5-4Z" />
    </svg>
  );
}
function HomeIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 11 9-8 9 8" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 10v10h14V10M10 20v-6h4v6"
      />
    </svg>
  );
}
function ChevronLeftIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
    </svg>
  );
}
function HeartIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.9-8.8a5.5 5.5 0 0 0-.1-7.8Z"
      />
    </svg>
  );
}
function QuoteIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.5 6C5.5 7.5 4 10 4 13.4V19h7v-7H7.4c.2-1.8 1.1-3.2 2.9-4.2L8.5 6Zm10 0C15.5 7.5 14 10 14 13.4V19h7v-7h-3.6c.2-1.8 1.1-3.2 2.9-4.2L18.5 6Z" />
    </svg>
  );
}
function UniversityIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 10h16L12 4 4 10Z" />
      <path d="M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16" />
    </svg>
  );
}
function CheckIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
    </svg>
  );
}
function PlusIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
function LockIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
function CardIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}
function BotIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" />
    </svg>
  );
}
function MapSearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v14M15 6v14" />
      <circle cx="17" cy="10" r="2.5" />
      <path strokeLinecap="round" d="m19 12 2 2" />
    </svg>
  );
}
function ApartmentIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M3 21h20M9 7h2M14 7h2M9 11h2M14 11h2M9 15h2M14 15h2"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 21v-4h4v4" />
    </svg>
  );
}
function BookingIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="4" y="5" width="16" height="17" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8 16 2.5 2.5L16 13"
      />
    </svg>
  );
}
