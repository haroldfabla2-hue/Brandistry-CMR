
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Project, Task, User, Asset, Client, Notification, AssetComment, ChatSession, ChatMessage, IrisAction, IrisActionType, MessageBlock,
  UserRole, TaskStatus, AssetStatus, AssetType, UserPreferences, SystemSettings, NotificationEvent, AccessRequestStatus
} from '../types';
import { 
  MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS, MOCK_CLIENTS, MOCK_ASSETS, MOCK_CHATS
} from '../constants';

interface StoreContextType {
  user: User; 
  realUser: User | null;
  isImpersonating: boolean;
  users: User[];
  projects: Project[];
  tasks: Task[];
  assets: Asset[];
  clients: Client[];
  notifications: Notification[];
  chats: ChatSession[];
  
  userPreferences: UserPreferences;
  systemSettings: SystemSettings;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAuthenticated: boolean;
  
  login: (email: string, password?: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  checkAutoLogin: () => Promise<void>;
  
  requestUserAccess: (targetUserId: string) => void;
  resolveAccessRequest: (requesterId: string, status: AccessRequestStatus) => void;
  startImpersonation: (targetUserId: string) => void;
  stopImpersonation: () => void;

  registerUser: (newUser: Partial<User>) => void;
  editUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  registerClient: (newClient: Partial<Client> & { password?: string }) => void;

  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (task: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'status' | 'version' | 'comments' | 'clientId'> & { clientId?: string }) => void;
  updateAssetStatus: (assetId: string, status: AssetStatus) => void;
  addAssetComment: (assetId: string, content: string) => void;
  deleteAsset: (assetId: string) => void;
  
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  assignProjectToWorker: (projectId: string, userId: string) => void;
  
  markNotificationRead: (id: string) => void;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  notify: (event: NotificationEvent) => void;
  getAssetsByClient: (clientId: string) => Asset[];

  // Chat Actions
  createChatSession: (targetUserId: string) => string;
  createGroupSession: (name: string, participantIds: string[]) => string;
  updateChatSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  sendMessage: (sessionId: string, content: string, blocks?: MessageBlock[]) => void;
  editMessage: (sessionId: string, messageId: string, newContent: string) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  markChatRead: (sessionId: string) => void;
  toggleChatReadStatus: (sessionId: string) => void;

  // Iris Actions
  executeIrisAction: (action: IrisAction) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [currentUserIdx, setCurrentUserIdx] = useState(0);
  const [realUserIdx, setRealUserIdx] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Initialize with Mock, but then Load from LocalStorage
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chats, setChats] = useState<ChatSession[]>(MOCK_CHATS);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: 'light',
    dashboardWidgets: { revenue: true, activeProjects: true, teamProductivity: true, systemHealth: true, recentActivity: true },
    notifications: { email: true, push: true, frequency: 'realtime' }
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    apiKeys: { gemini: '', googleDrive: '', googlePhotos: '', googleSheets: '', googleCalendar: '' },
    general: { companyName: 'Brandistry CRM', maintenanceMode: false }
  });

  const user = users[currentUserIdx];
  const realUser = realUserIdx !== null ? users[realUserIdx] : null;
  const isImpersonating = realUserIdx !== null;

  // --- PERSISTENCE LAYER ---
  useEffect(() => {
    // Load Data on Mount
    const load = (key: string, setter: any, defaultVal: any) => {
       const saved = localStorage.getItem(`brandistry_${key}`);
       if (saved) setter(JSON.parse(saved));
       else setter(defaultVal);
    };

    load('users', setUsers, MOCK_USERS);
    load('projects', setProjects, MOCK_PROJECTS);
    load('tasks', setTasks, MOCK_TASKS);
    load('assets', setAssets, MOCK_ASSETS);
    load('chats', setChats, MOCK_CHATS);
    load('clients', setClients, MOCK_CLIENTS);
    
    checkAutoLogin();
  }, []);

  // Save Data on Change
  useEffect(() => { if(!isAuthChecking) localStorage.setItem('brandistry_users', JSON.stringify(users)); }, [users, isAuthChecking]);
  useEffect(() => { if(!isAuthChecking) localStorage.setItem('brandistry_projects', JSON.stringify(projects)); }, [projects, isAuthChecking]);
  useEffect(() => { if(!isAuthChecking) localStorage.setItem('brandistry_tasks', JSON.stringify(tasks)); }, [tasks, isAuthChecking]);
  useEffect(() => { if(!isAuthChecking) localStorage.setItem('brandistry_assets', JSON.stringify(assets)); }, [assets, isAuthChecking]);
  useEffect(() => { if(!isAuthChecking) localStorage.setItem('brandistry_chats', JSON.stringify(chats)); }, [chats, isAuthChecking]);
  useEffect(() => { if(!isAuthChecking) localStorage.setItem('brandistry_clients', JSON.stringify(clients)); }, [clients, isAuthChecking]);

  const checkAutoLogin = async () => {
    const savedUserEmail = localStorage.getItem('brandistry_auth_email');
    if (savedUserEmail) {
      await new Promise(r => setTimeout(r, 100)); 
      const idx = users.findIndex(u => u.email === savedUserEmail);
      if (idx !== -1) {
        setCurrentUserIdx(idx);
        setIsAuthenticated(true);
      }
    }
    setIsAuthChecking(false);
  };

  // --- DERIVED STATE CALCULATIONS (REAL-TIME DB VIEWS) ---
  useEffect(() => {
    setClients(prevClients => prevClients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      const activeProjs = clientProjects.filter(p => p.status === 'ACTIVE').length;
      const deliveredCount = assets.filter(a => a.clientId === client.id && a.status === AssetStatus.DELIVERED).length;

      return {
        ...client,
        totalProjects: clientProjects.length,
        activeProjects: activeProjs,
        assetsDelivered: deliveredCount
      };
    }));
  }, [assets, projects]);

  // --- NOTIFICATION SERVICE ---
  const notify = (event: NotificationEvent) => {
    if (event.priority === 'LOW') return;

    let isRelevant = false;
    const target = realUser || user;
    
    if (event.targetUserId && event.targetUserId === target.id) isRelevant = true;
    if (event.targetRoleId && event.targetRoleId === target.role) isRelevant = true;
    if (event.projectId) {
      const project = projects.find(p => p.id === event.projectId);
      if (project && (project.team.includes(target.id) || target.role === UserRole.ADMIN)) {
        isRelevant = true;
      }
    }
    if (!event.targetUserId && !event.targetRoleId && !event.projectId) {
       isRelevant = true;
    }

    if (!isRelevant) return;

    const newNotif: Notification = {
      id: `n${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title,
      message: event.message,
      type: event.type,
      priority: event.priority,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
  };

  // --- AUTH ACTIONS ---
  const login = (email: string, password?: string, rememberMe: boolean = false) => {
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) {
      setCurrentUserIdx(idx);
      setIsAuthenticated(true);
      if (rememberMe) localStorage.setItem('brandistry_auth_email', email);
      else localStorage.removeItem('brandistry_auth_email');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRealUserIdx(null);
    localStorage.removeItem('brandistry_auth_email');
    setCurrentUserIdx(0);
  };

  // --- ACCESS CONTROL ---
  const requestUserAccess = (targetUserId: string) => {
    const activeAdmin = realUser || user;
    if (activeAdmin.role !== UserRole.ADMIN) return;

    setUsers(prev => prev.map(u => {
       if (u.id === targetUserId) {
          if (u.accessRequests?.some(r => r.requesterId === activeAdmin.id)) return u;
          const newRequest = {
             requesterId: activeAdmin.id,
             requesterName: activeAdmin.name,
             timestamp: new Date().toISOString(),
             status: 'PENDING'
          } as const;
          return { ...u, accessRequests: [...(u.accessRequests || []), newRequest] };
       }
       return u;
    }));

    notify({ title: 'Access Requested', message: `Admin ${activeAdmin.name} requested access.`, type: 'warning', priority: 'HIGH', targetUserId: targetUserId });
  };

  const resolveAccessRequest = (requesterId: string, status: AccessRequestStatus) => {
     setUsers(prev => prev.map(u => {
        if (u.id === user.id) {
           return { ...u, accessRequests: u.accessRequests.map(r => r.requesterId === requesterId ? { ...r, status } : r) };
        }
        return u;
     }));
     notify({ title: `Access ${status}`, message: `${user.name} responded to your request.`, type: status === 'APPROVED' ? 'success' : 'error', priority: 'HIGH', targetUserId: requesterId });
  };

  const startImpersonation = (targetUserId: string) => {
    const admin = realUser || user;
    if (admin.role !== UserRole.ADMIN) return;

    const targetIdx = users.findIndex(u => u.id === targetUserId);
    const targetUser = users[targetIdx];
    const request = targetUser.accessRequests?.find(r => r.requesterId === admin.id);
    const hasPermission = request?.status === 'APPROVED';

    if (hasPermission || targetUserId === admin.id) {
       setRealUserIdx(currentUserIdx);
       setCurrentUserIdx(targetIdx);
       notify({ title: 'Impersonation Started', message: `Viewing as ${targetUser.name}`, type: 'info', priority: 'MEDIUM' });
    } else {
       notify({ title: 'Access Denied', message: 'Need approval first.', type: 'error', priority: 'HIGH' });
    }
  };

  const stopImpersonation = () => {
     if (realUserIdx !== null) {
        setCurrentUserIdx(realUserIdx);
        setRealUserIdx(null);
     }
  };

  // --- USER MANAGEMENT ---
  const registerUser = (newUser: Partial<User>) => {
    const newUserRecord: User = {
        id: `u_${Date.now()}`,
        name: newUser.name || 'New User',
        email: newUser.email || '',
        password: newUser.password || 'password123',
        role: newUser.role || UserRole.WORKER,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
        specialty: newUser.specialty || '',
        accessRequests: [],
        ...newUser
    } as User;
    setUsers(prev => [...prev, newUserRecord]);
    notify({ title: 'User Registered', message: `Welcome ${newUserRecord.name}!`, type: 'success', priority: 'MEDIUM' });
  };

  const editUser = (userId: string, updates: Partial<User>) => {
     setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
     notify({ title: 'User Updated', message: 'Profile updated successfully.', type: 'info', priority: 'MEDIUM' });
  };

  const deleteUser = (userId: string) => {
     setUsers(prev => prev.filter(u => u.id !== userId));
     notify({ title: 'User Deleted', message: 'User removed from system.', type: 'warning', priority: 'HIGH' });
  };

  const registerClient = (newClient: Partial<Client> & { password?: string }) => {
     const client: Client = {
         id: `c_${Date.now()}`,
         name: newClient.name || 'Contact',
         company: newClient.company || 'New Company',
         email: newClient.email || '',
         phone: newClient.phone || '',
         industry: newClient.industry || 'General',
         status: 'Active',
         budgetAllocated: newClient.budgetAllocated || 0,
         initialBrief: newClient.initialBrief || '',
         notes: '',
         ...newClient
     } as Client;
     setClients(prev => [...prev, client]);

     const clientUser: User = {
        id: `u_client_${client.id}`,
        name: client.name,
        email: client.email,
        password: newClient.password || 'password123',
        role: UserRole.CLIENT,
        avatar: `https://i.pravatar.cc/150?u=${client.id}`,
        company: client.company,
        assignedClientIds: [client.id],
        specialty: 'Client Contact',
        accessRequests: []
     };
     setUsers(prev => [...prev, clientUser]);
     
     notify({ title: 'Client Onboarded', message: `${client.company} added.`, type: 'success', priority: 'HIGH' });
  };

  // --- TASK ACTIONS ---
  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };
  const addTask = (newTask: Partial<Task>) => {
    const task: Task = {
      id: `t${Date.now()}`,
      title: newTask.title || 'New Task',
      description: newTask.description || '',
      projectId: newTask.projectId || projects[0]?.id || 'p1',
      assignee: newTask.assignee || user.id,
      status: newTask.status || TaskStatus.TODO,
      priority: newTask.priority || 'MEDIUM',
      dueDate: newTask.dueDate || new Date().toISOString(),
      generatedByAI: newTask.generatedByAI
    };
    setTasks(prev => [...prev, task]);
    notify({ title: 'Task Created', message: `"${task.title}" added.`, type: 'success', priority: 'MEDIUM', projectId: task.projectId });
  };
  const updateTask = (taskId: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  const deleteTask = (taskId: string) => setTasks(prev => prev.filter(t => t.id !== taskId));

  // --- ASSET ACTIONS ---
  const addAsset = (newAsset: any) => {
    let clientId = newAsset.clientId;
    if (!clientId) {
        const project = projects.find(p => p.id === newAsset.projectId);
        clientId = project ? project.clientId : '';
    }
    const asset: Asset = {
      ...newAsset,
      clientId: clientId || '', 
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: AssetStatus.DRAFT,
      version: 1,
      comments: [],
      tags: newAsset.tags || []
    };
    setAssets(prev => [asset, ...prev]);
    notify({ title: 'Asset Uploaded', message: `${asset.title} added.`, type: 'success', priority: 'HIGH', projectId: asset.projectId });
  };
  const updateAssetStatus = (assetId: string, status: AssetStatus) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status } : a));
  };
  const addAssetComment = (assetId: string, content: string) => {
    const newComment: AssetComment = { id: `c${Date.now()}`, userId: user.id, userName: user.name, content, timestamp: new Date().toISOString() };
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, comments: [...a.comments, newComment] } : a));
  };
  const deleteAsset = (assetId: string) => setAssets(prev => prev.filter(a => a.id !== assetId));

  // --- PROJECT ACTIONS ---
  const updateProject = (projectId: string, updates: Partial<Project>) => setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  const assignProjectToWorker = (projectId: string, userId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId && !p.team.includes(userId) ? { ...p, team: [...p.team, userId] } : p));
    setUsers(prev => prev.map(u => u.id === userId && !u.assignedProjectIds?.includes(projectId) ? { ...u, assignedProjectIds: [...(u.assignedProjectIds || []), projectId] } : u));
  };

  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const updateUserPreferences = (prefs: Partial<UserPreferences>) => setUserPreferences(prev => ({...prev, ...prefs}));
  const updateSystemSettings = (settings: Partial<SystemSettings>) => setSystemSettings(prev => ({...prev, ...settings}));
  const getAssetsByClient = (clientId: string) => assets.filter(a => a.clientId === clientId);

  // --- CHAT SYSTEM ---
  const createChatSession = (targetUserId: string): string => {
     // Check if existing session
     const existing = chats.find(c => !c.isGroup && c.participants.includes(user.id) && c.participants.includes(targetUserId));
     if (existing) return existing.id;

     const newSession: ChatSession = {
        id: `chat_${Date.now()}`,
        participants: [user.id, targetUserId],
        unreadCount: { [targetUserId]: 0, [user.id]: 0 },
        messages: []
     };
     setChats(prev => [newSession, ...prev]);
     return newSession.id;
  };

  const createGroupSession = (name: string, participantIds: string[]): string => {
      const newSession: ChatSession = {
          id: `group_${Date.now()}`,
          isGroup: true,
          name: name,
          participants: [...participantIds, user.id], // Ensure creator is included
          unreadCount: {},
          messages: []
      };
      // Initialize unread counts
      newSession.participants.forEach(pid => newSession.unreadCount[pid] = 0);
      setChats(prev => [newSession, ...prev]);
      return newSession.id;
  };

  const updateChatSession = (sessionId: string, updates: Partial<ChatSession>) => {
      setChats(prev => prev.map(c => c.id === sessionId ? { ...c, ...updates } : c));
      if (updates.projectId) {
         notify({ title: 'Context Updated', message: 'Chat stream linked to project.', type: 'info', priority: 'LOW' });
      }
  };

  const sendMessage = (sessionId: string, content: string, blocks?: MessageBlock[]) => {
     const newMessage: ChatMessage = {
        id: `m_${Date.now()}`,
        senderId: user.id,
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
        blocks // New rich payload support
     };
     
     setChats(prev => prev.map(c => {
        if (c.id === sessionId) {
           const updatedUnread = { ...c.unreadCount };
           c.participants.forEach(pId => {
              if (pId !== user.id) updatedUnread[pId] = (updatedUnread[pId] || 0) + 1;
           });
           return {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: newMessage,
              unreadCount: updatedUnread
           };
        }
        return c;
     }));
  };

  const editMessage = (sessionId: string, messageId: string, newContent: string) => {
      setChats(prev => prev.map(c => {
          if (c.id === sessionId) {
              return {
                  ...c,
                  messages: c.messages.map(m => m.id === messageId ? { ...m, content: newContent, isEdited: true } : m)
              };
          }
          return c;
      }));
  };

  const deleteMessage = (sessionId: string, messageId: string) => {
      setChats(prev => prev.map(c => {
          if (c.id === sessionId) {
              return {
                  ...c,
                  messages: c.messages.filter(m => m.id !== messageId)
              };
          }
          return c;
      }));
  };

  const markChatRead = (sessionId: string) => {
     setChats(prev => prev.map(c => {
        if (c.id === sessionId) {
           return {
              ...c,
              unreadCount: { ...c.unreadCount, [user.id]: 0 },
              messages: c.messages.map(m => m.senderId !== user.id ? { ...m, isRead: true } : m)
           };
        }
        return c;
     }));
  };

  const toggleChatReadStatus = (sessionId: string) => {
      setChats(prev => prev.map(c => {
          if (c.id === sessionId) {
              // If currently 0, set to 1 to mark unread. If > 0, set to 0.
              const currentUnread = c.unreadCount[user.id] || 0;
              return {
                  ...c,
                  unreadCount: { ...c.unreadCount, [user.id]: currentUnread === 0 ? 1 : 0 }
              };
          }
          return c;
      }));
  };

  // --- IRIS EXECUTOR ---
  const executeIrisAction = (action: IrisAction) => {
     switch (action.type) {
        case IrisActionType.CREATE_TASK:
           addTask(action.payload);
           break;
        case IrisActionType.CREATE_USER: // ADDED
           registerUser(action.payload);
           break;
        case IrisActionType.DELETE_USER:
           deleteUser(action.payload.userId);
           break;
        case IrisActionType.ASSIGN_PROJECT:
           assignProjectToWorker(action.payload.projectId, action.payload.userId);
           break;
        case IrisActionType.UPDATE_STATUS:
           updateTaskStatus(action.payload.taskId, action.payload.status);
           break;
        default:
           break;
     }
     notify({
        title: 'Iris Action Executed',
        message: action.confirmationText,
        type: 'info',
        priority: 'MEDIUM'
     });
  };

  if (isAuthChecking) return null; 

  return (
    <StoreContext.Provider value={{
      user, realUser, isImpersonating, users, projects, tasks, assets, clients, notifications, chats,
      userPreferences, systemSettings, searchQuery, setSearchQuery, isAuthenticated,
      login, logout, checkAutoLogin, requestUserAccess, resolveAccessRequest, startImpersonation, stopImpersonation,
      registerUser, editUser, deleteUser, registerClient,
      updateTaskStatus, addTask, updateTask, deleteTask,
      addAsset, updateAssetStatus, addAssetComment, deleteAsset,
      updateProject, assignProjectToWorker, markNotificationRead, updateUserPreferences, updateSystemSettings, notify, getAssetsByClient,
      createChatSession, createGroupSession, updateChatSession, sendMessage, editMessage, deleteMessage, markChatRead, toggleChatReadStatus, executeIrisAction
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
