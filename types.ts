
export interface PhotoSticker {
  id: string;
  emoji: string;
  x: number; 
  y: number;
}

export type FrameType = 'classic' | 'pink' | 'mint' | 'dots' | 'stripes' | 'checkered';
export type PinType = 'simple' | 'tape' | 'clip' | 'none';
export type CameraFilter = 'normal' | 'vintage' | 'bw' | 'cool' | 'warm';

export interface PhotoData {
  id: string;
  url: string;
  x: number;
  y: number;
  rotation: number;
  note: string;
  filter: CameraFilter;
  timestamp: number;
  isDeveloping: boolean;
  isShaken: boolean;
  shakeProgress: number;
  stickers: PhotoSticker[];
  pin?: PinType;
  frame?: FrameType;
}

export interface WallSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface WallText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  rotation: number;
}

export interface DoodleLine {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export type WallTheme = 'beige' | 'white' | 'grey' | 'black' | 'cork';

export interface CameraConfig {
  id: CameraFilter;
  name: string;
  description: string;
  cssFilter: string;
  overlay?: string;
  bodyColor: string;
  accentColor: string;
}

export const CAMERAS: CameraConfig[] = [
  {
    id: 'normal',
    name: 'Instax Mini 11',
    description: '现代自动曝光，色彩鲜活细腻',
    cssFilter: 'contrast(1.1) saturate(1.2) brightness(1.02)',
    bodyColor: 'bg-white',
    accentColor: 'bg-zinc-100',
  },
  {
    id: 'vintage',
    name: 'Polaroid SX-70',
    description: '1972 经典折叠，复古暖棕影调',
    cssFilter: 'sepia(0.45) contrast(1.15) brightness(0.9) saturate(0.8) hue-rotate(-5deg)',
    overlay: 'rgba(139, 69, 19, 0.08)',
    bodyColor: 'bg-[#d2b48c]',
    accentColor: 'bg-[#8b4513]',
  },
  {
    id: 'bw',
    name: 'Instax Monochrome',
    description: '专业黑白相纸，电影感明暗对比',
    cssFilter: 'grayscale(1) contrast(1.4) brightness(1.05)',
    bodyColor: 'bg-[#1a1a1a]',
    accentColor: 'bg-zinc-800',
  },
  {
    id: 'cool',
    name: 'Instax Mini 9 Blue',
    description: '清新冰川蓝，日系淡雅空气感',
    cssFilter: 'saturate(0.7) brightness(1.15) hue-rotate(190deg) contrast(0.95)',
    overlay: 'rgba(165, 216, 221, 0.12)',
    bodyColor: 'bg-[#a5d8dd]',
    accentColor: 'bg-blue-300',
  },
  {
    id: 'warm',
    name: 'Polaroid 600 Sun',
    description: '阳光系列，浓郁饱和的夏日回忆',
    cssFilter: 'saturate(1.6) contrast(1.2) brightness(1.05) sepia(0.12)',
    bodyColor: 'bg-[#f9ca24]',
    accentColor: 'bg-black',
  }
];
