import React from 'react'

function EvalCard({ ev, profile, participant }) {
    return <div key={ev.id} className="bg-black/40 rounded-2xl overflow-hidden border border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase bg-${profile?.color}-500/10 text-${profile?.color}-400`}>
                {participant.name} {profile.emoji}
            </span>
            <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-full">{ev.score}%</span>
        </div>
        <img src={ev.drawingThumbnail} className="w-full aspect-square object-cover rounded-xl opacity-90 shadow-lg" />
        <div className="bg-black/20 p-2 rounded-lg border border-white/5">
            <p className="text-[11px] text-white/70 leading-relaxed italic">"{ev.feedback}"</p>
        </div>
    </div>
}

export default EvalCard
