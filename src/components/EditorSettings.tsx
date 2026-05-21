import React from 'react';
import { Sliders, SunDim, Paintbrush, ShieldCheck, Sparkles, SlidersHorizontal, ArrowLeftRight, Flame } from 'lucide-react';
import { SliderSettings } from '../types';

interface EditorSettingsProps {
  settings: SliderSettings;
  onChangeSettings: (settings: SliderSettings) => void;
  onReset: () => void;
  isProcessing: boolean;
}

export default function EditorSettings({
  settings,
  onChangeSettings,
  onReset,
  isProcessing,
}: EditorSettingsProps) {
  const updateField = (field: keyof SliderSettings, val: number) => {
    onChangeSettings({
      ...settings,
      [field]: val,
    });
  };

  const sliderList = [
    {
      id: 'rimLight',
      name: 'Golden Rim Lighting',
      icon: <Flame className="w-4 h-4 text-amber-500" />,
      description: 'Golden outline rim light separating subject from background.',
      min: 0,
      max: 100,
      suffix: '%',
    },
    {
      id: 'shadowTint',
      name: 'Shadow Color Tint',
      icon: <ArrowLeftRight className="w-4 h-4 text-sky-400" />,
      description: 'Tint of dark areas: Blue-cobalt neon (left) vs Warm bronze (right).',
      min: 0,
      max: 100,
      suffix: ' tint',
    },
    {
      id: 'facialClarity',
      name: 'Facial Clarity & Likeness',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      description: 'Improves clarity of facial details while preserving natural form.',
      min: 0,
      max: 100,
      suffix: '%',
    },
    {
      id: 'colorVibrancy',
      name: 'Color Vibrancy',
      icon: <Paintbrush className="w-4 h-4 text-pink-400" />,
      description: 'Enhances richness of warm colors and portrait glows.',
      min: 0,
      max: 100,
      suffix: '%',
    },
    {
      id: 'filmicGlow',
      name: 'Luxurious Filmic Glow',
      icon: <Sparkles className="w-4 h-4 text-violet-400" />,
      description: 'Applies dreamy editorial soft mist bloom to highlights.',
      min: 0,
      max: 100,
      suffix: '%',
    },
    {
      id: 'denoise',
      name: 'Denoise & Grain Control',
      icon: <SunDim className="w-4 h-4 text-teal-400" />,
      description: 'Locks out sensor noise, compression grain, and low-light artifacts.',
      min: 0,
      max: 100,
      suffix: '%',
    },
  ];

  return (
    <div id="settings-card" className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
            Granular adjustments
          </h2>
        </div>
        <button
          id="btn-reset-sliders"
          disabled={isProcessing}
          onClick={onReset}
          className="text-xs font-mono font-bold text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        >
          Reset All
        </button>
      </div>

      <div id="sliders-container" className="space-y-4">
        {sliderList.map((slider) => {
          const value = settings[slider.id as keyof SliderSettings];
          return (
            <div key={slider.id} id={`control-${slider.id}`} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {slider.icon}
                  <span className="text-xs font-bold text-zinc-200">{slider.name}</span>
                </div>
                <span className="text-xs font-mono font-extrabold text-amber-500">
                  {value}
                  {slider.suffix}
                </span>
              </div>
              <p className="text-[10px] text-zinc-550 leading-relaxed font-sans mt-0.5">
                {slider.description}
              </p>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                value={value}
                id={`slider-${slider.id}`}
                disabled={isProcessing}
                onChange={(e) => updateField(slider.id as keyof SliderSettings, Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
