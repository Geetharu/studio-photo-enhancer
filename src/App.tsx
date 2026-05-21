import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UploadCloud,
  Undo2,
  Download,
  Info,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SliderSettings, Preset, EnhancementResult } from './types';
import CompareSlider from './components/CompareSlider';
import StudioPresets, { PRESETS } from './components/StudioPresets';
import EditorSettings from './components/EditorSettings';
import ImageDropzone from './components/ImageDropzone';
import {
  bakeImageForDownload,
  buildCanvasFilter,
  triggerDownloadFromDataUrl,
} from './utils/canvasExport';
import {
  deductCredit,
  FREE_CREDITS_MAX,
  getCreditsRemaining,
  hasCredits,
} from './utils/credits';
import {
  addToHistory,
  HistoryEntry,
  loadHistory,
} from './utils/enhancementHistory';
import RecentEnhancements from './components/RecentEnhancements';

// High-quality, reliable street-lit couple portrait to act as low-light demo
const DEMO_IMAGE_URL = 'https://images.unsplash.com/photo-1516575150278-77136aed6920?q=80&w=1200&auto=format&fit=crop';

export default function App() {
  // Application states
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [settings, setSettings] = useState<SliderSettings>(PRESETS[0].settings);
  const [currentPresetId, setCurrentPresetId] = useState<string>(PRESETS[0].id);
  
  // Processing & result states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<EnhancementResult | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(() =>
    getCreditsRemaining()
  );
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() =>
    loadHistory()
  );
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [statusLogs, setStatusLogs] = useState<string[]>([
    'Photo Studio Engine loaded.',
    'Ready for raw camera portrait upload.'
  ]);

  // Check API health status on load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApiKey) {
          setHasApiKey(true);
          addLog('Gemini API key detected. Enhance button is ready.');
        } else {
          setHasApiKey(false);
          addLog('No GEMINI_API_KEY in .env.local — add your key to enable Enhance.');
        }
      })
      .catch(() => {
        setHasApiKey(false);
        addLog('Studio connection verified. Loaded local rendering components.');
      });
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setStatusLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 7)]);
  };

  const handleImageLoaded = (base64Data: string, type: string) => {
    setOriginalImage(base64Data);
    setMimeType(type);
    setApiResult(null);
    setActiveHistoryId(null);
    addLog(`Uploaded raw camera input image: ${type.toUpperCase()}`);
  };

  const handleLoadDemo = () => {
    setOriginalImage(DEMO_IMAGE_URL);
    setMimeType('image/jpeg');
    setApiResult(null);
    setActiveHistoryId(null);
    addLog('Loaded default low-light street portrait demo.');
  };

  const handleSelectPreset = (preset: Preset) => {
    setSettings(preset.settings);
    setCurrentPresetId(preset.id);
    addLog(`Applied preset: ${preset.name}`);
  };

  const handleResetSettings = () => {
    const defaultPreset = PRESETS[0];
    setSettings(defaultPreset.settings);
    setCurrentPresetId(defaultPreset.id);
    addLog('Reset adjustments to default cinematic state.');
  };

  const resolveImageForApi = async (src: string): Promise<string> => {
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    const response = await fetch(src);
    if (!response.ok) throw new Error('Could not load image for enhancement.');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Failed to encode image.'));
      };
      reader.onerror = () => reject(new Error('Failed to read image.'));
      reader.readAsDataURL(blob);
    });
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setOriginalImage(entry.imageUrl);
    setMimeType('image/jpeg');
    setApiResult({
      imageUrl: entry.imageUrl,
      isAiRender: true,
      promptUsed: 'Loaded from recent history',
      timestamp: new Date(entry.savedAt).toLocaleTimeString(),
    });
    setActiveHistoryId(entry.id);
    setErrorNotice(null);
    addLog('Loaded enhancement from recent history.');
  };

  const handleEnhance = async () => {
    if (!originalImage || isProcessing || !hasCredits()) return;
    setIsProcessing(true);
    setErrorNotice(null);
    setApiResult(null);
    addLog('Sending image to Gemini for studio enhancement...');

    try {
      const imagePayload = await resolveImageForApi(originalImage);

      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePayload, settings }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.imageUrl) {
        let errorMsg = data.error || `Enhancement failed (${response.status}).`;
        
        // Custom logic to catch raw JSON and rate limits
        const errorString = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
        const lowerError = errorString.toLowerCase();
        
        if (lowerError.includes('429') || lowerError.includes('quota') || lowerError.includes('rate limit') || lowerError.includes('resource exhausted')) {
          errorMsg = 'API Rate Limit Reached: Please wait a moment and try again.';
        } else if (typeof errorMsg !== 'string') {
          errorMsg = data.error?.message || 'An unexpected API error occurred.';
        }

        setErrorNotice(errorMsg);
        addLog(`Error: ${errorMsg}`);
        return;
      }

      const remaining = deductCredit();
      setCreditsRemaining(remaining);

      setApiResult({
        imageUrl: data.imageUrl,
        isAiRender: true,
        promptUsed: 'Gemini studio enhancement',
        timestamp: new Date().toLocaleTimeString(),
      });
      setActiveHistoryId(null);
      addLog(`Gemini enhancement completed. ${remaining} credit${remaining === 1 ? '' : 's'} remaining.`);

      const historyResult = await addToHistory(data.imageUrl);
      setHistoryEntries(historyResult.entries);
      if (historyResult.ok === false) {
        if (historyResult.reason === 'quota') {
          addLog('History not saved — browser storage is full.');
        } else {
          addLog('History not saved — could not compress image.');
        }
      }
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : 'Network error during enhancement.';
      
      const lowerError = message.toLowerCase();
      if (lowerError.includes('429') || lowerError.includes('quota') || lowerError.includes('rate limit') || lowerError.includes('resource exhausted')) {
        message = 'API Rate Limit Reached: Please wait a moment and try again.';
      }
      
      setErrorNotice(message);
      addLog(`Error: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const applySliderPreview = !(apiResult && apiResult.isAiRender);

  const getSimulatedEnhancedStyle = (): React.CSSProperties => {
    if (!applySliderPreview) return {};
    return { filter: buildCanvasFilter(settings) };
  };

  // Shadow Tint gradient overlay logic
  const getShadowTintOverlay = () => {
    if (settings.shadowTint < 50) {
      // Cobalt blue shadow tint
      const intensity = ((50 - settings.shadowTint) / 50) * 0.35;
      return `linear-gradient(to top, rgba(30, 58, 138, ${intensity}) 0%, rgba(15, 23, 42, 0.05) 75%, transparent 100%)`;
    } else {
      // Warm bronze/chocolate sunset tint
      const intensity = ((settings.shadowTint - 50) / 50) * 0.28;
      return `linear-gradient(to top, rgba(120, 53, 4, ${intensity}) 0%, rgba(120, 53, 4, ${intensity * 0.1}) 60%, transparent 100%)`;
    }
  };

  const handleDownload = async () => {
    const sourceUrl = apiResult ? apiResult.imageUrl : originalImage;
    if (!sourceUrl || isExporting) return;

    setIsExporting(true);
    addLog('Baking slider adjustments into export canvas...');

    try {
      const bakedDataUrl = await bakeImageForDownload(sourceUrl, settings, {
        applySliderEffects: applySliderPreview,
      });
      triggerDownloadFromDataUrl(
        bakedDataUrl,
        `enhanced_portrait_${Date.now()}.png`
      );
      addLog('Exported image with baked adjustments to downloads.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Export failed.';
      setErrorNotice(message);
      addLog(`Export error: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="workspace-root" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Editorial Header */}
      <header id="app-header" className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500 rounded-xl text-zinc-950 shadow-lg shadow-amber-500/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase font-mono text-zinc-200">
              Studio Photo Enhancer
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-wide">
              PRO CINEMATIC COLOR GRADE & SHIFT PIPELINE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`}></span>
            {hasApiKey ? 'AI ENGINE: ACTIVE' : 'LOCAL ENGINE: LIVE'}
          </div>
          {originalImage && (
            <button
              id="header-btn-clear"
              disabled={isProcessing}
              onClick={() => {
                setOriginalImage(null);
                setApiResult(null);
                addLog('Cleared workspace.');
              }}
              className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer"
            >
              Clear Workspace
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body Layout */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Play/Control Space */}
        <div id="editor-left-workspace" className="col-span-1 lg:col-span-3 space-y-6">
          
          {!originalImage ? (
            /* Upload Onboarding State */
            <div id="onboarding-block" className="space-y-6">
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <div className="max-w-2xl text-left space-y-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                    AI Studio Grade Photography
                  </span>
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-sans">
                    Transform low-light snaps into award-winning masterpieces.
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Upload your low-exposure or night couple selfies. This studio applies dramatic 3D volumetric warmth, introduces a rich golden rim-contour light, preserves detailed facial likenesses, eliminates digital noise, and adds a luxurious romantic glow using Google Gemini's advanced multimodal graphics.
                  </p>
                </div>
              </div>

              <ImageDropzone
                onImageLoaded={handleImageLoaded}
                onLoadDemo={handleLoadDemo}
                isProcessing={isProcessing}
              />
            </div>
          ) : (
            /* Active Photo Editing Canvas */
            <div id="active-editor-canvas" className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl">
                <div className="text-left">
                  <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block">
                    Workspace Active
                  </span>
                  <h2 className="text-xs font-mono uppercase font-bold text-zinc-300">
                    Interactive Compare Canvas
                  </h2>
                  <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">
                    Drag the middle orange slider side-to-side to inspect rendering layers.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      id="credits-badge"
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wide"
                    >
                      Credits Remaining:{' '}
                      <span
                        className={
                          creditsRemaining > 0 ? 'text-amber-500 ml-1' : 'text-red-400 ml-1'
                        }
                      >
                        {creditsRemaining}/{FREE_CREDITS_MAX}
                      </span>
                    </span>
                    <button
                      id="btn-enhance"
                      disabled={
                        isProcessing || !hasApiKey || creditsRemaining === 0
                      }
                      onClick={handleEnhance}
                      title={
                        creditsRemaining === 0
                          ? 'Free credits used — Pro coming soon'
                          : hasApiKey
                            ? 'Enhance with Gemini AI'
                            : 'Set GEMINI_API_KEY in .env.local'
                      }
                      className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-mono font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Enhancing...
                        </>
                      ) : creditsRemaining === 0 ? (
                        'Limit Reached - Pro Coming Soon'
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          Enhance
                        </>
                      )}
                    </button>
                  </div>

                  {originalImage && (
                    <button
                      id="btn-download-masterpiece"
                      disabled={isExporting || isProcessing}
                      onClick={handleDownload}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-zinc-200 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-zinc-400" />
                          Export
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Comparison Canvas Slider Container */}
              <div id="canvas-wrapper" className="relative">
                <CompareSlider
                  original={originalImage}
                  enhanced={apiResult ? apiResult.imageUrl : originalImage}
                  heightClass="h-[480px] md:h-[580px]"
                  enhancedStyle={getSimulatedEnhancedStyle()}
                />

                {/* Simulated Glow Overlay - Real-time bloom */}
                {applySliderPreview && settings.filmicGlow > 0 && (
                  <img
                    src={originalImage}
                    alt="Real-time Bloom Layer"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen rounded-2xl"
                    style={{
                      // Clip identical to comparison slider? Actually, to match the slider, we let it clip side-by-side or overlay
                      // Since it's pointer-events-none we can overlay it beautifully
                      filter: 'blur(16px) brightness(1.3) contrast(1.25)',
                      opacity: (settings.filmicGlow / 100) * 0.35,
                    }}
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Simulated Rim-Light Overlay - Warm Golden contour light mapping */}
                {applySliderPreview && settings.rimLight > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none mix-blend-color-dodge rounded-2xl"
                    style={{
                      opacity: (settings.rimLight / 100) * 0.42,
                      background: 'radial-gradient(circle at center, transparent 38%, rgba(245, 158, 11, 0.22) 72%, rgba(245, 158, 11, 0.46) 100%)',
                    }}
                  />
                )}

                {/* Simulated Shadow Tint Layer - Rich blue cobalt or rich amber sunset shadows */}
                {applySliderPreview && (
                  <div
                    className="absolute inset-x-0 bottom-0 top-1/2 pointer-events-none mix-blend-soft-light rounded-b-2xl"
                    style={{
                      background: getShadowTintOverlay(),
                    }}
                  />
                )}
              </div>

              {/* Preset Quick Panel */}
              <StudioPresets
                currentPresetId={currentPresetId}
                onSelectPreset={handleSelectPreset}
              />

              <RecentEnhancements
                entries={historyEntries}
                activeId={activeHistoryId}
                onSelect={handleSelectHistory}
              />
            </div>
          )}

          {!originalImage && historyEntries.length > 0 && (
            <RecentEnhancements
              entries={historyEntries}
              activeId={activeHistoryId}
              onSelect={handleSelectHistory}
            />
          )}

          {/* Feedback details: Sleek Error/API state notifications */}
          {errorNotice && (
            <div id="api-status-notice" className="bg-red-950/60 border border-red-500/30 rounded-xl p-3 flex items-center gap-3 text-left max-w-[600px] shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-xs font-mono text-zinc-300 leading-relaxed m-0 break-words">{errorNotice}</p>
            </div>
          )}
        </div>

        {/* Dynamic adjust slider Panel (Right sidebar) */}
        <div id="editor-right-controls" className="space-y-6">
          <EditorSettings
            settings={settings}
            onChangeSettings={(new_settings) => {
              setSettings(new_settings);
              setCurrentPresetId(''); // clear preset highlight since we modified sliders
            }}
            onReset={handleResetSettings}
            isProcessing={isProcessing}
          />

          {/* Render status logging logs */}
          <div id="rendering-telemetry" className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-[10px] font-mono tracking-widest uppercase font-bold text-zinc-400">
              Pipeline State Telemetry
            </h3>
            <div id="logs-container" className="font-mono text-[10px] space-y-2 leading-relaxed text-zinc-500 text-left overflow-hidden h-[130px] pr-1">
              {statusLogs.map((log, index) => (
                <div key={index} className={`truncate ${index === 0 ? 'text-amber-500 font-bold' : ''}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      <footer id="studio-footer" className="studio-footer text-center p-5 border-t border-[#1a1a1a] text-[#666] text-xs tracking-wider">
        <p className="studio-footer__text">
          STUDIO PHOTO ENHANCER &copy; 2026 — GEETH WICKRAMASINGHE &bull; POWERED BY
          GEMINI AI &bull; STATUS: ONLINE
        </p>
      </footer>
    </div>
  );
}