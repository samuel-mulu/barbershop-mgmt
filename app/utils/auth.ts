export const getUserFromLocalStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error: unknown) {
    console.error('Invalid user JSON in localStorage:', error);
    return null;
  }
};
