
import React, { useMemo } from 'react';

interface TimerProps {
  secondsRemaining: number;
  totalSeconds: number;
  isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ secondsRemaining, totalSeconds, isPaused }) => {
  const percentage = useMemo(() => {
    return (secondsRemaining / totalSeconds) * 100;
  }, [secondsRemaining, totalSeconds]);

  // Dimensiones reducidas para un círculo más compacto
  const radius = 22;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
        {/* Círculo de fondo */}
        <circle
          cx="26"
          cy="26"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        {/* Círculo de progreso */}
        <circle
          cx="26"
          cy="26"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s linear' }}
          className={`${secondsRemaining < 5 ? 'text-red-500' : 'text-blue-400'}`}
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center mono ${isPaused ? 'animate-pulse' : ''}`}>
        <span className="text-[11px] font-black tracking-tighter">{secondsRemaining}s</span>
      </div>
    </div>
  );
};

export default Timer;
