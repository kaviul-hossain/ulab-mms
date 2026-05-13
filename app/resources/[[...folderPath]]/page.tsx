'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, LogOut, Settings, ChevronRight, Download, Folder, File, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { notify } from '@/app/utils/notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface IResourceFolder {
  _id: string;
  name: string;
  parentId: string | null;
  createdBy: { name: string; email: string };
  createdAt: string;
}

interface IStoredFile {
  _id: string;
  filename: string;
  originalName: string;
  folderId: string;
  uploadedBy: { name: string; email: string };
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export default function ResourcesPage({ params }: { params: Promise<{ folderPath?: string[] }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const [folders, setFolders] = useState<IResourceFolder[]>([]);
  const [files, setFiles] = useState<IStoredFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [breadcrumb, setBreadcrumb] = useState<IResourceFolder[]>([]);
  const [breadcrumbDisplayNames, setBreadcrumbDisplayNames] = useState<Map<string, string>>(new Map());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize folderPath from params
  useEffect(() => {
    const initPath = async () => {
      const resolvedParams = await params;
      const path = resolvedParams.folderPath || [];
      setFolderPath(path);
      
      if (path.length > 0) {
        // Resolve folder IDs from the folder names path
        await resolveFolderPath(path);
      }
    };
    initPath();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    loadFolders();
  }, [currentFolderId]);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Resolve folder path by looking up folder names and getting their IDs
  const resolveFolderPath = async (path: string[]) => {
    try {
      let parentId: string | null = null;
      let lastFolderId: string | null = null;
      const breadcrumbItems: IResourceFolder[] = [];
      const displayNames = new Map<string, string>();

      for (const folderName of path) {
        // Decode the folder name from URL
        const decodedName = decodeURIComponent(folderName);
        
        // Fetch folders at this level
        const url: string = parentId
          ? `/api/resources/folders?parentId=${parentId}`
          : '/api/resources/folders';
        
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success || !data.folders) break;

        // Find the folder with this name (handling numbered duplicates)
        let baseName = decodedName;
        let occurrence = 1;
        
        // Check if this has a [number] suffix
        const match = decodedName.match(/^(.+?)\s*\[(\d+)\]$/);
        if (match) {
          baseName = match[1];
          occurrence = parseInt(match[2], 10);
        }

        // Count occurrences and find the right one
        let occurrenceCount = 0;
        let foundFolder: IResourceFolder | null = null;

        for (const folder of data.folders) {
          if (folder.name === baseName) {
            occurrenceCount++;
            if (occurrenceCount === occurrence) {
              foundFolder = folder;
              break;
            }
          }
        }

        if (!foundFolder) break;

        parentId = foundFolder._id;
        lastFolderId = foundFolder._id;
        breadcrumbItems.push(foundFolder);
        
        // Store display name
        const totalCount = data.folders.filter((f: IResourceFolder) => f.name === baseName).length;
        const displayName = totalCount > 1 ? `${baseName} [${occurrenceCount}]` : baseName;
        displayNames.set(foundFolder._id, displayName);
      }

      if (lastFolderId) {
        setCurrentFolderId(lastFolderId);
        setBreadcrumb(breadcrumbItems);
        setBreadcrumbDisplayNames(displayNames);
      }
    } catch (err) {
      toast.error('Failed to load folder path');
    }
  };

  const loadFolders = async () => {
    setLoading(true);
    try {
      const url = currentFolderId
        ? `/api/resources/folders?parentId=${currentFolderId}`
        : '/api/resources/folders';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setFolders(data.folders);
        if (currentFolderId) {
          loadFiles(currentFolderId);
        } else {
          setFiles([]);
        }
      } else {
        toast.error(data.error || 'Failed to load folders');
      }
    } catch (err) {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  // Prevent race conditions from overlapping fetches
  const latestFilesRequestRef = useRef(0);

  const loadFiles = async (folderId: string) => {
    const reqId = ++latestFilesRequestRef.current;
    try {
      const response = await fetch(`/api/resources/files?folderId=${folderId}`);
      const data = await response.json();

      if (reqId !== latestFilesRequestRef.current) return;

      if (data.success) {
        setFiles(data.files);
      } else {
        toast.error(data.error || 'Failed to load files');
      }
    } catch (err) {
      if (reqId === latestFilesRequestRef.current) {
        toast.error('Failed to load files');
      }
    }
  };

  const searchLower = debouncedSearch.toLowerCase();
  const displayedFolders = useMemo(() => {
    if (!debouncedSearch) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(searchLower));
  }, [folders, debouncedSearch]);

  const displayedFiles = useMemo(() => {
    if (!debouncedSearch) return files;
    return files.filter((fl) => fl.originalName.toLowerCase().includes(searchLower));
  }, [files, debouncedSearch]);

  const folderDisplayNames = useMemo(() => {
    const nameCounts = new Map<string, number>();
    const displayNames = new Map<string, string>();

    folders.forEach((folder) => {
      const count = nameCounts.get(folder.name) || 0;
      nameCounts.set(folder.name, count + 1);
    });

    const seen = new Map<string, number>();
    folders.forEach((folder) => {
      const total = nameCounts.get(folder.name) || 0;
      const occurrence = (seen.get(folder.name) || 0) + 1;
      seen.set(folder.name, occurrence);
      displayNames.set(folder._id, total > 1 ? `${folder.name} [${occurrence}]` : folder.name);
    });

    return displayNames;
  }, [folders]);

  const navigateToFolder = (folderId: string, folderName: string) => {
    setFiles([]);
    const displayName = folderDisplayNames.get(folderId) || folderName;
    
    // Build new path
    const newPath = [...folderPath, encodeURIComponent(displayName)];
    router.push(`/resources/${newPath.join('/')}`);
    
    setCurrentFolderId(folderId);
    setBreadcrumb((b) => [...b, { _id: folderId, name: folderName } as IResourceFolder]);
    setBreadcrumbDisplayNames((m) => new Map(m).set(folderId, displayName));
  };

  const navigateTo = (index: number) => {
    setFiles([]);
    if (index === -1) {
      // Navigate to root
      router.push('/resources');
      setCurrentFolderId(null);
      setBreadcrumb([]);
      setBreadcrumbDisplayNames(new Map());
      setFolderPath([]);
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      const newPath = newBreadcrumb.map((f) => encodeURIComponent(breadcrumbDisplayNames.get(f._id) || f.name));
      router.push(`/resources/${newPath.join('/')}`);
      
      setCurrentFolderId(breadcrumb[index]._id);
      setBreadcrumb(newBreadcrumb);
      
      const newDisplayNames = new Map(breadcrumbDisplayNames);
      breadcrumb.slice(index + 1).forEach((f) => newDisplayNames.delete(f._id));
      setBreadcrumbDisplayNames(newDisplayNames);
      setFolderPath(newPath);
    }
  };

  const downloadFile = (fileId: string, fileName: string) => {
    window.location.href = `/api/resources/files/${fileId}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Same as Dashboard */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Image
                  src="/ulab.svg"
                  alt="ULAB Logo"
                  width={100}
                  height={100}
                  className="drop-shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Resources
                </h1>
                <p className="text-xs text-muted-foreground">
                  Welcome, {session?.user?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="default" asChild>
                <Link href="/dashboard">
                  <span className="h-4 w-4 mr-2">📊</span>
                  Dashboard
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link href="/capstone">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Capstone
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  notify.auth.signOutSuccess();
                  signOut({ callbackUrl: '/auth/signin' });
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigateTo(-1)}
              className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
            >
              Resources
            </button>
            {breadcrumb.map((folder, index) => (
              <div key={folder._id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateTo(index)}
                  className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                >
                  {breadcrumbDisplayNames.get(folder._id) || folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search folders or files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button variant="ghost" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Folders Section */}
          {displayedFolders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Folders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedFolders.map((folder) => (
                  <button
                    key={folder._id}
                    onClick={() => navigateToFolder(folder._id, folder.name)}
                    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Folder className="w-6 h-6 text-blue-500" />
                      <h3 className="font-medium text-lg truncate">{folderDisplayNames.get(folder._id) || folder.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created: {formatDate(folder.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {displayedFiles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Files</h2>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {displayedFiles.map((file) => (
                        <tr key={file._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium truncate">{file.originalName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(file.fileSize)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(file.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(file._id, file.originalName)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && folders.length === 0 && files.length === 0 && (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {currentFolderId ? 'This folder is empty' : 'No resources available yet'}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
