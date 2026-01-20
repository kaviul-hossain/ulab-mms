'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Trash2, File, Folder, RefreshCw, Github, ExternalLink, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  download_url: string;
  type: 'file' | 'dir';
}

export default function FileExplorer() {
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/github-files?path=${encodeURIComponent(currentPath)}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
      } else {
        setError(data.error);
        toast.error(data.error);
      }
    } catch (err: any) {
      setError('Failed to load files');
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);

    try {
      const response = await fetch('/api/github-files', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`File "${file.name}" uploaded successfully!`);
        loadFiles(); // Reload file list
        event.target.value = ''; // Reset input
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: GitHubFile) => {
    try {
      toast.loading('Downloading...', { id: 'download' });
      
      const response = await fetch(`/api/github-files/${file.path}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Downloaded successfully!', { id: 'download' });
    } catch (err: any) {
      toast.error('Failed to download file', { id: 'download' });
    }
  };

  const handleDelete = async (file: GitHubFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      toast.loading('Deleting...', { id: 'delete' });
      
      const response = await fetch(`/api/github-files/${file.path}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File deleted successfully!', { id: 'delete' });
        loadFiles(); // Reload file list
      } else {
        toast.error(data.error, { id: 'delete' });
      }
    } catch (err: any) {
      toast.error('Failed to delete file', { id: 'delete' });
    }
  };

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    setCreatingFolder(true);
    try {
      const response = await fetch('/api/github-files/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: newFolderName.trim(),
          path: currentPath,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Folder "${newFolderName}" created successfully!`);
        setShowCreateFolder(false);
        setNewFolderName('');
        loadFiles(); // Reload file list
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Github className="h-8 w-8" />
              GitHub File Explorer
            </h1>
            <p className="text-muted-foreground mt-1">
              Test GitHub as file storage - No authentication required
            </p>
          </div>
          <Button onClick={loadFiles} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Current Directory
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowCreateFolder(true)}
                  variant="outline"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <label htmlFor="file-upload">
                  <Button 
                    disabled={uploading} 
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </span>
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                />
              </div>
            </CardTitle>
            <CardDescription>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => setCurrentPath('')}
                  className="hover:underline font-medium"
                >
                  root
                </button>
                {pathParts.map((part, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <span>/</span>
                    <button
                      onClick={() => setCurrentPath(pathParts.slice(0, index + 1).join('/'))}
                      className="hover:underline font-medium"
                    >
                      {part}
                    </button>
                  </span>
                ))}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Navigation */}
            {currentPath && (
              <div className="mb-4">
                <Button onClick={navigateUp} variant="outline" size="sm">
                  ← Back
                </Button>
              </div>
            )}

            {/* File List */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No files in this directory</p>
                <p className="text-sm">Upload a file to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {file.type === 'dir' ? (
                        <Folder className="h-5 w-5 text-blue-500" />
                      ) : (
                        <File className="h-5 w-5 text-gray-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => file.type === 'dir' && navigateToFolder(file.path)}
                          className={`font-medium truncate block ${
                            file.type === 'dir' ? 'hover:underline text-blue-600' : ''
                          }`}
                        >
                          {file.name}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {file.type === 'file' && formatSize(file.size)}
                        </p>
                      </div>
                    </div>
                    
                    {file.type === 'file' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Files:</span>
              <span className="font-medium">{files.filter(f => f.type === 'file').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Folders:</span>
              <span className="font-medium">{files.filter(f => f.type === 'dir').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Path:</span>
              <span className="font-mono text-xs">/{currentPath || 'root'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Create Folder Dialog */}
        <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for the new folder. Only letters, numbers, hyphens, and underscores are allowed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="my-folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder();
                    }
                  }}
                />
              </div>
              {currentPath && (
                <p className="text-sm text-muted-foreground">
                  Will be created in: <span className="font-mono">/{currentPath}</span>
                </p>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                disabled={creatingFolder}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={creatingFolder}>
                {creatingFolder ? 'Creating...' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
