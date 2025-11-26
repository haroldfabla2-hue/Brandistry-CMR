
import { UserRole, ProjectStatus, TaskStatus, IrisTeamMember, AssetStatus, AssetType, Task, Client, Project, Asset, ProjectType, User, ChatSession } from './types';
import { 
  BarChart3, PenTool, Code2, LineChart, Briefcase, Scale, 
  BadgeDollarSign, Headset, Clapperboard, Palette, Megaphone,
  Database, ShieldCheck, Globe
} from 'lucide-react';

export const MOCK_USERS: User[] = [
  {
    id: 'u_admin_alberto',
    name: 'Alberto Farah',
    email: 'alberto.farahb@hotmail.com',
    password: 'Fbalberto1910',
    role: UserRole.ADMIN,
    avatar: 'https://i.pravatar.cc/150?u=alberto',
    specialty: 'CEO & Founder',
    accessRequests: []
  },
  {
    id: 'u1',
    name: 'Alex Rivera',
    email: 'alex@brandistry.com',
    password: 'password123',
    role: UserRole.ADMIN,
    avatar: 'https://i.pravatar.cc/150?u=admin',
    specialty: 'Operations',
    accessRequests: []
  },
  {
    id: 'w1',
    name: 'Maria Garcia',
    email: 'maria@brandistry.com',
    password: 'password123',
    role: UserRole.WORKER,
    avatar: 'https://i.pravatar.cc/150?u=maria',
    specialty: 'Senior Designer',
    assignedProjectIds: ['p1', 'p3'],
    assignedClientIds: ['c1'],
    accessRequests: []
  },
  {
    id: 'w2',
    name: 'James Chen',
    email: 'james@brandistry.com',
    password: 'password123',
    role: UserRole.WORKER,
    avatar: 'https://i.pravatar.cc/150?u=james',
    specialty: 'Frontend Dev',
    assignedProjectIds: ['p3'],
    assignedClientIds: [],
    accessRequests: []
  },
  {
    id: 'c1',
    name: 'Sarah Connor',
    email: 'sarah@ecogoods.com',
    password: 'password123',
    role: UserRole.CLIENT,
    company: 'EcoGoods',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    assignedClientIds: ['c1'],
    assignedProjectIds: ['p2'],
    accessRequests: []
  }
];

export const IRIS_TEAMS: IrisTeamMember[] = [
  { id: 'orch', category: 'Strategy', role: 'Chief Orchestrator', description: 'Coordinates all agents.', systemPrompt: 'You are the Chief Orchestrator. Break down requests into plans and delegate to specialists.', icon: 'Briefcase' },
  { id: 'm1', category: 'Marketing', role: 'SEO Specialist', description: 'Expert in search engine optimization strategies.', systemPrompt: 'You are an expert SEO Specialist. Focus on keywords, ranking, and organic traffic.', icon: 'Megaphone' },
  { id: 'm2', category: 'Marketing', role: 'Content Strategist', description: 'Plans content calendars and brand voice.', systemPrompt: 'You are a Content Strategist. Focus on storytelling, engagement, and editorial planning.', icon: 'PenTool' },
  { id: 'd1', category: 'Design', role: 'UI Designer', description: 'Creates user interface visuals.', systemPrompt: 'You are a UI Designer. Focus on typography, color theory, and layout.', icon: 'Palette' },
  { id: 'd2', category: 'Design', role: 'Brand Director', description: 'Guardians of the brand identity.', systemPrompt: 'You are a Brand Director. Focus on consistency, mission, and visual identity.', icon: 'Palette' },
  { id: 'dev1', category: 'Development', role: 'Frontend Engineer', description: 'React and UI implementation expert.', systemPrompt: 'You are a Senior Frontend Engineer. Focus on React, CSS, and component architecture.', icon: 'Code2' },
  { id: 'a1', category: 'Analysis', role: 'Data Scientist', description: 'Advanced data modeling.', systemPrompt: 'You are a Data Scientist. Focus on predictive models and statistical significance.', icon: 'LineChart' },
];

export const MOCK_CLIENTS: Client[] = [
  { 
    id: 'c1', 
    name: 'Sarah Connor', 
    company: 'EcoGoods', 
    email: 'sarah@ecogoods.com', 
    phone: '+1 (555) 123-4567',
    industry: 'Retail', 
    status: 'Active', 
    budgetAllocated: 120000,
    initialBrief: 'We want to rebrand our entire eco-friendly product line to appeal to Gen Z.'
  },
  { 
    id: 'c2', 
    name: 'John Smith', 
    company: 'TechFlow Inc', 
    email: 'john@techflow.com', 
    phone: '+1 (555) 987-6543',
    industry: 'Technology', 
    status: 'Active', 
    budgetAllocated: 250000 
  },
  { 
    id: 'c3', 
    name: 'Bruce Wayne', 
    company: 'Wayne Enterprises', 
    email: 'bruce@wayne.com', 
    industry: 'Conglomerate', 
    status: 'Lead', 
    budgetAllocated: 50000 
  },
];

export const MOCK_PROJECTS: Project[] = [
  { 
    id: 'p1', 
    clientId: 'c2', // TechFlow
    name: 'Nebula Rebrand', 
    description: 'Complete brand overhaul including logo, guidelines, and website.',
    type: ProjectType.WEB_DESIGN,
    budget: 15000, 
    spent: 4500, 
    startDate: '2023-09-01',
    endDate: '2023-12-01', 
    status: ProjectStatus.ACTIVE, 
    progress: 35, 
    team: ['u1', 'w1'],
    deliverables: ['Logo V1', 'Brand Guidelines', 'Homepage Mockup', 'Mobile App UI']
  },
  { 
    id: 'p2', 
    clientId: 'c1', // EcoGoods
    name: 'Q4 Marketing Campaign', 
    description: 'Holiday season social media push and ad spend management.',
    type: ProjectType.CAMPAIGN,
    budget: 8000, 
    spent: 7800, 
    startDate: '2023-10-01',
    endDate: '2023-12-31', 
    status: ProjectStatus.REVIEW, 
    progress: 95, 
    team: ['w1'],
    deliverables: ['Social Banners', 'Ad Copy', 'Landing Page', 'Email Sequence']
  },
  { 
    id: 'p3', 
    clientId: 'c3', // Wayne Ent
    name: 'Mobile App MVP', 
    description: 'Initial prototype for the new security app.',
    type: ProjectType.STRATEGY,
    budget: 45000, 
    spent: 12000, 
    startDate: '2023-11-01',
    endDate: '2024-03-15', 
    status: ProjectStatus.PLANNING, 
    progress: 10, 
    team: ['w2', 'w1'],
    deliverables: ['Architecture Diagram', 'User Stories', 'Wireframes']
  },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Design Homepage Mockups', description: 'Create 3 variations.', projectId: 'p1', assignee: 'w1', status: TaskStatus.DONE, priority: 'HIGH', dueDate: '2023-10-10' },
  { id: 't2', title: 'Setup CI/CD Pipeline', description: 'Github Actions setup.', projectId: 'p3', assignee: 'w2', status: TaskStatus.IN_PROGRESS, priority: 'HIGH', dueDate: '2023-11-05' },
  { id: 't3', title: 'Keyword Research', description: 'Competitor analysis.', projectId: 'p2', assignee: 'w1', status: TaskStatus.TODO, priority: 'MEDIUM', dueDate: '2023-10-15' },
  { id: 't4', title: 'Client Feedback Review', description: 'Meeting notes integration.', projectId: 'p1', assignee: 'u1', status: TaskStatus.REVIEW, priority: 'LOW', dueDate: '2023-10-12' },
];

export const MOCK_ASSETS: Asset[] = [
  { 
    id: 'a1', 
    title: 'Nebula Homepage V1', 
    type: AssetType.IMAGE, 
    url: 'https://picsum.photos/seed/nebula/800/600', 
    projectId: 'p1', 
    clientId: 'c2',
    uploadedBy: 'u1', 
    createdAt: '2023-10-15T10:00:00Z', 
    status: AssetStatus.DELIVERED, 
    version: 1,
    comments: [],
    tags: ['v1', 'homepage']
  },
  { 
    id: 'a2', 
    title: 'Q4 Social Banner', 
    type: AssetType.IMAGE, 
    url: 'https://picsum.photos/seed/social/800/400', 
    projectId: 'p2', 
    clientId: 'c1',
    uploadedBy: 'w1', 
    createdAt: '2023-10-18T14:30:00Z', 
    status: AssetStatus.PENDING_REVIEW, 
    version: 2,
    comments: [
      { id: 'cm1', userId: 'w1', userName: 'Maria Garcia', content: 'Updated per client request.', timestamp: '2023-10-18T14:35:00Z' }
    ],
    tags: ['social', 'marketing']
  },
  { 
    id: 'a3', 
    title: 'App Architecture Diagram', 
    type: AssetType.DOCUMENT, 
    url: 'https://picsum.photos/seed/arch/600/800', 
    projectId: 'p3', 
    clientId: 'c3',
    uploadedBy: 'w2', 
    createdAt: '2023-10-20T09:15:00Z', 
    status: AssetStatus.CHANGES_REQUESTED, 
    version: 1,
    comments: [
      { id: 'cm2', userId: 'u1', userName: 'Alex Rivera', content: 'Please add the load balancer layer.', timestamp: '2023-10-21T09:00:00Z'}
    ],
    tags: ['technical', 'diagram']
  },
  { 
    id: 'a4', 
    title: 'Q4 Ad Copy', 
    type: AssetType.DOCUMENT, 
    url: 'https://picsum.photos/seed/copy/600/800', 
    projectId: 'p2', 
    clientId: 'c1',
    uploadedBy: 'w1', 
    createdAt: '2023-10-22T09:15:00Z', 
    status: AssetStatus.DELIVERED, 
    version: 1,
    comments: [],
    tags: ['copy', 'marketing']
  }
];

export const MOCK_CHATS: ChatSession[] = [
    {
        id: 'chat_demo_1',
        participants: ['u1', 'w1'],
        tags: ['priority', 'nebula'],
        projectId: 'p1',
        messages: [
            { id: 'm1', senderId: 'u1', content: 'Hey Maria, how is the Nebula project going?', timestamp: '2023-10-25T10:00:00Z', isRead: true },
            { id: 'm2', senderId: 'w1', content: 'Going well! Just uploaded the new V1 designs.', timestamp: '2023-10-25T10:05:00Z', isRead: false },
            { 
               id: 'm3', 
               senderId: 'w1', 
               content: 'Here is the task for the homepage review.', 
               timestamp: '2023-10-25T10:06:00Z', 
               isRead: false,
               blocks: [
                  { 
                     type: 'TASK', 
                     id: 'tb1', 
                     data: { id: 't1', title: 'Design Homepage Mockups', description: 'Create 3 variations.', projectId: 'p1', assignee: 'w1', status: TaskStatus.DONE, priority: 'HIGH', dueDate: '2023-10-10' }
                  }
               ]
            }
        ],
        unreadCount: { 'u1': 1, 'w1': 0 },
        lastMessage: { id: 'm2', senderId: 'w1', content: 'Going well! Just uploaded the new V1 designs.', timestamp: '2023-10-25T10:05:00Z', isRead: false }
    }
];
