"use client";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Admin user profile and settings.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/20 text-xl font-bold text-indigo-600">
            A
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Admin User</h2>
            <p className="text-sm text-slate-500">Finance Operations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
