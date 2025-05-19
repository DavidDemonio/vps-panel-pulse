
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home,
  Server,
  CreditCard,
  Users,
  Settings,
  Menu,
  X,
  BarChart3,
  HardDrive,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
      )}
      onClick={onClick}
    >
      <span className="flex w-5 h-5">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-primary">
            <HardDrive className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-sidebar-foreground">ProxVPS</span>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-2 space-y-1">
        <p className="text-xs font-medium text-sidebar-foreground/50 px-3 py-1.5">General</p>
        <NavItem to="/dashboard" icon={<Home size={16} />} label="Dashboard" onClick={closeSidebar} />
        <NavItem to="/servers" icon={<Server size={16} />} label="Servers" onClick={closeSidebar} />
        <NavItem to="/billing" icon={<CreditCard size={16} />} label="Billing" onClick={closeSidebar} />
        
        {isAdmin && (
          <>
            <p className="text-xs font-medium text-sidebar-foreground/50 px-3 py-1.5 mt-4">Admin</p>
            <NavItem to="/users" icon={<Users size={16} />} label="Users" onClick={closeSidebar} />
            <NavItem to="/nodes" icon={<HardDrive size={16} />} label="Nodes" onClick={closeSidebar} />
            <NavItem to="/statistics" icon={<BarChart3 size={16} />} label="Statistics" onClick={closeSidebar} />
          </>
        )}
        
        <p className="text-xs font-medium text-sidebar-foreground/50 px-3 py-1.5 mt-4">Account</p>
        <NavItem to="/settings" icon={<Settings size={16} />} label="Settings" onClick={closeSidebar} />
        <Button 
          variant="ghost" 
          className="w-full justify-start px-3 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          onClick={() => { logout(); closeSidebar(); }}
        >
          <LogOut size={16} className="mr-3" />
          Logout
        </Button>
      </div>
      
      <div className="px-3 py-4 mt-auto">
        <div className="rounded-md bg-sidebar-accent/50 p-2 text-xs text-sidebar-foreground/70">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-xs font-semibold text-sidebar-primary-foreground">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="truncate font-medium">{user?.name || user?.email}</p>
              <p className="truncate opacity-70">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Sidebar with Toggle
  if (isMobile) {
    return (
      <>
        <Button 
          variant="outline" 
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </Button>
        
        {isOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={closeSidebar} />
        )}
        
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar transition-transform duration-300 ease-in-out transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }
  
  // Desktop Sidebar
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {sidebarContent}
    </aside>
  );
}
