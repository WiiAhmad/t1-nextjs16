import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings, 
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { getDashboardData, getUserAccessInfo } from '@/app/(dashboard)/action';
import { 
  SidebarInset, 
  SidebarTrigger 
} from '@/components/ui/sidebar';

export default async function DashboardPage() {
  // Get dashboard data on the server
  const dashboardResult = await getDashboardData();
  const accessResult = await getUserAccessInfo();

  if (!dashboardResult.success) {
    return (
      <SidebarInset>
        <div className="flex h-full items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Error Loading Dashboard
              </CardTitle>
              <CardDescription>
                {dashboardResult.error || 'Failed to load dashboard data'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </SidebarInset>
    );
  }

  const { data: dashboardData } = dashboardResult;
  const { data: accessData } = accessResult;

  if (!dashboardData) {
    return (
      <SidebarInset>
        <div className="flex h-full items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>
                Dashboard data is not available at the moment.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </SidebarInset>
    );
  }

  const { user, statistics, recentActivities, quickActions } = dashboardData;

  return (
    <SidebarInset>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name}!
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid gap-6">
              
              {/* User Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your current account information and status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {/* <AvatarImage src={user.avatar || ''} alt={user.name} /> */}
                      <AvatarFallback className="text-lg">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{user.name}</h3>
                        <Badge variant="outline">
                          {user.clearanceLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {user.department && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {user.department}
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {user.location}
                          </div>
                        )}
                        {user.lastLogin && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      +0 from last month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Roles
                    </CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.activeRoles}</div>
                    <p className="text-xs text-muted-foreground">
                      Role assignments
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Access Logs
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.accessLogs}</div>
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Policies
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.policies}</div>
                    <p className="text-xs text-muted-foreground">
                      Active policies
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Two Column Layout */}
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>
                      Your latest access history and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Activity className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {activity.action}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.ipAddress}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Access Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Access Information</CardTitle>
                    <CardDescription>
                      Your current roles and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {accessData?.roles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{role.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {role.description}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {new Date(role.grantedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                      
                      {accessData?.permissions.slice(0, 3).map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{permission.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and actions you can perform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {quickActions.map((action, actionIndex) => {
                      const getIcon = (iconName: string) => {
                        switch (iconName) {
                          case 'User': return Users;
                          case 'Shield': return Shield;
                          case 'Lock': return Settings;
                          default: return Settings;
                        }
                      };
                      
                      const IconComponent = getIcon(action.icon);

                      return (
                        <Button
                          key={actionIndex}
                          variant="outline"
                          className="h-auto flex-col gap-2 p-4"
                          asChild
                        >
                          <a href={action.href}>
                            <IconComponent className="h-6 w-6" />
                            <div className="text-center">
                              <p className="font-medium">{action.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {action.description}
                              </p>
                            </div>
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}