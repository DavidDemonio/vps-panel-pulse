import { toast } from '@/components/ui/sonner';
import { 
  Server, 
  User, 
  Node, 
  ServerUsage,
  OsTemplate,
  Plan,
  Invoice,
  Transaction,
  ProxmoxConfig 
} from '@/types';

// Set this in the setup script or load from env
const API_BASE_URL = '/api';
const PROXMOX_API_URL = '/proxmox/api';

// Generic API error handling
const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  
  toast.error(errorMessage);
  return Promise.reject(errorMessage);
};

// Generic fetch wrapper with auth
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

// Proxmox API calls 
async function fetchProxmox(endpoint: string, options: RequestInit = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${PROXMOX_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Proxmox API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
}

// Auth
export async function login(email: string, password: string): Promise<User> {
  return fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  return fetchWithAuth('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<User> {
  return fetchWithAuth('/auth/me');
}

// Servers
export async function getServers(): Promise<Server[]> {
  return fetchWithAuth('/servers');
}

export async function getServer(id: string): Promise<Server> {
  return fetchWithAuth(`/servers/${id}`);
}

export async function createServer(data: Partial<Server>): Promise<Server> {
  return fetchWithAuth('/servers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateServer(id: string, data: Partial<Server>): Promise<Server> {
  return fetchWithAuth(`/servers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteServer(id: string): Promise<void> {
  return fetchWithAuth(`/servers/${id}`, {
    method: 'DELETE',
  });
}

// Server actions
export async function startServer(id: string): Promise<void> {
  return fetchWithAuth(`/servers/${id}/start`, {
    method: 'POST',
  });
}

export async function stopServer(id: string): Promise<void> {
  return fetchWithAuth(`/servers/${id}/stop`, {
    method: 'POST',
  });
}

export async function restartServer(id: string): Promise<void> {
  return fetchWithAuth(`/servers/${id}/restart`, {
    method: 'POST',
  });
}

// Server metrics
export async function getServerMetrics(id: string, period: string): Promise<ServerUsage> {
  return fetchWithAuth(`/servers/${id}/metrics?period=${period}`);
}

// Nodes
export async function getNodes(): Promise<Node[]> {
  return fetchWithAuth('/nodes');
}

export async function getNode(id: string): Promise<Node> {
  return fetchWithAuth(`/nodes/${id}`);
}

// OS Templates
export async function getOsTemplates(): Promise<OsTemplate[]> {
  return fetchWithAuth('/os-templates');
}

// Plans
export async function getPlans(): Promise<Plan[]> {
  return fetchWithAuth('/plans');
}

// Billing
export async function getInvoices(): Promise<Invoice[]> {
  return fetchWithAuth('/invoices');
}

export async function getInvoice(id: string): Promise<Invoice> {
  return fetchWithAuth(`/invoices/${id}`);
}

export async function getTransactions(): Promise<Transaction[]> {
  return fetchWithAuth('/transactions');
}

// PayPal
export async function createPayPalOrder(amount: number): Promise<{ id: string }> {
  return fetchWithAuth('/payments/paypal/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function capturePayPalOrder(orderId: string): Promise<Transaction> {
  return fetchWithAuth('/payments/paypal/capture-order', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

// Users
export async function getUsers(): Promise<User[]> {
  return fetchWithAuth('/users');
}

export async function createUser(userData: Partial<User>): Promise<User> {
  return fetchWithAuth('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  return fetchWithAuth(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id: string): Promise<void> {
  return fetchWithAuth(`/users/${id}`, {
    method: 'DELETE',
  });
}

// Proxmox Configuration
export async function getProxmoxConfig(): Promise<ProxmoxConfig> {
  // For development: check if we should use mock data
  if (USE_MOCK_API) {
    // Return mock config from localStorage if available
    const savedConfig = localStorage.getItem('mock_proxmox_config');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    return {
      apiUrl: 'https://proxmox.example.com:8006/api2/json',
      username: 'root@pam',
      token: '',
      tokenName: '',
      nodeList: ['pve1', 'pve2'],
      verifySSL: false
    };
  }
  
  return fetchWithAuth('/settings/proxmox');
}

export async function saveProxmoxConfig(config: ProxmoxConfig): Promise<ProxmoxConfig> {
  // For development: check if we should use mock data
  if (USE_MOCK_API) {
    // Save mock config to localStorage
    localStorage.setItem('mock_proxmox_config', JSON.stringify(config));
    toast.success('Proxmox configuration saved successfully');
    return config;
  }
  
  return fetchWithAuth('/settings/proxmox', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function testProxmoxConnection(config: ProxmoxConfig): Promise<{ success: boolean; message: string }> {
  // For development: check if we should use mock data
  if (USE_MOCK_API) {
    // Simulate API response
    return new Promise((resolve) => {
      setTimeout(() => {
        if (config.apiUrl && (config.token || config.username)) {
          resolve({ success: true, message: 'Connection successful!' });
        } else {
          resolve({ success: false, message: 'Invalid configuration' });
        }
      }, 1000);
    });
  }
  
  return fetchWithAuth('/settings/proxmox/test', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function syncProxmoxNodes(): Promise<Node[]> {
  // For development: check if we should use mock data
  if (USE_MOCK_API) {
    // Simulate API response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'pve1',
            name: 'pve1',
            status: 'online',
            cpuTotal: 8,
            cpuUsed: 2,
            memoryTotal: 16384,
            memoryUsed: 4096,
            storageTotal: 1024,
            storageUsed: 256
          },
          {
            id: 'pve2',
            name: 'pve2',
            status: 'online',
            cpuTotal: 4,
            cpuUsed: 1,
            memoryTotal: 8192,
            memoryUsed: 2048,
            storageTotal: 512,
            storageUsed: 128
          }
        ]);
      }, 1000);
    });
  }
  
  return fetchWithAuth('/settings/proxmox/sync-nodes', {
    method: 'POST',
  });
}

// For development: check if we should use mock data
const USE_MOCK_API = true; // Set to false when real API is available
