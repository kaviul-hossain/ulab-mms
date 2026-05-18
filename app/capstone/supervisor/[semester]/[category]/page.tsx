'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const SUBCATEGORIES = [
  { name: 'Peer Review', code: 'peer', color: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-400' },
  { name: 'Report', code: 'report', color: 'bg-purple-100 dark:bg-purple-900', textColor: 'text-purple-600 dark:text-purple-400' },
  { name: 'Weekly Journal', code: 'weekly-journal', color: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-600 dark:text-green-400' },
];

export default function CategoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const semester = params?.semester as string;
  const category = params?.category as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/capstone/supervisor/${semester}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold capitalize">{category.replace('-', ' ')}</h1>
                <p className="text-sm text-muted-foreground">Semester: {semester}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUBCATEGORIES.map((item, index) => (
            <Link key={index} href={`/capstone/supervisor/${semester}/${category}/${item.code}`}>
              <Card className={`cursor-pointer transition-all hover:shadow-lg ${item.color}`}>
                <CardHeader>
                  <CardTitle className={item.textColor}>{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">View {item.name.toLowerCase()} details</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
