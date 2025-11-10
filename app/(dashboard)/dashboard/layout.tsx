import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { DashboardSidebar } from '@/components/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { requireAuth, getCurrentDashboardUser } from '@/app/(dashboard)/action';

export const metadata = {
  title: 'Dashboard | RBAC Access Control System',
  description: 'Secure dashboard with role-based access control',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  try {
    // Check authentication
    const session = await requireAuth();
    const user = await getCurrentDashboardUser();
    
    if (!user) {
      // Redirect to signin if user not found
      redirect('/signin');
    }

    // Prepare user data for sidebar
    const sidebarUser = {
      name: user.name,
      email: user.email,
      avatar: undefined, // You can implement avatar logic here
    };

    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar user={sidebarUser} />
          <main className="flex-1 overflow-hidden">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  } catch (error) {
    console.error('Dashboard layout error:', error);
    // If there's an error, redirect to signin
    redirect('/signin');
  }
}