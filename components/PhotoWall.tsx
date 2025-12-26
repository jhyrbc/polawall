
import React, { useRef, useState, useEffect } from 'react';
import { PhotoData, WallTheme, WallSticker, WallText, DoodleLine } from '../types';
import PolaroidPhoto from './PolaroidPhoto';
import { Trash2, Maximize2 } from 'lucide-react';

interface PhotoWallProps {
  photos: PhotoData[];
  onUpdatePhoto: (updatedPhoto: PhotoData) => void;
  onSelectPhoto: (photo: PhotoData) => void;
  theme: WallTheme;
  doodles: DoodleLine[];
  wallStickers: WallSticker[];
  wallTexts: WallText[];
  isDoodling: boolean;
  isErasing: boolean;
  doodleColor: string;
  onDoodleComplete: (line: DoodleLine) => void;
  onDeleteDoodle: (id: string) => void;
  onUpdateWallSticker: (id: string, updates: Partial<WallSticker>) => void;
  onDeleteWallSticker: (id: string) => void;
  onUpdateWallText: (id: string, updates: Partial<WallText>) => void;
  onDeleteWallText: (id: string) => void;
}

const COLORS = ['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa', '#000000', '#ffffff'];

const PhotoWall: React.FC<PhotoWallProps> = ({ 
  photos, onUpdatePhoto, onSelectPhoto, theme, doodles, wallStickers, wallTexts, 
  isDoodling, isErasing, doodleColor, onDoodleComplete, onDeleteDoodle, onUpdateWallSticker, onDeleteWallSticker, 
  onUpdateWallText, onDeleteWallText 
}) => {
  const wallRef = useRef<HTMLDivElement>(null);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [draggedWallId, setDraggedWallId] = useState<{type: 'sticker'|'text', id: string} | null>(null);
  const [resizeWallId, setResizeWallId] = useState<{type: 'sticker'|'text', id: string, initialDist: number, initialScale: number, initialFontSize: number} | null>(null);
  
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isDragMove, setIsDragMove] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentDoodle, setCurrentDoodle] = useState<DoodleLine | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  const rafRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent, photo: PhotoData) => {
    e.stopPropagation(); 
    setDraggedPhotoId(photo.id);
    setDragOffset({ x: e.clientX - photo.x, y: e.clientY - photo.y });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setIsDragMove(false);
    setSelectedWallId(null);
  };

  const checkAndErase = (mouseX: number, mouseY: number) => {
    if (!isErasing || !wallRef.current) return;
    const rect = wallRef.current.getBoundingClientRect();
    const x = mouseX - rect.left + wallRef.current.scrollLeft;
    const y = mouseY - rect.top;

    // Check distance to each doodle segment
    doodles.forEach(doodle => {
      const isNear = doodle.points.some(p => Math.hypot(p.x - x, p.y - y) < 30);
      if (isNear) onDeleteDoodle(doodle.id);
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      const totalDist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (totalDist > 5) setIsDragMove(true);

      if (isErasing && isMouseDown) {
        checkAndErase(e.clientX, e.clientY);
      }

      // Photo Dragging
      if (draggedPhotoId && wallRef.current) {
        const moveDist = Math.hypot(e.clientX - lastMousePos.x, e.clientY - lastMousePos.y);
        const photo = photos.find(p => p.id === draggedPhotoId);
        if (photo) {
          let newShakeProgress = photo.shakeProgress;
          if (photo.isDeveloping && !photo.isShaken && moveDist > 12) {
            newShakeProgress = Math.min(100, photo.shakeProgress + moveDist / 6);
          }
          onUpdatePhoto({
            ...photo,
            x: e.clientX - dragOffset.x,
            y: Math.max(20, Math.min(e.clientY - dragOffset.y, window.innerHeight - 300)),
            shakeProgress: newShakeProgress,
            isShaken: newShakeProgress >= 100 ? true : photo.isShaken,
            timestamp: Date.now()
          });
        }
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }

      // Decoration Dragging
      if (draggedWallId && wallRef.current) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        if (draggedWallId.type === 'sticker') onUpdateWallSticker(draggedWallId.id, { x, y });
        else onUpdateWallText(draggedWallId.id, { x, y });
      }

      // Decoration Resizing
      if (resizeWallId && wallRef.current) {
        const item = resizeWallId.type === 'sticker' 
          ? wallStickers.find(s => s.id === resizeWallId.id) 
          : wallTexts.find(t => t.id === resizeWallId.id);
        
        if (item) {
          const currentDist = Math.hypot(e.clientX - item.x, e.clientY - item.y);
          const ratio = currentDist / resizeWallId.initialDist;
          
          if (resizeWallId.type === 'sticker') {
            onUpdateWallSticker(resizeWallId.id, { scale: Math.max(0.2, resizeWallId.initialScale * ratio) });
          } else {
            onUpdateWallText(resizeWallId.id, { fontSize: Math.max(12, resizeWallId.initialFontSize * ratio) });
          }
        }
      }

      // Doodling
      if (currentDoodle && wallRef.current) {
        const rect = wallRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + wallRef.current.scrollLeft;
        const y = e.clientY - rect.top;
        setCurrentDoodle(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
      }
    });
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (currentDoodle) {
      onDoodleComplete(currentDoodle);
      setCurrentDoodle(null);
    }
    
    if (draggedPhotoId) {
      if (!isDragMove) {
        const photo = photos.find(p => p.id === draggedPhotoId);
        if (photo) onSelectPhoto(photo);
      }
      setDraggedPhotoId(null);
    }

    setDraggedWallId(null);
    setResizeWallId(null);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPhotoId, dragOffset, mouseDownPos, lastMousePos, currentDoodle, draggedWallId, resizeWallId, isDragMove, isMouseDown, isErasing, doodles]);

  const initiateResize = (e: React.MouseEvent, id: string, type: 'sticker'|'text') => {
    e.stopPropagation();
    const item = type === 'sticker' ? wallStickers.find(s => s.id === id) : wallTexts.find(t => t.id === id);
    if (item) {
      setResizeWallId({
        id, 
        type, 
        initialDist: Math.hypot(e.clientX - item.x, e.clientY - item.y),
        initialScale: type === 'sticker' ? (item as WallSticker).scale : 1,
        initialFontSize: type === 'text' ? (item as WallText).fontSize : 48
      });
    }
  };

  return (
    <div 
      ref={wallRef}
      id="photo-wall-container"
      className={`relative h-full overflow-visible ${isErasing ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      onMouseDown={(e) => {
        setIsMouseDown(true);
        if (isErasing) {
          checkAndErase(e.clientX, e.clientY);
        } else if (isDoodling && wallRef.current) {
          const rect = wallRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left + wallRef.current.scrollLeft;
          const y = e.clientY - rect.top;
          setCurrentDoodle({ id: Date.now().toString(), points: [{ x, y }], color: doodleColor, width: 4 });
        } else {
          setSelectedWallId(null);
          setEditingTextId(null);
        }
      }}
      style={{ width: '5000px' }}
    >
      <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 5 }}>
        {doodles.map(line => (
          <polyline 
            key={line.id} 
            points={line.points.map(p => `${p.x},${p.y}`).join(' ')} 
            fill="none" 
            stroke={line.color} 
            strokeWidth={line.width} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        ))}
        {currentDoodle && (
          <polyline points={currentDoodle.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={currentDoodle.color} strokeWidth={currentDoodle.width} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>

      {/* Wall Texts */}
      {wallTexts.map(t => (
        <div 
          key={t.id}
          className={`absolute cursor-move select-none font-handwriting transition-all group ${selectedWallId === t.id ? 'z-50 ring-2 ring-amber-400/50 rounded-lg p-3' : 'z-10'}`}
          style={{ left: t.x, top: t.y, color: t.color, fontSize: `${t.fontSize}px`, transform: `translate(-50%, -50%)` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setSelectedWallId(t.id);
            setDraggedWallId({type: 'text', id: t.id});
            setDragOffset({ x: e.clientX - t.x, y: e.clientY - t.y });
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingTextId(t.id);
          }}
        >
          {editingTextId === t.id ? (
            <div className="relative inline-flex flex-col items-center">
              {/* This wrapper div is key to auto-sizing without clipping during typing */}
              <span className="invisible whitespace-pre min-w-[20px] px-2">{t.text || ' '}</span>
              <input 
                autoFocus
                className="absolute inset-0 bg-transparent border-none outline-none text-center px-2 w-full h-full"
                value={t.text}
                onChange={(e) => onUpdateWallText(t.id, { text: e.target.value })}
                onBlur={() => setEditingTextId(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTextId(null)}
              />
            </div>
          ) : (
            <span className="px-2">{t.text || <span className="text-gray-300 opacity-50 italic">双击输入文字</span>}</span>
          )}

          {selectedWallId === t.id && (
            <div className="absolute inset-0 pointer-events-none">
              <button 
                className="absolute -top-5 -right-5 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-90 pointer-events-auto"
                style={{ transform: 'scale(1)' }}
                onMouseDown={(e) => { e.stopPropagation(); onDeleteWallText(t.id); }}
              >
                <Trash2 size={16} />
              </button>
              <button 
                className="absolute -bottom-5 -right-5 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-500 active:scale-90 cursor-nwse-resize pointer-events-auto"
                onMouseDown={(e) => initiateResize(e, t.id, 'text')}
              >
                <Maximize2 size={16} />
              </button>
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-1 bg-white/95 p-1 rounded-full shadow-xl border border-amber-100 pointer-events-auto">
                {COLORS.map(c => (
                  <button key={c} onClick={() => onUpdateWallText(t.id, { color: c })} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Wall Stickers */}
      {wallStickers.map(s => (
        <div 
          key={s.id}
          className={`absolute cursor-move select-none transition-all group ${selectedWallId === s.id ? 'z-50 ring-2 ring-amber-400/50 rounded-2xl p-6' : 'z-10'}`}
          style={{ left: s.x, top: s.y, transform: `translate(-50%, -50%) scale(${s.scale})` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setSelectedWallId(s.id);
            setDraggedWallId({type: 'sticker', id: s.id});
            setDragOffset({ x: e.clientX - s.x, y: e.clientY - s.y });
          }}
        >
          <div className="text-7xl group-active:scale-95 transition-transform">{s.emoji}</div>
          
          {selectedWallId === s.id && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Apply inverse scale to keep UI buttons consistent size */}
              <button 
                className="absolute -top-6 -right-6 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-90 pointer-events-auto"
                style={{ transform: `scale(${1 / s.scale})` }}
                onMouseDown={(e) => { e.stopPropagation(); onDeleteWallSticker(s.id); }}
              >
                <Trash2 size={20} />
              </button>
              <button 
                className="absolute -bottom-6 -right-6 w-10 h-10 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-500 active:scale-90 cursor-nwse-resize pointer-events-auto"
                style={{ transform: `scale(${1 / s.scale})` }}
                onMouseDown={(e) => initiateResize(e, s.id, 'sticker')}
              >
                <Maximize2 size={20} />
              </button>
            </div>
          )}
        </div>
      ))}
      
      {photos.map(photo => (
        <PolaroidPhoto 
          key={photo.id}
          data={photo}
          onMouseDown={(e) => handleMouseDown(e, photo)}
          onMouseUp={() => {}}
          isDragging={draggedPhotoId === photo.id}
        />
      ))}
    </div>
  );
};

export default PhotoWall;
