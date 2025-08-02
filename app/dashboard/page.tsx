'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromLocalStorage } from '@/utils/auth';

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUserFromLocalStorage();

    if (!user) {
      router.push('/login');
    } else if (user.role === 'admin') {
      router.push('/dashboard/admin');
    } else if (user.role === 'owner') {
      router.push('/dashboard/owner');
    } else if (user.role === 'barber') {
      router.push('/dashboard/barber');
    } else if (user.role === 'washer') {
      router.push('/dashboard/barber'); // Washers use the same dashboard as barbers
    } else if (user.role === 'customer') {
      router.push('/dashboard/customer');
    } else {
      router.push('/unauthorized'); // fallback
    }

    setLoading(false);
  }, []);

  return loading ? <p>Redirecting...</p> : null;
};

export default DashboardPage;
