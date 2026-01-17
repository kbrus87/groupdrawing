
import React, { useRef, useState, useEffect } from 'react';
import { evaluateDrawing } from '../services/geminiService';
import { AppSettings, Participant, ParticipantType } from '../types';

const PROFILE_EMOJIS: Record<ParticipantType, string> = {
  Boy: '👦',
  Girl: '👧',
  AdultMale: '👨',
  AdultFemale: '👩',
  Person: '👤',
  LittlePerson: '✨'
};

interface CameraModuleProps {
  referenceUrl: string;
  settings: AppSettings;
  participants: Participant[];
  onClose: () => void;
  onResult: (score: number, feedback: string, drawingThumbnail: string, participantId: string) => void;
}

const CameraModule: React.FC<CameraModuleProps> = ({ referenceUrl, settings, participants, onClose, onResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id || "");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("No se pudo acceder a la cámara. Revisa los permisos.");
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedParticipantId) return;
    
    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      const participant = participants.find(p => p.id === selectedParticipantId);
      if (participant) {
        const result = await evaluateDrawing(referenceUrl, dataUrl, settings, participant.type);
        onResult(result.score, result.feedback, dataUrl, selectedParticipantId);
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      {/* Participant Selector */}
      <div className="w-full max-w-xl mb-6 flex flex-col items-center">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">¿Quién ha dibujado?</label>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full justify-center">
          {participants.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedParticipantId(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shrink-0 ${
                selectedParticipantId === p.id 
                  ? 'bg-blue-600 border-blue-400 text-white' 
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              <span className="text-lg">{PROFILE_EMOJIS[p.type]}</span>
              <span className="text-xs font-bold">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full max-w-xl aspect-[4/3] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-red-400">{error}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-medium">Analizando trazo de {participants.find(p => p.id === selectedParticipantId)?.name}...</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-8 flex gap-4 w-full max-w-xl">
        <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold uppercase tracking-widest">Cancelar</button>
        <button 
          onClick={handleCapture}
          disabled={loading || !!error || !selectedParticipantId}
          className="flex-[2] py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-600/20"
        >
          {loading ? 'Evaluando...' : 'Tomar Foto y Evaluar'}
        </button>
      </div>
    </div>
  );
};

export default CameraModule;
