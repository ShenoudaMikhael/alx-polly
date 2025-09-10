import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/context/auth-context';

const withAdminAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithAdminAuth: React.FC<P> = (props) => {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
      if (!authLoading && user) {
        const adminEmails = ['admin@alxpolly.com', 'admin@example.com'];
        const userIsAdmin =
          adminEmails.includes(user.email || '') ||
          user.email?.includes('admin') ||
          user.app_metadata?.role === 'admin';

        if (userIsAdmin) {
          setIsAdmin(true);
        } else {
          router.push('/polls');
        }
      } else if (!authLoading && !user) {
        router.push('/login');
      }
    }, [user, authLoading, router]);

    if (authLoading) {
      return <div className="p-6">Loading...</div>;
    }

    if (!isAdmin) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600 mt-2">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return WithAdminAuth;
};

export default withAdminAuth;
