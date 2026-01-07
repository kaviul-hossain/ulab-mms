'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Settings, LogOut, Plus, Upload, Copy, Edit, Trash2, BookOpen, FlaskConical, FileText, MoreVertical, Archive, Folder, FolderPlus, Trash2 as TrashIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { notify } from '@/app/utils/notifications';

interface Course {
  _id: string;
  name: string;
  code: string;
  semester: string;
  year: number;
  courseType: 'Theory' | 'Lab';
  isArchived: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [adminPasswordSubmitting, setAdminPasswordSubmitting] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [duplicatingCourse, setDuplicatingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 'Spring',
    year: new Date().getFullYear(),
    courseType: 'Theory' as 'Theory' | 'Lab',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    semester: 'Spring',
    year: new Date().getFullYear(),
    courseType: 'Theory' as 'Theory' | 'Lab',
  });
  const [duplicateFormData, setDuplicateFormData] = useState({
    name: '',
    code: '',
    semester: 'Spring',
    year: new Date().getFullYear(),
    courseType: 'Theory' as 'Theory' | 'Lab',
  });
  const [error, setError] = useState('');
  const [showResourceManager, setShowResourceManager] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [folderName, setFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('/');
  const [folderFiles, setFolderFiles] = useState<Record<string, any[]>>({});
  const [currentBrowseFolderId, setCurrentBrowseFolderId] = useState<string | null>(null);
  const [currentBrowseFiles, setCurrentBrowseFiles] = useState<any[]>([]);
  const [currentBrowseFolders, setCurrentBrowseFolders] = useState<any[]>([]);
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Root' },
  ]);

  // Password-protected admin feature - available to all users
  const handleAdminAccess = () => {
    setShowAdminPasswordModal(true);
    setAdminPassword('');
    setAdminPasswordError('');
  };

  const getAdminPassword = () => {
    return localStorage.getItem('adminPassword') || '';
  };

  const handleAdminPasswordSubmit = async () => {
    if (!adminPassword.trim()) {
      setAdminPasswordError('Please enter the admin password');
      return;
    }

    setAdminPasswordSubmitting(true);
    try {
      // Verify password
      const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Admin@123';
      if (adminPassword === expectedPassword) {
        // Store the admin password in localStorage for the session
        localStorage.setItem('adminPassword', adminPassword);
        setIsAdminUnlocked(true);
        setShowAdminPasswordModal(false);
        setAdminPassword('');
        setAdminPasswordError('');
        // Fetch folders when admin is unlocked
        fetchFolders();
      } else {
        setAdminPasswordError('Incorrect password. Please try again.');
      }
    } finally {
      setAdminPasswordSubmitting(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCourses();
      // Check if admin password is already unlocked in localStorage
      const storedAdminPassword = localStorage.getItem('adminPassword');
      if (storedAdminPassword) {
        setIsAdminUnlocked(true);
      }
    }
  }, [status]);

  const fetchFolders = async (parentFolderId: string | null = null) => {
    try {
      const url = new URL('/api/files/folders', window.location.origin);
      if (parentFolderId) {
        url.searchParams.append('parentFolderId', parentFolderId);
      }
      const response = await fetch(url.toString());
      const data = await response.json();
      setFolders(data.folders || []);
      
      // Fetch files for each folder
      if (data.folders && data.folders.length > 0) {
        for (const folder of data.folders) {
          const filesUrl = new URL('/api/files', window.location.origin);
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
      // Navigate to root
      setFolderBreadcrumbs([{ id: null, name: 'Root' }]);
    } else {
      // Check if we're navigating back via breadcrumb
      const existingIndex = folderBreadcrumbs.findIndex(b => b.id === folderId);
      if (existingIndex !== -1) {
        // We're clicking on a breadcrumb - go back to that level
        setFolderBreadcrumbs(folderBreadcrumbs.slice(0, existingIndex + 1));
      } else {
        // We're going deeper - add this folder to breadcrumbs
        setFolderBreadcrumbs([
          ...folderBreadcrumbs,
          { id: folderId, name: folderName },
        ]);
      }
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': getAdminPassword(),
        },
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

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
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
          'x-admin-password': getAdminPassword(),
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
      // Refresh the current browse folder to show new folder
      browseFolderContents(currentBrowseFolderId);
      // Also refresh the main folders list
      fetchFolders(selectedFolderId);
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
        headers: {
          'x-admin-password': getAdminPassword(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete folder');
      }

      setUploadSuccess('Folder deleted successfully!');
      fetchFolders(selectedFolderId);
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
        headers: {
          'x-admin-password': getAdminPassword(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      setUploadSuccess(`File "${data.file.originalName}" uploaded successfully!`);
      setUploadFile(null);
      // Refresh the current browse folder to show new file
      browseFolderContents(currentBrowseFolderId);
      // Also refresh the main folders list
      fetchFolders(selectedFolderId);
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        notify.course.createError(data.error);
        setError(data.error || 'Failed to create course');
        return;
      }

      notify.course.created(data.course.name);
      setCourses([data.course, ...courses]);
      setShowAddModal(false);
      setFormData({
        name: '',
        code: '',
        semester: 'Spring',
        year: new Date().getFullYear(),
        courseType: 'Theory',
      });
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleArchiveCourse = async (courseId: string, courseName: string) => {
    setArchiving(courseId);
    try {
      const response = await fetch(`/api/courses/${courseId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });

      if (response.ok) {
        notify.course.archived(courseName);
        setCourses(courses.filter(c => c._id !== courseId));
      } else {
        const data = await response.json();
        notify.course.archiveError(data.error);
      }
    } catch (err) {
      console.error('Error archiving course:', err);
      notify.course.archiveError();
    } finally {
      setArchiving(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? All students, exams, and marks will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const deletedCourse = courses.find(c => c._id === courseId);
        notify.course.deleted(deletedCourse?.name);
        setCourses(courses.filter((c) => c._id !== courseId));
      } else {
        notify.course.deleteError();
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      notify.course.deleteError();
    }
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editingCourse) return;

    try {
      const response = await fetch(`/api/courses/${editingCourse._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        notify.course.updateError(data.error);
        setError(data.error || 'Failed to update course');
        return;
      }

      notify.course.updated(data.course.name);
      // Update the course in the list
      setCourses(courses.map(c => c._id === editingCourse._id ? data.course : c));
      setShowEditModal(false);
      setEditingCourse(null);
      setEditFormData({
        name: '',
        code: '',
        semester: 'Spring',
        year: new Date().getFullYear(),
        courseType: 'Theory',
      });
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditFormData({
      name: course.name,
      code: course.code,
      semester: course.semester,
      year: course.year,
      courseType: course.courseType,
    });
    setShowEditModal(true);
  };

  const openDuplicateModal = (course: Course) => {
    setDuplicatingCourse(course);
    setDuplicateFormData({
      name: `${course.name} (Copy)`,
      code: `${course.code}-COPY`,
      semester: course.semester,
      year: course.year,
      courseType: course.courseType,
    });
    setShowDuplicateModal(true);
  };

  const handleImportCourse = async () => {
    if (!importFile) {
      notify.exportImport.noFileSelected();
      return;
    }

    setImporting(true);
    try {
      const fileContent = await importFile.text();
      const courseData = JSON.parse(fileContent);

      // Validate the import file structure
      if (!courseData.version || !courseData.course || !courseData.students || !courseData.exams) {
        notify.exportImport.invalidFile();
        return;
      }

      const response = await fetch('/api/courses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        const data = await response.json();
        notify.exportImport.importSuccess(`Course "${data.course.name}"`);
        setShowImportModal(false);
        setImportFile(null);
        await fetchCourses(); // Refresh the course list
      } else {
        const data = await response.json();
        notify.exportImport.importError(data.error);
      }
    } catch (err) {
      console.error('Import error:', err);
      notify.exportImport.importError();
    } finally {
      setImporting(false);
    }
  };

  const handleDuplicateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!duplicatingCourse) return;

    setDuplicating(true);
    try {
      // First, export the course data
      const exportResponse = await fetch(`/api/courses/${duplicatingCourse._id}/export`);
      if (!exportResponse.ok) {
        throw new Error('Failed to export course data');
      }
      const courseData = await exportResponse.json();

      // Update the course data with new details
      courseData.course.name = duplicateFormData.name;
      courseData.course.code = duplicateFormData.code;
      courseData.course.semester = duplicateFormData.semester;
      courseData.course.year = duplicateFormData.year;
      courseData.course.courseType = duplicateFormData.courseType;

      // Import as a new course
      const importResponse = await fetch('/api/courses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      });

      if (importResponse.ok) {
        const data = await importResponse.json();
        notify.course.duplicated(data.course.name);
        setShowDuplicateModal(false);
        setDuplicatingCourse(null);
        setDuplicateFormData({
          name: '',
          code: '',
          semester: 'Spring',
          year: new Date().getFullYear(),
          courseType: 'Theory',
        });
        await fetchCourses(); // Refresh the course list
      } else {
        const data = await importResponse.json();
        notify.course.duplicateError(data.error);
        setError(data.error || 'Error duplicating course');
      }
    } catch (err) {
      console.error('Duplicate error:', err);
      notify.course.duplicateError();
      setError('Error duplicating course. Please try again.');
    } finally {
      setDuplicating(false);
    }
  };



  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  Marks Management System
                </h1>
                <p className="text-xs text-muted-foreground">
                  Welcome, {session?.user?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="default" asChild>
                <Link href="/capstone">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Capstone
                </Link>
              </Button>
              {isAdminUnlocked ? (
                <>
                  <Button 
                    variant="outline"
                    disabled
                    className="border-orange-500 text-orange-500 cursor-not-allowed opacity-70"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin (Unlocked)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem('adminPassword');
                      setIsAdminUnlocked(false);
                    }}
                    className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Lock Admin
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline"
                  onClick={handleAdminAccess}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="destructive"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              My Courses
            </h2>
            <p className="text-muted-foreground">
              Manage your courses and student marks
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Course
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>

        {/* Quick Access Card for Files - Admin Only */}
        {isAdminUnlocked && (
          <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Manage Resources</h3>
                    <p className="text-sm text-muted-foreground">Create folders, upload files, and manage all resources</p>
                  </div>
                </div>
                <Button size="lg" onClick={() => {
                  setShowResourceManager(true);
                  browseFolderContents(null); // Initialize with root folder
                }}>
                  <Folder className="h-4 w-4 mr-2" />
                  Open Manager
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources Card for Non-Admin Users */}
        {!isAdminUnlocked && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Resources</h3>
                    <p className="text-sm text-muted-foreground">Download files uploaded by administrators</p>
                  </div>
                </div>
                <Button asChild size="lg">
                  <Link href={`/${session?.user?.name?.replace(/\s+/g, '-')}/files`}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Files
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📚</span>
              </div>
              <CardTitle className="mb-2">
                No Courses Yet
              </CardTitle>
              <CardDescription className="mb-6">
                Get started by creating your first course
              </CardDescription>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      course.courseType === 'Theory' 
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600' 
                        : 'bg-gradient-to-br from-purple-600 to-pink-600'
                    }`}>
                      {course.courseType === 'Theory' ? (
                        <BookOpen className="h-6 w-6 text-white" />
                      ) : (
                        <FlaskConical className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(course)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDuplicateModal(course)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleArchiveCourse(course._id, course.name)}
                          disabled={archiving === course._id}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {archiving === course._id ? 'Archiving...' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCourse(course._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-4">{course.name}</CardTitle>
                  <CardDescription>{course.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="mb-4">
                    {course.courseType} Course
                  </Badge>
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <Badge variant="outline">{course.semester}</Badge>
                    <Badge variant="outline">{course.year}</Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/course/${course._id}`}>
                      Open Course →
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-name">Course Name</Label>
              <Input
                id="course-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Data Structures"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-code">Course Code</Label>
              <Input
                id="course-code"
                type="text"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., CSE201"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <select
                id="semester"
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                required
                min="2000"
                max="2100"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-type">Course Type</Label>
              <select
                id="course-type"
                value={formData.courseType}
                onChange={(e) =>
                  setFormData({ ...formData, courseType: e.target.value as 'Theory' | 'Lab' })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Theory">Theory Course</option>
                <option value="Lab">Lab Course</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {formData.courseType === 'Theory' 
                  ? '📖 Theory courses include Midterm and Final exams with CO breakdown'
                  : '🔬 Lab courses include Lab Final and OEL/CE Project'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Course</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEditCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-course-name">Course Name</Label>
              <Input
                id="edit-course-name"
                type="text"
                required
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="e.g., Data Structures"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-course-code">Course Code</Label>
              <Input
                id="edit-course-code"
                type="text"
                required
                value={editFormData.code}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, code: e.target.value })
                }
                placeholder="e.g., CSE201"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-semester">Semester</Label>
              <select
                id="edit-semester"
                value={editFormData.semester}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, semester: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-year">Year</Label>
              <Input
                id="edit-year"
                type="number"
                required
                min="2000"
                max="2100"
                value={editFormData.year}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, year: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-course-type">Course Type</Label>
              <select
                id="edit-course-type"
                value={editFormData.courseType}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, courseType: e.target.value as 'Theory' | 'Lab' })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Theory">Theory Course</option>
                <option value="Lab">Lab Course</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {editFormData.courseType === 'Theory' 
                  ? '📖 Theory courses include Midterm and Final exams with CO breakdown'
                  : '🔬 Lab courses include Lab Final and OEL/CE Project'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCourse(null);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Course Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Course</DialogTitle>
            <DialogDescription>
              Select a course backup JSON file to import. This will create a new course with all students, exams, and marks from the backup.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertDescription>
              ⚠️ This will create a new course. The imported data will not affect existing courses.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="import-file">Select JSON Backup File</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            {importFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {importFile.name}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportCourse}
              disabled={!importFile || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Course Modal */}
      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Course</DialogTitle>
            <DialogDescription>
              This will create a new course with all students, exams, and marks from <strong>{duplicatingCourse?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleDuplicateCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dup-course-name">Course Name</Label>
              <Input
                id="dup-course-name"
                type="text"
                required
                value={duplicateFormData.name}
                onChange={(e) =>
                  setDuplicateFormData({ ...duplicateFormData, name: e.target.value })
                }
                placeholder="e.g., Data Structures (Copy)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dup-course-code">Course Code</Label>
              <Input
                id="dup-course-code"
                type="text"
                required
                value={duplicateFormData.code}
                onChange={(e) =>
                  setDuplicateFormData({ ...duplicateFormData, code: e.target.value })
                }
                placeholder="e.g., CSE201-COPY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dup-semester">Semester</Label>
              <select
                id="dup-semester"
                value={duplicateFormData.semester}
                onChange={(e) =>
                  setDuplicateFormData({ ...duplicateFormData, semester: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dup-year">Year</Label>
              <Input
                id="dup-year"
                type="number"
                required
                min="2000"
                max="2100"
                value={duplicateFormData.year}
                onChange={(e) =>
                  setDuplicateFormData({ ...duplicateFormData, year: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dup-course-type">Course Type</Label>
              <select
                id="dup-course-type"
                value={duplicateFormData.courseType}
                onChange={(e) =>
                  setDuplicateFormData({ ...duplicateFormData, courseType: e.target.value as 'Theory' | 'Lab' })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="Theory">Theory Course</option>
                <option value="Lab">Lab Course</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {duplicateFormData.courseType === 'Theory' 
                  ? '📖 Theory courses include Midterm and Final exams with CO breakdown'
                  : '🔬 Lab courses include Lab Final and OEL/CE Project'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicatingCourse(null);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={duplicating}>
                {duplicating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Duplicating...
                  </>
                ) : (
                  'Duplicate Course'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unified Resource Manager Modal - Admin Only */}
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
            <div className="p-3 bg-green-100 border border-green-400 rounded-lg text-green-700 text-sm">
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
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        📁 {folder.name}
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
                      className="text-blue-600 hover:text-blue-800 text-sm"
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
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
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

      {/* Admin Password Modal */}
      <Dialog open={showAdminPasswordModal} onOpenChange={setShowAdminPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
            <DialogDescription>
              Enter the admin password to access resource management features
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {adminPasswordError && (
              <Alert variant="destructive">
                <AlertDescription>{adminPasswordError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setAdminPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminPasswordSubmit();
                  }
                }}
                disabled={adminPasswordSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdminPasswordModal(false)}
              disabled={adminPasswordSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdminPasswordSubmit}
              disabled={adminPasswordSubmitting}
            >
              {adminPasswordSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Unlock Admin'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
