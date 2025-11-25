
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { LogIn, Lock, Mail, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(false);

  // Check for device token simulation
  useEffect(() => {
     const savedEmail = localStorage.getItem('brandistry_auth_email');
     if(savedEmail) {
        setIsAutoLogging(true);
        // StoreContext handles the actual logic, this is just visual feedback
     }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const success = login(email, password, rememberMe);
      if (!success) {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    }, 800);
  };

  if (isAutoLogging) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
             <div className="w-16 h-16 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin mb-6"></div>
             <p className="text-brand-100 flex items-center gap-2"><Smartphone size={16}/> Recognizing this device...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        <div className="p-8 bg-white">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-brand-500/30 mb-4">
              <span className="text-3xl font-bold text-white">B</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Brandistry CRM</h1>
            <p className="text-slate-500 mt-2">Enterprise Management Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100 animate-in fade-in">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    placeholder="name@brandistry.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Keep me logged in
                </label>
                <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700">Forgot password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            <p>Protected by Enterprise Grade Security</p>
          </div>
        </div>
      </div>
    </div>
  );
};
