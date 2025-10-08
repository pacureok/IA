// --- VARIABLES GLOBALES Y CACHÉ ---
let speaking = false;
let currentChatId = null; 
let history = {}; // { chat_id: {title: '...', messages: [{sender: 'user/ia', content: '...', stopped: false}]}, ... }

// Inicializa el historial al cargar la página
document.addEventListener('DOMContentLoaded', loadHistory);


// --- ICONOS SVG (Necesarios para la barra de acciones) ---
const SVG_ICONS = {
    thumbsUp: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V18C14 19.1046 13.1046 20 12 20H5C3.89543 20 3 19.1046 3 18V9C3 7.89543 3.89543 7 5 7H12C13.1046 7 14 7.89543 14 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7H18.5C19.3284 7 20 7.67157 20 8.5C20 9.32843 19.3284 10 18.5 10H17V17C17 18.1046 16.1046 19 15 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7L13 3L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    thumbsDown: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 15V6C10 4.89543 10.8954 4 12 4H19C20.1046 4 21 4.89543 21 6V15C21 16.1046 20.1046 17 19 17H12C10.8954 17 10 16.1046 10 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17H5.5C4.67157 17 4 16.3284 4 15.5C4 14.6716 4.67157 14 5.5 14H7V7C7 5.89543 7.89543 5 9 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17L11 21L9 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 20V14H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 9C4.85257 7.1593 7.0707 6 9.5 6C14.747 6 18.2612 10.0494 17.5147 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.4853 15C19.1427 16.8407 16.9246 18 14.5 18C9.25301 18 5.73881 13.9506 6.48531 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 14V17C18 18.1046 17.1046 19 16 19H8C6.89543 19 6 18.1046 6 17V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15L12 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 6L12 3L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4H8C6.89543 4 6 4.89543 6 6V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V6C18 4.89543 17.1046 4 16 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
};


// --- FUNCIÓN TTS (Text-to-Speech) ---

function stopSpeaking(manuallyStopped = true) {
    if (speaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        speaking = false;
        
        // Añadir el aviso de detención al último mensaje de la IA
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

function speakText(text) {
    stopSpeaking(false); // Detiene cualquier lectura previa sin marcarla como detenida
    if ('speechSynthesis' in window) {
        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        
        const stopBtn = document.getElementById('stopSpeakerBtn');
        
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
        
        // Cargar el chat más reciente por defecto
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
    const historyList = document.getElementById('historyList');
    // Recrea el botón de Nuevo Chat
    historyList.innerHTML = '<div class="history-item new-chat-btn" onclick="startNewChat()">➕ Nuevo Chat</div>';
    
    const chatIds = Object.keys(history).sort((a, b) => a > b ? -1 : 1);

    chatIds.forEach(id => {
        const chat = history[id];
        const item = document.createElement('div');
        item.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        // Mostrar título o los primeros caracteres del primer mensaje
        const displayTitle = chat.title || (chat.messages[0] ? chat.messages[0].content.substring(0, 30) + '...' : 'Nuevo Chat');
        item.textContent = displayTitle;
        item.onclick = () => loadChat(id);
        historyList.appendChild(item);
    });
}

function loadChat(id) {
    currentChatId = id;
    renderChatWindow(history[id].messages);
    renderHistoryList(); // Actualiza el estado activo
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


// --- FUNCIONES DE ACCIÓN DE LA IA ---

function reListen(chatId, messageIndex) {
    const chat = history[chatId];
    if (!chat || !chat.messages[messageIndex]) return;

    // Obtener solo el texto limpio (sin el HTML de la barra de acciones, etc.)
    const content = chat.messages[messageIndex].content;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textToRead = tempDiv.querySelector('.result-text') ? 
                       tempDiv.querySelector('.result-text').textContent : 
                       tempDiv.textContent;

    speakText(textToRead);
    document.querySelectorAll('.options-menu').forEach(menu => menu.style.display = 'none');
}

function copyResponse(chatId, messageIndex) {
    const chat = history[chatId];
    if (!chat || !chat.messages[messageIndex]) return;

    const content = chat.messages[messageIndex].content;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textToCopy = tempDiv.textContent || tempDiv.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('Respuesta copiada al portapapeles!');
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}

function redoSearch(chatId, messageIndex) {
    const chat = history[chatId];
    if (!chat) return;

    // Encuentra la última consulta del usuario antes de esta respuesta de la IA
    let userQuery = '';
    let userMessageIndex = -1;
    for (let i = messageIndex - 1; i >= 0; i--) {
        if (chat.messages[i].sender === 'user') {
            userQuery = chat.messages[i].content;
            userMessageIndex = i;
            break;
        }
    }

    if (userQuery) {
        document.getElementById('searchInput').value = userQuery;
        // Elimina el mensaje de la IA actual y la pregunta del usuario
        if (userMessageIndex !== -1) {
             chat.messages.splice(userMessageIndex, 2); 
        } else {
             chat.messages.splice(messageIndex, 1);
        }
       
        saveHistory();
        renderChatWindow(chat.messages);
        buscar(); // Vuelve a ejecutar la búsqueda
    } else {
        alert('No se encontró una consulta anterior para rehacer.');
    }
}

function toggleMenu(element) {
    const menu = element.querySelector('.options-menu');
    // Cerrar cualquier otro menú abierto
    document.querySelectorAll('.options-menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
    // Toggle del menú actual
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function createActionsBar(chatId, messageIndex) {
    return `
        <div class="ia-actions">
            <button class="action-btn" onclick="alert('¡Gracias por tu valoración!');">
                ${SVG_ICONS.thumbsUp}
                <span class="tooltip-text">Respuesta correcta</span>
            </button>
            
            <button class="action-btn" onclick="alert('¡Lo siento! Ayúdanos a mejorar.');">
                ${SVG_ICONS.thumbsDown}
                <span class="tooltip-text">Respuesta incorrecta</span>
            </button>
            
            <button class="action-btn" onclick="redoSearch('${chatId}', ${messageIndex})">
                ${SVG_ICONS.redo}
                <span class="tooltip-text">Rehacer</span>
            </button>
            
            <button class="action-btn" onclick="alert('Función de compartir no implementada.');">
                ${SVG_ICONS.share}
                <span class="tooltip-text">Compartir y exportar</span>
            </button>
            
            <button class="action-btn" onclick="copyResponse('${chatId}', ${messageIndex})">
                ${SVG_ICONS.copy}
                <span class="tooltip-text">Copiar respuesta</span>
            </button>
            
            <div class="more-options">
                <button class="action-btn" onclick="toggleMenu(this.parentElement)">
                    ${SVG_ICONS.dots}
                </button>
                <div class="options-menu">
                    <button onclick="reListen('${chatId}', ${messageIndex})">Volver a escuchar TTS</button>
                </div>
            </div>
        </div>
    `;
}


// --- FUNCIÓN PARA RENDERIZAR MENSAJES EN LA PANTALLA ---
function renderChatWindow(messages) {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.innerHTML = '';
    
    if (messages.length === 0) {
        chatWindow.innerHTML = '<h1 class="main-title">Hola YouTuber pacure</h1>';
        return;
    }

    messages.forEach((msg, index) => { 
        const msgElement = document.createElement('div');
        msgElement.className = `chat-message chat-${msg.sender}`;
        
        // 1. Manejo del mensaje de Detención
        if (msg.stopped && msg.sender === 'ia') {
             const stopNoticeContainer = document.createElement('div');
             // Usamos un div para contener el aviso, asegurando que se muestre correctamente.
             stopNoticeContainer.innerHTML = `
                <div class="stop-notice">
                    <img src="/static/img/imagres.ico" class="stop-icon" alt="stop icon">
                    Detuviste esta respuesta
                </div>
             `;
             msgElement.appendChild(stopNoticeContainer); 
             
        } else {
            // 2. Renderizado de burbujas normales (Usuario e IA)
            const bubble = document.createElement('div');
            bubble.className = `message-bubble bubble-${msg.sender}`;
            bubble.innerHTML = msg.content;
            
            // 3. Inyección de la barra de acciones para la IA
            if (msg.sender === 'ia') {
                const actionsBar = createActionsBar(currentChatId, index);
                bubble.innerHTML += actionsBar;
            }

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
    const normalizedQuery = query.toLowerCase();

    if (!query) {
        // Mejorar con un mensaje de error visual si lo tienes.
        return;
    }

    // 1. Añadir el mensaje del USUARIO al historial y a la pantalla
    const userMessage = { sender: 'user', content: query };
    history[currentChatId].messages.push(userMessage);
    renderChatWindow(history[currentChatId].messages);
    
    let iaContent = '';
    let isCustomResponse = false;
    let textToRead = '';

    // 2. Lógica de Respuestas Programadas (PACURE IA)
    
    // A. ¿Qué hace PACURE IA? (o Generar Imagen)
    if (normalizedQuery.includes('que hace') || normalizedQuery.includes('pacure ia') ||
        normalizedQuery.includes('genera imagen') || normalizedQuery.includes('haz una imagen')) 
    {
        isCustomResponse = true;
        iaContent = `
            <h3 class="result-title">PACURE IA: ¿Qué Hago?</h3>
            <p class="result-text">
                Soy PACURE IA, la herramienta de asistencia y búsqueda diseñada para brindarte información rápida y precisa. Mis capacidades principales incluyen:
                <ul>
                    <li>**Resumen de Búsqueda:** Combino datos de múltiples fuentes para darte una respuesta concisa.</li>
                    <li>**Generación de Texto y Código:** Puedo generar textos creativos, resúmenes o ejemplos de código.</li>
                    <li>**¡IMPORTANTE! Generación de Imágenes:** **No puedo generar o hacer imágenes** en este momento. Soy un asistente de texto avanzado.</li>
                    <li>**Asistencia por Voz (TTS):** Puedo leer mis respuestas para ti si lo deseas.</li>
                    <li>**Gestión de Historial:** Guardo nuestras conversaciones para que puedas consultarlas más tarde.</li>
                </ul>
            </p>
            <p class="result-text">
                Mi función principal es ayudarte a encontrar información de manera eficiente.
            </p>
        `;
        textToRead = "Mi función principal es ayudarte a encontrar información de manera eficiente. No puedo generar imágenes, pero sí puedo generar texto, resúmenes y leer mis respuestas.";
    } 
    
    // B. ¿Quién es el dueño de PACURE IA?
    else if (normalizedQuery.includes('dueño') || normalizedQuery.includes('creador')) 
    {
        isCustomResponse = true;
        iaContent = `
            <h3 class="result-title">Dueño de PACURE IA</h3>
            <p class="result-text">
                Soy propiedad y desarrollo de **PACURE IA DUEÑO**. Mi propósito es ser una herramienta de apoyo y un asistente virtual para todos mis usuarios.
            </p>
        `;
        textToRead = "Soy propiedad y desarrollo de PACURE IA DUEÑO. Mi propósito es ser un asistente virtual para ti.";
    }
    
    // C. Home/Inicio
    else if (normalizedQuery.includes('home') || normalizedQuery.includes('inicio') || normalizedQuery.includes('principal')) 
    {
        isCustomResponse = true;
        iaContent = `
            <h3 class="result-title">Página Principal de PACURE IA (Home)</h3>
            <p class="result-text">
                Bienvenido de vuelta. Esta es una simulación del contenido de mi página de inicio, copiado del enlace:
                <ul>
                    <li>**¡Bienvenido a PACURE IA!** Tu compañero de IA más eficiente.</li>
                    <li>**Rápido y Preciso:** Obtén respuestas en segundos.</li>
                    <li>**Últimas Novedades:** Pronto implementaremos una función de generación de imágenes y mejoras en el historial.</li>
                    <li>**Soporte:** Para más ayuda, visita nuestro sitio oficial o contacta al dueño.</li>
                </ul>
            </p>
        `;
        textToRead = "Bienvenido a mi página de inicio. Soy tu compañero de IA más eficiente. Obtén respuestas rápidas y precisas. ¡Sigue preguntando!";
    }
    
    
    // 3. Ejecución de la Respuesta (Personalizada o Externa)
    
    if (isCustomResponse) {
        // Respuesta personalizada
        
        if (history[currentChatId].messages.length === 1) { 
            history[currentChatId].title = generateTitle(query);
        }

        const iaMessage = { sender: 'ia', content: iaContent, stopped: false };
        history[currentChatId].messages.push(iaMessage);
        
        speakText(textToRead);
        
    } else {
        // Respuesta normal (Búsqueda externa)
        
        // Nota: Asegúrate de tener elementos de loading en tu HTML/CSS
        // const loadingEl = document.getElementById('loading');
        // loadingEl.classList.remove('hidden');

        try {
            const response = await fetch('/buscar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Estructura el resultado de la IA
                iaContent = `
                    <div class="result-header">
                        <span class="source-badge wikipedia">${data.source || 'WEB'}</span>
                        <h3 class="result-title">${data.title}</h3>
                    </div>
                    <p class="result-text">${data.text}</p>
                    <a href="${data.url}" target="_blank" class="result-link">Ver fuente completa →</a>
                `;
                
                textToRead = `${data.title}. El resumen es: ${data.text}`;
                speakText(textToRead);
                
                if (history[currentChatId].messages.length === 1) { 
                    history[currentChatId].title = generateTitle(query);
                }

            } else {
                iaContent = `<p class="error-text">❌ ${data.error || 'Error desconocido al buscar.'}</p>`;
                textToRead = "Hubo un error al buscar la información.";
            }
            
            const iaMessage = { sender: 'ia', content: iaContent, stopped: false };
            history[currentChatId].messages.push(iaMessage);
            
        } catch (err) {
            iaContent = '<p class="error-text">⚠️ Error de conexión con el servidor.</p>';
            const errorMsg = { sender: 'ia', content: iaContent };
            history[currentChatId].messages.push(errorMsg);
            textToRead = "Error de conexión con el servidor.";
        } finally {
            // loadingEl.classList.add('hidden');
        }
    }

    // 4. Actualizar la interfaz y caché después de cualquier tipo de respuesta
    renderChatWindow(history[currentChatId].messages);
    renderHistoryList(); 
    saveHistory(); 
    searchInput.value = ''; // Limpiar la barra de búsqueda
}


// --- LISTENERS DE EVENTOS ---
document.getElementById('searchBtn').addEventListener('click', buscar);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscar();
    }
});
// Asegúrate de que los botones de voz y tiempo existan en tu HTML
// document.getElementById('voiceBtn').addEventListener('click', startVoiceInput); 
// document.getElementById('timeWeatherBtn').addEventListener('click', getWeatherAndSpeak); 
// document.getElementById('stopSpeakerBtn').addEventListener('click', () => stopSpeaking(true));
