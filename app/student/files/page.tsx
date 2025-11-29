'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Download, FileText } from 'lucide-react';

interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export default function UserFilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchFiles();
    }
  }, [session]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.files);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Available Files</h1>
            <p className="text-slate-600">Download files uploaded by administrators</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
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
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                          <Button
                            onClick={() => handleDownload(file.id, file.originalName)}
                            disabled={downloadingId === file.id}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            {downloadingId === file.id ? 'Downloading...' : 'Download'}
                          </Button>
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
  );
}
