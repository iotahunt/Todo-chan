import React from 'react';
import todochanMascotImg from '../../assets/images/todochan_ethereal_fairy_neon.png';

interface TodoChanBobCutEmoteProps {
  className?: string;
  size?: number;
  interactive?: boolean;
  showParticles?: boolean;
}

export const TodoChanBobCutEmote: React.FC<TodoChanBobCutEmoteProps> = ({
  className = '',
  size = 140,
  interactive = true,
  showParticles = true,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none flex items-center justify-center ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Baby Pink Multi-stage Neon Aura */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-80 pointer-events-none transition-all duration-300 group-hover:scale-110"
        style={{
          background: 'radial-gradient(circle, rgba(255, 105, 180, 0.75) 0%, rgba(255, 182, 193, 0.35) 60%, transparent 100%)',
        }}
      />

      {/* Floating Sparkles and Neon Hearts */}
      {showParticles && (
        <>
          <span
            className="absolute -top-2 -left-2 text-pink-300 text-xs animate-bounce pointer-events-none select-none drop-shadow-[0_0_8px_#ff69b4]"
            style={{ animationDuration: '2.4s' }}
          >
            ✨
          </span>
          <span
            className="absolute -top-1 -right-2 text-pink-400 text-xs animate-pulse pointer-events-none select-none drop-shadow-[0_0_8px_#ff69b4]"
            style={{ animationDuration: '1.8s' }}
          >
            💕
          </span>
          <span
            className="absolute -bottom-1 -left-2 text-pink-300 text-xs animate-pulse pointer-events-none select-none drop-shadow-[0_0_8px_#ffb6c1]"
            style={{ animationDuration: '2.8s' }}
          >
            ⭐
          </span>
          <span
            className="absolute -bottom-2 -right-1 text-pink-400 text-xs animate-bounce pointer-events-none select-none drop-shadow-[0_0_8px_#ff69b4]"
            style={{ animationDuration: '3.1s' }}
          >
            ✨
          </span>
        </>
      )}

      {/* Mascot Image (Original Bob Cut Baby Pink Neon Design from User) */}
      <div
        className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-pink-400/90 bg-black/80 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
        style={{
          boxShadow: '0 0 16px rgba(255, 105, 180, 0.85), 0 0 32px rgba(255, 182, 193, 0.45), inset 0 0 12px rgba(255, 105, 180, 0.3)',
        }}
      >
        <img
          src={todochanMascotImg}
          alt="Todo-chan Anime Mascot - Baby Pink Neon Bob Cut Design"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter drop-shadow-[0_0_12px_rgba(255,105,180,0.95)] contrast-110 saturate-125"
          draggable={false}
          loading="eager"
        />
        {/* Neon Gradient Glaze Overlay */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(255,105,180,0.6) 0%, transparent 60%, rgba(255,182,193,0.4) 100%)',
          }}
        />
      </div>
    </div>
  );
};
