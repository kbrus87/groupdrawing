
import React from 'react';
import { PoseImage, DrawingEvaluation, Participant, ParticipantType } from '../types';

interface SessionSummaryProps {
    images: PoseImage[];
    evaluations: DrawingEvaluation[];
    participants: Participant[];
    onReset: () => void;
}

const PROFILE_DATA: Record<ParticipantType, { label: string, emoji: string, color: string }> = {
    AdultMale: { label: 'Adulto', emoji: '👨', color: 'orange' },
    AdultFemale: { label: 'Adulta', emoji: '👩', color: 'pink' },
    Girl: { label: 'Niña', emoji: '👧', color: 'pink' },
    Boy: { label: 'Niño', emoji: '👦', color: 'emerald' },
    Person: { label: 'Persona', emoji: '👤', color: 'orange' },
    LittlePerson: { label: 'Persona Pequeña', emoji: '✨', color: 'emerald' }
};

const SessionSummary: React.FC<SessionSummaryProps> = ({ images, evaluations, participants, onReset }) => {
    const summaryByPose = images.map(img => ({
        pose: img,
        drawings: evaluations.filter(ev => ev.poseId === img.id)
    })).filter(item => item.drawings.length > 0);

    const averageScore = evaluations.length > 0
        ? Math.round(evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length)
        : 0;

    const handleShare = (platform: string) => {
        const text = `¡Acabo de terminar mi sesión de dibujo en Sesión de Dibujo! Mi puntuación media fue de ${averageScore}%.`;
        const url = window.location.href;

        let shareUrl = '';
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
                break;
            case 'googleplus':
                shareUrl = `https://plus.google.com/share?url=${encodeURIComponent(url)}`;
                break;
            case 'instagram':
                alert("Instagram no permite compartir imágenes directamente desde el navegador. ¡Toma una captura de pantalla y etiquétanos!");
                return;
        }
        if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 md:p-10 no-scrollbar">
            <div className="max-w-6xl mx-auto space-y-12 pb-20">
                {/* Header Stats */}
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white">RESUMEN DE SESIÓN</h2>
                    <div className="flex flex-wrap justify-center gap-6 mt-8">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl min-w-[140px]">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Puntuación Media</p>
                            <p className="text-4xl font-black text-blue-500">{averageScore}%</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl min-w-[140px]">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Dibujos Totales</p>
                            <p className="text-4xl font-black text-white">{evaluations.length}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl min-w-[140px]">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Poses Practicadas</p>
                            <p className="text-4xl font-black text-white">{summaryByPose.length}</p>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="space-y-16">
                    {summaryByPose.map((item, idx) => (
                        <div key={item.pose.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/10" />
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Pose {idx + 1}</h3>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                {/* Original Reference */}
                                <div className="md:col-span-4 space-y-3">
                                    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                                        <img src={item.pose.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Referencia" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        <div className="absolute bottom-4 left-4">
                                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Original</p>
                                            <p className="text-sm font-bold truncate">{item.pose.title}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Drawings by Participants */}
                                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {item.drawings.map(ev => {
                                        const participant = participants.find(p => p.id === ev.participantId);
                                        const profile = participant ? PROFILE_DATA[participant.type] : null;
                                        return (
                                            <div key={ev.id} className="bg-zinc-900/80 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full shadow-lg hover:border-blue-500/50 transition-all group">
                                                <div className="relative aspect-square overflow-hidden bg-black">
                                                    <img src={ev.drawingThumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt="Dibujo" />
                                                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full font-black text-xs border shadow-lg ${ev.score > 80 ? 'bg-emerald-500/90 border-emerald-400' : 'bg-orange-500/90 border-orange-400'}`}>
                                                        {ev.score}%
                                                    </div>
                                                </div>
                                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">{profile?.emoji}</span>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{participant?.name}</p>
                                                            <p className={`text-[9px] font-black uppercase tracking-widest text-${profile?.color}-400`}>{profile?.label}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-white/50 italic leading-snug line-clamp-3">"{ev.feedback}"</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col items-center gap-8 py-10 border-t border-white/10">
                    <div className="space-y-4 text-center">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Presumir Resultados</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleShare('facebook')}
                                className="w-12 h-12 flex items-center justify-center bg-[#1877F2] text-white rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-blue-500/20"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-0.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </button>
                            <button
                                onClick={() => handleShare('instagram')}
                                className="w-12 h-12 flex items-center justify-center bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-2xl hover:scale-110 transition-transform shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </button>
                            <button
                                onClick={() => handleShare('googleplus')}
                                className="w-12 h-12 flex items-center justify-center bg-[#db4437] text-white rounded-2xl hover:scale-110 transition-transform shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.33 11.67V13H10.3C10.19 13.62 9.56 14.83 7.33 14.83C5.4 14.83 3.82 13.23 3.82 11.25S5.4 7.67 7.33 7.67C8.43 7.67 9.17 8.13 9.59 8.53L10.59 7.56C9.95 6.96 8.79 6.25 7.33 6.25C4.54 6.25 2.28 8.51 2.28 11.3S4.54 16.35 7.33 16.35C10.24 16.35 12.17 14.31 12.17 11.42C12.17 11.14 12.14 10.91 12.09 10.67H7.33V11.67ZM21.72 11.3H20.28V9.86H18.84V11.3H17.4V12.74H18.84V14.18H20.28V12.74H21.72V11.3Z" /></svg>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onReset}
                        className="px-16 py-6 bg-white text-black font-black rounded-[2rem] hover:bg-blue-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-blue-600/20"
                    >
                        NUEVA SESIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionSummary;
