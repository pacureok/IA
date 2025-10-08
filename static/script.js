// --- VARIABLES GLOBALES Y UTILIDADES ---
let speaking = false;
let currentChatId = null; 
let history = {}; 

// Inicializa el historial al cargar la página
document.addEventListener('DOMContentLoaded', loadHistory);

// Función para detener la lectura actual
function stopSpeaking(manuallyStopped = true) {
    if (speaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        speaking = false;
        
        // 💡 NUEVO: Añadir el aviso de detención al último mensaje de la IA
        if (manuallyStopped && currentChatId) {
            const messages = history[currentChatId].messages;
            if (messages.length > 0 && messages[messages.length - 1].sender === 'ia') {
                messages[messages.length - 1].stopped = true;
                renderChatWindow(messages);
                saveHistory();
            }
        }
        
        const stopBtn = document.getElementById('stopSpeakerBtn');
        if (stopBtn) stopBtn.classList.add('hidden');
    }
}

// Función para leer el texto
function speakText(text) {
    stopSpeaking(false); // Detiene cualquier lectura previa sin marcarla como detenida
    if ('speechSynthesis' in window) {
        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        
        const stopBtn = document.getElementById('stopSpeakerBtn');
        
        // Configuración de la voz
        utterance.lang = 'es-ES';
        
        utterance.onstart = () => { 
            speaking = true; 
            if (stopBtn) stopBtn.classList.remove('hidden');
        };
        utterance.onend = () => { 
            speaking = false; 
            if (stopBtn) stopBtn.classList.add('hidden');
        };
        utterance.onerror = (e) => { 
            console.error('Error TTS:', e); 
            speaking = false; 
            if (stopBtn) stopBtn.classList.add('hidden');
        };
        
        synthesis.speak(utterance);
    } else {
        console.warn('El navegador no soporta Text-to-Speech.');
    }
}


// --- LÓGICA DE HISTORIAL Y CACHÉ (localStorage) ---

function loadHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        
        // Si hay historial, cargamos el chat más reciente por defecto
        const chatIds = Object.keys(history).sort((a, b) => a > b ? -1 : 1);
        if (chatIds.length > 0) {
            loadChat(chatIds[0]);
        } else {
            startNewChat();
        }
    } else {
        startNewChat();
    }
}

function saveHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function renderHistoryList() {
    // ... (Mantener la función renderHistoryList)
    // ... (Asegúrate de que la función startNewChat se llama con () en onclick)
}

function loadChat(id) {
    currentChatId = id;
    renderChatWindow(history[id].messages);
    renderHistoryList();
    stopSpeaking(false); // Detener TTS si cambiamos de chat
}

function startNewChat() {
    const newId = Date.now().toString();
    history[newId] = { title: 'Nuevo Chat', messages: [] };
    loadChat(newId);
}

function generateTitle(firstQuery) {
    const cleanQuery = firstQuery.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').trim();
    return cleanQuery.substring(0, 30) + (cleanQuery.length > 30 ? '...' : '');
}

// --- FUNCIÓN PARA RENDERIZAR MENSAJES EN LA PANTALLA (CLAVE) ---
function renderChatWindow(messages) {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.innerHTML = '';
    
    if (messages.length === 0) {
        // Pantalla de bienvenida simple si el chat está vacío
        chatWindow.innerHTML = '<h1 class="main-title">Hola YouTuber pacure</h1>';
        return;
    }

    messages.forEach(msg => {
        const msgElement = document.createElement('div');
        msgElement.className = `chat-message chat-${msg.sender}`;
        
        const bubble = document.createElement('div');
        
        if (msg.stopped) {
             // 💡 NUEVO: Renderiza el aviso de detención
             // Nota: La ruta url_for('static', ...) no funciona en JS, se usa la ruta directa.
             bubble.innerHTML = `
                <div class="stop-notice">
                    <img src="/static/img/imagres.ico" class="stop-icon" alt="stop icon" style="width:20px; height:20px; filter: drop-shadow(0 0 5px #4285F4);">
                    Detuviste esta respuesta
                </div>
             `;
             // En la imagen, el aviso de detención aparece fuera de la burbuja, alineado a la izquierda
             msgElement.className += ' stop-message'; 
        } else {
             bubble.className = `message-bubble bubble-${msg.sender}`;
             bubble.innerHTML = msg.content;
             msgElement.appendChild(bubble);
        }

        chatWindow.appendChild(msgElement);
    });
    
    // Desplazar al fondo
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


// --- FUNCIÓN PRINCIPAL DE BÚSQUEDA ---
async function buscar() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (!query) {
        // ... (Mostrar error)
        return;
    }

    // 1. Añadir el mensaje del USUARIO
    const userMessage = { sender: 'user', content: query };
    history[currentChatId].messages.push(userMessage);
    renderChatWindow(history[currentChatId].messages);
    
    // 2. Control visual (loading, etc.)
    // ... (Tu código de fetch)

    try {
        const response = await fetch('/buscar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        let iaContent = '';
        
        if (response.ok) {
            // Estructura el resultado de la IA
            iaContent = `
                <div class="result-header">
                    <span class="source-badge wikipedia">${data.source}</span>
                    <h3 class="result-title">${data.title}</h3>
                </div>
                <p class="result-text">${data.text}</p>
                <a href="${data.url}" target="_blank" class="result-link">Ver fuente completa →</a>
            `;
            
            // 💡 Iniciar TTS y guardar bandera de detención
            const textToRead = `${data.title}. El resumen es: ${data.text}`;
            speakText(textToRead);
            
            // 4. Generar título si es el primer mensaje
            if (history[currentChatId].messages.length === 1) { 
                history[currentChatId].title = generateTitle(query);
            }

        } else {
             iaContent = `<p class="error-text">❌ ${data.error || 'Error desconocido.'}</p>`;
        }
        
        // 5. Añadir la respuesta de la IA (stopped: false por defecto)
        const iaMessage = { sender: 'ia', content: iaContent, stopped: false };
        history[currentChatId].messages.push(iaMessage);
        
        // 6. Actualizar la interfaz y caché
        renderChatWindow(history[currentChatId].messages);
        renderHistoryList(); 
        saveHistory(); 
        
    } catch (err) {
        // Manejo de error de conexión
        const errorMsg = { sender: 'ia', content: '<p class="error-text">⚠️ Error de conexión con el servidor.</p>' };
        history[currentChatId].messages.push(errorMsg);
        renderChatWindow(history[currentChatId].messages);
        saveHistory();
    } finally {
        // ... (limpieza del loading)
    }
}

// --- OTROS LISTENERS ---
// ... (Mantener todas las funciones y listeners auxiliares)
document.getElementById('searchBtn').addEventListener('click', buscar);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscar();
    }
});
document.getElementById('voiceBtn').addEventListener('click', startVoiceInput);
document.getElementById('timeWeatherBtn').addEventListener('click', getWeatherAndSpeak);
document.getElementById('stopSpeakerBtn').addEventListener('click', () => stopSpeaking(true)); // Pasar true
