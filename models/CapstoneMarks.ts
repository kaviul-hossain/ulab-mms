import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICapstoneMarks extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId; // Capstone course (CSE4098A, CSE4098B, etc.)
  groupId?: mongoose.Types.ObjectId; // Group that the marks are for (IMPORTANT for group isolation)
  supervisorId: mongoose.Types.ObjectId;
  evaluatorId?: mongoose.Types.ObjectId;
  supervisorRole?: 'supervisor' | 'evaluator' | 'both'; // Role assigned by admin
  evaluatorRole?: 'supervisor' | 'evaluator' | 'both'; // Role assigned by admin
  supervisorMarks?: number;
  supervisorComments?: string;
  evaluatorMarks?: number;
  evaluatorComments?: string;
  weeklyJournalMarks?: number;
  weeklyJournalComments?: string;
  peerMarks?: number;
  peerComments?: string;
  reportRubrics?: {
    // CSE4098A rubrics
    abstract?: number;
    backgroundLiterature?: number;
    problemStatement?: number;
    objectiveAndSignificance?: number;
    scopeAndLimitation?: number;
    literatureReviewAndAnalysis?: number;
    requirementsTaskDistributionBudgets?: number;
    tools?: number;
    referencesAndCitations?: number;
    communication?: number;
    // CSE4098B rubrics
    abstractAndBackground?: number;
    literatureReview?: number;
    performanceEvaluation?: number;
    literatureAnalysis?: number;
    projectManagement?: number;
    modernTools?: number;
    designSolution?: number;
    implementSolution?: number;
    experimentalResult?: number;
    societalAspects?: number;
    sustainability?: number;
    ethicalPrinciples?: number;
    conclusion?: number;
    references?: number;
    // CSE4098C and CSE499 rubrics (same rubrics)
    abstractProblemStatement?: number;
    literatureReviewAnalysis?: number;
    performanceEvaluationCriterion?: number;
    projectManagementFinancial?: number;
    usageModernTools?: number;
    implementation?: number;
    evaluateSolution?: number;
    investigateFinalResult?: number;
    societalHealthSafety?: number;
    environmentSustainability?: number;
    ethicalProfessional?: number;
    conclusionFutureWorks?: number;
    referencesCitations?: number;
  };
  reportMarks?: number;
  reportComments?: string;
  finalMarks?: number;
  submittedBy: mongoose.Types.ObjectId; // User who submitted the marks
  submissionType: 'supervisor' | 'evaluator' | 'weeklyJournal' | 'peer' | 'report';
  assignedBy?: mongoose.Types.ObjectId; // Admin who assigned the student
  createdAt: Date;
  updatedAt: Date;
}

const CapstoneMarsSchema: Schema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'CapstoneGroup',
      default: null, // Optional for backward compatibility, but IMPORTANT for group isolation
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evaluatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    supervisorRole: {
      type: String,
      enum: ['supervisor', 'evaluator', 'both'],
      default: 'supervisor',
    },
    evaluatorRole: {
      type: String,
      enum: ['supervisor', 'evaluator', 'both'],
      default: 'evaluator',
    },
    supervisorMarks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
      default: null,
    },
    supervisorComments: {
      type: String,
      default: '',
    },
    evaluatorMarks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
      default: null,
    },
    evaluatorComments: {
      type: String,
      default: '',
    },
    weeklyJournalMarks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [10, 'Weekly journal marks cannot exceed 10'],
      default: null,
    },
    weeklyJournalComments: {
      type: String,
      default: '',
    },
    peerMarks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [5, 'Peer marks cannot exceed 5'],
      default: null,
    },
    peerComments: {
      type: String,
      default: '',
    },
    reportRubrics: {
      type: {
        // CSE4098A rubrics
        abstract: { type: Number, min: 0, max: 3, default: null },
        backgroundLiterature: { type: Number, min: 0, max: 3, default: null },
        problemStatement: { type: Number, min: 0, max: 3, default: null },
        objectiveAndSignificance: { type: Number, min: 0, max: 3, default: null },
        scopeAndLimitation: { type: Number, min: 0, max: 3, default: null },
        literatureReviewAndAnalysis: { type: Number, min: 0, max: 3, default: null },
        requirementsTaskDistributionBudgets: { type: Number, min: 0, max: 3, default: null },
        tools: { type: Number, min: 0, max: 3, default: null },
        referencesAndCitations: { type: Number, min: 0, max: 3, default: null },
        communication: { type: Number, min: 0, max: 3, default: null },
        // CSE4098B rubrics
        abstractAndBackground: { type: Number, min: 0, max: 3, default: null },
        literatureReview: { type: Number, min: 0, max: 3, default: null },
        performanceEvaluation: { type: Number, min: 0, max: 3, default: null },
        literatureAnalysis: { type: Number, min: 0, max: 3, default: null },
        projectManagement: { type: Number, min: 0, max: 3, default: null },
        modernTools: { type: Number, min: 0, max: 3, default: null },
        designSolution: { type: Number, min: 0, max: 3, default: null },
        implementSolution: { type: Number, min: 0, max: 3, default: null },
        experimentalResult: { type: Number, min: 0, max: 3, default: null },
        societalAspects: { type: Number, min: 0, max: 3, default: null },
        sustainability: { type: Number, min: 0, max: 3, default: null },
        ethicalPrinciples: { type: Number, min: 0, max: 3, default: null },
        conclusion: { type: Number, min: 0, max: 3, default: null },
        references: { type: Number, min: 0, max: 3, default: null },
        // CSE4098C and CSE499 rubrics (same rubrics for both courses)
        abstractProblemStatement: { type: Number, min: 0, max: 3, default: null },
        literatureReviewAnalysis: { type: Number, min: 0, max: 3, default: null },
        performanceEvaluationCriterion: { type: Number, min: 0, max: 3, default: null },
        projectManagementFinancial: { type: Number, min: 0, max: 3, default: null },
        usageModernTools: { type: Number, min: 0, max: 3, default: null },
        implementation: { type: Number, min: 0, max: 3, default: null },
        evaluateSolution: { type: Number, min: 0, max: 3, default: null },
        investigateFinalResult: { type: Number, min: 0, max: 3, default: null },
        societalHealthSafety: { type: Number, min: 0, max: 3, default: null },
        environmentSustainability: { type: Number, min: 0, max: 3, default: null },
        ethicalProfessional: { type: Number, min: 0, max: 3, default: null },
        conclusionFutureWorks: { type: Number, min: 0, max: 3, default: null },
        referencesCitations: { type: Number, min: 0, max: 3, default: null },
      },
      default: {},
    },
    reportMarks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [54, 'Report marks cannot exceed 54'],
      default: null,
    },
    reportComments: {
      type: String,
      default: '',
    },
    finalMarks: {
      type: Number,
      default: null,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissionType: {
      type: String,
      enum: ['supervisor', 'evaluator', 'weeklyJournal', 'peer', 'report'],
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
CapstoneMarsSchema.index({ studentId: 1, courseId: 1, supervisorId: 1 });
CapstoneMarsSchema.index({ supervisorId: 1, courseId: 1 });
CapstoneMarsSchema.index({ evaluatorId: 1, courseId: 1 });
CapstoneMarsSchema.index({ courseId: 1 });
CapstoneMarsSchema.index({ groupId: 1, courseId: 1 });

// Unique compound index to prevent duplicate records per student/course/group/supervisor/submissionType combination
// This ensures marks are isolated per group
CapstoneMarsSchema.index({ studentId: 1, courseId: 1, groupId: 1, supervisorId: 1, submissionType: 1 }, { unique: true, sparse: true });

const CapstoneMarks: Model<ICapstoneMarks> =
  mongoose.models.CapstoneMarks || mongoose.model<ICapstoneMarks>('CapstoneMarks', CapstoneMarsSchema);

export default CapstoneMarks;
