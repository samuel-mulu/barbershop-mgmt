"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Scissors, Users, BarChart3, Shield, Sparkles, CheckCircle } from "lucide-react";
import SplashScreen from "./components/SplashScreen";
import { getUserFromLocalStorage } from "@/utils/auth";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Check if user is already logged in
        const user = getUserFromLocalStorage();
        const token = localStorage.getItem("token");
        
        if (user && token) {
          // User is logged in, navigate to appropriate dashboard
          switch (user.role) {
            case 'owner':
              router.push('/dashboard/owner');
              break;
            case 'admin':
              router.push('/dashboard/admin');
              break;
            case 'barber':
              router.push('/dashboard/barber');
              break;
            case 'washer':
              router.push('/dashboard/washer');
              break;
            default:
              router.push('/login');
          }
        } else {
          // User is not logged in, show splash for 5 seconds then go to login
          setTimeout(() => {
            setShowSplash(false);
            router.push('/login');
          }, 5000);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, show splash for 5 seconds then go to login
        setTimeout(() => {
          setShowSplash(false);
          router.push('/login');
        }, 5000);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndNavigate();
  }, [router]);

  if (showSplash || isCheckingAuth) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Barbershop Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="text-slate-700 hover:text-violet-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
          </a>
          <a
                href="/register"
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg mb-6">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-6">
              Professional Barbershop
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Streamline your barbershop operations with our comprehensive management platform. 
              Manage services, staff, appointments, and reports all in one place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/register"
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
        </a>
        <a
              href="/login"
              className="bg-white text-slate-700 px-8 py-4 rounded-xl text-lg font-medium border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
              Everything you need to run your barbershop
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed specifically for barbershop management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Staff Management</h3>
              <p className="text-slate-600 mb-6">
                Manage your barbers and washers efficiently. Track performance, assign services, and monitor productivity.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Role-based access control
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Performance tracking
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Service assignment
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Service Management</h3>
              <p className="text-slate-600 mb-6">
                Create and manage services with custom pricing. Set different rates for barbers and washers.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Custom service pricing
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Branch-specific services
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Easy service editing
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Advanced Reports</h3>
              <p className="text-slate-600 mb-6">
                Comprehensive reporting and analytics. Track revenue, performance, and business insights.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Real-time analytics
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Performance reports
                </li>
                <li className="flex items-center text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Revenue tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl p-12 text-white">
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-violet-200" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to transform your barbershop?
            </h2>
            <p className="text-xl text-violet-100 mb-8">
              Join thousands of barbershop owners who trust our platform to manage their business.
            </p>
            <a
              href="/register"
              className="bg-white text-violet-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center"
            >
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Barbershop Pro</span>
              </div>
              <p className="text-slate-300">
                Professional barbershop management system for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-300">
            <p>&copy; 2024 Barbershop Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
