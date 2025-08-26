"use client";

import { useState, useEffect } from "react";

// Function to convert HEX to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Function to convert RGB to CMYK (simplified approximation)
const rgbToCmyk = (r: number, g: number, b: number): { c: number; m: number; y: number; k: number } => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const k = 1 - Math.max(red, green, blue);
  const c = (1 - red - k) / (1 - k);
  const m = (1 - green - k) / (1 - k);
  const y = (1 - blue - k) / (1 - k);

  return {
    c: Math.round(c * 100) || 0,
    m: Math.round(m * 100) || 0,
    y: Math.round(y * 100) || 0,
    k: Math.round(k * 100) || 0,
  };
};

export default function Home() {
  const [brandColors, setBrandColors] = useState([
    { name: "Brand/100", class: "bg-brand-100", hex: "#f8fafc" },
    { name: "Brand/200", class: "bg-brand-200", hex: "#e2e8f0" },
    { name: "Brand/300", class: "bg-brand-300", hex: "#cbd5e1" },
    { name: "Brand/400", class: "bg-brand-400", hex: "#94a3b8" },
    { name: "Brand/500", class: "bg-brand-500", hex: "#64748b" },
    { name: "Brand/600", class: "bg-brand-600", hex: "#475569" },
    { name: "Brand/700", class: "bg-brand-700", hex: "#334155" },
    { name: "Brand/800", class: "bg-brand-800", hex: "#1e293b" },
    { name: "Brand/900", class: "bg-brand-900", hex: "#0f172a" },
  ]);

  // Function to get computed CSS variable values
  const getCSSVariableValue = (variableName: string): string => {
    if (typeof window !== "undefined") {
      return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    }
    return "";
  };

  // Function to update colors with current CSS variable values
  const updateColorsFromCSS = () => {
    const updatedColors = brandColors.map((color) => {
      const cssVarName = `--color-${color.name.toLowerCase().replace("/", "-")}`;
      const hexValue = getCSSVariableValue(cssVarName);
      return {
        ...color,
        hex: hexValue || color.hex, // fallback to original if not found
      };
    });
    setBrandColors(updatedColors);
  };

  // Function to get color formats
  const getColorFormats = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return { rgb: "N/A", cmyk: "N/A" };

    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    return {
      rgb: `${rgb.r} ${rgb.g} ${rgb.b}`,
      cmyk: `${cmyk.c} ${cmyk.m} ${cmyk.y} ${cmyk.k}`,
      hex: hex.toUpperCase(),
    };
  };

  useEffect(() => {
    updateColorsFromCSS();

    // Listen for CSS changes (when webhook updates the file)
    const observer = new MutationObserver(() => {
      updateColorsFromCSS();
    });

    if (typeof window !== "undefined") {
      observer.observe(document.head, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Brand Guide</h1>
              <p className='text-gray-600 mt-1'>Design tokens and color variables</p>
            </div>
            <div className='text-sm text-gray-500'>Generated from Figma</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Color Variables Section */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-6'>Color Variables</h2>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {brandColors.map((color) => {
              const formats = getColorFormats(color.hex);
              return (
                <div key={color.name} className='bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow'>
                  {/* Color Preview */}
                  <div className={`w-full h-20 rounded-lg mb-4 border border-gray-200 ${color.class}`} />

                  {/* Color Info */}
                  <div className='space-y-3'>
                    <h3 className='font-medium text-gray-900'>{color.name}</h3>

                    <div className='space-y-2 text-sm'>
                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600 font-medium'>Tailwind Class:</span>
                        <code className='bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs'>{color.class}</code>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600 font-medium'>HEX:</span>
                        <code className='bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs'>{formats.hex}</code>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600 font-medium'>RGB:</span>
                        <code className='bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs'>{formats.rgb}</code>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600 font-medium'>CMYK:</span>
                        <code className='bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs'>{formats.cmyk}</code>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600 font-medium'>CSS Variable:</span>
                        <code className='bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-xs'>--color-{color.name.toLowerCase().replace("/", "-")}</code>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Usage Example */}
        <section className='bg-white rounded-lg shadow-sm border p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Usage Example</h3>
          <div className='bg-gray-900 rounded-lg p-4'>
            <code className='text-green-400 font-mono text-sm'>
              {`// Tailwind Classes
<div className="bg-brand-100">Brand 100</div>
<div className="bg-brand-200">Brand 200</div>
<div className="bg-brand-300">Brand 300</div>
<div className="bg-brand-400">Brand 400</div>
<div className="bg-brand-500">Brand 500</div>
<div className="bg-brand-600">Brand 600</div>
<div className="bg-brand-700">Brand 700</div>
<div className="bg-brand-800">Brand 800</div>
<div className="bg-brand-900">Brand 900</div>

// CSS Variables (Auto-generated from Figma)
:root {
  --color-brand-100: ${brandColors[0]?.hex || "#f8fafc"};
  --color-brand-200: ${brandColors[1]?.hex || "#e2e8f0"};
  --color-brand-300: ${brandColors[2]?.hex || "#cbd5e1"};
  --color-brand-400: ${brandColors[3]?.hex || "#94a3b8"};
  --color-brand-500: ${brandColors[4]?.hex || "#64748b"};
  --color-brand-600: ${brandColors[5]?.hex || "#475569"};
  --color-brand-700: ${brandColors[6]?.hex || "#334155"};
  --color-brand-800: ${brandColors[7]?.hex || "#1e293b"};
  --color-brand-900: ${brandColors[8]?.hex || "#0f172a"};
}`}
            </code>
          </div>
        </section>
      </main>
    </div>
  );
}
