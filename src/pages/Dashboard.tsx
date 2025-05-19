
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server as ServerIcon, HardDrive, CreditCard, Clock } from 'lucide-react';
import { getServers, getServerMetrics, getNodes, getInvoices } from '@/lib/api';
import { Server, Node, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
  let color;
  
  switch (status.toLowerCase()) {
    case 'running':
    case 'online':
    case 'paid':
      color = 'bg-green-100 text-green-800';
      break;
    case 'stopped':
    case 'maintenance':
    case 'pending':
      color = 'bg-yellow-100 text-yellow-800';
      break;
    case 'failed':
    case 'offline':
    case 'cancelled':
      color = 'bg-red-100 text-red-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
};

const Dashboard = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load all initial data
        const serversData = await getServers();
        setServers(serversData);
        
        const nodesData = await getNodes();
        setNodes(nodesData);
        
        const invoicesData = await getInvoices();
        setInvoices(invoicesData);
        
        // Generate sample data for the chart
        if (serversData.length > 0) {
          try {
            const metrics = await getServerMetrics(serversData[0].id, '24h');
            setUsageData(metrics.usage.map(point => ({
              time: format(new Date(point.timestamp), 'HH:mm'),
              cpu: point.cpu,
              memory: point.memory,
              disk: point.disk,
            })));
          } catch (error) {
            console.error("Could not load metrics:", error);
            
            // Fallback to sample data
            const generateSampleData = () => {
              const data = [];
              const now = new Date();
              
              for (let i = 24; i >= 0; i--) {
                data.push({
                  time: format(subDays(now, i/24), 'HH:mm'),
                  cpu: Math.floor(Math.random() * 80) + 10,
                  memory: Math.floor(Math.random() * 70) + 20,
                  disk: Math.floor(Math.random() * 50) + 10,
                });
              }
              
              return data;
            };
            
            setUsageData(generateSampleData());
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Generate summary statistics
  const activeServers = servers.filter(s => s.status === 'running').length;
  const totalServers = servers.length;
  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const totalNodes = nodes.length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
  
  // Calculate resource usage
  const totalCpu = nodes.reduce((sum, node) => sum + node.cpuTotal, 0);
  const usedCpu = nodes.reduce((sum, node) => sum + node.cpuUsed, 0);
  const cpuUsage = totalCpu > 0 ? Math.round((usedCpu / totalCpu) * 100) : 0;
  
  const totalMemory = nodes.reduce((sum, node) => sum + node.memoryTotal, 0);
  const usedMemory = nodes.reduce((sum, node) => sum + node.memoryUsed, 0);
  const memoryUsage = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;
  
  const totalStorage = nodes.reduce((sum, node) => sum + node.storageTotal, 0);
  const usedStorage = nodes.reduce((sum, node) => sum + node.storageUsed, 0);
  const storageUsage = totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Link to="/servers/new">
          <Button>
            <ServerIcon className="mr-2 h-4 w-4" /> New Server
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <ServerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServers} / {totalServers}</div>
            <p className="text-xs text-muted-foreground">Active servers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nodes</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineNodes} / {totalNodes}</div>
            <p className="text-xs text-muted-foreground">Online nodes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Pending invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={usageData} 
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#8884d8" 
                    name="CPU"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#82ca9d" 
                    name="Memory"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="disk" 
                    stroke="#ffc658" 
                    name="Disk"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Resource Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>CPU Usage</span>
                <span className="font-medium">{cpuUsage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${cpuUsage}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Memory Usage</span>
                <span className="font-medium">{memoryUsage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${memoryUsage}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>Storage Usage</span>
                <span className="font-medium">{storageUsage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${storageUsage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Servers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : servers.length > 0 ? (
              <div className="space-y-2">
                {servers.slice(0, 5).map((server) => (
                  <div 
                    key={server.id} 
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div className="flex items-center space-x-4">
                      <ServerIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{server.name}</p>
                        <p className="text-sm text-muted-foreground">{server.ipAddress}</p>
                      </div>
                    </div>
                    <StatusBadge status={server.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No servers found
              </div>
            )}
            {servers.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Link to="/servers">
                  <Button variant="outline">View All Servers</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.slice(0, 5).map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No invoices found
              </div>
            )}
            {invoices.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Link to="/billing">
                  <Button variant="outline">View All Invoices</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
