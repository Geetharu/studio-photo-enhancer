import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Eye } from 'lucide-react';

interface CompareSliderProps {
  original: string;
  enhanced: string;
  heightClass?: string;
  enhancedStyle?: React.CSSProperties; // allows applying local CSS filters for real-time preview
}

export default function CompareSlider({
  original,
  enhanced,
  heightClass = 'h-[500px]',
  enhancedStyle = {},
}: CompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onTouchStart = () => {
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      id="comparison-container"
      className={`relative w-full ${heightClass} bg-zinc-950 rounded-2xl overflow-hidden select-none border border-zinc-800/80 shadow-2xl group`}
    >
      {/* Enhanced Image (Base Layer) */}
      <div 
        id="enhanced-layer"
        className="absolute inset-0 w-full h-full"
      >
        <img
          src={enhanced}
          alt="Studio Enhanced"
          className="w-full h-full object-cover transition-opacity duration-300"
          style={enhancedStyle}
          referrerPolicy="no-referrer"
        />
        <span id="enhanced-badge" className="absolute bottom-4 right-4 bg-amber-500/90 text-zinc-950 font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-sm">
          <Sparkles className="w-3 h-3 text-zinc-950" />
          Studio Enhanced
        </span>
      </div>

      {/* Original Image (Clip-path overlay) */}
      <div
        id="original-layer"
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      >
        <img
          src={original}
          alt="Original Raw"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <span id="original-badge" className="absolute bottom-4 left-4 bg-zinc-900/80 text-zinc-300 font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-lg border border-zinc-700/50 flex items-center gap-1 backdrop-blur-sm">
          <Eye className="w-3 h-3 text-zinc-400" />
          Original Raw
        </span>
      </div>

      {/* Slider Bar & Handle */}
      <div
        id="slider-divider"
        className="absolute top-0 bottom-0 w-1 bg-amber-500 cursor-ew-resize flex items-center justify-center group-hover:w-1.5 transition-all duration-200"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div 
          id="slider-handle"
          className="w-9 h-9 bg-zinc-900 border-2 border-amber-500 text-amber-500 rounded-full flex items-center justify-center shadow-xl cursor-ew-resize hover:scale-110 active:scale-95 transition-transform duration-150 backdrop-blur-md"
        >
          <div className="flex gap-0.5 items-center justify-center">
            <span className="w-0.5 h-3.5 bg-amber-500 rounded-md"></span>
            <span className="w-0.5 h-3.5 bg-amber-500 rounded-md"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
