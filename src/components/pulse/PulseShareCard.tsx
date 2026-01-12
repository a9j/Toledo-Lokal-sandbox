import { useRef, useEffect, useState } from 'react';
import { PULSE_CATEGORIES, PulseCategory } from '@/lib/pulse-config';
import { Radio } from 'lucide-react';

interface PulseShareCardProps {
  headline: string;
  category: PulseCategory;
  businessName?: string;
  onImageGenerated?: (dataUrl: string) => void;
}

const CATEGORY_COLORS: Record<PulseCategory, { bg: string; accent: string }> = {
  right_now: { bg: '#fef3c7', accent: '#f59e0b' },
  heads_up: { bg: '#fee2e2', accent: '#ef4444' },
  energy_check: { bg: '#dbeafe', accent: '#3b82f6' },
  community_ask: { bg: '#e0e7ff', accent: '#6366f1' },
  good_stuff: { bg: '#dcfce7', accent: '#22c55e' },
};

export function PulseShareCard({ 
  headline, 
  category, 
  businessName,
  onImageGenerated 
}: PulseShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const categoryConfig = PULSE_CATEGORIES[category];
  const colors = CATEGORY_COLORS[category];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size (1:1 square for social sharing)
    const size = 600;
    canvas.width = size;
    canvas.height = size;

    // Background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colors.bg);
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Abstract Toledo-inspired pattern (glass/geometric)
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * size,
        Math.random() * size,
        50 + Math.random() * 100,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = colors.accent;
      ctx.fill();
    }
    ctx.restore();

    // Category accent bar at top
    ctx.fillStyle = colors.accent;
    ctx.fillRect(0, 0, size, 8);

    // ToledoLokal logo area
    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 24px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ToledoLokal', 40, 60);

    // Pulse badge
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.roundRect(40, 80, 100, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px "DM Sans", sans-serif';
    ctx.fillText('The Pulse', 58, 102);

    // Headline text (wrapped)
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';

    const words = headline.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = size - 80;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 44;
    const startY = 200;
    lines.slice(0, 4).forEach((line, i) => {
      ctx.fillText(line, 40, startY + i * lineHeight);
    });

    // Business name if present
    if (businessName) {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 18px "DM Sans", sans-serif';
      ctx.fillText(`Posted by ${businessName}`, 40, size - 100);
    }

    // Category label
    ctx.fillStyle = colors.accent;
    ctx.font = '600 16px "DM Sans", sans-serif';
    ctx.fillText(categoryConfig.label.toUpperCase(), 40, size - 60);

    // CTA text
    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 22px "DM Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Join the Pulse →', size - 40, size - 40);

    // Generate data URL
    const dataUrl = canvas.toDataURL('image/png');
    setImageUrl(dataUrl);
    onImageGenerated?.(dataUrl);
  }, [headline, category, businessName, categoryConfig.label, colors]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="hidden" />
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="Pulse Share Card" 
          className="w-full max-w-[300px] rounded-xl shadow-lg"
        />
      )}
    </div>
  );
}

// Utility to generate share card as base64
export async function generatePulseShareCardImage(
  headline: string,
  category: PulseCategory,
  businessName?: string
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    const size = 600;
    canvas.width = size;
    canvas.height = size;

    const colors = CATEGORY_COLORS[category];
    const categoryConfig = PULSE_CATEGORIES[category];

    // Background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colors.bg);
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Accent bar
    ctx.fillStyle = colors.accent;
    ctx.fillRect(0, 0, size, 8);

    // Logo text
    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ToledoLokal', 40, 60);

    // Badge
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.roundRect(40, 80, 100, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 14px sans-serif';
    ctx.fillText('The Pulse', 58, 102);

    // Headline
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px sans-serif';
    const words = headline.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = size - 80;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = 44;
    const startY = 200;
    lines.slice(0, 4).forEach((line, i) => {
      ctx.fillText(line, 40, startY + i * lineHeight);
    });

    if (businessName) {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 18px sans-serif';
      ctx.fillText(`Posted by ${businessName}`, 40, size - 100);
    }

    ctx.fillStyle = colors.accent;
    ctx.font = '600 16px sans-serif';
    ctx.fillText(categoryConfig.label.toUpperCase(), 40, size - 60);

    ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Join the Pulse →', size - 40, size - 40);

    resolve(canvas.toDataURL('image/png'));
  });
}
