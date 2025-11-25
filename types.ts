
export enum UserRole {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  CLIENT = 'CLIENT'
}

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AccessRequest {
  requesterId: string;
  requesterName: string;
  timestamp: string;
  status: AccessRequestStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for auth simulation
  role: UserRole;
  avatar: string;
  company?: string; // For clients
  specialty?: string; // For workers
  assignedProjectIds?: string[]; // IDs of projects assigned to this worker
  assignedClientIds?: string[]; // IDs of clients assigned to this worker
  hourlyRate?: number;
  accessRequests: AccessRequest[]; // New field for security
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  dashboardWidgets: {
    revenue: boolean;
    activeProjects: boolean;
    teamProductivity: boolean;
    systemHealth: boolean;
    recentActivity: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    frequency: 'realtime' | 'daily';
  }
}

export interface SystemSettings {
  apiKeys: {
    gemini: string;
    googleDrive: string;
    googlePhotos: string;
    googleSheets: string;
    googleCalendar: string;
  };
  general: {
    companyName: string;
    maintenanceMode: boolean;
  }
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
}

export enum ProjectType {
  CAMPAIGN = 'CAMPAIGN',
  WEB_DESIGN = 'WEB_DESIGN',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  STRATEGY = 'STRATEGY',
  VIDEO_PRODUCTION = 'VIDEO_PRODUCTION'
}

export interface Project {
  id: string;
  clientId: string; // Foreign Key to Client
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  team: string[]; // Array of User IDs
  deliverables: string[]; // List of expected deliverable names
  notes?: string;
  progress: number; // Computed 0-100
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignee: string; // User ID
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  generatedByAI?: boolean;
}

export interface Client {
  id: string;
  name: string; // Contact Name
  company: string;
  email: string;
  phone?: string;
  industry: string;
  status: 'Active' | 'Lead' | 'Churned';
  budgetAllocated: number; // Total budget across all projects
  initialBrief?: string; // Added for client onboarding
  notes?: string;
  // Stats (Computed)
  totalProjects?: number;
  activeProjects?: number;
  assetsDelivered?: number; // Counter
}

export interface IrisTeamMember {
  id: string;
  role: string;
  category: 'Marketing' | 'Design' | 'Development' | 'Strategy' | 'Analysis' | 'Legal' | 'Finance' | 'Support' | 'Production';
  description: string;
  systemPrompt: string;
  icon: string;
}

// --- CHAT SYSTEM TYPES ---

export interface ChatMessage {
  id: string;
  senderId: string; // 'model' for AI, or User ID
  content: string;
  timestamp: string;
  isRead: boolean;
  // For AI Logic
  role?: 'user' | 'model';
  isOrchestration?: boolean;
  orchestrationSteps?: { step: string; status: 'pending' | 'active' | 'completed' }[];
}

export interface ChatSession {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>; // Map UserId -> Count
  messages: ChatMessage[];
  isGroup?: boolean;
  name?: string; // For Group Chats
}

// --- IRIS ACTION TYPES ---

export enum IrisActionType {
  CREATE_TASK = 'CREATE_TASK',
  DELETE_USER = 'DELETE_USER',
  ASSIGN_PROJECT = 'ASSIGN_PROJECT',
  UPDATE_STATUS = 'UPDATE_STATUS',
  NONE = 'NONE'
}

export interface IrisAction {
  type: IrisActionType;
  payload: any;
  confirmationText: string;
}

// --- ASSET MANAGEMENT TYPES ---

export enum AssetStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  DELIVERED = 'DELIVERED', // Final state that increments client counters
  REJECTED = 'REJECTED'
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT'
}

export interface AssetComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface Asset {
  id: string;
  title: string;
  type: AssetType;
  url: string; 
  projectId: string; // Foreign Key to Project
  clientId: string;  // Foreign Key to Client (Denormalized for easy access)
  uploadedBy: string;
  createdAt: string;
  status: AssetStatus;
  version: number;
  comments: AssetComment[];
  tags?: string[];
}

// --- SMART NOTIFICATION TYPES ---

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface NotificationEvent {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: NotificationPriority;
  targetUserId?: string; // If specific to a user
  targetRoleId?: UserRole; // If specific to a role
  projectId?: string; // If specific to a project team
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: NotificationPriority;
  read: boolean;
  timestamp: string;
}

// --- GOOGLE INTEGRATION TYPES ---

export interface GoogleFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink: string;
  iconLink: string;
  modifiedTime: string;
}
