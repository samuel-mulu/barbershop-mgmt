// app/dashboard/layout.tsx
"use client";
import { useUserStatus } from '../../hooks/useUserStatus';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Check user status periodically
  useUserStatus();

  return (
    <div className="min-h-screen flex flex-col sm:flex-row overflow-x-hidden">
      <aside className="w-full sm:w-64 bg-gray-900 text-white hidden sm:block">
        <div className="p-4 text-xl font-bold">Dashboard</div>
        <ul className="p-4 space-y-2">
          <li><a href="/dashboard" className="block hover:bg-gray-700 p-2 rounded">Home</a></li>
          <li><a href="/dashboard/profile" className="block hover:bg-gray-700 p-2 rounded">Profile</a></li>
        </ul>
      </aside>
      <main className="flex-1 p-2 sm:p-4 w-full overflow-x-hidden max-w-full">
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
