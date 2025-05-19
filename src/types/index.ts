
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Server {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'failed';
  vmid: number;
  node: string;
  cpu: number;
  memory: number;
  storage: number;
  ipAddress: string;
  osTemplate: string;
  userId: string;
  createdAt: string;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  timestamp: string;
}

export interface ServerUsage {
  serverId: string;
  usage: ResourceUsage[];
}

export interface Node {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  cpuTotal: number;
  cpuUsed: number;
  memoryTotal: number;
  memoryUsed: number;
  storageTotal: number;
  storageUsed: number;
}

export interface OsTemplate {
  id: string;
  name: string;
  description: string;
  file: string;
}

export interface Plan {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  storage: number;
  bandwidth: number;
  price: number;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  items: InvoiceItem[];
  createdAt: string;
  dueDate: string;
  paidAt?: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'payment' | 'refund' | 'credit';
  status: 'completed' | 'pending' | 'failed';
  gateway: 'paypal' | 'credit';
  gatewayTransactionId?: string;
  createdAt: string;
}

export interface ServerMetrics {
  cpu: MetricPoint[];
  memory: MetricPoint[];
  disk: MetricPoint[];
  network: {
    in: MetricPoint[];
    out: MetricPoint[];
  };
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface ProxmoxConfig {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
  tokenName?: string;
  verifySSL: boolean;
  nodeList: string[];
}
