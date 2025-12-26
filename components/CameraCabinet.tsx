import React from 'react';
import { CAMERAS, CameraFilter } from '../types';
import { Camera } from 'lucide-react';

interface CameraCabinetProps {
  selectedCameraId: CameraFilter;
  onSelectCamera: (id: CameraFilter) => void;
  onTakePhoto: () => void;
}

const CameraCabinet: React.FC<CameraCabinetProps> = ({ selectedCameraId, onSelectCamera, onTakePhoto }) => {
  return (
    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full max-w-4xl px-4 pointer-events-none">
      
      <div className="glass-light px-10 py-6 rounded-[50px] shadow-2xl flex items-center gap-12 pointer-events-auto border-2 border-white/80">
        
        <div className="flex items-end gap-8 pb-1">
          {CAMERAS.map((camera) => {
            const isSelected = selectedCameraId === camera.id;
            // 映射真实型号相机的典型颜色
            const getRealisticColor = (id: CameraFilter) => {
              switch(id) {
                case 'normal': return 'bg-white'; // Instax Mini 11 陶瓷白
                case 'vintage': return 'bg-[#d2b48c]'; // SX-70 皮革棕/金
                case 'bw': return 'bg-[#1a1a1a]'; // Instax 黑
                case 'cool': return 'bg-[#a5d8dd]'; // Mini 9 冰川蓝
                case 'warm': return 'bg-[#f9ca24]'; // Polaroid 600 阳光黄
                default: return 'bg-white';
              }
            };

            return (
              <button
                key={camera.id}
                onClick={() => onSelectCamera(camera.id)}
                className={`group relative flex flex-col items-center transition-all duration-500 ${
                   isSelected ? 'scale-110 -translate-y-4' : 'hover:-translate-y-2 opacity-70 hover:opacity-100'
                }`}
              >
                 {/* 3D 仿真相机模型 */}
                 <div className={`relative w-20 h-16 rounded-2xl camera-3d-body ${getRealisticColor(camera.id)} border border-black/10 shadow-md transition-all flex flex-col items-center justify-center`}>
                    {/* 取景器 */}
                    <div className="absolute top-2 left-3 w-4 h-3 bg-zinc-900/90 rounded-sm shadow-inner"></div>
                    {/* 闪光灯 */}
                    <div className="absolute top-2 right-3 w-5 h-3 bg-zinc-100 rounded-sm border border-zinc-200 shadow-sm flex items-center justify-center">
                        <div className="w-3 h-1 bg-amber-100/40 blur-[1px]"></div>
                    </div>
                    {/* 镜头 */}
                    <div className="w-10 h-10 rounded-full bg-zinc-900 lens-3d border-[3px] border-zinc-800 flex items-center justify-center relative">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-900 via-zinc-900 to-zinc-800 overflow-hidden">
                             <div className="absolute top-1 right-1 w-2 h-2 bg-white/10 rounded-full blur-[1px]"></div>
                        </div>
                    </div>
                    {/* 快门按钮 */}
                    {/* Fix: changed 'id' to 'camera.id' on line 55 */}
                    <div className={`absolute -top-1 right-5 w-4 h-1 ${camera.id === 'warm' ? 'bg-red-500' : 'bg-zinc-400'} rounded-t-sm shadow-sm`}></div>
                 </div>
                 
                 <div className={`mt-3 text-[10px] font-black tracking-widest transition-all ${isSelected ? 'text-amber-900 opacity-100' : 'text-amber-900/40 opacity-0 group-hover:opacity-100'}`}>
                   {camera.name}
                 </div>

                 {isSelected && (
                   <div className="absolute -bottom-4 w-1 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                 )}
              </button>
            );
          })}
        </div>

        <div className="w-px h-16 bg-amber-900/10"></div>

        <div className="flex flex-col items-center gap-2">
            <button 
                onClick={onTakePhoto}
                className="relative w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center group active:scale-90 transition-all border-4 border-amber-50"
            >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-inner flex items-center justify-center group-hover:brightness-110">
                    <Camera className="text-white" size={32} />
                </div>
                {/* 快门光效 */}
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-100 transition-opacity pointer-events-none"></div>
            </button>
            <span className="text-[10px] text-amber-900/60 font-black uppercase tracking-[0.2em]">按下拍摄</span>
        </div>

      </div>
    </div>
  );
};

export default CameraCabinet;