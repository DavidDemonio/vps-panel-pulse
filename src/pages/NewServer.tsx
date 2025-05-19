import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { getNodes, getOsTemplates, getPlans, createServer } from '@/lib/api';
import { Node, OsTemplate, Plan } from '@/types';
import { toast } from 'sonner';
import { 
  ServerIcon, 
  Cpu, 
  Database, 
  HardDrive, 
  Globe, 
  Check, 
  CreditCard 
} from 'lucide-react';

const NewServer = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [templates, setTemplates] = useState<OsTemplate[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form values
  const [name, setName] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [selectedOs, setSelectedOs] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [customPlan, setCustomPlan] = useState(false);
  const [cpu, setCpu] = useState(1);
  const [memory, setMemory] = useState(2);
  const [storage, setStorage] = useState(20);
  const [password, setPassword] = useState('');
  
  // Custom tab handling
  const [currentTab, setCurrentTab] = useState('plans');
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [nodesData, templatesData, plansData] = await Promise.all([
          getNodes(),
          getOsTemplates(),
          getPlans()
        ]);
        
        setNodes(nodesData);
        setTemplates(templatesData);
        setPlans(plansData);
        
        // Set defaults
        if (nodesData.length > 0) {
          setSelectedNode(nodesData[0].id);
        }
        
        if (templatesData.length > 0) {
          setSelectedOs(templatesData[0].id);
        }
        
        if (plansData.length > 0) {
          setSelectedPlan(plansData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch required data:', error);
        toast.error('Failed to load server configuration options');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const getSelectedPlanDetails = () => {
    if (!selectedPlan || customPlan) return null;
    return plans.find(plan => plan.id === selectedPlan);
  };
  
  const calculatePrice = () => {
    if (customPlan) {
      // Simple pricing calculation
      const cpuPrice = cpu * 5;
      const memoryPrice = memory * 2;
      const storagePrice = storage * 0.1;
      return cpuPrice + memoryPrice + storagePrice;
    } else {
      const plan = getSelectedPlanDetails();
      return plan ? plan.price : 0;
    }
  };
  
  const handleCreateServer = async () => {
    if (!name || !selectedNode || !selectedOs || (!selectedPlan && !customPlan) || !password) {
      toast.error('Please complete all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    const serverData = {
      name,
      node: selectedNode,
      osTemplate: selectedOs,
      password,
      cpu: customPlan ? cpu : getSelectedPlanDetails()?.cpu || 1,
      memory: customPlan ? memory : getSelectedPlanDetails()?.memory || 1,
      storage: customPlan ? storage : getSelectedPlanDetails()?.storage || 10,
      planId: customPlan ? undefined : selectedPlan
    };
    
    try {
      const newServer = await createServer(serverData);
      toast.success('Server created successfully!');
      navigate(`/servers/${newServer.id}`);
    } catch (error) {
      console.error('Failed to create server:', error);
      toast.error('Failed to create server');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Getting next step logic
  const nextStep = () => {
    if (step === 1 && !name) {
      toast.error('Please enter a server name');
      return;
    }
    
    if (step === 2 && !selectedNode) {
      toast.error('Please select a node');
      return;
    }
    
    if (step === 3 && !selectedOs) {
      toast.error('Please select an OS template');
      return;
    }
    
    if (step === 4 && !selectedPlan && !customPlan) {
      toast.error('Please select a plan or create a custom configuration');
      return;
    }
    
    if (step < 5) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const selectedTemplate = templates.find(template => template.id === selectedOs);
  
  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Create New Server</h2>
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step >= stepNumber ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background'
                }`}
              >
                {step > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
              </div>
              {stepNumber < 5 && (
                <div className={`h-1 w-10 ${step > stepNumber ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      <Card className="w-full max-w-4xl mx-auto">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle>Name Your Server</CardTitle>
              <CardDescription>Give your virtual server a name to easily identify it.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Server Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., my-awesome-server" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Use only alphanumeric characters, hyphens, and underscores.
                  </p>
                </div>
              </div>
            </CardContent>
          </>
        )}
        
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle>Select Node Location</CardTitle>
              <CardDescription>Choose which physical server location to deploy on.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Server Node</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {nodes.map((node) => (
                      <div 
                        key={node.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                          selectedNode === node.id ? 'border-primary bg-accent' : 'border-border'
                        }`}
                        onClick={() => setSelectedNode(node.id)}
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{node.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={node.status === 'online' ? 'default' : 'secondary'}>
                              {node.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((node.cpuUsed / node.cpuTotal) * 100)}% CPU used
                            </span>
                          </div>
                        </div>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted">
                          {selectedNode === node.id && (
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
        
        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle>Choose Operating System</CardTitle>
              <CardDescription>Select the operating system template for your server.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Operating System</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template) => (
                      <div 
                        key={template.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                          selectedOs === template.id ? 'border-primary bg-accent' : 'border-border'
                        }`}
                        onClick={() => setSelectedOs(template.id)}
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                        </div>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted">
                          {selectedOs === template.id && (
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
        
        {step === 4 && (
          <>
            <CardHeader>
              <CardTitle>Server Resources</CardTitle>
              <CardDescription>Select a pre-configured plan or create a custom configuration.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="plans"
                    onClick={() => setCustomPlan(false)}
                  >
                    Pre-configured Plans
                  </TabsTrigger>
                  <TabsTrigger 
                    value="custom"
                    onClick={() => setCustomPlan(true)}
                  >
                    Custom Configuration
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="plans">
                  <div className="grid gap-4 mt-4 md:grid-cols-2">
                    {plans.map((plan) => (
                      <div 
                        key={plan.id}
                        className={`flex cursor-pointer flex-col justify-between rounded-lg border p-4 ${
                          selectedPlan === plan.id ? 'border-primary bg-accent' : 'border-border'
                        }`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-semibold">{plan.name}</h3>
                            <span className="font-bold">${plan.price}/mo</span>
                          </div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                              <Cpu className="mr-2 h-4 w-4" /> {plan.cpu} vCPUs
                            </li>
                            <li className="flex items-center">
                              <Database className="mr-2 h-4 w-4" /> {plan.memory} GB RAM
                            </li>
                            <li className="flex items-center">
                              <HardDrive className="mr-2 h-4 w-4" /> {plan.storage} GB SSD
                            </li>
                            <li className="flex items-center">
                              <Globe className="mr-2 h-4 w-4" /> {plan.bandwidth} GB Bandwidth
                            </li>
                          </ul>
                        </div>
                        <div className="mt-4 flex items-center justify-center">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted">
                            {selectedPlan === plan.id && (
                              <div className="h-3 w-3 rounded-full bg-primary"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="custom">
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cpu">CPU Cores</Label>
                        <span className="font-medium">{cpu} vCPUs</span>
                      </div>
                      <Slider 
                        id="cpu"
                        min={1} 
                        max={16} 
                        step={1} 
                        value={[cpu]} 
                        onValueChange={(values) => setCpu(values[0])} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="memory">Memory (RAM)</Label>
                        <span className="font-medium">{memory} GB</span>
                      </div>
                      <Slider 
                        id="memory"
                        min={1} 
                        max={64} 
                        step={1} 
                        value={[memory]} 
                        onValueChange={(values) => setMemory(values[0])} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="storage">Storage (SSD)</Label>
                        <span className="font-medium">{storage} GB</span>
                      </div>
                      <Slider 
                        id="storage"
                        min={10} 
                        max={1000} 
                        step={10} 
                        value={[storage]} 
                        onValueChange={(values) => setStorage(values[0])} 
                      />
                    </div>
                    
                    <div className="rounded-md border border-border p-4 bg-accent/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Estimated Price:</span>
                        <span className="font-bold">${calculatePrice().toFixed(2)}/mo</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </>
        )}
        
        {step === 5 && (
          <>
            <CardHeader>
              <CardTitle>Final Configuration</CardTitle>
              <CardDescription>Review and complete your server setup.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Root Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    placeholder="Enter a secure password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a strong combination of letters, numbers, and special characters.
                  </p>
                </div>
                
                <div className="rounded-lg border border-border">
                  <div className="border-b border-border p-4">
                    <h3 className="font-medium">Server Summary</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Node</p>
                        <p className="font-medium">
                          {nodes.find(n => n.id === selectedNode)?.name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Operating System</p>
                        <p className="font-medium">{selectedTemplate?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-medium">
                          {customPlan 
                            ? 'Custom Configuration' 
                            : plans.find(p => p.id === selectedPlan)?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Resources</p>
                      <div className="mt-1 flex items-center gap-4">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {customPlan ? cpu : plans.find(p => p.id === selectedPlan)?.cpu || 1} vCPUs
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {customPlan ? memory : plans.find(p => p.id === selectedPlan)?.memory || 1} GB RAM
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {customPlan ? storage : plans.find(p => p.id === selectedPlan)?.storage || 10} GB SSD
                        </Badge>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Total Price</p>
                        <p className="font-bold">${calculatePrice().toFixed(2)}/month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={step === 1}>
            Previous
          </Button>
          {step < 5 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button onClick={handleCreateServer} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Server'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewServer;
