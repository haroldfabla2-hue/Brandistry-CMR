
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import { 
  Settings, Shield, Database, Layout, Bell, Key, User, 
  Save, RefreshCw, ToggleLeft, ToggleRight, Eye, EyeOff
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, userPreferences, systemSettings, updateUserPreferences, updateSystemSettings } = useStore();
  const [activeTab, setActiveTab] = useState(user.role === UserRole.ADMIN ? 'system' : 'personal');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleWidgetToggle = (key: keyof typeof userPreferences.dashboardWidgets) => {
    updateUserPreferences({
      dashboardWidgets: {
        ...userPreferences.dashboardWidgets,
        [key]: !userPreferences.dashboardWidgets[key]
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Settings</h2>
        <nav className="space-y-1">
          {user.role === UserRole.ADMIN && (
            <>
              <button
                onClick={() => setActiveTab('system')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'system' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Shield size={18} /> System & Security
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'api' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Key size={18} /> API Configuration
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('personal')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'personal' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User size={18} /> Profile & Account
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layout size={18} /> Dashboard Widgets
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell size={18} /> Notifications
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto custom-scroll">
        
        {/* --- API CONFIGURATION (ADMIN) --- */}
        {activeTab === 'api' && user.role === UserRole.ADMIN && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">Google Integration Keys</h3>
              <p className="text-sm text-slate-500">Manage API keys for Gemini, Drive, and Workspace integrations.</p>
            </div>

            <div className="space-y-4">
              {Object.entries(systemSettings.apiKeys).map(([key, val]) => (
                <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    {key.replace(/([A-Z])/g, ' $1').trim()} API Key
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type={showKeys[key] ? "text" : "password"}
                        value={val || 'sk-................................'} 
                        className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-10 text-sm text-slate-600"
                        readOnly
                      />
                      <button 
                        onClick={() => toggleKeyVisibility(key)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showKeys[key] ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    <button className="bg-white border border-slate-300 text-slate-600 px-3 rounded-lg hover:bg-slate-50 font-medium text-sm">
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4">
               <button className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
                 <Save size={18} /> Save Configurations
               </button>
            </div>
          </div>
        )}

        {/* --- DASHBOARD WIDGETS --- */}
        {activeTab === 'dashboard' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="border-b border-slate-100 pb-4">
               <h3 className="text-xl font-bold text-slate-800">Dashboard Customization</h3>
               <p className="text-sm text-slate-500">Toggle visibility of widgets on your main dashboard.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.entries(userPreferences.dashboardWidgets).map(([key, enabled]) => (
                 <div key={key} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${enabled ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Layout size={20} />
                       </div>
                       <div>
                          <h4 className="font-medium text-slate-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                          <p className="text-xs text-slate-400">{enabled ? 'Visible on dashboard' : 'Hidden'}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleWidgetToggle(key as any)}
                      className={`text-2xl transition-colors ${enabled ? 'text-brand-600' : 'text-slate-300'}`}
                    >
                      {enabled ? <ToggleRight size={40} className="fill-current"/> : <ToggleLeft size={40} className="fill-current"/>}
                    </button>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* --- SYSTEM SETTINGS (ADMIN) --- */}
        {activeTab === 'system' && user.role === UserRole.ADMIN && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-slate-100 pb-4">
               <h3 className="text-xl font-bold text-slate-800">System Parameters</h3>
               <p className="text-sm text-slate-500">Global configuration for Brandistry CRM.</p>
             </div>
             
             <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                   <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">Maintenance Mode</h4>
                        <p className="text-sm text-slate-500">Prevent non-admin users from logging in.</p>
                      </div>
                      <button 
                        onClick={() => updateSystemSettings({general: {...systemSettings.general, maintenanceMode: !systemSettings.general.maintenanceMode}})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.general.maintenanceMode ? 'bg-brand-600' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.general.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                   </div>
                   {systemSettings.general.maintenanceMode && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-center gap-2">
                        <Shield size={16} /> System is currently locked for maintenance.
                      </div>
                   )}
                </div>
                
                <div className="p-4 border border-slate-200 rounded-xl">
                    <label className="block font-bold text-slate-800 mb-2">Company Name</label>
                    <input 
                      type="text" 
                      value={systemSettings.general.companyName}
                      onChange={(e) => updateSystemSettings({general: {...systemSettings.general, companyName: e.target.value}})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    />
                </div>
             </div>
           </div>
        )}

        {/* --- PERSONAL SETTINGS --- */}
        {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="border-b border-slate-100 pb-4 flex items-center gap-4">
                  <img src={user.avatar} className="w-16 h-16 rounded-full border-4 border-white shadow-md" alt="Avatar"/>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                    <p className="text-sm text-slate-500">{user.email} • {user.role}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input value={user.name} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-500 text-sm cursor-not-allowed"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input value={user.email} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-500 text-sm cursor-not-allowed"/>
                  </div>
               </div>
               
               <div className="pt-4">
                 <h4 className="font-bold text-slate-800 mb-3">Theme Preferences</h4>
                 <div className="flex gap-4">
                    {['light', 'dark', 'system'].map(theme => (
                      <button 
                        key={theme}
                        onClick={() => updateUserPreferences({theme: theme as any})}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize ${
                          userPreferences.theme === theme 
                            ? 'bg-brand-50 border-brand-500 text-brand-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                 </div>
               </div>
            </div>
        )}

      </div>
    </div>
  );
};
