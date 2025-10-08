// --- VARIABLES GLOBALES Y CACHÉ --- 
let speaking = false;
let currentChatId = null; 
let history = {}; // { chat_id: {title: '...', messages: [{sender: 'user/ia', content: '...', stopped: false, sources: []}]}, ... }

// --- ICONOS SVG (Necesarios para la barra de acciones y fuentes) ---
const SVG_ICONS = {
    thumbsUp: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V18C14 19.1046 13.1046 20 12 20H5C3.89543 20 3 19.1046 3 18V9C3 7.89543 3.89543 7 5 7H12C13.1046 7 14 7.89543 14 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7H18.5C19.3284 7 20 7.67157 20 8.5C20 9.32843 19.3284 10 18.5 10H17V17C17 18.1046 16.1046 19 15 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7L13 3L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    thumbsDown: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 15V6C10 4.89543 10.8954 4 12 4H19C20.1046 4 21 4.89543 21 6V15C21 16.1046 20.1046 17 19 17H12C10.8954 17 10 16.1046 10 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17H5.5C4.67157 17 4 16.3284 4 15.5C4 14.6716 4.67157 14 5.5 14H7V7C7 5.89543 7.89543 5 9 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17L11 21L9 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 20V14H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 9C4.85257 7.1593 7.0707 6 9.5 6C14.747 6 18.2612 10.0494 17.5147 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.4853 15C19.1427 16.8407 16.9246 18 14.5 18C9.25301 18 5.73881 13.9506 6.48531 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 14V17C18 18.1046 17.1046 19 16 19H8C6.89543 19 6 18.1046 6 17V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15L12 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 6L12 3L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4H8C6.89543 4 6 4.89543 6 6V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V6C18 4.89543 17.1046 4 16 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
};

const SOURCE_ICON_SVG = '<svg class="source-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.44 4 16.08 4 12C4 7.92 7.05 4.56 11 4.07V19.93ZM13 4.07V19.93C16.95 19.44 20 16.08 20 12C20 7.92 16.95 4.56 13 4.07Z" fill="currentColor"/></svg>';
const DROPDOWN_ICON_SVG = '<svg class="source-dropdown-btn" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10L12 15L17 10H7Z" fill="currentColor"/></svg>';


// --- LÓGICA DEL SLIDER (BARRA LATERAL) ---

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const wrapper = document.getElementById('mainContentWrapper');
    const menuToggle = document.getElementById('menuToggle');
    
    const isOpen = sidebar.classList.toggle('open');
    wrapper.classList.toggle('sidebar-open', isOpen);
    menuToggle.classList.toggle('sidebar-open', isOpen);

    // Cambiar el ícono del botón
    menuToggle.innerHTML = isOpen ? 
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : // Ícono X
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; // Ícono Hamburguesa
}

// --- LÓGICA DE HISTORIAL Y CACHÉ ---

function loadHistory() {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        
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
    // Botón de Nuevo Chat con ícono
    historyList.innerHTML = `<div class="history-item new-chat-btn" onclick="startNewChat()">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Nuevo Chat
    </div>`;
    
    const chatIds = Object.keys(history).sort((a, b) => a > b ? -1 : 1);

    chatIds.forEach(id => {
        const chat = history[id];
        const item = document.createElement('div');
        item.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        const displayTitle = chat.title || (chat.messages[0] ? chat.messages[0].content.substring(0, 30) + '...' : 'Nuevo Chat');
        item.textContent = displayTitle;
        item.onclick = () => loadChat(id);
        historyList.appendChild(item);
    });
}

function loadChat(id) {
    currentChatId = id;
    renderChatWindow(history[id].messages);
    renderHistoryList(); 
    stopSpeaking(false); 
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


// --- FUNCIONES DE TTS (Text-to-Speech) ---

function stopSpeaking(manuallyStopped = true) {
    if (speaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        speaking = false;
        
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
    stopSpeaking(false); 
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


// --- FUNCIONES DE ACCIÓN DE LA IA Y FUENTES ---

function toggleSourceDropdown(element) {
    const dropdown = element.querySelector('.source-dropdown');
    document.querySelectorAll('.source-dropdown').forEach(d => {
        if (d !== dropdown) d.style.display = 'none';
    });
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function createSourceBar(sources) {
    if (!sources || sources.length === 0) return '';
    
    let html = '<div class="sources-container">';
    
    const visibleSources = sources.slice(0, 1);
    const hiddenSources = sources.slice(1);

    visibleSources.forEach(source => {
        // Mostrar solo el nombre del dominio (ej: wikipedia.org)
        let sourceName = new URL(source.url).hostname;
        sourceName = sourceName.replace(/(www\.)?/g, '');
        
        html += `
            <a href="${source.url}" target="_blank" class="source-item">
                ${SOURCE_ICON_SVG}
                ${sourceName}
            </a>
        `;
    });

    if (hiddenSources.length > 0) {
        let dropdownItems = '';
        hiddenSources.forEach(source => {
            dropdownItems += `
                <a href="${source.url}" target="_blank" class="source-link">
                    ${source.name} 
                </a>
            `;
        });
        
        html += `
            <div class="more-options" onclick="toggleSourceDropdown(this)">
                <span class="source-item">
                    ${DROPDOWN_ICON_SVG}
                    ${hiddenSources.length} más
                </span>
                <div class="source-dropdown">
                    ${dropdownItems}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function reListen(chatId, messageIndex) {
    const chat = history[chatId];
    if (!chat || !chat.messages[messageIndex]) return;

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
    document.querySelectorAll('.options-menu').forEach(m => {
        if (m !== menu) m.style.display = 'none';
    });
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
        chatWindow.innerHTML = '<h1 class="main-title">Hola usuario</h1>';
        return;
    }

    messages.forEach((msg, index) => { 
        const msgElement = document.createElement('div');
        msgElement.className = `chat-message chat-${msg.sender}`;
        
        if (msg.stopped && msg.sender === 'ia') {
             const stopNoticeContainer = document.createElement('div');
             stopNoticeContainer.className = 'stop-notice-container'; 
             stopNoticeContainer.innerHTML = `
                <div class="stop-notice">
                    <img src="/static/img/imagres.ico" class="stop-icon" alt="stop icon">
                    Detuviste esta respuesta
                </div>
             `;
             msgElement.appendChild(stopNoticeContainer); 
             
        } else {
            const bubble = document.createElement('div');
            bubble.className = `message-bubble bubble-${msg.sender}`;
            
            let finalContent = msg.content;

            if (msg.sender === 'ia') {
                // 1. Inyección de las fuentes (ANTES del contenido principal)
                if (msg.sources && msg.sources.length > 0) {
                    const sourceBar = createSourceBar(msg.sources);
                    finalContent = sourceBar + finalContent;
                }
                
                // 2. Inyección de la barra de acciones
                const actionsBar = createActionsBar(currentChatId, index);
                finalContent += actionsBar;
            }

            bubble.innerHTML = finalContent;
            msgElement.appendChild(bubble);
        }

        chatWindow.appendChild(msgElement);
    });
    
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


// --- FUNCIÓN PRINCIPAL DE BÚSQUEDA ---
async function buscar() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    const normalizedQuery = query.toLowerCase();

    if (!query) return;

    // 1. Añadir el mensaje del USUARIO
    const userMessage = { sender: 'user', content: query };
    history[currentChatId].messages.push(userMessage);
    renderChatWindow(history[currentChatId].messages);
    
    let iaContent = '';
    let isCustomResponse = false;
    let textToRead = '';
    let sources = []; // Inicializar fuentes para la respuesta

    // 2. Lógica de Respuestas Programadas (PACURE IA)
    
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
        
        if (history[currentChatId].messages.length === 1) { 
            history[currentChatId].title = generateTitle(query);
        }

        // Se usa sources: [] por defecto
        const iaMessage = { sender: 'ia', content: iaContent, stopped: false, sources: [] }; 
        history[currentChatId].messages.push(iaMessage);
        
        speakText(textToRead);
        
    } else {
        // Respuesta normal (Búsqueda externa - Aquí simulas la respuesta de tu servidor)
        
        try {
            // SIMULACIÓN de la respuesta del servidor (reemplaza esto con tu fetch real)
            const data = {
                title: 'Río Pacuare y Rafting',
                text: 'El Río Pacuare, ubicado en Costa Rica, es famoso mundialmente por sus emocionantes rápidos de clase III y IV, que lo hacen ideal para el rafting. Es un río prístino que atraviesa una densa selva tropical.',
                url: 'https://es.wikipedia.org/wiki/R%C3%ADo_Pacuare',
                // Simulamos múltiples fuentes para demostrar el 'más'
                external_sources: [
                    { name: 'Wikipedia (Río Pacuare)', url: 'https://es.wikipedia.org/wiki/R%C3%ADo_Pacuare' },
                    { name: 'National Geographic - Aventuras', url: 'https://www.nationalgeographic.com/aventura-pacuare' },
                    { name: 'Pacuare Lodge Oficial', url: 'https://www.pacuarelodge.com/' }
                ]
            };
            
            // Asignar fuentes y construir el contenido
            sources = data.external_sources || [];

            iaContent = `
                <div class="result-header">
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

            const iaMessage = { 
                sender: 'ia', 
                content: iaContent, 
                stopped: false, 
                sources: sources // Asigna las fuentes aquí
            };
            history[currentChatId].messages.push(iaMessage);
            
        } catch (err) {
            iaContent = '<p class="error-text">⚠️ Error de conexión con el servidor.</p>';
            const errorMsg = { sender: 'ia', content: iaContent, sources: [] };
            history[currentChatId].messages.push(errorMsg);
            textToRead = "Error de conexión con el servidor.";
        }
    }

    // 4. Actualizar
    renderChatWindow(history[currentChatId].messages);
    renderHistoryList(); 
    saveHistory(); 
    searchInput.value = ''; // Limpiar la barra de búsqueda
}


// --- LISTENERS DE EVENTOS ---

document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    // Listener para el botón de abrir/cerrar menú
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);

    // Listener para el botón de búsqueda
    document.getElementById('searchBtn').addEventListener('click', buscar);
    
    // Listener para la tecla Enter en el input
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscar();
        }
    });

    // Listener para detener el TTS (ya añadido en el HTML, pero aseguramos la función)
    const stopBtn = document.getElementById('stopSpeakerBtn');
    if (stopBtn) stopBtn.addEventListener('click', () => stopSpeaking(true));
});
