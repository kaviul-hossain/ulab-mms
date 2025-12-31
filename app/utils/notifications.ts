import { toast } from 'sonner';

/**
 * Centralized Notification Service using OOP principles
 * Provides consistent toast notifications across the entire application
 */
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ============================================
  // AUTHENTICATION NOTIFICATIONS
  // ============================================

  auth = {
    signInSuccess: () => {
      toast.success('Welcome back! Signed in successfully');
    },
    signInError: (error?: string) => {
      toast.error(error || 'Failed to sign in. Please check your credentials');
    },
    signUpSuccess: () => {
      toast.success('Account created successfully! Please sign in');
    },
    signUpError: (error?: string) => {
      toast.error(error || 'Failed to create account');
    },
    signOutSuccess: () => {
      toast.success('Signed out successfully');
    },
    passwordChanged: () => {
      toast.success('Password changed successfully!');
    },
    passwordChangeError: (error?: string) => {
      toast.error(error || 'Failed to change password');
    },
  };

  // ============================================
  // STUDENT OPERATIONS
  // ============================================

  student = {
    added: (studentName?: string) => {
      toast.success(studentName ? `Student ${studentName} added successfully!` : 'Student added successfully!');
    },
    addError: (error?: string) => {
      toast.error(error || 'Failed to add student');
    },
    updated: (studentName?: string) => {
      toast.success(studentName ? `Student ${studentName} updated successfully!` : 'Student updated successfully!');
    },
    updateError: (error?: string) => {
      toast.error(error || 'Failed to update student');
    },
    deleted: (studentName?: string) => {
      toast.success(studentName ? `Student ${studentName} deleted successfully!` : 'Student deleted successfully!');
    },
    deleteError: (error?: string) => {
      toast.error(error || 'Failed to delete student');
    },
    bulkImported: (count: number) => {
      toast.success(`Successfully imported ${count} student${count !== 1 ? 's' : ''}!`);
    },
    bulkImportError: (error?: string) => {
      toast.error(error || 'Failed to import students');
    },
    notFound: (studentId?: string) => {
      toast.error(studentId ? `Student ${studentId} not found` : 'Student not found in this course');
    },
    searchSuccess: (studentName: string) => {
      toast.success(`Found: ${studentName}`);
    },
    validationError: (message: string) => {
      toast.error(message);
    },
  };

  // ============================================
  // COURSE OPERATIONS
  // ============================================

  course = {
    created: (courseName?: string) => {
      toast.success(courseName ? `Course "${courseName}" created successfully!` : 'Course created successfully!');
    },
    createError: (error?: string) => {
      toast.error(error || 'Failed to create course');
    },
    updated: (courseName?: string) => {
      toast.success(courseName ? `Course "${courseName}" updated successfully!` : 'Course updated successfully!');
    },
    updateError: (error?: string) => {
      toast.error(error || 'Failed to update course');
    },
    deleted: (courseName?: string) => {
      toast.success(courseName ? `Course "${courseName}" deleted successfully!` : 'Course deleted successfully!');
    },
    deleteError: (error?: string) => {
      toast.error(error || 'Failed to delete course');
    },
    duplicated: (courseName?: string) => {
      toast.success(courseName ? `Course "${courseName}" duplicated successfully!` : 'Course duplicated successfully!');
    },
    duplicateError: (error?: string) => {
      toast.error(error || 'Failed to duplicate course');
    },
    archived: (courseName?: string) => {
      toast.success(courseName ? `Course "${courseName}" archived successfully!` : 'Course archived successfully!');
    },
    archiveError: (error?: string) => {
      toast.error(error || 'Failed to archive course');
    },
    unarchived: (courseName?: string) => {
      toast.success(courseName ? `Course "${courseName}" restored successfully!` : 'Course restored successfully!');
    },
    unarchiveError: (error?: string) => {
      toast.error(error || 'Failed to restore course');
    },
    settingsSaved: () => {
      toast.success('Course settings saved successfully!');
    },
    settingsError: (error?: string) => {
      toast.error(error || 'Failed to save course settings');
    },
  };

  // ============================================
  // EXAM OPERATIONS
  // ============================================

  exam = {
    created: (examName?: string) => {
      toast.success(examName ? `Exam "${examName}" created successfully!` : 'Exam created successfully!');
    },
    createError: (error?: string) => {
      toast.error(error || 'Failed to create exam');
    },
    updated: (examName?: string) => {
      toast.success(examName ? `Exam "${examName}" updated successfully!` : 'Exam updated successfully!');
    },
    updateError: (error?: string) => {
      toast.error(error || 'Failed to update exam');
    },
    deleted: (examName?: string) => {
      toast.success(examName ? `Exam "${examName}" deleted successfully!` : 'Exam deleted successfully!');
    },
    deleteError: (error?: string) => {
      toast.error(error || 'Failed to delete exam');
    },
    settingsUpdated: () => {
      toast.success('Exam settings updated successfully!');
    },
    settingsError: (error?: string) => {
      toast.error(error || 'Failed to update exam settings');
    },
  };

  // ============================================
  // MARK OPERATIONS
  // ============================================

  mark = {
    added: (studentName?: string, examName?: string) => {
      const message = studentName && examName 
        ? `Mark added for ${studentName} in ${examName}!`
        : 'Mark added successfully!';
      toast.success(message);
    },
    addError: (error?: string) => {
      toast.error(error || 'Failed to add mark');
    },
    updated: (studentName?: string, examName?: string) => {
      const message = studentName && examName 
        ? `Mark updated for ${studentName} in ${examName}!`
        : 'Mark updated successfully!';
      toast.success(message);
    },
    updateError: (error?: string) => {
      toast.error(error || 'Failed to update mark');
    },
    bulkSaved: (count: number) => {
      toast.success(`Successfully saved ${count} mark${count !== 1 ? 's' : ''}!`);
    },
    bulkSaveError: (error?: string) => {
      toast.error(error || 'Failed to save marks');
    },
    emptyMarksSet: (count: number) => {
      toast.success(`Successfully set ${count} empty mark${count !== 1 ? 's' : ''} to 0!`);
    },
    emptyMarksError: (error?: string) => {
      toast.error(error || 'Failed to set marks to zero');
    },
    marksReset: (count: number) => {
      toast.success(`Successfully deleted ${count} mark${count !== 1 ? 's' : ''}!`);
    },
    resetError: (error?: string) => {
      toast.error(error || 'Failed to reset marks');
    },
    noMarksToReset: () => {
      toast.error('No marks found for selected exams!');
    },
    allMarksExist: () => {
      toast.error('All students already have marks for selected exams!');
    },
  };

  // ============================================
  // SCALING OPERATIONS
  // ============================================

  scaling = {
    applied: (method?: string) => {
      const message = method 
        ? `${method} scaling applied successfully!`
        : 'Scaling applied successfully!';
      toast.success(message);
    },
    applyError: (error?: string) => {
      toast.error(error || 'Failed to apply scaling');
    },
    targetUpdated: () => {
      toast.success('Scaling target updated successfully!');
    },
    targetUpdatedAndRecalculated: () => {
      toast.success('Scaling target updated and marks recalculated successfully!');
    },
    targetError: (error?: string) => {
      toast.error(error || 'Failed to update scaling target');
    },
    recalculateError: () => {
      toast.error('Scaling target updated but failed to recalculate marks');
    },
    roundingApplied: () => {
      toast.success('Rounding applied successfully!');
    },
    roundingError: (error?: string) => {
      toast.error(error || 'Failed to apply rounding');
    },
    toggledOn: () => {
      toast.success('Scaling enabled successfully!');
    },
    toggledOff: () => {
      toast.success('Scaling disabled successfully!');
    },
    toggleError: (error?: string) => {
      toast.error(error || 'Failed to toggle scaling');
    },
    methodRequired: () => {
      toast.error('Please apply a scaling method first');
    },
    invalidTarget: () => {
      toast.error('Please enter a valid scaling target value');
    },
    targetExceedsTotal: (totalMarks: number) => {
      toast.error(`Scaling target cannot exceed total marks (${totalMarks})`);
    },
  };

  // ============================================
  // EXPORT/IMPORT OPERATIONS
  // ============================================

  exportImport = {
    exportSuccess: (format: 'JSON' | 'CSV', fileName?: string) => {
      const message = fileName 
        ? `${fileName} exported as ${format} successfully!`
        : `Course exported as ${format} successfully!`;
      toast.success(message);
    },
    exportError: (error?: string) => {
      toast.error(error || 'Failed to export course');
    },
    importSuccess: (itemType?: string) => {
      const message = itemType 
        ? `${itemType} imported successfully!`
        : 'Course imported successfully!';
      toast.success(message);
    },
    importError: (error?: string) => {
      toast.error(error || 'Failed to import. Please ensure the file is valid');
    },
    noFileSelected: () => {
      toast.error('Please select a file to import');
    },
    invalidFile: () => {
      toast.error('Invalid file format. Please check your file');
    },
  };

  // ============================================
  // SETTINGS OPERATIONS
  // ============================================

  settings = {
    saved: (settingName?: string) => {
      const message = settingName 
        ? `${settingName} saved successfully!`
        : 'Settings saved successfully!';
      toast.success(message);
    },
    saveError: (error?: string) => {
      toast.error(error || 'Failed to save settings');
    },
    weightagesSaved: () => {
      toast.success('Default weightages saved successfully!');
    },
    invalidWeightage: () => {
      toast.error('Weightages must be between 0 and 100');
    },
    invalidInput: () => {
      toast.error('Please enter valid numbers');
    },
  };

  // ============================================
  // VALIDATION & GENERAL MESSAGES
  // ============================================

  validation = {
    requiredFields: (fields?: string) => {
      const message = fields 
        ? `Please fill in: ${fields}`
        : 'Please fill in all required fields';
      toast.error(message);
    },
    invalidFormat: (field?: string) => {
      const message = field 
        ? `Invalid ${field} format`
        : 'Invalid format';
      toast.error(message);
    },
    noData: (dataType?: string) => {
      const message = dataType 
        ? `No ${dataType} data found`
        : 'No data found';
      toast.error(message);
    },
    passwordsDoNotMatch: () => {
      toast.error('Passwords do not match');
    },
    passwordTooShort: (minLength: number = 6) => {
      toast.error(`Password must be at least ${minLength} characters`);
    },
  };

  // ============================================
  // LOADING & PROCESS MESSAGES
  // ============================================

  loading = {
    start: (message: string) => {
      return toast.loading(message);
    },
    update: (toastId: string | number, message: string) => {
      toast.loading(message, { id: toastId });
    },
    success: (toastId: string | number, message: string) => {
      toast.success(message, { id: toastId });
    },
    error: (toastId: string | number, message: string) => {
      toast.error(message, { id: toastId });
    },
    dismiss: (toastId: string | number) => {
      toast.dismiss(toastId);
    },
  };

  // ============================================
  // GENERIC METHODS
  // ============================================

  success(message: string) {
    toast.success(message);
  }

  error(message: string) {
    toast.error(message);
  }

  info(message: string) {
    toast.info(message);
  }

  warning(message: string) {
    toast.warning(message);
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, messages);
  }
}

// Export singleton instance for easy access
export const notify = NotificationService.getInstance();

// Export default for convenience
export default notify;
