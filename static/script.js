// --- ICONOS SVG (Deben estar al inicio de tu script.js) ---
const SVG_ICONS = {
    // Definiciones de tus SVGs aquí (omitidas para brevedad, asume que están definidas)
    thumbsUp: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V18C14 19.1046 13.1046 20 12 20H5C3.89543 20 3 19.1046 3 18V9C3 7.89543 3.89543 7 5 7H12C13.1046 7 14 7.89543 14 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7H18.5C19.3284 7 20 7.67157 20 8.5C20 9.32843 19.3284 10 18.5 10H17V17C17 18.1046 16.1046 19 15 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7L13 3L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    thumbsDown: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 15V6C10 4.89543 10.8954 4 12 4H19C20.1046 4 21 4.89543 21 6V15C21 16.1046 20.1046 17 19 17H12C10.8954 17 10 16.1046 10 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17H5.5C4.67157 17 4 16.3284 4 15.5C4 14.6716 4.67157 14 5.5 14H7V7C7 5.89543 7.89543 5 9 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17L11 21L9 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 20V14H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 9C4.85257 7.1593 7.0707 6 9.5 6C14.747 6 18.2612 10.0494 17.5147 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.4853 15C19.1427 16.8407 16.9246 18 14.5 18C9.25301 18 5.73881 13.9506 6.48531 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 14V17C18 18.1046 17.1046 19 16 19H8C6.89543 19 6 18.1046 6 17V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15L12 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 6L12 3L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4H8C6.89543 4 6 4.89543 6 6V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V6C18 4.89543 17.1046 4 16 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
};

// --- FUNCIONES DE ACCIÓN (Deben estar en tu script.js) ---

function reListen(chatId, messageIndex) {
    const chat = history[chatId];
    if (!chat || !chat.messages[messageIndex]) return;

    const content = chat.messages[messageIndex].content;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textToRead = tempDiv.textContent || tempDiv.innerText;

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
    for (let i = messageIndex - 1; i >= 0; i--) {
        if (chat.messages[i].sender === 'user') {
            userQuery = chat.messages[i].content;
            break;
        }
    }

    if (userQuery) {
        document.getElementById('searchInput').value = userQuery;
        // Eliminar el mensaje de la IA y el mensaje del usuario
        chat.messages.splice(messageIndex - 1, 2); 
        saveHistory();
        renderChatWindow(chat.messages);
        buscar(); // Re-ejecutar la búsqueda
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

// --- FUNCIÓN DE UTILIDAD: CREA LA BARRA DE ACCIONES ---
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

// --- FUNCIÓN PRINCIPAL DE RENDERIZADO ---
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
             stopNoticeContainer.className = 'stop-notice-container'; // Contenedor para alinear el aviso

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
