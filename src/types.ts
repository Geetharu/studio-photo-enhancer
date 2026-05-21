export interface SliderSettings {
  rimLight: number; // 0 to 100
  shadowTint: number; // 0 to 100 (0 = rich deep blue, 100 = warm chocolate)
  facialClarity: number; // 0 to 100
  colorVibrancy: number; // 0 to 100
  filmicGlow: number; // 0 to 100
  brightness: number; // 0 to 100
  contrast: number; // 0 to 100
  denoise: number; // 0 to 100
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: SliderSettings;
}

export interface EnhancementResult {
  imageUrl: string;
  isAiRender: boolean;
  promptUsed: string;
  timestamp: string;
}
