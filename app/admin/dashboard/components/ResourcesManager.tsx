'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Trash2, File, Folder, RefreshCw, FolderPlus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

export default function ResourcesManager() {
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [currentPath, setCurrentPath] = useState('common');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/github-files?path=${encodeURIComponent(currentPath)}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
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
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to upload ${file.name}:`, data.error);
          }
        } catch (err: any) {
          failCount++;
          console.error(`Error uploading ${file.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully!`);
        loadFiles();
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
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

    setDeletingPath(file.path);
    try {
      toast.loading('Deleting...', { id: 'delete' });
      
      if (file.type === 'dir') {
        // For directories, delete the .gitkeep file
        const gitkeepPath = `${file.path}/.gitkeep`;
        const response = await fetch(`/api/github-files/${encodeURIComponent(gitkeepPath)}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Folder deleted successfully!', { id: 'delete' });
          loadFiles();
        } else {
          toast.error(data.error, { id: 'delete' });
        }
      } else {
        // For files, delete normally
        const response = await fetch(`/api/github-files/${encodeURIComponent(file.path)}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          toast.success('File deleted successfully!', { id: 'delete' });
          loadFiles();
        } else {
          toast.error(data.error, { id: 'delete' });
        }
      }
    } catch (err: any) {
      toast.error('Failed to delete file', { id: 'delete' });
    } finally {
      setDeletingPath(null);
    }
  };

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  const navigateUp = () => {
    if (currentPath === 'common') return; // Can't go above common
    
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? parts.join('/') : 'common');
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
        loadFiles();
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

  // Get display path (showing "Common" instead of actual path)
  const getDisplayPath = () => {
    if (currentPath === 'common') return 'Common';
    const parts = currentPath.split('/').filter(Boolean);
    parts[0] = 'Common'; // Replace 'common' with 'Common' for display
    return parts.join(' / ');
  };

  const canNavigateUp = currentPath !== 'common';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Resources</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Manage common resources shared across all courses. Create folders to organize files, and upload files to any folder. All files are stored on GitHub.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button onClick={loadFiles} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              <span className="font-mono text-base">/{getDisplayPath()}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowCreateFolder(true)}
                variant="outline"
                size="sm"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <label htmlFor="file-upload">
                <Button 
                  disabled={uploading} 
                  size="sm"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Files'}
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleUpload}
                className="hidden"
                multiple
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Breadcrumb Navigation */}
          <div className="mb-4 flex items-center gap-2">
            <Button 
              onClick={() => setCurrentPath('common')}
              variant={currentPath === 'common' ? 'default' : 'outline'}
              size="sm"
            >
              Common
            </Button>
            {currentPath !== 'common' && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium">
                  {currentPath.split('/').filter(Boolean).slice(1).join(' / ')}
                </span>
              </>
            )}
          </div>

          {/* Navigation */}
          {canNavigateUp && (
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
              <p className="text-sm">Upload a file or create a folder to get started</p>
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
                      <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => file.type === 'dir' && navigateToFolder(file.path)}
                        className={`font-medium truncate block ${
                          file.type === 'dir' ? 'hover:underline text-blue-600' : ''
                        }`}
                        disabled={file.type !== 'dir'}
                      >
                        {file.name}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {file.type === 'file' && formatSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.type === 'file' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(file)}
                        disabled={deletingPath === file.path}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(file)}
                      disabled={deletingPath === file.path}
                    >
                      {deletingPath === file.path ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Files:</span>
            <span className="font-medium">{files.filter(f => f.type === 'file').length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Folders:</span>
            <span className="font-medium">{files.filter(f => f.type === 'dir').length}</span>
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
            <p className="text-sm text-muted-foreground">
              Will be created in: <span className="font-mono">/{getDisplayPath()}</span>
            </p>
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
  );
}
