import EnquiryForm from "@/components/EnquiryForm";

// No searchParams / cookies here, so this page is fully static (fast).
export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto mb-6 flex max-w-xl items-center justify-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">B</span>
        <span className="text-xl text-slate-500"><b className="text-slate-900">Beacon</b> A Guiding Signal</span>
      </div>
      <div className="relative mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <EnquiryForm />
      </div>
    </main>
  );
}
