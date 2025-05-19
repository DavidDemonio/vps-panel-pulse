
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getInvoices, getTransactions, createPayPalOrder, capturePayPalOrder } from '@/lib/api';
import { Invoice, Transaction } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Download, Plus } from 'lucide-react';

const Billing = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState<number>(10);
  const [activeTab, setActiveTab] = useState('invoices');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const invoicesData = await getInvoices();
        const transactionsData = await getTransactions();
        
        setInvoices(invoicesData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
        toast.error('Failed to load billing information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const createOrder = async () => {
    try {
      const order = await createPayPalOrder(amount);
      return order.id;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      toast.error('Failed to create payment order');
      return null;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      const transaction = await capturePayPalOrder(data.orderID);
      // Update transactions list
      setTransactions(prevTransactions => [transaction, ...prevTransactions]);
      toast.success('Payment completed successfully!');
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      toast.error('Failed to process payment');
    }
  };

  const renderInvoiceStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      'paid': { variant: 'default', label: 'Paid' },
      'pending': { variant: 'secondary', label: 'Pending' },
      'cancelled': { variant: 'destructive', label: 'Cancelled' },
    };
    
    const { variant, label } = statusMap[status] || { variant: 'secondary', label: status };
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  const renderTransactionStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string }> = {
      'completed': { variant: 'default', label: 'Completed' },
      'pending': { variant: 'secondary', label: 'Pending' },
      'failed': { variant: 'destructive', label: 'Failed' },
    };
    
    const { variant, label } = statusMap[status] || { variant: 'secondary', label: status };
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <Button onClick={() => setActiveTab('add-funds')}>
          <Plus className="mr-2 h-4 w-4" /> Add Funds
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="add-funds">Add Funds</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="pt-4">
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : invoices.length > 0 ? (
            <div className="rounded-md border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id.substring(0, 8)}</TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>{renderInvoiceStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button size="sm">Pay Now</Button>
                          )}
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
                <CreditCard className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">No invoices found</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                No invoices have been generated for your account yet.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-4">
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="rounded-md border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>{renderTransactionStatusBadge(transaction.status)}</TableCell>
                      <TableCell className="capitalize">{transaction.gateway}</TableCell>
                      <TableCell>{format(new Date(transaction.createdAt), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">No transactions found</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                No payment transactions have been recorded for your account.
              </p>
              <Button onClick={() => setActiveTab('add-funds')}>
                <Plus className="mr-2 h-4 w-4" /> Add Funds
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="add-funds" className="pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add Funds</CardTitle>
                <CardDescription>
                  Add funds to your account using PayPal or credit card.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      min="1" 
                      step="1"
                      value={amount} 
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(10)}
                      className={amount === 10 ? 'bg-accent' : ''}
                    >
                      $10
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(25)}
                      className={amount === 25 ? 'bg-accent' : ''}
                    >
                      $25
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(50)}
                      className={amount === 50 ? 'bg-accent' : ''}
                    >
                      $50
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(100)}
                      className={amount === 100 ? 'bg-accent' : ''}
                    >
                      $100
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(200)}
                      className={amount === 200 ? 'bg-accent' : ''}
                    >
                      $200
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(500)}
                      className={amount === 500 ? 'bg-accent' : ''}
                    >
                      $500
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="rounded border border-border p-4 w-full">
                  <PayPalScriptProvider options={{ 
                    "client-id": "test",
                    currency: "USD",
                    intent: "capture",
                  }}>
                    <PayPalButtons
                      style={{ layout: "horizontal" }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                    />
                  </PayPalScriptProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  By proceeding with the payment you agree to our terms of service.
                </p>
              </CardFooter>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Amount</span>
                      <span className="font-semibold">${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Processing Fee</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="border-t border-border pt-4 flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">${amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border border-border rounded-md p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-16 bg-[#0070ba] rounded flex items-center justify-center text-white font-bold">
                          PayPal
                        </div>
                        <span>PayPal</span>
                      </div>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between border border-border rounded-md p-4 opacity-50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-16 bg-[#6772e5] rounded flex items-center justify-center text-white font-bold">
                          Stripe
                        </div>
                        <span>Credit Card</span>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
