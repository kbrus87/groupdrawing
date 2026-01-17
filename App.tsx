
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PoseImage, SessionState, SessionConfig, DrawingEvaluation, AppSettings, Participant, ParticipantType } from './types';
import { fetchPoseReferences } from './services/geminiService';
import Timer from './components/Timer';
import PoseViewer from './components/PoseViewer';
import CameraModule from './components/CameraModule';
import ByokModal from './components/ByokModal';
import EvalCard from './components/EvalCard';
import ThumbnailGallery from './components/ThumbnailGallery';
import SessionSummary from './components/SessionSummary';

const PROFILE_DATA: Record<ParticipantType, { label: string, emoji: string, color: string }> = {
  AdultMale: { label: 'Adulto', emoji: '👨', color: 'orange' },
  AdultFemale: { label: 'Adulta', emoji: '👩', color: 'pink' },
  Girl: { label: 'Niña', emoji: '👧', color: 'pink' },
  Boy: { label: 'Niño', emoji: '👦', color: 'emerald' },
  Person: { label: 'Persona', emoji: '👤', color: 'orange' },
  LittlePerson: { label: 'Persona Pequeña', emoji: '✨', color: 'emerald' }
};

const App: React.FC = () => {
  // Session State
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
  const [images, setImages] = useState<PoseImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [config, setConfig] = useState<SessionConfig>({
    intervalSeconds: 60,
    totalImages: 10,
    category: 'Dynamic'
  });

  // API Key State
  const [hasUserKey, setHasUserKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasUserKey(hasKey);
      }
    };
    checkKey();
  }, []);


  // Custom Images State
  const [useCustomImages, setUseCustomImages] = useState(false);
  const [customImages, setCustomImages] = useState<PoseImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showScore, setShowScore] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Participants State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");

  // Global App Settings
  const [settings, setSettings] = useState<AppSettings>({
    searchRefinement: 'Professional photography',
    enableRoast: true,
    evaluationFocus: 'Gesture',
    apiKey: import.meta.env.REACT_APP_AI_API_KEY || ''
  });

  const setApiKey = (apiKey) => {
    setSettings(s => {
      return { ...s, apiKey }
    })
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasUserKey(true);
    } else {
      // Si no estamos en AI Studio, abrimos nuestro propio modal
      setIsModalOpen(true);
    }
  };

  const handleSaveKey = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue); // Usamos tu función para guardar en settings
      setIsModalOpen(false);  // Cerramos el modal
      setHasUserKey(true);    // Marcamos que ya tenemos una clave
    }
  };
  const [showSettings, setShowSettings] = useState(false);

  // Evaluation State
  const [allEvaluations, setAllEvaluations] = useState<DrawingEvaluation[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [latestResult, setLatestResult] = useState<{ score: number, feedback: string, type: ParticipantType } | null>(null);

  const timerRef = useRef<number | null>(null);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { }
  };

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;
    setParticipants([...participants, { id: `p-${Date.now()}`, name: newParticipantName, type: 'AdultMale' }]);
    setNewParticipantName("");
  };

  const removeParticipant = (id: string) => setParticipants(participants.filter(p => p.id !== id));

  const cycleParticipantType = (id: string) => {
    const types: ParticipantType[] = ['AdultMale', 'AdultFemale', 'Girl', 'Boy', 'Person', 'LittlePerson'];
    setParticipants(participants.map(p => {
      if (p.id === id) {
        const idx = types.indexOf(p.type);
        return { ...p, type: types[(idx + 1) % types.length] };
      }
      return p;
    }));
  };

  const addCustomImageUrl = () => {
    if (!imageUrlInput.trim() || customImages.length >= 10) return;
    const newImage: PoseImage = {
      id: `custom-${Date.now()}`,
      url: imageUrlInput,
      thumbnail: imageUrlInput,
      sourceUrl: imageUrlInput,
      title: 'Imagen Personal',
      author: 'Usuario'
    };
    setCustomImages([...customImages, newImage]);
    setImageUrlInput("");
  };

  const removeCustomImage = (idToRemove: string) => {
    setCustomImages(customImages.filter(img => img.id !== idToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 10 - customImages.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomImages(prev => [...prev, {
            id: `file-${Date.now()}-${Math.random()}`,
            url: ev.target!.result as string,
            thumbnail: ev.target!.result as string,
            sourceUrl: 'Local',
            title: file.name
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Logic to determine if a practice session can be started
  const canStartPractice = useMemo(() => {
    const hasParticipants = participants.length > 0;
    if (useCustomImages) {
      return hasParticipants && customImages.length > 0;
    }
    return hasParticipants;
  }, [participants, useCustomImages, customImages]);

  const startSession = async () => {
    if (!canStartPractice) return;
    setSessionState(SessionState.LOADING);
    const sessionImages = useCustomImages && customImages.length > 0
      ? [...customImages]
      : await fetchPoseReferences(config.category, config.totalImages, settings);

    setImages(sessionImages);
    setCurrentIndex(0);
    setSecondsRemaining(config.intervalSeconds);
    setSessionState(SessionState.RUNNING);
  };

  const nextPose = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSecondsRemaining(config.intervalSeconds);
      setSessionState(SessionState.RUNNING);
      setLatestResult(null);
      playBeep();
    } else {
      setSessionState(SessionState.FINISHED);
    }
  }, [currentIndex, images.length, config.intervalSeconds]);

  const prevPose = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSecondsRemaining(config.intervalSeconds);
      setSessionState(SessionState.RUNNING);
      setLatestResult(null);
    }
  };

  const togglePause = () => {
    setSessionState(prev => prev === SessionState.RUNNING ? SessionState.PAUSED : SessionState.RUNNING);
  };

  const resetSession = () => {
    setSessionState(SessionState.IDLE);
    setImages([]);
    setCurrentIndex(0);
    setAllEvaluations([]);
    setIsFullscreen(false);
  };

  useEffect(() => {
    if (sessionState === SessionState.RUNNING && secondsRemaining > 0) {
      timerRef.current = window.setInterval(() => setSecondsRemaining(prev => prev - 1), 1000);
    } else if (secondsRemaining === 0 && sessionState === SessionState.RUNNING) {
      playBeep();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionState, secondsRemaining]);

  const handleEvaluationResult = (score: number, feedback: string, drawingThumbnail: string, participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;
    const newEval = { id: `ev-${Date.now()}`, poseId: images[currentIndex].id, participantId, score, feedback, drawingThumbnail };
    setAllEvaluations(prev => [...prev, newEval]);
    setLatestResult({ score, feedback, type: participant.type, participant, ev: newEval });
    setShowScore(true)
    setTimeout(() => {
      setShowScore(false)
    }, 5000)
    setShowCamera(false);
  };

  const isVisible = sessionState === SessionState.RUNNING || sessionState === SessionState.PAUSED;

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden">
      <div className="flex-1 flex flex-col relative h-full">
        {!isFullscreen && sessionState !== SessionState.FINISHED && (
          <header className={`px-6 py-4 flex justify-between items-center bg-black/50 border-b border-white/5 z-20 backdrop-blur-md ${isVisible ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold italic text-white shadow-lg shadow-blue-500/20">P</div>
              <h1 className="text-xl font-semibold tracking-tight">Sesion de Dibujo!</h1>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowSettings(true)} className="p-2 text-white/40 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
              {sessionState !== SessionState.IDLE && <button onClick={resetSession} className="text-white/40 hover:text-white text-sm font-medium transition-colors">SALIR</button>}
            </div>
          </header>
        )}

        <main className={`relative flex flex-col no-scrollbar ${isVisible || sessionState === SessionState.FINISHED ? 'h-full flex-1' : 'flex-1 overflow-y-auto'}`}>
          {sessionState === SessionState.IDLE && (
            <div className="max-w-6xl mx-auto my-4 md:my-12 p-6 md:p-10 bg-zinc-900/50 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              <div className="space-y-8">
                <h2 className="text-3xl font-black mb-4">Configuración</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-3">Tiempo (s)</label>
                    <select value={config.intervalSeconds} onChange={e => setConfig({ ...config, intervalSeconds: parseInt(e.target.value) })} className="w-full bg-zinc-800 text-white border border-white/10 rounded-xl py-3 px-4 text-sm appearance-none outline-none focus:border-blue-500">
                      <option value={30}>30s (Gesto)</option>
                      <option value={60}>1m (Estándar)</option>
                      <option value={300}>5m (Estudio)</option>
                    </select>
                  </div>
                  {!useCustomImages && (
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-3">Fotos</label>
                      <input type="number" value={config.totalImages} min={1} max={30} onChange={e => setConfig({ ...config, totalImages: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-500" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-4">Fuente</label>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                    <button onClick={() => setUseCustomImages(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg ${!useCustomImages ? 'bg-blue-600 shadow-lg' : 'text-white/40'}`}>Internet</button>
                    <button onClick={() => setUseCustomImages(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg ${useCustomImages ? 'bg-blue-600 shadow-lg' : 'text-white/40'}`}>Mis Fotos</button>
                  </div>
                </div>
                {!useCustomImages && (
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-4">Categoría</label>
                    <div className="flex flex-wrap gap-2">
                      {['Dynamic', 'Athletic', 'Sitting', 'Standing', 'Random'].map(cat => (
                        <button key={cat} onClick={() => setConfig({ ...config, category: cat })} className={`py-2 px-4 rounded-xl border text-xs font-bold ${config.category === cat ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 text-white/40'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {useCustomImages ? (
                  <>
                    <h2 className="text-3xl font-black mb-4">Mis Poses</h2>
                    <input type="text" placeholder="Link..." value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addCustomImageUrl()} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm" />
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                      <p className="text-xs font-bold text-white/40 uppercase">Subir Archivos</p>
                    </div>
                    <ThumbnailGallery customImages={customImages} removeCustomImage={removeCustomImage} />
                  </>
                ) : (
                  <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl space-y-4">
                    <p className="text-sm text-blue-200/70">Buscamos fotos de personas reales en poses interesantes para tu sesión. Pero tambián puedes agregar tus propias imágenes.</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-black mb-4">Artistas</h2>
                <div className="flex gap-2">
                  <input type="text" placeholder="Nombre..." value={newParticipantName} onChange={e => setNewParticipantName(e.target.value)} onKeyPress={e => e.key === 'Enter' && addParticipant()} className="flex-1 bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm" />
                  <button onClick={addParticipant} className="px-4 bg-white/10 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                  {participants.map(p => {
                    const profile = PROFILE_DATA[p.type];
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <button onClick={() => cycleParticipantType(p.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-${profile.color}-500/20 text-${profile.color}-400`}>{profile.emoji}</button>
                          <div><p className="text-sm font-bold">{p.name}</p><p className={`text-[9px] uppercase font-bold text-${profile.color}-500`}>{profile.label}</p></div>
                        </div>
                        <button onClick={() => removeParticipant(p.id)} className="p-2 text-white/20 hover:text-red-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-3 mt-4"><button onClick={startSession} disabled={!canStartPractice} className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30">COMENZAR PRÁCTICA</button></div>
            </div>
          )}

          {sessionState === SessionState.LOADING && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/40 mono uppercase tracking-widest text-xs animate-pulse">Cargando referencias...</p>
            </div>
          )}

          {isVisible && images[currentIndex] && (
            <div className="relative h-full flex-1">
              <PoseViewer
                image={images[currentIndex]}
                currentIndex={currentIndex}
                total={images.length}
                onNext={nextPose}
                onPrev={prevPose}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
              {latestResult && showScore && (
                <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-3xl shadow-2xl animate-in fade-in zoom-in border backdrop-blur-xl ${['Boy', 'Girl', 'LittlePerson'].includes(latestResult.type) ? 'bg-emerald-600/90 border-emerald-400' : 'bg-orange-600/90 border-orange-400'}`}>
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{PROFILE_DATA[latestResult.type].emoji}</span>
                      <div>
                        <p className="text-[10px] font-black uppercase opacity-60">PUNTUACIÓN</p>
                        <p className="font-black text-xl leading-none">{latestResult.score}%</p>
                      </div>
                    </div>
                    {latestResult.type && latestResult.participant && <EvalCard ev={latestResult.ev} profile={PROFILE_DATA[latestResult.type]} participant={latestResult.participant} />}
                  </div>
                </div>
              )}
            </div>
          )}

          {sessionState === SessionState.FINISHED && (
            <SessionSummary
              images={images}
              evaluations={allEvaluations}
              participants={participants}
              onReset={resetSession}
            />
          )}
        </main>

        {isVisible && (
          <div className="fixed top-6 left-6 flex items-center gap-3 px-6 py-3 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40">
            <button onClick={prevPose} className="p-2 text-white/40 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" /></svg></button>
            <button onClick={togglePause} className="p-2 text-white/40 hover:text-white">
              {sessionState === SessionState.RUNNING ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>
            <button onClick={() => setShowCamera(true)} className="flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
              <span className="whitespace-nowrap uppercase">Evaluar Dibujo</span>
            </button>
            <button onClick={nextPose} className="p-2 text-white/40 hover:text-white"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg></button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <Timer secondsRemaining={secondsRemaining} totalSeconds={config.intervalSeconds} isPaused={sessionState === SessionState.PAUSED} />
          </div>
        )}
      </div>

      {allEvaluations.length > 0 && !isFullscreen && isVisible && (
        <aside className="w-80 bg-zinc-900 border-l border-white/5 flex flex-col z-10 hidden md:flex">
          <div className="p-6 border-b border-white/5"><h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Últimas Evaluaciones</h3></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            {allEvaluations.slice().reverse().map(ev => {
              const p = participants.find(part => part.id === ev.participantId);
              if (!p) return null;
              const profile = PROFILE_DATA[p.type];
              return (
                <EvalCard ev={ev} profile={profile} participant={p} />
              );
            })}
          </div>
        </aside>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-8">Ajustes</h2>
            <div className="space-y-6">
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-xs">
                <p className="mb-3 text-blue-200/70">Usa tu cuenta propia para evaluaciones ilimitadas.</p>
                <button onClick={handleOpenKeySelector} className={`w-full py-2 rounded-xl font-black ${hasUserKey ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                  {hasUserKey ? '✓ CLAVE CONFIGURADA' : 'CONFIGURAR CLAVE PROPIA'}
                </button>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-white text-black font-black rounded-xl">CERRAR</button>
            </div>
          </div>
        </div>
      )}

      {showCamera && images[currentIndex] && (
        <CameraModule referenceUrl={images[currentIndex].url} settings={settings} participants={participants} onClose={() => {
          setShowCamera(false)
        }} onResult={handleEvaluationResult} />
      )}
      {isModalOpen && <ByokModal setInputValue={setInputValue} setIsModalOpen={setIsModalOpen} handleSaveKey={handleSaveKey} inputValue={inputValue} />}
    </div>
  );
};

export default App;
