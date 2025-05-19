
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart3, LineChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';

const Statistics = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [isLoading, setIsLoading] = useState(false);
  
  // This would normally be a real API call
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['stats', timeRange],
    queryFn: async () => {
      // This is a mock implementation that would be replaced with real API calls
      return {
        cpu: generateMockTimeSeriesData(24, 0, 100),
        memory: generateMockTimeSeriesData(24, 20, 80),
        storage: generateMockTimeSeriesData(24, 30, 70),
        network: {
          in: generateMockTimeSeriesData(24, 0, 500),
          out: generateMockTimeSeriesData(24, 0, 300)
        }
      };
    },
  });

  // Generate mock time series data
  function generateMockTimeSeriesData(points: number, min: number, max: number) {
    const now = new Date();
    const data = [];
    
    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      data.push({
        timestamp: time.toISOString(),
        value: Math.floor(Math.random() * (max - min + 1) + min)
      });
    }
    
    return data;
  }

  if (isLoadingStats) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 hours</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>Detailed</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
                <CardDescription>Average CPU usage across all nodes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {statsData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.cpu.map(point => ({
                      time: new Date(point.timestamp).toLocaleTimeString(),
                      value: point.value
                    }))}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorCpu)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Average memory usage across all nodes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {statsData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.memory.map(point => ({
                      time: new Date(point.timestamp).toLocaleTimeString(),
                      value: point.value
                    }))}>
                      <defs>
                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="value" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMem)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Traffic</CardTitle>
              <CardDescription>Incoming and outgoing network traffic</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {statsData && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={statsData.network.in.map((point, i) => ({
                      time: new Date(point.timestamp).toLocaleTimeString(),
                      in: point.value,
                      out: statsData.network.out[i].value
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="in" stroke="#8884d8" name="Incoming" />
                    <Line type="monotone" dataKey="out" stroke="#82ca9d" name="Outgoing" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;
