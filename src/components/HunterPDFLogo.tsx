import React from 'react';

interface HunterPDFLogoProps {
  height?: number;
  className?: string;
}

export const HunterPDFLogo: React.FC<HunterPDFLogoProps> = ({
  height = 46,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        height={height}
        viewBox="0 0 390 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-auto max-h-[50px] block"
      >
        <defs>
          <linearGradient id="pdfGoldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#785307" />
          </linearGradient>
          <linearGradient id="pdfGoldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1B8" />
            <stop offset="50%" stopColor="#C59B27" />
            <stop offset="100%" stopColor="#6E4C02" />
          </linearGradient>
          <linearGradient id="pdfGoldGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EEDC82" />
            <stop offset="40%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#805B08" />
          </linearGradient>
          <linearGradient id="pdfGoldGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBF0B7" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#85620A" />
          </linearGradient>
          <linearGradient id="pdfTextGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="30%" stopColor="#CA8A04" />
            <stop offset="70%" stopColor="#A16207" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>
          <linearGradient id="pdfTextSubGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A16207" />
            <stop offset="50%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>
        </defs>

        {/* EMBLEM ICON (3D angled geometric Hunter "H") */}
        <g transform="translate(0, 0) scale(0.66)">
          {/* Top Left Block */}
          <path
            d="M28 12 L64 12 C66.8 12 68.8 14.5 68.2 17.2 L60.5 50 C59.9 52.7 57.5 54.8 54.7 54.8 L18.7 54.8 C15.9 54.8 13.9 52.3 14.5 49.6 L22.2 16.8 C22.8 14.1 25.2 12 28 12 Z"
            fill="url(#pdfGoldGrad1)"
          />
          {/* Top Right Block */}
          <path
            d="M68 28 L91 28 C93.8 28 95.8 30.5 95.2 33.2 L91.2 50 C90.6 52.7 88.2 54.8 85.4 54.8 L62.4 54.8 C59.6 54.8 57.6 52.3 58.2 49.6 L62.2 32.8 C62.8 30.1 65.2 28 68 28 Z"
            fill="url(#pdfGoldGrad2)"
          />
          {/* Bottom Left Block */}
          <path
            d="M17 59 L40 59 C42.8 59 44.8 61.5 44.2 64.2 L40.2 81 C39.6 83.7 37.2 85.8 34.4 85.8 L11.4 85.8 C8.6 85.8 6.6 83.3 7.2 80.6 L11.2 63.8 C11.8 61.1 14.2 59 17 59 Z"
            fill="url(#pdfGoldGrad3)"
          />
          {/* Bottom Right Block */}
          <path
            d="M48 59 L84 59 C86.8 59 88.8 61.5 88.2 64.2 L80.5 97 C79.9 99.7 77.5 101.8 74.7 101.8 L38.7 101.8 C35.9 101.8 33.9 99.3 34.5 96.6 L42.2 63.8 C42.8 61.1 45.2 59 48 59 Z"
            fill="url(#pdfGoldGrad4)"
          />
        </g>

        {/* HUNTER Main Title */}
        <text
          x="72"
          y="37"
          fill="url(#pdfTextGold)"
          fontSize="35"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, Arial, sans-serif"
          letterSpacing="3"
        >
          HUNTER
        </text>

        {/* Subtitle: RECURSOS HUMANOS INTELIGENTES */}
        <text
          x="73"
          y="54"
          fill="url(#pdfTextSubGold)"
          fontSize="9.5"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, Arial, sans-serif"
          letterSpacing="2.2"
        >
          RECURSOS HUMANOS INTELIGENTES
        </text>
      </svg>
    </div>
  );
};
