
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/lib/api';
import { Loader2, Plus, UserIcon } from 'lucide-react';

const Users = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { data: users, isLoading: isLoadingUsers, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  if (isLoadingUsers) {
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
            <h3 className="text-sm font-medium text-destructive">Error loading users</h3>
            <div className="mt-2 text-sm text-destructive/80">
              <p>Failed to load user data. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users?.map((user: User) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Role</div>
                <div className="font-medium">{user.role}</div>
                <div className="text-muted-foreground">Created</div>
                <div className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Users;
