
import React, { useState } from 'react';
import { PoseImage, DrawingEvaluation, Participant } from '../types';
import { exportPoseToImage, formatScoreForExport, exportFullSessionToImage } from '../utils/exportUtils';

interface SessionSummaryProps {
  images: PoseImage[];
  evaluations: DrawingEvaluation[];
  participants: Participant[];
  onReset: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ images, evaluations, participants, onReset }) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isExportingFull, setIsExportingFull] = useState(false);

  const summaryByPose = images.map(img => ({
    pose: img,
    drawings: evaluations.filter(ev => ev.poseId === img.id)
  })).filter(item => item.drawings.length > 0);

  const averageScoreRaw = evaluations.length > 0 
    ? evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length
    : 0;
  
  const averageScoreFormatted = formatScoreForExport(averageScoreRaw);

  const handleExport = async (item: { pose: PoseImage; drawings: DrawingEvaluation[] }, index: number) => {
    setIsGenerating(item.pose.id);
    try {
      await exportPoseToImage(item, index, participants);
    } catch (err) {
      console.error(err);
      alert("Error al generar imagen de exportación.");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExportFull = async () => {
    setIsExportingFull(true);
    try {
      await exportFullSessionToImage(summaryByPose, participants, averageScoreFormatted, evaluations.length);
    } catch (err) {
      console.error(err);
      alert("Error al generar el recuerdo completo.");
    } finally {
      setIsExportingFull(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 md:p-8 no-scrollbar">
      <div className="max-w-[1600px] mx-auto space-y-12 pb-20">
        {/* Header de Resultados */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter text-white uppercase">Resultados</h2>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl text-center min-w-[140px]">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Puntaje AVG</p>
              <p className="text-4xl font-black text-blue-500">{averageScoreFormatted}<span className="text-base opacity-40">/10</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl text-center min-w-[140px]">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Dibujos</p>
              <p className="text-4xl font-black text-white">{evaluations.length}</p>
            </div>
          </div>
        </div>

        {/* Listado de Poses */}
        <div className="space-y-32">
          {summaryByPose.map((item, idx) => (
            <div key={item.pose.id} className="relative space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
              <div className="relative pt-1 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-1.5 bg-blue-600 rounded-full" />
                  <h3 className="text-base font-black text-white uppercase tracking-[0.4em]">Pose {idx + 1}</h3>
                </div>
                
                <button 
                  onClick={() => handleExport(item, idx)}
                  disabled={!!isGenerating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isGenerating === item.pose.id ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  <span>Exportar</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                <div className="sticky top-4 md:relative z-20 aspect-[3/4] max-h-[40vh] md:max-h-none rounded-[2.5rem] overflow-hidden border-2 border-blue-600 shadow-2xl group ring-4 ring-blue-600/10 bg-black self-start">
                  <img 
                    src={item.pose.url} 
                    crossOrigin="anonymous" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    alt="Referencia" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="px-3 py-1 bg-blue-600 text-[8px] font-black rounded-lg mb-2 inline-block shadow-lg uppercase tracking-widest">Referencia Original</span>
                    <p className="text-sm font-bold truncate text-white/95">{item.pose.title}</p>
                  </div>
                </div>

                {item.drawings.map(ev => {
                  const participant = participants.find(p => p.id === ev.participantId);
                  return (
                    <div key={ev.id} className="bg-zinc-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl hover:border-white/10 transition-all duration-500 group">
                      <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
                        <img src={ev.drawingThumbnail} className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105 duration-1000" alt="Dibujo" />
                        
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 z-10">
                          <span className="text-[10px] font-black text-white/90 tracking-widest uppercase">{participant?.name}</span>
                        </div>

                        <div className={`absolute top-4 right-4 px-3 py-1.5 backdrop-blur-md rounded-xl border border-white/10 z-10 ${ev.score >= 80 ? 'bg-emerald-500/60 text-emerald-100' : 'bg-orange-500/60 text-orange-100'}`}>
                          <span className="text-xs font-black">{formatScoreForExport(ev.score)}</span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-center min-h-[100px]">
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 h-full flex items-center justify-center">
                          <p className="text-[11px] text-white/70 italic leading-snug text-center">
                            "{ev.feedback}"
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sección Final de Recuerdo y Reinicio */}
        <div className="flex flex-col items-center gap-12 py-24 border-t border-white/10">
          
          {/* Nuevo Botón: Guardar de recuerdo */}
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={handleExportFull}
              disabled={isExportingFull}
              className="px-10 py-4 bg-zinc-900 border border-white/10 text-white/60 hover:text-white hover:border-white/30 rounded-full transition-all flex items-center gap-3 backdrop-blur-md active:scale-95 disabled:opacity-50"
            >
              {isExportingFull ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Guardar de recuerdo</span>
            </button>
            <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">Crea una galería completa de tu sesión</p>
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-2xl font-black text-white/90 uppercase italic">¿Listo para más?</h4>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Sigue perfeccionando tu técnica</p>
          </div>
          
          <button 
            onClick={onReset} 
            className="px-16 py-6 bg-white text-black font-black rounded-3xl hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 4v16m8-8H4" /></svg>
            <span className="text-base uppercase tracking-wider">Nueva Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;
