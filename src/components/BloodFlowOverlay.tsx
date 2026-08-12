import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../config/video';

type Particle = {
  offset: number;
  radius: number;
  speed: number;
  lane: number;
  phase: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const pointAt = (t: number) => {
  const x = 300 + t * 1320;
  const narrowing = Math.abs(t - 0.66);
  const width = 330 - 165 * clamp01(1 - narrowing / 0.12);
  return { x, width };
};

export const BloodFlowOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const highlightPulse = interpolate(frame % 45, [0, 22, 45], [0.35, 1, 0.35]);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 30 }, (_, index) => ({
      offset: index / 30,
      radius: 5 + (index % 4) * 1.5,
      speed: 0.0018 + (index % 5) * 0.00045,
      lane: (index % 7) / 6,
      phase: index * 0.37,
    }));
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" role="img" aria-label="Medical visualization of blood moving through an artery with a narrowed section">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#091823" />
            <stop offset="1" stopColor="#050b10" />
          </linearGradient>
          <linearGradient id="artery" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#934856" />
            <stop offset="0.5" stopColor="#6e3542" />
            <stop offset="1" stopColor="#512734" />
          </linearGradient>
          <linearGradient id="lumen" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f18b96" />
            <stop offset="0.5" stopColor="#cf6977" />
            <stop offset="1" stopColor="#a64d5c" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="lumenClip">
            <path d="M285 405 C520 330 690 360 830 405 C905 430 955 438 1020 410 C1135 360 1300 355 1640 415 L1640 665 C1300 725 1135 720 1020 670 C955 642 905 650 830 675 C690 720 520 750 285 675 Z" />
          </clipPath>
        </defs>

        <rect width="1920" height="1080" fill="url(#bg)" />

        <g opacity={0.8 * reveal}>
          <path d="M285 405 C520 330 690 360 830 405 C905 430 955 438 1020 410 C1135 360 1300 355 1640 415 L1640 665 C1300 725 1135 720 1020 670 C955 642 905 650 830 675 C690 720 520 750 285 675 Z" fill="url(#artery)" stroke="#a85867" strokeWidth="6" />
          <path d="M305 433 C520 370 680 388 818 430 C913 459 951 469 1033 438 C1160 390 1304 390 1620 438 L1620 642 C1304 690 1160 690 1033 642 C951 611 913 621 818 650 C680 692 520 710 305 647 Z" fill="url(#lumen)" stroke="#f19aa4" strokeWidth="4" />
        </g>

        <g clipPath="url(#lumenClip)">
          {particles.map((particle, index) => {
            const t = (particle.offset + frame * particle.speed + Math.sin(frame * 0.03 + particle.phase) * 0.006) % 1;
            const { x, width } = pointAt(t);
            const y = 540 + (particle.lane - 0.5) * (width * 0.78);
            const squeeze = 0.5 + width / 330;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={particle.radius * squeeze}
                fill={index % 3 === 0 ? COLORS.bloodBright : COLORS.blood}
                opacity={0.68 + (index % 4) * 0.06}
              />
            );
          })}
        </g>

        <g>
          <ellipse cx="1285" cy="540" rx="255" ry={265 * (0.28 + highlightPulse * 0.08)} fill="none" stroke={COLORS.highlight} strokeWidth="8" opacity={0.9} filter="url(#glow)" />
          <ellipse cx="1285" cy="540" rx="236" ry={247 * (0.28 + highlightPulse * 0.08)} fill="none" stroke={COLORS.highlight} strokeWidth="3" opacity={0.55} />
          <path d="M1482 318 L1565 245 L1670 245" fill="none" stroke={COLORS.highlight} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="1482" cy="318" r="10" fill={COLORS.highlight} />
        </g>

        <g opacity={reveal}>
          <rect x="142" y="122" width="585" height="96" rx="18" fill="#0e2632" stroke="#284755" strokeWidth="2" />
          <text x="175" y="163" fill={COLORS.text} fontSize="32" fontWeight="700">Blood flow through an artery</text>
          <text x="175" y="198" fill={COLORS.muted} fontSize="21">Particles show the direction of flow</text>

          <rect x="1430" y="194" width="350" height="84" rx="16" fill="#241f12" stroke={COLORS.highlight} strokeWidth="2" />
          <text x="1460" y="229" fill={COLORS.highlight} fontSize="24" fontWeight="700">Narrowed section</text>
          <text x="1460" y="258" fill="#d6caa5" fontSize="18">Reduced channel width</text>
        </g>

        <g opacity={reveal}>
          <text x="285" y="815" fill="#9eb7c1" fontSize="22">Normal lumen</text>
          <line x1="285" y1="778" x2="585" y2="778" stroke="#65818b" strokeWidth="3" />
          <polygon points="585,778 566,768 566,788" fill="#65818b" />
          <text x="1225" y="815" fill={COLORS.highlight} fontSize="22">Tighter passage</text>
          <line x1="1385" y1="778" x2="1575" y2="778" stroke={COLORS.highlight} strokeWidth="3" />
          <polygon points="1385,778 1404,768 1404,788" fill={COLORS.highlight} />
        </g>

        <text x="148" y="964" fill="#6f8b95" fontSize="18" letterSpacing="2">MEDICAL VISUALIZATION • SILENT OVERLAY POC</text>
      </svg>
    </AbsoluteFill>
  );
};
