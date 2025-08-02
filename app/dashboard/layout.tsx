// app/dashboard/layout.tsx
import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white hidden sm:block">
        <div className="p-4 text-xl font-bold">Dashboard</div>
        <ul className="p-4 space-y-2">
          <li><a href="/dashboard" className="block hover:bg-gray-700 p-2 rounded">Home</a></li>
          <li><a href="/dashboard/profile" className="block hover:bg-gray-700 p-2 rounded">Profile</a></li>
        </ul>
      </aside>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
