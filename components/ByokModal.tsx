import React from 'react'

function ByokModal({ setInputValue, setIsModalOpen, handleSaveKey, inputValue }) {

    return <div style={modalOverlayStyle}>
        <div style={modalStyle}>
            <h3>Configurar Gemini API Key</h3>
            <p>Introduce tu clave de API para continuar:</p>

            <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="AIza..."
                style={inputStyle}
            />

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={handleSaveKey} style={saveButtonStyle}>
                    Guardar Clave
                </button>
                <button onClick={() => setIsModalOpen(false)} style={cancelButtonStyle}>
                    Cancelar
                </button>
            </div>
        </div>
    </div>
}

export default ByokModal

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)'
};

const modalStyle = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    fontFamily: 'sans-serif',
    color: '#333'
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    marginTop: '15px',
    marginBottom: '5px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontSize: '14px'
};

const saveButtonStyle = {
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
};

const cancelButtonStyle = {
    backgroundColor: '#f1f3f4',
    color: '#3c4043',
    border: '1px solid #dadce0',
    padding: '10px 18px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px'
};