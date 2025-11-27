

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
  password?: string;
  role: UserRole;
  avatar: string;
  company?: string;
  specialty?: string;
  assignedProjectIds?: string[];
  assignedClientIds?: string[];
  hourlyRate?: number;
  accessRequests: AccessRequest[];
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
  clientId: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  team: string[];
  deliverables: string[];
  notes?: string;
  progress: number;
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
  assignee: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  generatedByAI?: boolean;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  industry: string;
  status: 'Active' | 'Lead' | 'Churned';
  budgetAllocated: number;
  initialBrief?: string;
  notes?: string;
  totalProjects?: number;
  activeProjects?: number;
  assetsDelivered?: number;
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

export type MessageBlockType = 'TEXT' | 'TASK' | 'ASSET' | 'FILE' | 'EVENT';

export interface MessageBlock {
  type: MessageBlockType;
  id: string;
  data: any; // Flexible data payload for the block (e.g., Task object)
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string; // Fallback text or main text
  timestamp: string;
  isRead: boolean;
  isEdited?: boolean; // New Flag
  role?: 'user' | 'model';
  isOrchestration?: boolean;
  orchestrationSteps?: { step: string; status: 'pending' | 'active' | 'completed' }[];
  
  // Rich Features
  blocks?: MessageBlock[]; // Interactive components
  attachments?: { type: 'file' | 'image' | 'link'; url: string; name: string }[];
  reactions?: Record<string, string[]>; // emoji -> [userIds]
  mentions?: string[]; // userIds
  tags?: string[]; // #urgent, #marketing
}

export interface ChatSession {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: Record<string, number>;
  messages: ChatMessage[];
  
  // Organization
  isGroup?: boolean;
  name?: string; // Channel name
  description?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[]; // Metadata tags for filtering
  projectId?: string; // Link to a project context
}

// --- IRIS ACTION TYPES ---

export enum IrisActionType {
  CREATE_TASK = 'CREATE_TASK',
  CREATE_USER = 'CREATE_USER', // Added
  DELETE_USER = 'DELETE_USER',
  ASSIGN_PROJECT = 'ASSIGN_PROJECT',
  UPDATE_STATUS = 'UPDATE_STATUS',
  SHOW_ASSET = 'SHOW_ASSET',
  NAVIGATE = 'NAVIGATE',
  GENERATE_REPORT = 'GENERATE_REPORT',
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
  DELIVERED = 'DELIVERED',
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
  projectId: string;
  clientId: string;
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
  targetUserId?: string;
  targetRoleId?: UserRole;
  projectId?: string;
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

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-3-pro-preview' | 'gemini-flash-lite-latest' | 'gemini-2.5-flash-image';
