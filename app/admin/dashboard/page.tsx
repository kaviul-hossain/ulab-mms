'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, Settings, Folder, FolderPlus, Upload, FileText, Trash2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { notify } from '@/app/utils/notifications';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  
  // File management states
  const [showResourceManager, setShowResourceManager] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [folderName, setFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [allFoldersForDropdown, setAllFoldersForDropdown] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<Record<string, any[]>>({});
  const [currentBrowseFolderId, setCurrentBrowseFolderId] = useState<string | null>(null);
  const [currentBrowseFiles, setCurrentBrowseFiles] = useState<any[]>([]);
  const [currentBrowseFolders, setCurrentBrowseFolders] = useState<any[]>([]);
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Root' },
  ]);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify');
        const data = await response.json();
        
        if (!data.authenticated) {
          router.push('/admin/signin');
        } else {
          setAuthenticated(true);
          fetchAllNestedFolders();
        }
      } catch (err) {
        router.push('/admin/signin');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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

  const fetchFolders = async (parentFolderId: string | null = null) => {
    try {
      const url = new URL('/api/files/folders', window.location.origin);
      if (parentFolderId) {
        url.searchParams.append('parentFolderId', parentFolderId);
      }
      const response = await fetch(url.toString());
      const data = await response.json();
      setFolders(data.folders || []);

      // Fetch files for each folder to show file count
      for (const folder of data.folders || []) {
        const filesUrl = new URL('/api/files', window.location.origin);
        if (folder.id) {
          filesUrl.searchParams.append('folderId', folder.id);
          const filesResponse = await fetch(filesUrl.toString());
          const filesData = await filesResponse.json();
          setFolderFiles((prev) => ({
            ...prev,
            [folder.id]: filesData.files || [],
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const fetchAllNestedFolders = async () => {
    try {
      const url = new URL('/api/files/folders', window.location.origin);
      url.searchParams.append('nested', 'true');
      const response = await fetch(url.toString());
      const data = await response.json();
      setAllFoldersForDropdown(data.folders || []);
    } catch (err) {
      console.error('Error fetching nested folders:', err);
    }
  };

  const browseFolderContents = async (folderId: string | null) => {
    try {
      setCurrentBrowseFolderId(folderId);

      // Fetch subfolders
      const foldersUrl = new URL('/api/files/folders', window.location.origin);
      if (folderId) {
        foldersUrl.searchParams.append('parentFolderId', folderId);
      }
      const foldersResponse = await fetch(foldersUrl.toString());
      const foldersData = await foldersResponse.json();
      setCurrentBrowseFolders(foldersData.folders || []);

      // Fetch files in this folder
      const filesUrl = new URL('/api/files', window.location.origin);
      if (folderId) {
        filesUrl.searchParams.append('folderId', folderId);
      }
      const filesResponse = await fetch(filesUrl.toString());
      const filesData = await filesResponse.json();
      setCurrentBrowseFiles(filesData.files || []);
    } catch (err) {
      console.error('Error browsing folder:', err);
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    browseFolderContents(folderId);
    
    if (folderId === null) {
      setFolderBreadcrumbs([{ id: null, name: 'Root' }]);
    } else {
      const existingIndex = folderBreadcrumbs.findIndex(b => b.id === folderId);
      if (existingIndex !== -1) {
        setFolderBreadcrumbs(folderBreadcrumbs.slice(0, existingIndex + 1));
      } else {
        setFolderBreadcrumbs([
          ...folderBreadcrumbs,
          { id: folderId, name: folderName },
        ]);
      }
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!folderName.trim()) {
      setError('Please enter a folder name');
      return;
    }

    setCreatingFolder(true);
    try {
      const response = await fetch('/api/files/folders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentFolderId: currentBrowseFolderId || selectedFolderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      setFolderName('');
      setUploadSuccess(`Folder "${folderName}" created successfully!`);
      browseFolderContents(currentBrowseFolderId);
      fetchFolders(selectedFolderId);
      fetchAllNestedFolders();
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete the folder "${folderName}" and all its contents?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete folder');
      }

      setUploadSuccess('Folder deleted successfully!');
      fetchFolders(selectedFolderId);
      fetchAllNestedFolders();
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete folder');
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadSuccess('');

    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const targetFolderId = currentBrowseFolderId || selectedFolderId;
      if (targetFolderId) {
        formData.append('folderId', targetFolderId);
      }

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      setUploadSuccess('File uploaded successfully!');
      setUploadFile(null);
      browseFolderContents(currentBrowseFolderId);
      fetchFolders(selectedFolderId);
      setTimeout(() => setUploadSuccess(''), 3000);

      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      setUploadSuccess('File deleted successfully!');
      browseFolderContents(currentBrowseFolderId);
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Image
                  src="/ulab.svg"
                  alt="ULAB Logo"
                  width={100}
                  height={100}
                  className="drop-shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-xs text-muted-foreground">
                  Resource Management System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" asChild>
                <Link href="/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 pt-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome, Admin
          </h2>
          <p className="text-muted-foreground">
            Manage system resources and files
          </p>
        </div>

        {/* Resource Manager Card */}
        <div className="grid gap-6">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-6 w-6" />
                Resource Manager
              </CardTitle>
              <CardDescription>
                Create folders, upload files, and manage all system resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                onClick={() => {
                  setShowResourceManager(true);
                  browseFolderContents(null);
                }}
                className="w-full sm:w-auto"
              >
                <Folder className="h-4 w-4 mr-2" />
                Open Resource Manager
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Folder className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{allFoldersForDropdown.length}</p>
                  <p className="text-sm text-muted-foreground">Total Folders</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {Object.values(folderFiles).reduce((sum, files) => sum + files.length, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">Active</p>
                  <p className="text-sm text-muted-foreground">System Status</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Resource Manager Modal */}
      <Dialog open={showResourceManager} onOpenChange={setShowResourceManager}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Resource Manager
            </DialogTitle>
            <DialogDescription>
              Create folders, upload files, and manage all your resources in one place
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-green-100 border border-green-400 rounded-lg text-green-700 text-sm dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              {uploadSuccess}
            </div>
          )}

          <div className="space-y-6">
            {/* Create Folder Section */}
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Create New Folder
              </h3>
              <form onSubmit={handleCreateFolder} className="flex gap-2">
                <Input
                  placeholder="Folder name (e.g., Lecture Notes)"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  disabled={creatingFolder}
                />
                <Button type="submit" disabled={creatingFolder || !folderName.trim()}>
                  {creatingFolder ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Upload File Section */}
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </h3>
              <form onSubmit={handleUploadFile} className="space-y-3">
                <div>
                  <Label htmlFor="folder-select" className="text-sm mb-1">
                    Select Folder (Optional)
                  </Label>
                  <select
                    id="folder-select"
                    value={selectedFolderId || ''}
                    onChange={(e) => setSelectedFolderId(e.target.value || null)}
                    disabled={uploadingFile}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Root Folder</option>
                    {allFoldersForDropdown.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="file-input" className="text-sm mb-1">
                    Select File
                  </Label>
                  <Input
                    id="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    disabled={uploadingFile}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Allowed: PDF, Word, Excel (Max 50MB)
                  </p>
                </div>

                <Button type="submit" disabled={uploadingFile || !uploadFile} className="w-full">
                  {uploadingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Folders & Files Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Your Folders & Files ({folders.length} folder{folders.length !== 1 ? 's' : ''})
              </h3>
              
              {folders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No folders created yet. Create one to get started!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/10 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Folder className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{folder.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {folderFiles[folder.id]?.length || 0} file(s)
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFolder(folder.id, folder.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Files in folder */}
                      {folderFiles[folder.id] && folderFiles[folder.id].length > 0 && (
                        <div className="mt-2 ml-8 space-y-1 text-sm">
                          {folderFiles[folder.id].map((file: any) => (
                            <div key={file.id} className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span className="truncate">{file.originalName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Browse Resources Section */}
            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Browse & Manage Files
              </h3>

              {/* Breadcrumb Navigation */}
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                {folderBreadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      onClick={() => navigateToFolder(crumb.id, crumb.name)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      {crumb.name}
                    </button>
                    {index < folderBreadcrumbs.length - 1 && (
                      <span className="text-muted-foreground">/</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Subfolders */}
              {currentBrowseFolders.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Folders</p>
                  <div className="space-y-1">
                    {currentBrowseFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => navigateToFolder(folder.id, folder.name)}
                        className="w-full text-left p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-sm flex items-center gap-2 group"
                      >
                        <Folder className="h-4 w-4 text-yellow-500" />
                        <span className="group-hover:font-medium">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {currentBrowseFiles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Files</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {currentBrowseFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-sm flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{file.originalName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id, file.originalName)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentBrowseFolders.length === 0 && currentBrowseFiles.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  This folder is empty
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResourceManager(false);
                setError('');
                setUploadSuccess('');
                setFolderName('');
                setUploadFile(null);
                setCurrentBrowseFolderId(null);
                setFolderBreadcrumbs([{ id: null, name: 'Root' }]);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
