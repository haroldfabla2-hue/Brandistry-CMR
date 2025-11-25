
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  Project, Task, User, Asset, Client, Notification, AssetComment,
  UserRole, TaskStatus, AssetStatus, AssetType, UserPreferences, SystemSettings, NotificationEvent
} from '../types';
import { 
  MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS, MOCK_CLIENTS, MOCK_ASSETS 
} from '../constants';

interface StoreContextType {
  user: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  assets: Asset[];
  clients: Client[];
  notifications: Notification[];
  userPreferences: UserPreferences;
  systemSettings: SystemSettings;
  
  // Actions
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (task: Partial<Task>) => void;
  
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'status' | 'version' | 'comments' | 'clientId'> & { clientId?: string }) => void;
  updateAssetStatus: (assetId: string, status: AssetStatus) => void;
  addAssetComment: (assetId: string, content: string) => void;
  deleteAsset: (assetId: string) => void;
  
  // Project Actions
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  assignProjectToWorker: (projectId: string, userId: string) => void;
  
  switchUserRole: (userId: string) => void;
  markNotificationRead: (id: string) => void;
  
  // Settings Actions
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  
  // Notification Service
  notify: (event: NotificationEvent) => void;
  
  // Computed Helpers
  getAssetsByClient: (clientId: string) => Asset[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [currentUserIdx, setCurrentUserIdx] = useState(0);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Settings State
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: 'light',
    dashboardWidgets: {
      revenue: true,
      activeProjects: true,
      teamProductivity: true,
      systemHealth: true,
      recentActivity: true
    },
    notifications: {
      email: true,
      push: true,
      frequency: 'realtime'
    }
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    apiKeys: {
      gemini: '',
      googleDrive: '',
      googlePhotos: '',
      googleSheets: '',
      googleCalendar: ''
    },
    general: {
      companyName: 'Brandistry CRM',
      maintenanceMode: false
    }
  });

  const user = users[currentUserIdx];

  // --- DERIVED STATE CALCULATIONS (REAL-TIME DB VIEWS) ---
  
  // Automatically calculate Client Stats whenever assets or projects change
  useEffect(() => {
    setClients(prevClients => prevClients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      const activeProjs = clientProjects.filter(p => p.status === 'ACTIVE').length;
      
      // Count DELIVERED assets for this client
      const deliveredCount = assets.filter(a => a.clientId === client.id && a.status === AssetStatus.DELIVERED).length;

      return {
        ...client,
        totalProjects: clientProjects.length,
        activeProjects: activeProjs,
        assetsDelivered: deliveredCount
      };
    }));
  }, [assets, projects]);


  // --- SMART NOTIFICATION SERVICE ---
  const notify = (event: NotificationEvent) => {
    // 1. FILTER: Ignore Low Priority events globally to reduce noise
    if (event.priority === 'LOW') return;

    // 2. FILTER: Relevance Check
    let isRelevant = false;

    // Direct match
    if (event.targetUserId && event.targetUserId === user.id) isRelevant = true;
    
    // Role match
    if (event.targetRoleId && event.targetRoleId === user.role) isRelevant = true;
    
    // Project Team match
    if (event.projectId) {
      const project = projects.find(p => p.id === event.projectId);
      if (project && (project.team.includes(user.id) || user.role === UserRole.ADMIN)) {
        isRelevant = true;
      }
    }

    // Default: Info/Warning/Critical events are usually relevant if no specific target is set
    if (!event.targetUserId && !event.targetRoleId && !event.projectId) {
       isRelevant = true;
    }

    if (!isRelevant) return;

    // 3. Add to State
    const newNotif: Notification = {
      id: `n${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title,
      message: event.message,
      type: event.type,
      priority: event.priority,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    // Keep max 10 notifications
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
  };

  // --- ACTIONS ---

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    
    if (status === TaskStatus.DONE && task) {
      notify({
        title: 'Task Completed',
        message: `Task "${task.title}" marked as done.`,
        type: 'success',
        priority: 'HIGH',
        projectId: task.projectId
      });
    }
  };

  const addTask = (newTask: Partial<Task>) => {
    const task: Task = {
      id: `t${Date.now()}`,
      title: newTask.title || 'New Task',
      description: newTask.description || '',
      projectId: newTask.projectId || '1',
      assignee: newTask.assignee || user.id,
      status: TaskStatus.TODO,
      priority: newTask.priority || 'MEDIUM',
      dueDate: newTask.dueDate || new Date().toISOString(),
      generatedByAI: newTask.generatedByAI
    };
    setTasks(prev => [...prev, task]);
    
    notify({
      title: 'Task Assigned',
      message: `You have been assigned: "${task.title}"`,
      type: 'info',
      priority: 'MEDIUM',
      targetUserId: task.assignee
    });
  };

  const addAsset = (newAsset: Omit<Asset, 'id' | 'createdAt' | 'status' | 'version' | 'comments' | 'clientId'> & { clientId?: string }) => {
    // If clientId is missing, look it up from projectId
    let clientId = newAsset.clientId;
    if (!clientId) {
        const project = projects.find(p => p.id === newAsset.projectId);
        clientId = project ? project.clientId : '';
    }

    const asset: Asset = {
      ...newAsset,
      clientId: clientId || '', // Ensure string
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: AssetStatus.DRAFT,
      version: 1,
      comments: [],
      tags: newAsset.tags || []
    };
    setAssets(prev => [asset, ...prev]);
    
    notify({
      title: 'New Asset Uploaded',
      message: `${asset.title} was uploaded to Project.`,
      type: 'success',
      priority: 'HIGH',
      projectId: asset.projectId
    });
  };

  const updateAssetStatus = (assetId: string, status: AssetStatus) => {
    const asset = assets.find(a => a.id === assetId);
    setAssets(prev => prev.map(a => 
      a.id === assetId ? { ...a, status } : a
    ));
    
    if (asset) {
      const isDelivered = status === AssetStatus.DELIVERED;
      const isRejection = status === AssetStatus.REJECTED || status === AssetStatus.CHANGES_REQUESTED;
      
      notify({
        title: `Asset ${status.replace('_', ' ')}`,
        message: `Status updated for: ${asset.title}`,
        type: isDelivered ? 'success' : isRejection ? 'warning' : 'info',
        priority: isDelivered || isRejection ? 'CRITICAL' : 'MEDIUM',
        projectId: asset.projectId
      });
    }
  };

  const addAssetComment = (assetId: string, content: string) => {
    const newComment: AssetComment = {
      id: `c${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content,
      timestamp: new Date().toISOString()
    };
    
    setAssets(prev => prev.map(a => 
      a.id === assetId ? { ...a, comments: [...a.comments, newComment] } : a
    ));
    
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
       // Notify everyone on the project EXCEPT the commenter
       notify({
         title: 'New Comment',
         message: `${user.name} commented on ${asset.title}`,
         type: 'info',
         priority: 'MEDIUM',
         projectId: asset.projectId
       });
    }
  };

  const deleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
    notify({
        title: 'Project Updated',
        message: `Configuration changed for project.`,
        type: 'info',
        priority: 'MEDIUM',
        projectId: projectId
    });
  };

  const assignProjectToWorker = (projectId: string, userId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId && !p.team.includes(userId) 
      ? { ...p, team: [...p.team, userId] } : p
    ));
    setUsers(prev => prev.map(u => u.id === userId && !u.assignedProjectIds?.includes(projectId)
      ? { ...u, assignedProjectIds: [...(u.assignedProjectIds || []), projectId] } : u
    ));
    
    notify({
      title: 'New Project Assignment',
      message: 'You have been added to a new project team.',
      type: 'success',
      priority: 'HIGH',
      targetUserId: userId
    });
  };

  const switchUserRole = (targetId: string) => {
    const idx = users.findIndex(u => u.id === targetId);
    if (idx !== -1) setCurrentUserIdx(idx);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updateUserPreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({...prev, ...prefs}));
  };

  const updateSystemSettings = (settings: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({...prev, ...settings}));
  };
  
  const getAssetsByClient = (clientId: string) => {
      return assets.filter(a => a.clientId === clientId);
  };

  return (
    <StoreContext.Provider value={{
      user,
      users,
      projects,
      tasks,
      assets,
      clients,
      notifications,
      userPreferences,
      systemSettings,
      updateTaskStatus,
      addTask,
      addAsset,
      updateAssetStatus,
      addAssetComment,
      deleteAsset,
      updateProject,
      assignProjectToWorker,
      switchUserRole,
      markNotificationRead,
      updateUserPreferences,
      updateSystemSettings,
      notify,
      getAssetsByClient
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
