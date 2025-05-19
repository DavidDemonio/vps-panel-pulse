
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Node } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getNodes } from '@/lib/api';
import { Loader2, RefreshCw, ServerIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const Nodes = () => {
  const { data: nodes, isLoading, error, refetch } = useQuery({
    queryKey: ['nodes'],
    queryFn: getNodes,
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-destructive">Error loading nodes</h3>
            <div className="mt-2 text-sm text-destructive/80">
              <p>Failed to load node data. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Nodes</h2>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {nodes?.map((node: Node) => (
          <Card key={node.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                node.status === 'online' 
                  ? 'bg-green-500/10' 
                  : node.status === 'maintenance' 
                  ? 'bg-yellow-500/10' 
                  : 'bg-red-500/10'
              }`}>
                <ServerIcon className={`h-6 w-6 ${
                  node.status === 'online' 
                    ? 'text-green-500' 
                    : node.status === 'maintenance' 
                    ? 'text-yellow-500' 
                    : 'text-red-500'
                }`} />
              </div>
              <div>
                <CardTitle>{node.name}</CardTitle>
                <CardDescription>
                  Status: 
                  <span className={`ml-2 capitalize font-medium ${
                    node.status === 'online' 
                      ? 'text-green-500' 
                      : node.status === 'maintenance' 
                      ? 'text-yellow-500' 
                      : 'text-red-500'
                  }`}>
                    {node.status}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CPU</span>
                  <span className="font-medium">{Math.round((node.cpuUsed / node.cpuTotal) * 100)}%</span>
                </div>
                <Progress value={(node.cpuUsed / node.cpuTotal) * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-medium">{Math.round((node.memoryUsed / node.memoryTotal) * 100)}%</span>
                </div>
                <Progress value={(node.memoryUsed / node.memoryTotal) * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-medium">{Math.round((node.storageUsed / node.storageTotal) * 100)}%</span>
                </div>
                <Progress value={(node.storageUsed / node.storageTotal) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Nodes;
