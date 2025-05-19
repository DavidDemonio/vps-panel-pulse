
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getUsers, getNodes, getServers } from '@/lib/api';
import { Loader2, Server, Users, Database, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const { data: nodes, isLoading: isLoadingNodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: getNodes,
  });

  const { data: servers, isLoading: isLoadingServers } = useQuery({
    queryKey: ['servers'],
    queryFn: getServers,
  });

  const isLoading = isLoadingUsers || isLoadingNodes || isLoadingServers;

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/users">View All Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Nodes
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nodes?.filter(n => n.status === 'online').length || 0} / {nodes?.length || 0}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/nodes">View All Nodes</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Servers
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servers?.length || 0}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/servers">View All Servers</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Online</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/statistics">View Statistics</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Recent system events</CardDescription>
          </CardHeader>
          <CardContent className="h-80 overflow-auto">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 rounded-md bg-secondary/20 p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {i === 0 && "Server created"}
                      {i === 1 && "User logged in"}
                      {i === 2 && "Node synced"}
                      {i === 3 && "Server stopped"}
                      {i === 4 && "User updated profile"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Date.now() - i * 3600000).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
            <CardDescription>Current resource usage</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <div className="space-y-8">
              {nodes?.slice(0, 3).map((node) => (
                <div key={node.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{node.name}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      node.status === 'online' 
                        ? 'bg-green-500/20 text-green-500' 
                        : node.status === 'maintenance' 
                        ? 'bg-yellow-500/20 text-yellow-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {node.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>CPU: {Math.round((node.cpuUsed / node.cpuTotal) * 100)}%</span>
                      <span>Memory: {Math.round((node.memoryUsed / node.memoryTotal) * 100)}%</span>
                      <span>Storage: {Math.round((node.storageUsed / node.storageTotal) * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/nodes">View All Nodes</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
