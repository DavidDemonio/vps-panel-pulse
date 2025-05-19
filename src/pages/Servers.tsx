import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { getServers, startServer, stopServer, restartServer } from '@/lib/api';
import { Server } from '@/types';
import { Server as ServerIcon, Search, Play, Square, RotateCw, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Mock data for development
const MOCK_SERVERS: Server[] = [
  {
    id: '1',
    name: 'Web Server',
    status: 'running',
    ipAddress: '192.168.1.100',
    node: 'node01',
    osTemplate: 'ubuntu-22.04',
    cpu: 2,
    memory: 4,
    storage: 50,
    createdAt: new Date().toISOString(),
    userId: '1',
    vmid: 101
  },
  {
    id: '2',
    name: 'Database Server',
    status: 'stopped',
    ipAddress: '192.168.1.101',
    node: 'node02',
    osTemplate: 'debian-11',
    cpu: 4,
    memory: 8,
    storage: 100,
    createdAt: new Date().toISOString(),
    userId: '1',
    vmid: 102
  },
  {
    id: '3',
    name: 'Mail Server',
    status: 'failed',
    ipAddress: '192.168.1.102',
    node: 'node01',
    osTemplate: 'centos-8',
    cpu: 2,
    memory: 4,
    storage: 40,
    createdAt: new Date().toISOString(),
    userId: '1',
    vmid: 103
  }
];

// For development: check if we should use mock data
const USE_MOCK_API = true; // Set to false when real API is available

const Servers = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [filteredServers, setFilteredServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchServers = async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_API) {
        // Use mock data
        setServers(MOCK_SERVERS);
        setFilteredServers(MOCK_SERVERS);
        setIsLoading(false);
        return;
      }
      
      const data = await getServers();
      setServers(data);
      setFilteredServers(data);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      toast.error('Failed to load servers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredServers(servers);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = servers.filter(
        (server) =>
          server.name.toLowerCase().includes(lowercasedSearch) ||
          server.ipAddress.toLowerCase().includes(lowercasedSearch) ||
          server.status.toLowerCase().includes(lowercasedSearch) ||
          server.node.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredServers(filtered);
    }
  }, [searchTerm, servers]);

  const handleServerAction = async (serverId: string, action: 'start' | 'stop' | 'restart') => {
    if (USE_MOCK_API) {
      // Mock server action
      const updatedServers = servers.map(server => {
        if (server.id === serverId) {
          let newStatus: 'running' | 'stopped' | 'failed' = server.status;
          switch (action) {
            case 'start':
              newStatus = 'running';
              break;
            case 'stop':
              newStatus = 'stopped';
              break;
            case 'restart':
              newStatus = 'running';
              break;
          }
          return { ...server, status: newStatus };
        }
        return server;
      });
      
      setServers(updatedServers);
      setFilteredServers(updatedServers);
      toast.success(`Server ${action} requested successfully`);
      return;
    }
    
    const actionMap = {
      start: startServer,
      stop: stopServer,
      restart: restartServer
    };

    try {
      await actionMap[action](serverId);
      toast.success(`Server ${action} requested successfully`);
      fetchServers(); // Refresh the list
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
      toast.error(`Failed to ${action} server`);
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      running: { variant: 'default' as const, label: 'Running' },
      stopped: { variant: 'secondary' as const, label: 'Stopped' },
      failed: { variant: 'destructive' as const, label: 'Failed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
      { variant: 'outline' as const, label: status };
    
    return (
      <Badge variant={config.variant}>{config.label}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Servers</h2>
        <div className="flex flex-1 items-center gap-2 md:max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search servers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/servers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Server
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : filteredServers.length > 0 ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Node</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ServerIcon className="h-4 w-4 text-muted-foreground" />
                      <Link to={`/servers/${server.id}`} className="hover:underline">
                        {server.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(server.status)}</TableCell>
                  <TableCell>{server.ipAddress}</TableCell>
                  <TableCell>{server.node}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span>CPU: {server.cpu} cores</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Memory: {server.memory} GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Storage: {server.storage} GB</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleServerAction(server.id, 'start')}
                            disabled={server.status === 'running'}
                          >
                            <Play className="mr-2 h-4 w-4" /> Start
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleServerAction(server.id, 'stop')}
                            disabled={server.status === 'stopped'}
                          >
                            <Square className="mr-2 h-4 w-4" /> Stop
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleServerAction(server.id, 'restart')}
                            disabled={server.status === 'stopped'}
                          >
                            <RotateCw className="mr-2 h-4 w-4" /> Restart
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Link to={`/servers/${server.id}`}>
                        <Button size="sm">Details</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ServerIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-xl font-semibold">No servers found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Get started by creating a new server'}
          </p>
          {!searchTerm && (
            <Link to="/servers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Server
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Servers;
