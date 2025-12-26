import React from 'react';
import { PhotoData, CAMERAS, PinType, FrameType } from '../types';

interface PolaroidPhotoProps {
  data: PhotoData;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isDragging: boolean;
}

const PolaroidPhoto: React.FC<PolaroidPhotoProps> = ({ data, onMouseDown, onMouseUp, isDragging }) => {
  const cameraConfig = CAMERAS.find(c => c.id === data.filter) || CAMERAS[0];
  const pinStyle = data.pin || 'simple';

  const getFrameStyle = (frame?: FrameType) => {
    switch (frame) {
      case 'pink': return 'bg-[#fff5f5]';
      case 'mint': return 'bg-[#f0fff4]';
      case 'dots': return 'bg-white frame-dots';
      case 'stripes': return 'bg-white frame-stripes';
      case 'checkered': return 'bg-white frame-checkered';
      default: return 'bg-white';
    }
  };

  const renderPin = (type: PinType) => {
    switch (type) {
      case 'simple':
        return (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 via-red-600 to-red-900 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_-1px_-1px_3px_rgba(0,0,0,0.6)] border border-red-800/20 flex items-center justify-center relative">
                <div className="w-2 h-2 rounded-full bg-white/40 blur-[0.8px] absolute top-1.5 left-1.5"></div>
             </div>
             <div className="w-[3px] h-3 bg-gradient-to-r from-zinc-300 to-zinc-500 mx-auto -mt-1 shadow-[1px_1px_2px_rgba(0,0,0,0.3)]"></div>
          </div>
        );
      case 'tape':
        return (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 w-20 h-9 bg-amber-100/30 rotate-[-1.5deg] shadow-[0_2px_3px_rgba(0,0,0,0.1)] backdrop-blur-[3px] border-x border-white/30" style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)' }}></div>
        );
      case 'clip':
        return (
           <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
              <div className="w-12 h-8 border-[4px] border-zinc-500 rounded-t-2xl border-b-0 shadow-xl"></div>
              <div className="w-20 h-5 bg-gradient-to-b from-zinc-700 to-zinc-950 -mt-1 rounded-sm shadow-xl"></div>
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute select-none rounded-sm transition-all duration-300 ease-out ${
        isDragging 
          ? 'z-50 scale-105 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] cursor-grabbing' 
          : 'shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] cursor-grab hover:scale-[1.02] hover:shadow-xl hover:z-40'
      } ${getFrameStyle(data.frame)}`}
      style={{
        left: data.x,
        top: data.y,
        transform: `rotate(${data.rotation}deg)`,
        width: '200px',
        height: '240px',
        padding: '10px 10px 50px 10px', 
        border: '1px solid rgba(0,0,0,0.1)',
      } as React.CSSProperties}
      onMouseDown={onMouseDown}
    >
      {renderPin(pinStyle)}

      <div className="relative w-full h-[170px] overflow-hidden border border-black/10 shadow-inner rounded-sm bg-zinc-900">
        <img
          src={data.url}
          alt="照片"
          className="w-full h-full object-cover pointer-events-none"
          style={{ filter: cameraConfig.cssFilter }}
        />
        
        {cameraConfig.overlay && (
          <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ backgroundColor: cameraConfig.overlay }} />
        )}

        <div className="absolute inset-0 photo-noise pointer-events-none mix-blend-overlay"></div>

        {/* 显影层：只有在显影中或未显影时显示 */}
        {data.isDeveloping && (
          <div 
            className={`absolute inset-0 bg-[#0a0a20] z-10 flex flex-col items-center justify-center transition-opacity duration-300 ${data.isShaken ? 'developing-mask' : 'opacity-100'}`}
          >
             {!data.isShaken && (
                <div className="flex flex-col items-center animate-in fade-in duration-700">
                   <div className="text-4xl shake-hint-anim mb-3 drop-shadow-lg">👋</div>
                   <div className="text-[12px] font-black tracking-widest uppercase text-amber-300 text-center px-4">快晃晃！激发显影</div>
                   <div className="mt-4 w-32 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300" style={{ width: `${data.shakeProgress}%` }}></div>
                   </div>
                </div>
             )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[50px] flex items-center justify-center px-4 overflow-hidden">
        <p className="font-handwriting text-zinc-800 text-2xl text-center leading-tight">
          {data.note}
        </p>
      </div>

      {data.stickers?.map(sticker => (
        <div 
          key={sticker.id}
          className="absolute text-5xl filter drop-shadow-lg z-10 pointer-events-none"
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {sticker.emoji}
        </div>
      ))}
    </div>
  );
};

export default PolaroidPhoto;