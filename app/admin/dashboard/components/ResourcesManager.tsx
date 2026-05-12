'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  File,
  Folder,
  FolderPlus,
  Edit2,
  ChevronRight,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';


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

export default function ResourcesManager() {
  const [folders, setFolders] = useState<IResourceFolder[]>([]);
  const [files, setFiles] = useState<IStoredFile[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<IResourceFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'file'; id: string; name: string } | null>(
    null
  );
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  useEffect(() => {
    loadFolders();
  }, [currentFolderId]);

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
          // Clear files when viewing root folder
          setFiles([]);
        }
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (folderId: string) => {
    try {
      const response = await fetch(`/api/resources/files?folderId=${folderId}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to load files');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      const response = await fetch('/api/resources/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Folder created successfully');
        setNewFolderName('');
        setShowCreateFolder(false);
        // Wait a moment for the database to persist the folder before refreshing
        setTimeout(() => {
          loadFolders();
        }, 800);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to create folder');
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentFolderId) {
      toast.error('Please select a folder first');
      return;
    }

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
        formData.append('folderId', currentFolderId);

        try {
          const response = await fetch('/api/resources/files', {
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
        } catch (err) {
          failCount++;
          console.error(`Error uploading ${file.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded`);
        // Wait a moment for the database to persist the files before fetching
        setTimeout(() => {
          loadFiles(currentFolderId);
        }, 800);
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;

    try {
      const url =
        deleteTarget.type === 'folder'
          ? `/api/resources/folders/${deleteTarget.id}`
          : `/api/resources/files/${deleteTarget.id}`;

      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        toast.success(`${deleteTarget.type === 'folder' ? 'Folder' : 'File'} deleted`);
        setDeleteTarget(null);
        setShowDeleteConfirm(false);
        // Wait a moment for the database to persist the deletion before refreshing
        setTimeout(() => {
          loadFolders();
        }, 800);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleEditFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    try {
      const response = await fetch(`/api/resources/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingFolderName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Folder updated');
        setEditingFolderId(null);
        setEditingFolderName('');
        // Wait a moment for the database to persist the changes before refreshing
        setTimeout(() => {
          loadFolders();
        }, 800);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to update folder');
    }
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setBreadcrumb([...breadcrumb, { _id: folderId, name: folderName } as IResourceFolder]);
  };

  const navigateTo = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setBreadcrumb([]);
    } else {
      setCurrentFolderId(breadcrumb[index]._id);
      setBreadcrumb(breadcrumb.slice(0, index + 1));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resources Manager</CardTitle>
          <CardDescription>Manage hierarchical folder structure and files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigateTo(-1)}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Root
            </button>
            {breadcrumb.map((folder, index) => (
              <div key={folder._id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateTo(index)}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowCreateFolder(true)}
              disabled={loading}
              variant="outline"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <div className="relative">
              <Input
                type="file"
                multiple
                onChange={handleUploadFile}
                disabled={uploading || !currentFolderId}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading || !currentFolderId}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>

          {!currentFolderId && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Create a folder to get started. You can only upload files to folders.
              </p>
            </div>
          )}

          {/* Folders Grid */}
          {folders.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {folders.map((folder) => (
                  <div
                    key={folder._id}
                    className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    {editingFolderId === folder._id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          placeholder="Folder name"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleEditFolder(folder._id)}
                            className="flex-1"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFolderId(null)}
                            className="flex-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => navigateToFolder(folder._id, folder.name)}
                          className="w-full text-left mb-2 flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Folder className="w-5 h-5" />
                          <span className="font-medium truncate">{folder.name}</span>
                        </button>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingFolderId(folder._id);
                              setEditingFolderName(folder.name);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'folder',
                                id: folder._id,
                                name: folder.name,
                              });
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Files</h3>
              <div className="border rounded-lg">
                {files.map((file, index) => (
                  <div
                    key={file._id}
                    className={`flex items-center justify-between p-3 ${
                      index !== files.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="w-5 h-5 flex-shrink-0 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.originalName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          window.location.href = `/api/resources/files/${file._id}`;
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDeleteTarget({
                            type: 'file',
                            id: file._id,
                            name: file.originalName,
                          });
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && folders.length === 0 && files.length === 0 && currentFolderId && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>This folder is empty</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder in {currentFolderId ? 'this folder' : 'the root directory'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type === 'folder' ? 'Folder' : 'File'}?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'folder'
                ? 'This will permanently delete this folder and all its contents (subfolders and files). This action cannot be undone.'
                : `This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
