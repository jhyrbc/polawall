import React, { useState, useRef, useEffect } from 'react';
import { PhotoData, PinType, FrameType, PhotoSticker, CAMERAS } from '../types';
import { X, PenTool, Sticker, Palette, Trash2, AlertCircle } from 'lucide-react';

interface NoteEditorProps {
  photo: PhotoData;
  onClose: () => void;
  onSave: (id: string, note: string, stickers: PhotoSticker[], pin: PinType, frame: FrameType) => void;
  onDelete: (id: string) => void;
}

const EMOJIS = ['❤️', '✨', '🌈', '🔥', '🐶', '🐱', '🌸', '🌻', '✈️', '📷', '🎉', '💡', '🎵', '🍕', '☕️', '🏖️', '🍭', '🍦', '🧸', '🎈'];
const FRAMES: {id: FrameType, name: string}[] = [
  {id: 'classic', name: '经典白'},
  {id: 'pink', name: '樱花粉'},
  {id: 'mint', name: '薄荷绿'},
  {id: 'dots', name: '波点控'},
  {id: 'stripes', name: '条纹衫'},
  {id: 'checkered', name: '小格子'},
];

const NoteEditor: React.FC<NoteEditorProps> = ({ photo, onClose, onSave, onDelete }) => {
  const [note, setNote] = useState(photo.note);
  const [stickers, setStickers] = useState<PhotoSticker[]>(photo.stickers || []);
  const [selectedPin, setSelectedPin] = useState<PinType>(photo.pin || 'simple');
  const [selectedFrame, setSelectedFrame] = useState<FrameType>(photo.frame || 'classic');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const cameraConfig = CAMERAS.find(c => c.id === photo.filter) || CAMERAS[0];

  const addSticker = (emoji: string) => {
    const newSticker: PhotoSticker = {
      id: Date.now().toString(),
      emoji,
      x: 50,
      y: 50
    };
    setStickers([...stickers, newSticker]);
  };

  const removeSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
  };

  useEffect(() => {
    if (!draggingStickerId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (previewRef.current) {
          const rect = previewRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          
          const boundedX = Math.max(5, Math.min(95, x));
          const boundedY = Math.max(5, Math.min(95, y));
          
          setStickers(prev => prev.map(s => s.id === draggingStickerId ? { ...s, x: boundedX, y: boundedY } : s));
        }
      });
    };

    const handleMouseUp = () => {
      setDraggingStickerId(null);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draggingStickerId]);

  const getFrameBg = (f: FrameType) => {
    switch (f) {
      case 'pink': return 'bg-[#fff5f5]';
      case 'mint': return 'bg-[#f0fff4]';
      case 'dots': return 'bg-white frame-dots';
      case 'stripes': return 'bg-white frame-stripes';
      case 'checkered': return 'bg-white frame-checkered';
      default: return 'bg-white';
    }
  };

  const handleFinalSave = () => {
    onSave(photo.id, note, stickers, selectedPin, selectedFrame);
    onClose(); 
  };

  const confirmDelete = () => {
    onDelete(photo.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-900/10 backdrop-blur-md p-4 animate-in fade-in">
      
      {/* 确认删除对话框 */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[40px] p-10 shadow-2xl w-[400px] border-4 border-red-50 flex flex-col items-center gap-6">
             <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="text-red-500" size={48} />
             </div>
             <div className="text-center">
                <h3 className="text-2xl font-black text-amber-950 mb-2">确定要销毁吗？</h3>
                <p className="text-amber-900/60 font-medium">这张承载回忆的相片一旦撕毁就找不回来啦...</p>
             </div>
             <div className="flex w-full gap-4 mt-2">
                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-4 bg-amber-50 text-amber-900 font-black rounded-2xl hover:bg-amber-100 transition-all">手滑了</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all">确认销毁</button>
             </div>
          </div>
        </div>
      )}

      <div className="glass-light rounded-[50px] p-10 w-full max-w-5xl shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-10 border-4 border-white">
        
        <button onClick={onClose} className="absolute top-8 right-8 text-amber-900/30 hover:text-amber-900 p-2 hover:bg-amber-100/50 rounded-full transition-all z-20">
          <X size={28} />
        </button>

        {/* 左侧：预览 */}
        <div className="flex flex-col items-center justify-center md:w-1/2 relative bg-white/40 rounded-[40px] p-8 border border-white/60 shadow-inner">
             <div 
                ref={previewRef}
                className={`relative w-[280px] h-[340px] shadow-2xl p-4 pb-14 rounded-sm transform transition-all overflow-hidden ${getFrameBg(selectedFrame)}`}
             >
                <div className="w-full h-[240px] overflow-hidden relative border border-black/5 pointer-events-none rounded-sm bg-zinc-900">
                    <img 
                      src={photo.url} 
                      alt="预览" 
                      className="w-full h-full object-cover" 
                      style={{ filter: cameraConfig.cssFilter }}
                    />
                    {cameraConfig.overlay && (
                      <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ backgroundColor: cameraConfig.overlay }} />
                    )}
                    <div className="absolute inset-0 photo-noise pointer-events-none mix-blend-overlay"></div>
                </div>
                
                <div className="mt-4 text-center font-handwriting text-2xl text-zinc-700 pointer-events-none leading-none">
                    {note || "写个笔记吧..."}
                </div>

                {stickers.map(s => (
                    <div 
                        key={s.id}
                        onMouseDown={(e) => { e.stopPropagation(); setDraggingStickerId(s.id); }}
                        className={`absolute text-5xl cursor-move select-none filter drop-shadow-md z-30 transition-none group ${draggingStickerId === s.id ? 'scale-125 z-40' : 'hover:scale-110'}`}
                        style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        {s.emoji}
                        <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => removeSticker(s.id)} 
                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <X size={10} strokeWidth={4} />
                        </button>
                    </div>
                ))}
             </div>
        </div>

        {/* 右侧：配置 */}
        <div className="flex-1 space-y-8 py-2">
             <div className="space-y-1">
                <h2 className="text-3xl font-black text-amber-900 font-handwriting tracking-tight">相片魔法编辑器</h2>
                <div className="h-1.5 w-16 bg-amber-400 rounded-full shadow-sm"></div>
            </div>

            {/* 相框 */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-black text-amber-900/40 uppercase tracking-[0.3em]"><Palette size={14}/> 相纸款式</label>
                <div className="grid grid-cols-3 gap-3">
                    {FRAMES.map(f => (
                        <button 
                            key={f.id} 
                            onClick={() => setSelectedFrame(f.id)}
                            className={`py-3 px-2 text-xs font-black rounded-2xl border-2 transition-all ${selectedFrame === f.id ? 'bg-amber-400 border-amber-400 text-white shadow-lg -translate-y-1' : 'bg-white border-amber-100 text-amber-900/60 hover:bg-amber-50'}`}
                        >
                            {f.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* 笔记 */}
            <div className="space-y-3">
                <label className="text-[11px] font-black text-amber-900/40 uppercase tracking-[0.3em] flex items-center gap-2"><PenTool size={14}/> 手写心情</label>
                <div className="relative">
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="想对照片说..."
                        maxLength={15}
                        className="w-full bg-white border-2 border-amber-100 rounded-2xl px-6 py-5 focus:outline-none focus:border-amber-400 transition-all font-handwriting text-2xl text-amber-950 shadow-inner"
                    />
                </div>
            </div>

            {/* 贴纸 */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] font-black text-amber-900/40 uppercase tracking-[0.3em]"><Sticker size={14}/> 贴纸盒</label>
                <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-4 bg-white/60 rounded-[30px] border-2 border-amber-50 shadow-inner">
                     {EMOJIS.map(e => (
                         <button key={e} onClick={() => addSticker(e)} className="text-3xl hover:scale-125 transition-transform p-1 filter drop-shadow-sm active:scale-95">
                             {e}
                         </button>
                     ))}
                </div>
            </div>

            <div className="pt-6 flex gap-4">
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="bg-red-50 text-red-500 p-5 rounded-3xl hover:bg-red-500 hover:text-white transition-all border-2 border-red-100 shadow-sm"
                  title="销毁相片"
                >
                  <Trash2 size={24} />
                </button>
                <button onClick={handleFinalSave} className="flex-1 bg-amber-400 text-white py-5 rounded-3xl font-black text-lg hover:bg-amber-500 transition-all shadow-[0_10px_30px_rgba(251,191,36,0.3)] active:scale-95 tracking-widest font-handwriting">
                    挂回相片墙 ✨
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;