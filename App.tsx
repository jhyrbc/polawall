
import React, { useState, useRef } from 'react';
import { CameraFilter, PhotoData, WallTheme, WallSticker, WallText, DoodleLine } from './types';
import PhotoWall from './components/PhotoWall';
import CameraCabinet from './components/CameraCabinet';
import PrintingOverlay from './components/PrintingOverlay';
import NoteEditor from './components/NoteEditor';
import { Download, Palette, Heart, Grid, TreePine, Layout, Eraser, Undo2, Sticker, Type as TextIcon, X, Maximize, Circle, Camera as CameraIcon, Upload } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import download from 'downloadjs';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraFilter>('normal');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<PhotoData | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoData | null>(null);
  
  // Camera Capture States
  const [showCaptureOptions, setShowCaptureOptions] = useState(false);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  
  // Wall States
  const [wallTheme, setWallTheme] = useState<WallTheme>('beige');
  const [doodles, setDoodles] = useState<DoodleLine[]>([]);
  const [wallStickers, setWallStickers] = useState<WallSticker[]>([]);
  const [wallTexts, setWallTexts] = useState<WallText[]>([]);
  const [isDoodling, setIsDoodling] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [doodleColor, setDoodleColor] = useState('#fbbf24');
  const [showWallSettings, setShowWallSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);

  const autoLayout = (type: 'heart' | 'grid' | 'tree' | 'circle') => {
    if (photos.length === 0) return;
    const centerX = window.scrollX + window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const step = 250;

    setPhotos(prev => prev.map((photo, i) => {
      let newX = photo.x, newY = photo.y, newRot = 0;
      const t = (i / prev.length) * 2 * Math.PI;
      switch(type) {
        case 'heart':
          newX = centerX + 16 * Math.pow(Math.sin(t), 3) * 15 - 100;
          newY = centerY - (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 15 - 120;
          newRot = (Math.random() - 0.5) * 5;
          break;
        case 'grid':
          const cols = Math.ceil(Math.sqrt(prev.length));
          newX = centerX - 400 + (i % cols) * step;
          newY = centerY - 300 + Math.floor(i / cols) * step;
          break;
        case 'circle':
          const radius = 350;
          newX = centerX + radius * Math.cos(t) - 100;
          newY = centerY + radius * Math.sin(t) - 120;
          break;
        case 'tree':
          const row = Math.floor(Math.sqrt(2 * i + 0.25) - 0.5);
          const colInRow = i - row * (row + 1) / 2;
          newX = centerX + (colInRow - row / 2) * step - 100;
          newY = centerY - 400 + row * step;
          break;
      }
      return { ...photo, x: newX, y: newY, rotation: newRot };
    }));
  };

  const startLiveCamera = async () => {
    setShowCaptureOptions(false);
    setIsLiveCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (captureVideoRef.current) captureVideoRef.current.srcObject = stream;
    } catch (e) {
      alert("无法访问摄像头，请检查权限。");
      setIsLiveCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!captureVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = captureVideoRef.current.videoWidth;
    canvas.height = captureVideoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(captureVideoRef.current, 0, 0);
      processNewPhoto(canvas.toDataURL('image/jpeg'));
    }
    stopLiveCamera();
  };

  const stopLiveCamera = () => {
    if (captureVideoRef.current?.srcObject) {
      (captureVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setIsLiveCameraActive(false);
  };

  const createPhotoObject = (url: string, indexOffset: number = 0): PhotoData => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
    url,
    x: window.scrollX + window.innerWidth / 2 - 100 + (Math.random() - 0.5) * 150 + (indexOffset * 20), 
    y: window.innerHeight / 2 - 130 + (indexOffset * 20),
    rotation: (Math.random() - 0.5) * 15, 
    note: '',
    filter: selectedCamera, 
    timestamp: Date.now(),
    isDeveloping: true, 
    isShaken: false, 
    shakeProgress: 0,
    stickers: [], 
    pin: 'simple', 
    frame: 'classic'
  });

  const processNewPhoto = (url: string) => {
    const newPhoto = createPhotoObject(url);
    setPendingPhoto(newPhoto);
    setIsPrinting(true);
  };

  const processBatchPhotos = async (files: FileList) => {
    const newPhotos: PhotoData[] = [];
    
    const readAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    };

    for (let i = 0; i < files.length; i++) {
      const url = await readAsDataURL(files[i]);
      newPhotos.push(createPhotoObject(url, i));
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setShowCaptureOptions(false);
  };

  const handlePrintingComplete = () => {
    if (pendingPhoto) setPhotos(prev => [...prev, pendingPhoto]);
    setPendingPhoto(null);
    setIsPrinting(false);
  };

  const addNewWallText = () => {
    setWallTexts(prev => [...prev, { 
      id: Date.now().toString(), 
      text: '', 
      x: window.scrollX + window.innerWidth / 2, 
      y: window.innerHeight / 2, 
      color: doodleColor, 
      fontSize: 48,
      rotation: 0
    }]);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className={`h-screen w-screen relative overflow-hidden flex flex-col wall-${wallTheme}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        multiple 
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            if (e.target.files.length === 1) {
              const reader = new FileReader();
              reader.readAsDataURL(e.target.files[0]);
              reader.onload = () => { processNewPhoto(reader.result as string); setShowCaptureOptions(false); };
            } else {
              processBatchPhotos(e.target.files);
            }
          }
        }} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Main Viewport */}
      <div className="wall-viewport flex-1 scroll-smooth">
        <PhotoWall 
          photos={photos} theme={wallTheme}
          onUpdatePhoto={updated => setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p))}
          onSelectPhoto={photo => { if (photo.isShaken || !photo.isDeveloping) setEditingPhoto(photo); }}
          doodles={doodles} wallStickers={wallStickers} wallTexts={wallTexts}
          isDoodling={isDoodling} isErasing={isErasing} doodleColor={doodleColor}
          onDoodleComplete={line => setDoodles(prev => [...prev, line])}
          onDeleteDoodle={id => setDoodles(prev => prev.filter(d => d.id !== id))}
          onUpdateWallSticker={(id, upd) => setWallStickers(prev => prev.map(s => s.id === id ? { ...s, ...upd } : s))}
          onDeleteWallSticker={id => setWallStickers(prev => prev.filter(s => s.id !== id))}
          onUpdateWallText={(id, upd) => setWallTexts(prev => prev.map(t => t.id === id ? { ...t, ...upd } : t))}
          onDeleteWallText={id => setWallTexts(prev => prev.filter(t => t.id !== id))}
        />
      </div>

      {/* Control Buttons */}
      <div className="fixed top-8 left-8 z-50 flex flex-col gap-3 items-start">
        <button 
          onClick={() => setShowWallSettings(!showWallSettings)} 
          className="control-btn flex items-center justify-center gap-3 px-8 py-4 h-14 bg-white border-2 border-amber-100 rounded-full text-amber-900 shadow-xl hover:bg-amber-50 transition-all"
        >
          <Palette size={24} />
          <span className="font-black text-lg">装饰照片墙</span>
        </button>
      </div>

      <div className="fixed top-8 right-8 z-40">
        <button 
          onClick={async () => {
            setIsExporting(true);
            const node = document.getElementById('photo-wall-container');
            if (node) {
              const dataUrl = await htmlToImage.toPng(node, { width: 5000, height: window.innerHeight });
              download(dataUrl, `InstaWall-${Date.now()}.png`);
            }
            setIsExporting(false);
          }} 
          className="control-btn flex items-center justify-center gap-2 px-8 py-4 h-14 bg-white border-2 border-amber-100 rounded-full font-black text-amber-900 shadow-xl hover:bg-amber-50 transition-all"
        >
          <Download size={20} />
          <span className="text-lg">{isExporting ? "导出中..." : "保存照片墙"}</span>
        </button>
      </div>

      {/* Decoration Settings Panel */}
      {showWallSettings && (
        <div className="fixed top-24 left-8 z-[60] glass-light rounded-[40px] shadow-2xl w-96 animate-in slide-in-from-left duration-500 flex flex-col max-h-[75vh] overflow-hidden">
          <div className="p-8 flex items-center justify-between border-b border-amber-900/5">
            <h3 className="text-2xl font-black text-amber-950 flex items-center gap-2 tracking-tight">墙面定制面板</h3>
            <button onClick={() => setShowWallSettings(false)} className="p-2 hover:bg-amber-100 rounded-full transition-colors text-amber-900/40 hover:text-amber-900"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
            <section>
              <h4 className="text-[12px] font-black tracking-widest uppercase text-amber-900/50 mb-4 flex items-center gap-2"><Layout size={14}/> 背景主题</h4>
              <div className="flex gap-4">
                {(['beige', 'white', 'grey', 'black', 'cork'] as WallTheme[]).map(t => (
                  <button key={t} onClick={() => setWallTheme(t)} className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${wallTheme === t ? 'border-amber-400 scale-110 shadow-lg' : 'border-amber-900/20'}`} style={{ backgroundColor: t === 'cork' ? '#bc8f8f' : t === 'beige' ? '#FFFBEB' : t === 'white' ? '#fff' : t === 'grey' ? '#f1f5f9' : '#0f172a' }} />
                ))}
              </div>
            </section>
            
            <section>
              <h4 className="text-[12px] font-black tracking-widest uppercase text-amber-900/50 mb-4 flex items-center gap-2"><Grid size={14}/> 一键排列</h4>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => autoLayout('heart')} className="p-4 bg-white rounded-2xl text-sm font-bold hover:bg-amber-50 flex items-center justify-center gap-2 border border-amber-100 shadow-sm"><Heart size={16} className="text-red-400"/> 爱心型</button>
                <button onClick={() => autoLayout('tree')} className="p-4 bg-white rounded-2xl text-sm font-bold hover:bg-amber-50 flex items-center justify-center gap-2 border border-amber-100 shadow-sm"><TreePine size={16} className="text-green-500"/> 圣诞树</button>
                <button onClick={() => autoLayout('circle')} className="p-4 bg-white rounded-2xl text-sm font-bold hover:bg-amber-50 flex items-center justify-center gap-2 border border-amber-100 shadow-sm"><Circle size={16} className="text-blue-400"/> 圆环</button>
                <button onClick={() => autoLayout('grid')} className="p-4 bg-white rounded-2xl text-sm font-bold hover:bg-amber-50 flex items-center justify-center gap-2 border border-amber-100 shadow-sm"><Maximize size={16} className="text-orange-400"/> 阵列</button>
              </div>
            </section>

            <section>
              <h4 className="text-[12px] font-black tracking-widest uppercase text-amber-900/50 mb-4 flex items-center gap-2"><Palette size={14}/> 笔刷与涂鸦</h4>
              <div className="flex flex-wrap gap-3 mb-4">
                {['#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa', '#000000', '#ffffff'].map(c => (
                  <button key={c} onClick={() => { setDoodleColor(c); setIsDoodling(true); setIsErasing(false); }} className={`w-8 h-8 rounded-full border-2 border-white transition-all shadow-sm ${doodleColor === c && isDoodling && !isErasing ? 'ring-2 ring-amber-400 scale-125' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsDoodling(!isDoodling); setIsErasing(false); }} 
                  className={`py-3 px-6 rounded-2xl flex-1 text-sm font-black transition-all shadow-sm ${isDoodling && !isErasing ? 'bg-amber-400 text-white shadow-inner' : 'bg-white border border-amber-100 text-amber-900 hover:bg-amber-50'}`}
                >
                  {isDoodling && !isErasing ? "正在涂鸦中" : "开启涂鸦"}
                </button>
                <button 
                  onClick={() => { setIsErasing(!isErasing); if (!isErasing) setIsDoodling(true); }}
                  className={`p-3 rounded-2xl border transition-all shadow-sm ${isErasing ? 'bg-red-500 text-white border-red-400 shadow-inner' : 'bg-white border-amber-100 text-amber-900 hover:bg-amber-50'}`}
                >
                  <Eraser size={20}/>
                </button>
                <button onClick={() => setDoodles(p => p.slice(0,-1))} className="p-3 bg-white rounded-2xl border border-amber-100 hover:bg-amber-50 shadow-sm text-amber-900"><Undo2 size={20}/></button>
              </div>
            </section>

            <section>
              <h4 className="text-[12px] font-black tracking-widest uppercase text-amber-900/50 mb-4 flex items-center gap-2"><TextIcon size={14}/> 墙上写字</h4>
              <button onClick={addNewWallText} className="w-full py-4 bg-amber-400 text-white rounded-2xl font-black shadow-md hover:bg-amber-500 transition-all flex items-center justify-center gap-2">
                添加文本框
              </button>
            </section>

            <section>
              <h4 className="text-[12px] font-black tracking-widest uppercase text-amber-900/50 mb-4 flex items-center gap-2"><Sticker size={14}/> 贴纸素材</h4>
              <div className="flex flex-wrap gap-2 p-4 bg-white/60 rounded-3xl border border-amber-50 shadow-inner">
                {['❤️', '✨', '🌈', '🐶', '🍭', '☕️', '📷', '🌸', '🍔', '🍦', '🏖️', '🎈'].map(e => (
                  <button key={e} onClick={() => setWallStickers(p => [...p, { id: Date.now().toString(), emoji: e, x: window.scrollX + window.innerWidth/2, y: window.innerHeight/2, scale: 1, rotation: 0 }])} className="text-3xl w-12 h-12 flex items-center justify-center hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            </section>
            
            <button onClick={() => { setDoodles([]); setWallStickers([]); setWallTexts([]); }} className="w-full py-4 text-red-500 font-black flex items-center justify-center gap-2 hover:bg-red-50 rounded-2xl transition-all"><Eraser size={20}/> 清除所有装饰</button>
          </div>
        </div>
      )}

      {/* Camera Capture Screen */}
      {isLiveCameraActive && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
           <div className="relative w-full max-w-4xl aspect-video rounded-[50px] overflow-hidden border-8 border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.15)]">
              <video ref={captureVideoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
              <div className="absolute inset-0 pointer-events-none border-[30px] border-black/20"></div>
           </div>
           <div className="mt-12 flex items-center gap-12">
              <button onClick={stopLiveCamera} className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"><X size={32}/></button>
              <button onClick={capturePhoto} className="w-24 h-24 rounded-full bg-white flex items-center justify-center group active:scale-90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] border-8 border-white/50">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse"></div>
                </div>
              </button>
              <div className="w-16"></div>
           </div>
        </div>
      )}

      {/* Choice Modal */}
      {showCaptureOptions && (
        <div className="fixed inset-0 z-[150] bg-amber-950/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[50px] p-10 shadow-2xl w-full max-w-md flex flex-col gap-6 border-4 border-amber-50">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-black text-amber-900">拍摄新相片</h3>
                <button onClick={() => setShowCaptureOptions(false)} className="p-2 hover:bg-amber-100 rounded-full transition-colors"><X size={24}/></button>
             </div>
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-4 p-6 bg-amber-50 hover:bg-amber-100 rounded-3xl transition-all group">
                <div className="p-4 bg-white rounded-2xl group-hover:scale-110 transition-transform"><Upload size={28} className="text-amber-500"/></div>
                <div className="text-left">
                   <div className="font-black text-amber-900">本地上传 / 多选</div>
                   <div className="text-xs text-amber-900/40">选择单张或多张照片批量打印</div>
                </div>
             </button>
             <button onClick={startLiveCamera} className="flex items-center gap-4 p-6 bg-amber-50 hover:bg-amber-100 rounded-3xl transition-all group">
                <div className="p-4 bg-white rounded-2xl group-hover:scale-110 transition-transform"><CameraIcon size={28} className="text-amber-500"/></div>
                <div className="text-left">
                   <div className="font-black text-amber-900">开启摄像头</div>
                   <div className="text-xs text-amber-900/40">即刻捕捉美好瞬间</div>
                </div>
             </button>
          </div>
        </div>
      )}

      <CameraCabinet selectedCameraId={selectedCamera} onSelectCamera={setSelectedCamera} onTakePhoto={() => setShowCaptureOptions(true)} />
      <PrintingOverlay isPrinting={isPrinting} photoUrl={pendingPhoto?.url || null} onAnimationComplete={handlePrintingComplete} selectedCameraId={selectedCamera} />
      {editingPhoto && (
        <NoteEditor 
          photo={editingPhoto} 
          onClose={() => setEditingPhoto(null)} 
          onSave={(id, note, stickers, pin, frame) => setPhotos(prev => prev.map(p => p.id === id ? { ...p, note, stickers, pin, frame } : p))} 
          onDelete={deletePhoto}
        />
      )}
    </div>
  );
};
export default App;
