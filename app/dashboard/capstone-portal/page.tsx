'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CapstoneManagement from '@/app/admin/dashboard/components/CapstoneManagement';

export default function CapstonePortal() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Check if admin is unlocked via localStorage
    const adminPassword = localStorage.getItem('adminPassword');
    if (!adminPassword) {
      setLoading(false);
      setIsAdminUnlocked(false);
      return;
    }

    setIsAdminUnlocked(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (mounted && !isAdminUnlocked && !loading) {
      router.push('/dashboard');
    }
  }, [mounted, isAdminUnlocked, loading, router]);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminUnlocked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Image
                  src="/ulab.svg"
                  alt="ULAB Logo"
                  width={40}
                  height={40}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Capstone Management Portal</h1>
                <p className="text-xs text-muted-foreground">
                  Create and manage capstone student groups
                </p>
              </div>
            </div>

            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 pt-8">
        <CapstoneManagement />
      </div>
    </div>
  );
}
