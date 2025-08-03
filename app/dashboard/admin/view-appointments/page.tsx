"use client";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";

export default function ViewAppointmentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">View Appointments</h1>
              <p className="text-slate-600">Manage and view customer appointments</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Appointment Management</h2>
          <p className="text-slate-600 mb-6">
            The appointment management feature is coming soon. This will allow you to view, 
            schedule, and manage customer appointments for your barbershop.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-slate-800 mb-2">Planned Features:</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• View all scheduled appointments</li>
              <li>• Schedule new appointments</li>
              <li>• Manage appointment status</li>
              <li>• Send appointment reminders</li>
              <li>• Calendar view integration</li>
            </ul>
          </div>
          <Link 
            href="/dashboard/admin" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 