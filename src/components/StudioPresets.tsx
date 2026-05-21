import React from 'react';
import { Sparkles, Sun, Zap, Eye, Moon, Film } from 'lucide-react';
import { Preset, SliderSettings } from '../types';

interface StudioPresetsProps {
  currentPresetId: string;
  onSelectPreset: (preset: Preset) => void;
}

export const PRESETS: Preset[] = [
  {
    id: 'cinematic',
    name: 'Dramatic Cinematic',
    description: 'Gold rim light with rich slate-blue shadows & a soft romantic filmic glow.',
    icon: 'Sparkles',
    settings: {
      rimLight: 75,
      shadowTint: 20, // 20 = Deep elegant navy
      facialClarity: 70,
      colorVibrancy: 65,
      filmicGlow: 50,
      brightness: 48,
      contrast: 58,
      denoise: 80,
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden hour',
    description: 'Intense sunset glow, soft highlights, and vibrant warm skin tones.',
    icon: 'Sun',
    settings: {
      rimLight: 90,
      shadowTint: 85, // 85 = Rich warm amber
      facialClarity: 60,
      colorVibrancy: 80,
      filmicGlow: 65,
      brightness: 55,
      contrast: 52,
      denoise: 75,
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Electric highlights, cobalt split shadows, and sharp technical styling.',
    icon: 'Zap',
    settings: {
      rimLight: 65,
      shadowTint: 5, // 5 = Pure cyber blue
      facialClarity: 90,
      colorVibrancy: 95,
      filmicGlow: 40,
      brightness: 46,
      contrast: 68,
      denoise: 40,
    },
  },
  {
    id: 'noir',
    name: 'Romantic Noir',
    description: 'Dramatic low-key monochrome contrast with velvet shadow reduction.',
    icon: 'Moon',
    settings: {
      rimLight: 85,
      shadowTint: 50, // Neutral b&w slate
      facialClarity: 75,
      colorVibrancy: 0, // Monochrome
      filmicGlow: 55,
      brightness: 42,
      contrast: 75,
      denoise: 90,
    },
  },
  {
    id: 'dreamy',
    name: 'Soft Editorial',
    description: 'Delicate high-key pastel exposure with smooth, glowing bloom textures.',
    icon: 'Film',
    settings: {
      rimLight: 40,
      shadowTint: 60,
      facialClarity: 45,
      colorVibrancy: 50,
      filmicGlow: 85,
      brightness: 62,
      contrast: 40,
      denoise: 95,
    },
  },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Sun':
      return <Sun className="w-4 h-4" />;
    case 'Zap':
      return <Zap className="w-4 h-4" />;
    case 'Moon':
      return <Moon className="w-4 h-4" />;
    case 'Film':
      return <Film className="w-4 h-4" />;
    case 'Sparkles':
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export default function StudioPresets({ currentPresetId, onSelectPreset }: StudioPresetsProps) {
  return (
    <div id="presets-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400">
          Studio Presets
        </h3>
        <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
          Quick Apply
        </span>
      </div>
      <div id="presets-grid" className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            id={`preset-btn-${preset.id}`}
            onClick={() => onSelectPreset(preset)}
            className={`flex flex-col items-start gap-2 text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              currentPresetId === preset.id
                ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/5'
                : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/70 hover:border-zinc-700'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg ${
                currentPresetId === preset.id
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-850 text-zinc-400 group-hover:text-amber-500 transition-colors'
              }`}
            >
              {getIcon(preset.icon)}
            </div>
            <div>
              <div
                className={`text-xs font-bold ${
                  currentPresetId === preset.id ? 'text-amber-500 font-extrabold' : 'text-zinc-200'
                }`}
              >
                {preset.name}
              </div>
              <p className="text-[10px] text-zinc-500 leading-snug mt-1 font-sans line-clamp-2">
                {preset.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
