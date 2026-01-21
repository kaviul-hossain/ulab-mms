'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Menu, LucideIcon } from 'lucide-react';

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface AdminSidebarProps {
  items: SidebarItem[];
  title?: string;
  collapsible?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AdminSidebar({ 
  items, 
  title = 'Admin Portal', 
  collapsible = true,
  isOpen: controlledIsOpen,
  onToggle 
}: AdminSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const pathname = usePathname();
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <aside className={`${
      isOpen ? 'w-64' : 'w-16'
    } transition-all duration-300 border-r bg-card flex flex-col`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="w-full justify-start"
        >
          <Menu className="w-5 h-5" />
          {isOpen && <span className="ml-2 font-medium">{title}</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
            >
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start"
              >
                <Icon className="w-5 h-5" />
                {isOpen && (
                  <div className="flex-1 flex items-center justify-between ml-2">
                    <span className="font-medium">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
