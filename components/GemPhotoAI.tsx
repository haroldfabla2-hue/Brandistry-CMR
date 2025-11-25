
import React, { useState, useRef } from 'react';
import { Sparkles, Upload, X, Check, Image as ImageIcon, Loader2, Save, Wand2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { useStore } from '../context/StoreContext';
import { AssetType } from '../types';

interface GemPhotoAIProps {
  onClose: () => void;
}

export const GemPhotoAI: React.FC<GemPhotoAIProps> = ({ onClose }) => {
  const { addAsset, user, projects } = useStore();
  const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [title, setTitle] = useState('Gemified Asset');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setOriginalImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage) return;
    setStep('processing');
    
    // Call Gemini API
    const result = await geminiService.generateGemifiedImage(originalImage);
    
    if (result) {
      setGeneratedImage(result);
      setStep('preview');
    } else {
      setStep('upload');
      alert('Failed to generate image. Please try again or check API key.');
    }
  };

  const handleSave = () => {
    if (!generatedImage) return;
    
    addAsset({
      title: title,
      type: AssetType.IMAGE,
      url: generatedImage,
      projectId: selectedProjectId,
      uploadedBy: user.id,
      tags: ['gem-ai', 'generated']
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Gem Photo AI</h2>
              <p className="text-xs text-blue-100 opacity-90">Transform photos into crystalline masterpieces</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scroll bg-slate-50">
          
          {step === 'upload' && (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50/50 transition-all min-h-[300px]"
                onClick={() => fileInputRef.current?.click()}
              >
                {originalImage ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img src={originalImage} alt="Original" className="max-h-[250px] rounded-lg shadow-lg" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <p className="text-white font-medium flex items-center gap-2"><Upload size={16}/> Change Image</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Upload Source Image</h3>
                    <p className="text-slate-500 text-sm mt-2 max-w-xs">Select a photo from your device or Google Photos to gemify.</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>

              {originalImage && (
                <button 
                  onClick={handleGenerate}
                  className="w-full py-4 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 size={20} />
                  Generate Gem Version
                </button>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-brand-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Sparkles className="text-brand-500 animate-pulse" size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mt-6">Crafting Crystals...</h3>
              <p className="text-slate-500 mt-2">Gemini AI is reimagining your image.</p>
            </div>
          )}

          {step === 'preview' && generatedImage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Original</span>
                    <img src={originalImage!} className="w-full rounded-xl border border-slate-200 shadow-sm" alt="Original"/>
                 </div>
                 <div className="space-y-2">
                    <span className="text-xs font-bold text-brand-500 uppercase flex items-center gap-1"><Sparkles size={12}/> Gemified Result</span>
                    <img src={generatedImage} className="w-full rounded-xl border-2 border-brand-500 shadow-lg" alt="Generated"/>
                 </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Save As</label>
                   <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Project</label>
                   <select 
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                   >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('upload')}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18}/>
                  Save to Assets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
