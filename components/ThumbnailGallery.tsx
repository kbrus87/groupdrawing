import React from 'react'

function ThumbnailGallery({ customImages, removeCustomImage }) {
    return <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
        {customImages.map(img => (
            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-white/5 group">
                {/* Imagen */}
                <img src={img.url} className="w-full h-full object-cover" alt="Custom" />

                {/* Botón de eliminar (Aparece al hacer hover sobre el div padre gracias a 'group-hover') */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Evita que el clic dispare otros eventos del contenedor
                        removeCustomImage(img.id);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 hover:bg-red-600 text-white rounded-lg 
                   flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                    title="Eliminar imagen"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Overlay opcional para mejorar contraste al hacer hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        ))}
    </div>
}

export default ThumbnailGallery