import React, { useEffect, useState } from 'react';
import { CAMERAS, CameraFilter } from '../types';

interface PrintingOverlayProps {
  isPrinting: boolean;
  photoUrl: string | null;
  onAnimationComplete: () => void;
  selectedCameraId: CameraFilter;
}

const PrintingOverlay: React.FC<PrintingOverlayProps> = ({ isPrinting, photoUrl, onAnimationComplete, selectedCameraId }) => {
  const [stage, setStage] = useState<'hidden' | 'flash' | 'ejecting'>('hidden');

  const cameraConfig = CAMERAS.find(c => c.id === selectedCameraId) || CAMERAS[0];

  useEffect(() => {
    if (isPrinting) {
      setStage('flash');
      const t1 = setTimeout(() => setStage('ejecting'), 400);
      
      const t2 = setTimeout(() => {
        setStage('hidden');
        onAnimationComplete();
      }, 4000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [isPrinting, onAnimationComplete]);

  if (!isPrinting || !photoUrl) return null;

  const getRealisticColor = (id: CameraFilter) => {
    switch(id) {
      case 'normal': return 'bg-white';
      case 'vintage': return 'bg-[#d2b48c]';
      case 'bw': return 'bg-[#1a1a1a]';
      case 'cool': return 'bg-[#a5d8dd]';
      case 'warm': return 'bg-[#f9ca24]';
      default: return 'bg-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-amber-50/40 backdrop-blur-xl transition-opacity duration-300">
      
      <div className={`absolute inset-0 bg-white z-[120] transition-opacity duration-150 pointer-events-none ${stage === 'flash' ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative w-[420px] h-[500px] flex flex-col items-center justify-end">
        
        <div className={`absolute top-0 w-[400px] h-[380px] ${getRealisticColor(selectedCameraId)} rounded-[70px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-4px_10px_rgba(0,0,0,0.05)] border border-stone-200 z-[110] flex flex-col items-center pt-12 overflow-hidden`}>
             
             <div className={`absolute top-0 left-0 w-full h-28 ${cameraConfig.accentColor} rounded-t-[70px] border-b border-stone-200/50`}></div>
             
             <div className="relative w-64 h-64 rounded-full bg-white shadow-[0_15px_35px_rgba(0,0,0,0.1),inset_0_2px_10px_rgba(255,255,255,1)] flex items-center justify-center border border-stone-100">
                 <div className="w-48 h-48 rounded-full bg-[#111] border-[10px] border-[#222] flex items-center justify-center overflow-hidden relative shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-transparent to-white/10 rounded-full"></div>
                    <div className={`absolute inset-0 bg-[#000] z-20 rounded-full transition-all duration-200 origin-center ${stage === 'flash' ? 'scale-0' : 'scale-100'}`}></div>
                    <div className="absolute top-6 right-6 w-14 h-8 bg-white/10 blur-xl rounded-full -rotate-45 z-30"></div>
                 </div>
             </div>

             <div className="absolute top-10 left-16 w-10 h-8 bg-zinc-900 rounded-lg shadow-inner border-2 border-stone-200"></div>
             
             <div className={`absolute top-8 right-16 w-10 h-10 ${selectedCameraId === 'warm' ? 'bg-red-500' : 'bg-white'} rounded-full shadow-lg border-b-4 border-stone-200 active:translate-y-1 transition-transform`}></div>

             <div className="absolute bottom-[-2px] w-80 h-10 bg-[#1a1a1a] rounded-t-2xl shadow-[inset_0_4px_12px_rgba(0,0,0,1)] z-[115]"></div>
        </div>

        <div 
           className="absolute z-[105] shadow-2xl w-[220px] bg-white p-4 pb-12 transition-transform duration-[3200ms] ease-out rounded-sm"
           style={{
               height: '260px',
               top: '340px', 
               transform: stage === 'ejecting' ? 'translateY(120px)' : 'translateY(-260px)',
               transitionTimingFunction: 'cubic-bezier(0.15, 0.45, 0.15, 1)'
           }}
        >
            <div className="w-full h-[180px] bg-zinc-50 overflow-hidden relative border border-black/5 rounded-sm">
                <img src={photoUrl || ''} className="w-full h-full object-cover opacity-10 grayscale brightness-50" alt="" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
            </div>
        </div>
      </div>
      
      {stage === 'ejecting' && (
         <div className="mt-[180px] text-amber-900/40 text-xs font-black tracking-[0.6em] animate-pulse">
            记录时光中...
         </div>
      )}
    </div>
  );
};

export default PrintingOverlay;