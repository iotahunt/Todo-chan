import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Sparkles, Sun, Moon, Check, Plus, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = v; b = q; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [236, 72, 153];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, v];
}

export const ColorWheel: React.FC = () => {
  const { themeColor, setThemeColor, isDarkMode, setIsDarkMode, isNeonMode, setIsNeonMode, resetTheme } = useTheme();
  const { updateUserPreferences } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brightness, setBrightness] = useState<number>(1);
  const [rgb, setRgb] = useState<[number, number, number]>([236, 72, 153]);
  const [hexInput, setHexInput] = useState<string>(themeColor);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    const [r, g, b] = hexToRgb(themeColor);
    setRgb([r, g, b]);
    setHexInput(themeColor);
    const [, , v] = rgbToHsv(r, g, b);
    setBrightness(v);
  }, [themeColor]);

  const applyColor = (hex: string) => {
    setThemeColor(hex);
    updateUserPreferences({ themeColor: hex });
  };

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 4;

    ctx.clearRect(0, 0, width, height);

    const image = ctx.createImageData(width, height);
    const data = image.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          let angle = Math.atan2(dy, dx);
          if (angle < 0) angle += 2 * Math.PI;
          const hue = angle / (2 * Math.PI);
          const sat = Math.min(dist / radius, 1);
          const [r, g, b] = hsvToRgb(hue, sat, brightness);

          const index = (y * width + x) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        }
      }
    }

    ctx.putImageData(image, 0, 0);

    // Marker
    const [h, s] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    const markerAngle = h * 2 * Math.PI;
    const markerDist = s * radius;
    const markerX = centerX + markerDist * Math.cos(markerAngle);
    const markerY = centerY + markerDist * Math.sin(markerAngle);

    ctx.beginPath();
    ctx.arc(markerX, markerY, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(markerX, markerY, 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [brightness, rgb]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = rect.width / 2 - 4;

    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    const hue = angle / (2 * Math.PI);
    const sat = Math.max(0, Math.min(1, dist / radius));

    const [r, g, b] = hsvToRgb(hue, sat, brightness);
    const newHex = rgbToHex(r, g, b);
    setRgb([r, g, b]);
    setHexInput(newHex);
    applyColor(newHex);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newV = parseFloat(e.target.value);
    setBrightness(newV);
    const [h, s] = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    const [r, g, b] = hsvToRgb(h, s, newV);
    const newHex = rgbToHex(r, g, b);
    setRgb([r, g, b]);
    setHexInput(newHex);
    applyColor(newHex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      applyColor(val);
    }
  };

  const handleRgbChange = (index: 0 | 1 | 2, val: number) => {
    const clamped = Math.max(0, Math.min(255, val || 0));
    const next: [number, number, number] = [...rgb];
    next[index] = clamped;
    setRgb(next);
    const hex = rgbToHex(next[0], next[1], next[2]);
    setHexInput(hex);
    applyColor(hex);
  };

  const handlePresetClick = (hex: string) => {
    applyColor(hex);
  };

  return (
    <div
      className={`border rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6 transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-[#E6DFD3]'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-4 border-b ${
          isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
        }`}
      >
        <div>
          <h2
            className={`text-base font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            <span>Theme Personalization</span>
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            Choose any custom color on the color wheel. All buttons and highlights will update immediately.
          </p>
        </div>
        <button
          onClick={resetTheme}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition ${
            isDarkMode
              ? 'text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
              : 'text-stone-600 hover:text-stone-900 bg-[#FAF7F2] hover:bg-[#EAE3D6] border-[#D6CEC0]'
          }`}
          title="Reset to default theme"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Interactive Color Wheel */}
        <div className="flex flex-col items-center">
          <div className="relative p-2 rounded-full border border-slate-800/80 bg-slate-950/60 shadow-inner">
            <canvas
              ref={canvasRef}
              width={220}
              height={220}
              className="cursor-crosshair rounded-full touch-none"
              onMouseDown={(e) => {
                setIsDragging(true);
                handleCanvasInteraction(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                if (isDragging) handleCanvasInteraction(e.clientX, e.clientY);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                setIsDragging(true);
                const touch = e.touches[0];
                handleCanvasInteraction(touch.clientX, touch.clientY);
              }}
              onTouchMove={(e) => {
                if (isDragging) {
                  const touch = e.touches[0];
                  handleCanvasInteraction(touch.clientX, touch.clientY);
                }
              }}
              onTouchEnd={() => setIsDragging(false)}
            />
          </div>

          {/* Brightness Slider */}
          <div className="w-full max-w-[220px] mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Brightness</span>
              <span className="font-mono">{Math.round(brightness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.01"
              value={brightness}
              onChange={handleBrightnessChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: themeColor }}
            />
          </div>
        </div>

        {/* Inputs, Swatches, Toggles */}
        <div className="space-y-4">
          {/* Color Preview & Hex */}
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl border border-white/20 shadow-lg shrink-0 transition-all"
              style={{
                backgroundColor: themeColor,
                boxShadow: isNeonMode ? `0 0 20px ${themeColor}80` : undefined,
              }}
            />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">HEX CODE</label>
              <input
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-hidden transition"
                style={{ borderColor: themeColor }}
                placeholder="#EC4899"
              />
            </div>
          </div>

          {/* RGB Values */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">RGB VALUES</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">R</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb[0]}
                  onChange={(e) => handleRgbChange(0, parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">G</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb[1]}
                  onChange={(e) => handleRgbChange(1, parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">B</span>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgb[2]}
                  onChange={(e) => handleRgbChange(2, parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Curated Aesthetic Palettes
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { hex: '#06b6d4', name: 'Cyber Cyan' },
                { hex: '#10b981', name: 'Mint Emerald' },
                { hex: '#8b5cf6', name: 'Electric Violet' },
                { hex: '#f59e0b', name: 'Solar Amber' },
                { hex: '#3b82f6', name: 'Sapphire Blue' },
                { hex: '#ec4899', name: 'Sakura Pink' },
                { hex: '#ef4444', name: 'Crimson Arc' },
              ].map((p) => (
                <button
                  key={p.hex}
                  onClick={() => handlePresetClick(p.hex)}
                  title={p.name}
                  className="w-8 h-8 rounded-xl border border-white/20 transition transform hover:scale-110 flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: p.hex }}
                >
                  {themeColor.toLowerCase() === p.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div
            className={`pt-2 border-t space-y-2.5 ${
              isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
            }`}
          >
            {/* Dark / Light Mode */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium flex items-center gap-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-stone-700'
                }`}
              >
                {isDarkMode ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Theme Mode
              </span>
              <div
                className={`flex p-1 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#FAF7F2] border-[#E6DFD3]'
                }`}
              >
                <button
                  onClick={() => {
                    setIsDarkMode(false);
                    updateUserPreferences({ isDarkMode: false });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    !isDarkMode ? 'bg-white text-stone-900 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cream Light
                </button>
                <button
                  onClick={() => {
                    setIsDarkMode(true);
                    updateUserPreferences({ isDarkMode: true });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    isDarkMode ? 'bg-slate-800 text-white shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Neon Mode */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium flex items-center gap-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-stone-700'
                }`}
              >
                <Sparkles className="w-4 h-4" style={{ color: themeColor }} />
                Neon Mode Glow
              </span>
              <button
                onClick={() => {
                  const next = !isNeonMode;
                  setIsNeonMode(next);
                  updateUserPreferences({ isNeonMode: next });
                }}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden"
                style={{ backgroundColor: isNeonMode ? themeColor : '#cbd5e1' }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isNeonMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Interactive Button & Component Preview */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mt-4 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Live Interactive Accent Preview
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Button Preview */}
          <button
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 flex items-center gap-1.5"
            style={{
              backgroundColor: themeColor,
              boxShadow: isNeonMode ? `0 0 15px ${themeColor}70` : undefined,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Action Button</span>
          </button>

          {/* Badge Preview */}
          <span
            className="px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1"
            style={{
              color: themeColor,
              backgroundColor: `${themeColor}20`,
              borderColor: `${themeColor}50`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Accent Badge</span>
          </span>

          {/* Tab Preview */}
          <span
            className="px-3 py-1 text-xs font-bold border-b-2"
            style={{
              color: themeColor,
              borderColor: themeColor,
            }}
          >
            Selected Tab
          </span>
        </div>

        {/* Progress Bar Preview */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Dynamic Progress Indicator</span>
            <span className="font-mono font-bold" style={{ color: themeColor }}>75%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: '75%',
                backgroundColor: themeColor,
                boxShadow: isNeonMode ? `0 0 10px ${themeColor}` : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
