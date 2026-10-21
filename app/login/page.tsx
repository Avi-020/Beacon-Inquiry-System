import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Login | Beacon", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">B</span>
          <h1 className="text-xl font-bold text-slate-900">Beacon dashboard</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
