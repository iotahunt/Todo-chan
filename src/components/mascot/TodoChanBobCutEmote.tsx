import React from 'react';

interface TodoChanBobCutEmoteProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

export const TodoChanBobCutEmote: React.FC<TodoChanBobCutEmoteProps> = ({
  className = '',
  size = 140,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 340 360"
      width={size}
      height={(size * 360) / 340}
      className={`overflow-visible select-none filter drop-shadow-[0_0_16px_rgba(255,182,193,0.9)] ${className}`}
      fill="none"
    >
      <defs>
        {/* Baby Pink Intense Multi-stage Neon Glow Filter */}
        <filter id="babyPinkNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="coreGlow" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5.0" result="midGlow" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="12.0" result="outerGlow" />
          <feMerge>
            <feMergeNode in="outerGlow" />
            <feMergeNode in="midGlow" />
            <feMergeNode in="coreGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Baby Pink Gradients */}
        <linearGradient id="babyPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff0f5" />
          <stop offset="40%" stopColor="#ffb6c1" />
          <stop offset="85%" stopColor="#ff80aa" />
          <stop offset="100%" stopColor="#ff4081" />
        </linearGradient>

        <linearGradient id="softBlush" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff69b4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff1493" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Floating Baby Pink Neon Sparkles & Stars */}
      <g stroke="#ffb6c1" filter="url(#babyPinkNeonGlow)">
        {/* Top-right sparkle */}
        <path
          d="M 290 60 Q 290 75 305 75 Q 290 75 290 90 Q 290 75 275 75 Q 290 75 290 60 Z"
          strokeWidth="2"
          fill="rgba(255,182,193,0.25)"
          className="animate-pulse"
        />
        {/* Top-left mini star */}
        <path
          d="M 50 85 Q 50 95 60 95 Q 50 95 50 105 Q 50 95 40 95 Q 50 95 50 85 Z"
          strokeWidth="1.8"
          fill="rgba(255,182,193,0.3)"
          className="animate-pulse"
        />
        {/* Floating tiny heart */}
        <path
          d="M 300 135 C 300 130 294 126 288 131 C 282 126 276 130 276 135 C 276 143 288 149 288 149 C 288 149 300 143 300 135 Z"
          strokeWidth="2"
          fill="rgba(255,182,193,0.35)"
        />
        {/* Left tiny heart */}
        <path
          d="M 58 170 C 58 166 53 162 48 166 C 43 162 38 166 38 170 C 38 177 48 182 48 182 C 48 182 58 177 58 170 Z"
          strokeWidth="1.8"
          fill="rgba(255,182,193,0.35)"
        />
      </g>

      {/* Main Mascot Body & Hair in Baby Pink Neon */}
      <g filter="url(#babyPinkNeonGlow)" stroke="#ffb6c1" strokeLinecap="round" strokeLinejoin="round">
        
        {/* --- BACK OF BOB CUT (Outer silhouette hugging nape) --- */}
        <path
          d="M 100 145 C 75 90 115 32 170 32 C 225 32 265 90 240 145 C 248 185 240 215 220 228 C 205 215 208 195 210 180"
          strokeWidth="3.8"
          fill="rgba(255, 182, 193, 0.05)"
        />
        <path
          d="M 100 145 C 92 185 100 215 120 228 C 135 215 132 195 130 180"
          strokeWidth="3.8"
          fill="rgba(255, 182, 193, 0.05)"
        />

        {/* --- CUTE NEON CAT-EAR HAIR ACCESSORIES --- */}
        {/* Left Ear */}
        <path
          d="M 115 56 L 95 24 L 138 42"
          strokeWidth="3.2"
          stroke="url(#babyPinkGrad)"
          fill="rgba(255, 182, 193, 0.12)"
        />
        <path d="M 110 46 L 100 32 L 126 40" strokeWidth="2" stroke="#ffffff" />
        {/* Right Ear */}
        <path
          d="M 225 56 L 245 24 L 202 42"
          strokeWidth="3.2"
          stroke="url(#babyPinkGrad)"
          fill="rgba(255, 182, 193, 0.12)"
        />
        <path d="M 230 46 L 240 32 L 214 40" strokeWidth="2" stroke="#ffffff" />

        {/* --- HEAD CONTOUR (Sweet round anime chin & cheeks) --- */}
        <path
          d="M 125 155 C 125 205 145 225 170 225 C 195 225 215 205 215 155"
          strokeWidth="3.2"
        />

        {/* Cute Ears with Neon Piercings */}
        <path d="M 118 160 C 110 160 108 174 118 178" strokeWidth="2.5" />
        <circle cx="112" cy="174" r="1.5" fill="#ffffff" stroke="none" />
        <path d="M 222 160 C 230 160 232 174 222 178" strokeWidth="2.5" />
        <circle cx="228" cy="174" r="1.5" fill="#ffffff" stroke="none" />

        {/* --- FRONT BOB CUT HAIR & PROMINENT SIDE BANGS --- */}
        {/* Left Long Face-Framing Side Bang (Curving gracefully past cheeks) */}
        <path
          d="M 122 115 C 110 145 106 182 116 218 C 122 198 128 170 132 150"
          strokeWidth="3.5"
          fill="rgba(255, 182, 193, 0.08)"
        />
        {/* Left Side Bang Detail Accent */}
        <path d="M 118 135 C 114 165 116 195 120 210" strokeWidth="2" stroke="#ffffff" />

        {/* Right Long Face-Framing Side Bang (Curving gracefully past cheeks) */}
        <path
          d="M 218 115 C 230 145 234 182 224 218 C 218 198 212 170 208 150"
          strokeWidth="3.5"
          fill="rgba(255, 182, 193, 0.08)"
        />
        {/* Right Side Bang Detail Accent */}
        <path d="M 222 135 C 226 165 224 195 220 210" strokeWidth="2" stroke="#ffffff" />

        {/* Sweet Bob Cut Center Fringe / Bangs across Forehead */}
        <path d="M 132 112 Q 146 148 154 136" strokeWidth="3" />
        <path d="M 152 124 Q 166 156 172 134" strokeWidth="3" />
        <path d="M 170 128 Q 184 156 192 128" strokeWidth="3" />
        <path d="M 190 120 Q 200 148 208 116" strokeWidth="3" />

        {/* Star Hairpin on Left Bangs */}
        <g stroke="#ffffff" strokeWidth="2" fill="rgba(255,255,255,0.8)">
          <path d="M 128 106 L 132 116 L 122 110 L 134 110 L 124 116 Z" />
        </g>

        {/* Hair Gloss / Ring of Light (Tenshi no Wa / Angel Ring) */}
        <path
          d="M 140 68 Q 170 60 200 68"
          strokeWidth="2.5"
          stroke="#ffffff"
          strokeDasharray="14 8 8 6"
        />

        {/* --- DELICATE ANIME EYEBROWS --- */}
        <path d="M 136 142 Q 148 138 156 142" strokeWidth="2.2" stroke="#ffb6c1" />
        <path d="M 184 142 Q 192 138 204 142" strokeWidth="2.2" stroke="#ffb6c1" />

        {/* --- LARGE SPARKLING ANIME EYES --- */}
        {/* LEFT EYE (Wide, Sparkling, Kawaii) */}
        <g>
          {/* Upper Eyelash line with anime wing */}
          <path d="M 134 156 Q 148 146 162 154" strokeWidth="4" stroke="#ffb6c1" />
          <path d="M 158 150 L 164 146" strokeWidth="2.5" stroke="#ff80aa" />
          <path d="M 160 154 L 166 152" strokeWidth="2" stroke="#ff80aa" />
          
          {/* Eye Iris Outline */}
          <ellipse cx="148" cy="165" rx="11" ry="15" strokeWidth="2.8" stroke="#ffb6c1" />
          {/* Bright White Primary Catchlight */}
          <circle cx="151" cy="158" r="5" fill="#ffffff" stroke="none" />
          {/* Secondary Catchlight */}
          <circle cx="143" cy="170" r="2.8" fill="#ffffff" stroke="none" />
          {/* Inner Baby Pink Neon Heart Sparkle inside Eye */}
          <path
            d="M 148 168 C 148 165 145 163 143 165 C 141 163 138 165 138 168 C 138 171 143 174 143 174 C 143 174 148 171 148 168 Z"
            fill="#ffb6c1"
            stroke="none"
          />
          {/* Lower delicate lash */}
          <path d="M 140 179 Q 148 182 156 179" strokeWidth="2" stroke="#ffb6c1" />
        </g>

        {/* RIGHT EYE (Wink / Playful Sparkle OR Large Matching Eye) */}
        <g>
          {/* Upper Eyelash line with anime wing */}
          <path d="M 178 154 Q 192 146 206 156" strokeWidth="4" stroke="#ffb6c1" />
          <path d="M 202 150 L 208 146" strokeWidth="2.5" stroke="#ff80aa" />
          <path d="M 200 154 L 206 152" strokeWidth="2" stroke="#ff80aa" />
          
          {/* Eye Iris Outline */}
          <ellipse cx="192" cy="165" rx="11" ry="15" strokeWidth="2.8" stroke="#ffb6c1" />
          {/* Bright White Primary Catchlight */}
          <circle cx="195" cy="158" r="5" fill="#ffffff" stroke="none" />
          {/* Secondary Catchlight */}
          <circle cx="187" cy="170" r="2.8" fill="#ffffff" stroke="none" />
          {/* Inner Baby Pink Neon Heart Sparkle inside Eye */}
          <path
            d="M 192 168 C 192 165 189 163 187 165 C 185 163 182 165 182 168 C 182 171 187 174 187 174 C 187 174 192 171 192 168 Z"
            fill="#ffb6c1"
            stroke="none"
          />
          {/* Lower delicate lash */}
          <path d="M 184 179 Q 192 182 200 179" strokeWidth="2" stroke="#ffb6c1" />
        </g>

        {/* --- CUTE ANIME NOSE & SWEET SMILING MOUTH --- */}
        {/* Tiny anime nose dot */}
        <circle cx="170" cy="176" r="1.5" fill="#ffffff" stroke="none" />

        {/* Sweet Open Cat-Smile / Happy UwU curve */}
        <path
          d="M 161 188 Q 166 195 170 190 Q 174 195 179 188"
          strokeWidth="2.8"
          stroke="#ffffff"
        />
        {/* Cute Little Tongue peeking */}
        <path
          d="M 166 192 Q 170 198 174 192"
          strokeWidth="1.8"
          stroke="#ff80aa"
          fill="rgba(255, 105, 180, 0.4)"
        />

        {/* --- BLUSHING CHEEKS (Neon Diagonal Anime Hatching) --- */}
        <g strokeWidth="2.2" stroke="#ff69b4">
          {/* Left Cheek Blush */}
          <line x1="128" y1="180" x2="136" y2="185" />
          <line x1="132" y1="183" x2="140" y2="188" />
          <line x1="136" y1="186" x2="144" y2="191" />

          {/* Right Cheek Blush */}
          <line x1="196" y1="191" x2="204" y2="186" />
          <line x1="200" y1="188" x2="208" y2="183" />
          <line x1="204" y1="185" x2="212" y2="180" />
        </g>

        {/* --- SLENDER NECK & CHOKER --- */}
        <path d="M 162 225 L 162 238" strokeWidth="2.8" />
        <path d="M 178 225 L 178 238" strokeWidth="2.8" />
        {/* Baby Pink Choker with Heart Charm */}
        <path d="M 160 234 Q 170 238 180 234" strokeWidth="3" stroke="#ff80aa" />
        <path
          d="M 170 238 C 170 235 167 233 165 235 C 163 233 160 235 160 238 C 160 242 165 245 165 245 C 165 245 170 242 170 238 Z"
          strokeWidth="1.8"
          stroke="#ffffff"
          fill="#ffb6c1"
        />

        {/* --- CUTE OVERSIZED HOODIE (Neon Outlined Shoulders & Sleeves) --- */}
        {/* Collar V-opening */}
        <path
          d="M 148 244 L 170 264 L 192 244"
          strokeWidth="3.2"
        />
        {/* Left Shoulder & Sleeve */}
        <path
          d="M 136 248 C 108 262 82 292 78 335"
          strokeWidth="3.8"
        />
        {/* Right Shoulder & Sleeve */}
        <path
          d="M 204 248 C 232 262 258 292 262 335"
          strokeWidth="3.8"
        />
        {/* Torso Silhouette */}
        <path
          d="M 108 335 L 108 355 M 232 335 L 232 355"
          strokeWidth="3.5"
        />

        {/* Hoodie Drawstrings with Ribbon Bows */}
        <path d="M 158 258 Q 156 295 154 315" strokeWidth="2.5" stroke="#ffffff" />
        <circle cx="154" cy="316" r="3" fill="#ffb6c1" stroke="#ffffff" strokeWidth="1.5" />

        <path d="M 182 258 Q 184 295 186 315" strokeWidth="2.5" stroke="#ffffff" />
        <circle cx="186" cy="316" r="3" fill="#ffb6c1" stroke="#ffffff" strokeWidth="1.5" />

        {/* Cute Mascot Logo / "TODO" Lettering & Heart on Hoodie Chest */}
        <g stroke="#ffffff" strokeWidth="2" fill="none">
          <path
            d="M 205 285 C 205 278 198 274 192 278 C 186 274 179 278 179 285 C 179 295 192 302 192 302 C 192 302 205 295 205 285 Z"
            strokeWidth="2.5"
            stroke="#ff80aa"
            fill="rgba(255,182,193,0.3)"
          />
        </g>

        {/* Right Hand: Cheerful Kawaii Peace Sign (V-Sign) */}
        <g stroke="#ffb6c1" strokeWidth="2.8" strokeLinecap="round" fill="rgba(255,182,193,0.1)">
          {/* Index Finger */}
          <path d="M 242 270 L 250 240 Q 254 236 258 240 L 254 266" />
          {/* Middle Finger */}
          <path d="M 255 264 L 268 244 Q 272 242 274 246 L 264 272" />
          {/* Folded Ring & Pinky & Palm */}
          <path d="M 264 272 C 270 278 266 288 258 290 C 248 292 240 284 242 274 Z" />
          {/* Thumb folded over */}
          <path d="M 246 275 Q 256 274 256 280" />
        </g>
      </g>
    </svg>
  );
};
