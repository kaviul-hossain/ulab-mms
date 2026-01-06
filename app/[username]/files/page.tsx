'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Download, FileText, ArrowLeft, Trash2, Loader2 } from 'lucide-react';

interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export default function UserFilesPage({ params }: { params: Promise<{ username: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setUsername(resolvedParams.username);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchFiles();
    }
  }, [session, selectedFolderId]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      
      // Fetch folders
      const foldersUrl = new URL('/api/files/folders', window.location.origin);
      if (selectedFolderId) {
        foldersUrl.searchParams.append('parentFolderId', selectedFolderId);
      }
      const foldersResponse = await fetch(foldersUrl.toString());
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json();
        setFolders(foldersData.folders || []);
      }

      // Fetch files
      const filesUrl = new URL('/api/files', window.location.origin);
      if (selectedFolderId) {
        filesUrl.searchParams.append('folderId', selectedFolderId);
      }
      const filesResponse = await fetch(filesUrl.toString());
      if (!filesResponse.ok) throw new Error('Failed to fetch files');
      const data = await filesResponse.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      setDownloadingId(fileId);
      const response = await fetch(`/api/files/${fileId}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    } finally {
      setDownloadingId('');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    // This function is no longer used - file deletion is handled from the admin dashboard
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    return '📎';
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b bg-background/80">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/ulab.svg"
                alt="ULAB Logo"
                width={80}
                height={80}
                className="drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Available Files
                </h1>
                <p className="text-xs text-muted-foreground">
                  Download resources uploaded by administrators
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Download Resources</h2>
              <p className="text-slate-600">All files uploaded by administrators are available below</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {deleteError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{deleteError}</p>
              </div>
            )}

            {/* Folder Navigation */}
            {selectedFolderId && (
              <div className="mb-6">
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                >
                  ← Back to Root
                </button>
              </div>
            )}

            {/* Folders Display */}
            {folders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Folders</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors text-center group"
                    >
                      <div className="text-4xl mb-2">📁</div>
                      <p className="font-medium text-slate-900 truncate group-hover:text-blue-600">
                        {folder.name}
                      </p>
                    </button>
                  ))}
                </div>
                <hr className="my-8" />
              </div>
            )}

            <div>
              {isLoading ? (
                <div className="text-center py-8 text-slate-600">Loading files...</div>
              ) : files.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No files available yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="text-black dark:text-white font-bold">Filename</TableHead>
                      <TableHead className="text-black dark:text-white font-bold">Size</TableHead>
                      <TableHead className="text-black dark:text-white font-bold">Uploaded By</TableHead>
                      <TableHead className="text-black dark:text-white font-bold">Uploaded At</TableHead>
                      <TableHead className="text-right text-black dark:text-white font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium text-slate-900">
                            <span className="mr-2">{getFileIcon(file.mimeType)}</span>
                            {file.originalName}
                          </TableCell>
                          <TableCell className="text-slate-600">{formatFileSize(file.size)}</TableCell>
                          <TableCell className="text-slate-600">{file.uploadedBy}</TableCell>
                          <TableCell className="text-slate-600">{formatDate(file.uploadedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                onClick={() => handleDownload(file.id, file.originalName)}
                                disabled={downloadingId === file.id}
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                {downloadingId === file.id ? 'Downloading...' : 'Download'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
