
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getProxmoxConfig, saveProxmoxConfig, testProxmoxConnection, syncProxmoxNodes } from '@/lib/api';
import { ProxmoxConfig } from '@/types';
import { AlertTriangle, Check, Loader2, RefreshCw, Server, Shield } from 'lucide-react';

// Schema for form validation
const proxmoxSchema = z.object({
  apiUrl: z.string().url("Must be a valid URL"),
  username: z.string().optional(),
  tokenName: z.string().optional(),
  token: z.string().optional(),
  verifySSL: z.boolean().default(false),
});

type ProxmoxFormValues = z.infer<typeof proxmoxSchema>;

const Settings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [configData, setConfigData] = useState<ProxmoxConfig | null>(null);
  const [useToken, setUseToken] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProxmoxFormValues>({
    resolver: zodResolver(proxmoxSchema),
    defaultValues: {
      apiUrl: '',
      username: '',
      tokenName: '',
      token: '',
      verifySSL: false,
    },
  });
  
  // Load initial data
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const config = await getProxmoxConfig();
        setConfigData(config);
        
        // Set form values
        reset({
          apiUrl: config.apiUrl,
          username: config.username || '',
          tokenName: config.tokenName || '',
          token: config.token || '',
          verifySSL: config.verifySSL,
        });
        
        // Determine if we're using API token or username/password
        setUseToken(!!config.token);
        
      } catch (error) {
        toast.error("Failed to load configuration");
        console.error("Failed to load Proxmox configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, [reset]);
  
  // Handle form submission
  const onSubmit = async (values: ProxmoxFormValues) => {
    try {
      setIsSaving(true);
      
      // Create config object
      const config: ProxmoxConfig = {
        apiUrl: values.apiUrl,
        verifySSL: values.verifySSL,
        nodeList: configData?.nodeList || [],
      };
      
      // Add authentication details based on auth method
      if (useToken) {
        config.tokenName = values.tokenName;
        config.token = values.token;
      } else {
        config.username = values.username;
        // Password is only included during initial setup or when changed
        if (watch('password')) {
          config.password = watch('password');
        }
      }
      
      // Save configuration
      const savedConfig = await saveProxmoxConfig(config);
      setConfigData(savedConfig);
      toast.success("Configuration saved successfully");
      
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error("Failed to save Proxmox configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle test connection
  const handleTestConnection = async () => {
    const values = watch();
    
    try {
      setIsTesting(true);
      
      // Create config object for testing
      const testConfig: ProxmoxConfig = {
        apiUrl: values.apiUrl,
        verifySSL: values.verifySSL,
        nodeList: configData?.nodeList || [],
      };
      
      // Add authentication details based on auth method
      if (useToken) {
        testConfig.tokenName = values.tokenName;
        testConfig.token = values.token;
      } else {
        testConfig.username = values.username;
        // Include password if provided
        if (watch('password')) {
          testConfig.password = watch('password');
        }
      }
      
      // Test connection
      const result = await testProxmoxConnection(testConfig);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      
    } catch (error) {
      toast.error("Connection test failed");
      console.error("Proxmox connection test failed:", error);
    } finally {
      setIsTesting(false);
    }
  };
  
  // Handle sync nodes
  const handleSyncNodes = async () => {
    try {
      setIsSyncing(true);
      const nodes = await syncProxmoxNodes();
      toast.success(`Successfully synced ${nodes.length} nodes`);
    } catch (error) {
      toast.error("Failed to sync nodes");
      console.error("Failed to sync Proxmox nodes:", error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Toggle between token and username/password auth
  const toggleAuthMethod = () => {
    setUseToken(!useToken);
  };
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[450px]">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only administrators can access settings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Tabs defaultValue="proxmox" className="w-full">
        <TabsList>
          <TabsTrigger value="proxmox" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span>Proxmox</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="proxmox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proxmox Configuration</CardTitle>
              <CardDescription>
                Configure your Proxmox VE server connection details
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiUrl">API URL</Label>
                        <Input
                          id="apiUrl"
                          placeholder="https://proxmox.example.com:8006/api2/json"
                          {...register('apiUrl')}
                        />
                        {errors.apiUrl && (
                          <p className="text-sm text-destructive">{errors.apiUrl.message}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          The URL to your Proxmox VE API
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="authMethod">Use API Token</Label>
                        <Switch
                          id="authMethod"
                          checked={useToken}
                          onCheckedChange={toggleAuthMethod}
                        />
                      </div>
                      
                      {useToken ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="tokenName">Token ID</Label>
                            <Input
                              id="tokenName"
                              placeholder="user@pam!tokenname"
                              {...register('tokenName')}
                            />
                            {errors.tokenName && (
                              <p className="text-sm text-destructive">{errors.tokenName.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="token">API Token</Label>
                            <Input
                              id="token"
                              type="password"
                              placeholder="API token value"
                              {...register('token')}
                            />
                            {errors.token && (
                              <p className="text-sm text-destructive">{errors.token.message}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              placeholder="root@pam"
                              {...register('username')}
                            />
                            {errors.username && (
                              <p className="text-sm text-destructive">{errors.username.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Leave empty to keep existing password"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="verifySSL" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Verify SSL</span>
                        </Label>
                        <Switch
                          id="verifySSL"
                          checked={watch('verifySSL')}
                          onCheckedChange={(checked) => setValue('verifySSL', checked)}
                        />
                      </div>
                      
                      {!watch('verifySSL') && (
                        <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                          <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-100">
                                SSL Verification Disabled
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200/70">
                                <p>
                                  SSL verification is disabled. This is not recommended for production environments.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {configData && configData.nodeList && configData.nodeList.length > 0 && (
                      <div className="space-y-2">
                        <Label>Available Nodes</Label>
                        <div className="flex flex-wrap gap-2">
                          {configData.nodeList.map((node) => (
                            <div
                              key={node}
                              className="rounded-md bg-secondary px-3 py-1 text-sm"
                            >
                              {node}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isLoading || isTesting || isSaving}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSyncNodes}
                    disabled={isLoading || isSyncing || isSaving || !configData}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Nodes
                      </>
                    )}
                  </Button>
                </div>
                
                <Button type="submit" disabled={isLoading || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
