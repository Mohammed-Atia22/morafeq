import { Link } from "react-router-dom";

export function OwnerPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50">
      <div className="rounded-2xl bg-white p-8 shadow-lg text-center">
        <div className="mb-4 text-6xl">👋</div>
        <h1 className="text-3xl font-bold text-slate-800">مرحباً بك يا مالك</h1>
        <p className="mt-2 text-slate-600">يمكنك الآن بدء إدارة عقاراتك</p>
      </div>

      <Link to={"/AddListing"}>
      <button>اضافه عقار</button>
      </Link>
      
    </div>

  );
}
