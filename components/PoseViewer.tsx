
import React from 'react';
import { PoseImage } from '../types';

interface PoseViewerProps {
  image: PoseImage;
  currentIndex: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const PoseViewer: React.FC<PoseViewerProps> = ({ 
  image, 
  currentIndex, 
  total, 
  onNext, 
  onPrev, 
  isFullscreen, 
  onToggleFullscreen 
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center w-full bg-black transition-all duration-300 select-none ${isFullscreen ? 'h-screen z-[100] fixed inset-0' : 'h-full'}`}>
      {/* Background Blur */}
      <div 
        className="absolute inset-0 opacity-20 blur-3xl pointer-events-none"
        style={{ backgroundImage: `url(${image.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      {/* Main Image Container */}
      <div 
        className={`relative z-10 w-full flex items-center justify-center transition-all duration-300 ${isFullscreen ? 'h-screen max-w-none px-0' : 'h-full md:max-w-4xl px-4'}`}
      >
        <img
          src={image.url}
          alt={image.title}
          onDoubleClick={onToggleFullscreen}
          className={`object-contain transition-all duration-500 rounded-lg shadow-2xl cursor-pointer ${isFullscreen ? 'w-full h-full rounded-none' : 'max-w-full max-h-full border border-white/10'}`}
        />
        
        {/* Fullscreen Toggle Button - Repositioned to bottom center */}
        <button 
          onClick={onToggleFullscreen}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 p-4 bg-black/60 hover:bg-black/90 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-xl border border-white/20 shadow-2xl transform hover:scale-110 active:scale-95 ${isFullscreen ? 'z-[110]' : 'hidden md:flex items-center justify-center'}`}
          title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
        >
          {isFullscreen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>

        {/* Navigation Overlays (Desktop) */}
        {!isFullscreen && (
          <>
            <button 
              onClick={onPrev}
              className="absolute left-8 p-4 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all transform hover:scale-110 opacity-0 md:opacity-100"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={onNext}
              className="absolute right-8 p-4 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all transform hover:scale-110 opacity-0 md:opacity-100"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Meta info (Hidden in fullscreen and on small screens during practice) */}
      {!isFullscreen && (
        <div className="hidden md:block mt-6 text-center z-10 space-y-1">
          <h2 className="text-xl font-medium text-white/90">{image.title}</h2>
          <p className="text-sm text-white/40 mono">
            Imagen {currentIndex + 1} de {total} • <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 underline decoration-white/20">Link de Origen</a>
          </p>
        </div>
      )}
    </div>
  );
};

export default PoseViewer;
