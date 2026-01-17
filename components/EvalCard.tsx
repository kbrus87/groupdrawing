import React from 'react'

function EvalCard({ ev, profile, participant }) {
    return <div key={ev.id} className="bg-black/40 rounded-2xl overflow-hidden border border-white/5 p-3">
        <div className="flex items-center justify-between mb-3">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase bg-${profile?.color}-500/10 text-${profile?.color}-400`}>{participant.name} {profile.emoji}</span>
            <span className="text-[10px] font-black">{ev.score}%</span>
        </div>
        <img src={ev.drawingThumbnail} className="w-full aspect-[4/3] object-cover rounded-lg mb-2 opacity-80" />
        <p className="text-[10px] text-white/60 leading-tight italic">"{ev.feedback}"</p>
    </div>
}

export default EvalCard