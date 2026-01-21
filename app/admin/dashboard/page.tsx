'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, LogOut, Settings, LayoutDashboard, BookOpen, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AdminSidebar, SidebarItem } from '@/app/components/AdminSidebar';
import { notify } from '@/app/utils/notifications';
import OverviewSection from './components/OverviewSection';
import CourseManagement from './components/CourseManagement';
import ResourcesManager from './components/ResourcesManager';

const sidebarItems: SidebarItem[] = [
  {
    title: 'Overview',
    href: '/admin/dashboard?tab=overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Course Management',
    href: '/admin/dashboard?tab=courses',
    icon: BookOpen,
  },
  {
    title: 'Resources',
    href: '/admin/dashboard?tab=resources',
    icon: FolderOpen,
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [router]);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify');
      if (response.ok) {
        setAuthenticated(true);
      } else {
        router.push('/admin/signin');
      }
    } catch (err) {
      router.push('/admin/signin');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/signout', { method: 'POST' });
      notify.auth.signOutSuccess();
      router.push('/admin/signin');
    } catch (err) {
      console.error('Sign out error:', err);
      notify.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/ulab.svg"
                alt="ULAB Logo"
                width={100}
                height={100}
                className="drop-shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-xs text-muted-foreground">
                  Marks Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Main Content Layout */}
      <div className="flex h-[calc(100vh-88px)]">
        {/* Left Sidebar */}
        <AdminSidebar 
          items={sidebarItems} 
          title="Menu"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {activeTab === 'overview' && <OverviewSection />}
            {activeTab === 'courses' && <CourseManagement />}
            {activeTab === 'resources' && <ResourcesManager />}
          </div>
        </main>
      </div>
    </div>
  );
}
