// --- VARIABLES GLOBALES Y CACHÉ ---
let speaking = false;
let currentChatId = null; 
let history = {}; 
let uploadedImageBase64 = null; // Base64 de la imagen subida
let isToolMode = false;         // Bandera para saber si estamos creando un documento
let currentTool = null;         // 'word' o 'excel'
let savedDocuments = [];      // Almacena los apuntes creados localmente

// Inicializa el historial y los documentos al cargar la página
document.addEventListener('DOMContentLoaded', loadInitialData);


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


// --- LÓGICA DE INICIALIZACIÓN Y CACHÉ ---

function loadInitialData() {
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
    
    // Cargar documentos guardados
    const savedDocs = localStorage.getItem('savedDocuments');
    if (savedDocs) savedDocuments = JSON.parse(savedDocs);
}

function saveHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function renderHistoryList() {
    const historyList = document.getElementById('historyList');
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
        const displayTitle = chat.title || (chat.messages[0] ? chat.messages[0].content.replace(/<[^>]*>?/gm, "").substring(0, 30) + '...' : 'Nuevo Chat');
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


// --- LÓGICA DE TTS (Text-to-Speech) ---

function stopSpeaking(manuallyStopped = true) {
    if (speaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        speaking = false;
        
        if (manuallyStopped && currentChatId) {
            const messages = history[currentChatId].messages;
            // Solo marca como detenido si el último mensaje es de la IA y no es el menú de herramientas
            if (messages.length > 0 && messages[messages.length - 1].sender === 'ia' && !messages[messages.length - 1].isToolPrompt) {
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


// --- LÓGICA DE IMAGENES ---

function handleImageUpload(event) {
    const file = event.target.files[0]; 
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');

    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, sube un archivo de imagen válido.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { 
             alert('La imagen es demasiado grande (máx 10MB).');
             return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageBase64 = e.target.result; 
            previewImg.src = uploadedImageBase64;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

    } else {
        removeImage();
    }
}

function removeImage() {
    uploadedImageBase64 = null;
    document.getElementById('imageInput').value = ''; 
    document.getElementById('imagePreviewContainer').classList.add('hidden');
    document.getElementById('imagePreview').src = '';
}


// --- LÓGICA DE HERRAMIENTAS Y APUNTES ---

function toggleToolsMenu() {
    const menu = document.getElementById('toolsMenu');
    // Si ya está abierto, lo cierro, si no, lo abro
    const isHidden = menu.classList.toggle('hidden');
    
    // Ajustar posición si se está abriendo
    if (!isHidden) {
        const toolsBtn = document.getElementById('toolsBtn');
        const rect = toolsBtn.getBoundingClientRect();
        // Alinea el menú justo a la izquierda del botón toolsBtn, ajustando el ancho del menú (200px)
        menu.style.left = (rect.left - 200) + 'px'; 
    }
}

function selectTool(toolType) {
    currentTool = toolType;
    isToolMode = true;
    toggleToolsMenu(); 

    const searchInput = document.getElementById('searchInput');
    
    let toolName = toolType === 'word' ? 'Apunte/Word' : 'Tabla/Excel';
    searchInput.placeholder = `Escribe el contenido para tu ${toolName}...`;
    
    // Simula la pregunta de la IA al usuario
    const iaPrompt = { 
        sender: 'ia', 
        content: `<h3 class="result-title">Herramienta de Creación: ${toolName}</h3><p class="result-text">Perfecto. Dime el **título y el contenido** que deseas incluir en tu nuevo ${toolName}. Usa saltos de línea para un mejor formato.</p>`,
        stopped: false, 
        isToolPrompt: true, // Marca para no mostrar acciones de IA
        sources: [] 
    };
    history[currentChatId].messages.push(iaPrompt);
    renderChatWindow(history[currentChatId].messages);
    saveHistory();
}

function createStyledDocument(query) {
    const iaToolMessage = { 
        sender: 'ia', 
        content: `<div class="status-message"><h3 class="result-title">Procesando Herramienta</h3><p class="result-text">La app dice: **CREANDO...** Analizando tu texto y dándole formato de apunte con estilo.</p></div>`,
        stopped: false, 
        isToolResult: true,
        sources: [] 
    };
    history[currentChatId].messages.push(iaToolMessage);
    renderChatWindow(history[currentChatId].messages);
    
    // Simulación de delay para el "CREANDO..."
    setTimeout(() => {
        
        // 1. Simular análisis y extracción de contenido
        const lines = query.split('\n');
        let title = lines[0].trim();
        let content = lines.slice(1).join('\n').trim();
        
        // Lógica simple para titular y formatear
        if (title.length > 50) {
            title = title.substring(0, 50) + '...';
        } else if (!title) {
            title = `Nuevo ${currentTool === 'word' ? 'Apunte' : 'Tabla'} sin Título`;
        }
        
        if (!content) {
            content = "*(Contenido vacío, por favor añade más texto en tu siguiente consulta para el apunte.)*";
        }

        const docId = Date.now().toString();
        const newDoc = {
            id: docId,
            type: currentTool,
            title: title,
            content: content,
            timestamp: new Date().toLocaleTimeString()
        };
        
        savedDocuments.push(newDoc);
        localStorage.setItem('savedDocuments', JSON.stringify(savedDocuments)); // Guardar en caché

        // 2. Generar el HTML del documento creado
        const docHTML = `
            <div class="created-document">
                <div class="document-title">
                    ${newDoc.type === 'word' ? '📝 ' : '📊 '} 
                    ${newDoc.title}
                </div>
                <div class="document-content">
                    ${newDoc.content.replace(/\n/g, '<br>')}
                </div>
                <div class="document-actions">
                    <button onclick="downloadDocument('${docId}')">Descargar .${newDoc.type}</button>
                    <button onclick="alert('Función de edición no implementada. Contenido guardado en caché.');">Editar</button>
                </div>
                <p style="font-size: 0.8em; color: #aaa; margin-top: 10px;">Guardado localmente en caché.</p>
            </div>
        `;

        // 3. Reemplazar el mensaje "CREANDO..." con el resultado final
        iaToolMessage.content = docHTML;
        renderChatWindow(history[currentChatId].messages);
        
        // 4. Salir del modo herramienta
        isToolMode = false;
        currentTool = null;
        document.getElementById('searchInput').placeholder = "Escribe o habla tu consulta...";
        saveHistory(); 
        
    }, 1500); // 1.5 segundos de simulación de carga
}

// Simulación de descarga
function downloadDocument(docId) {
    const doc = savedDocuments.find(d => d.id === docId);
    if (doc) {
        let content = `Título: ${doc.title}\nTipo: ${doc.type}\nFecha: ${doc.timestamp}\n\nContenido:\n${doc.content}`;
        alert(`Simulando descarga de .${doc.type} (El contenido es el siguiente):\n\n${content}`);
    }
}


// --- FUNCIONES DE CHAT Y RENDERIZADO ---

function toggleSourceDropdown(element) {
    const dropdown = element.querySelector('.source-dropdown');
    document.querySelectorAll('.source-dropdown').forEach(d => {
        if (d !== dropdown) d.style.display = 'none';
    });
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function createSourceBar(sources) {
    // Lógica para crear la barra de fuentes
    if (!sources || sources.length === 0) return '';
    let html = '<div class="sources-container">';
    const visibleSources = sources.slice(0, 1);
    const hiddenSources = sources.slice(1);

    visibleSources.forEach(source => {
        let sourceName = source.name || (source.url ? new URL(source.url).hostname.replace(/(www\.)?/g, '') : 'Fuente');
        html += `<a href="${source.url}" target="_blank" class="source-item">${SOURCE_ICON_SVG} ${sourceName}</a>`;
    });

    if (hiddenSources.length > 0) {
        let dropdownItems = '';
        hiddenSources.forEach(source => {
            dropdownItems += `<a href="${source.url}" target="_blank" class="source-link">${source.name}</a>`;
        });
        
        html += `<div class="more-options" onclick="toggleSourceDropdown(this)">
                <span class="source-item">${DROPDOWN_ICON_SVG}${hiddenSources.length} más</span>
                <div class="source-dropdown">${dropdownItems}</div>
            </div>
        `;
    }

    html += '</div>';
    return html;
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
        // Elimina el par de mensajes (usuario y IA)
        if (userMessageIndex !== -1) {
             chat.messages.splice(userMessageIndex, 2); 
        } else {
             chat.messages.splice(messageIndex, 1);
        }
       
        saveHistory();
        renderChatWindow(chat.messages);
        buscar(); 
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
                    <svg class="stop-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#3B82F6"/><path d="M12 17L17 12L12 7V17Z" fill="white"/></svg>
                    Detuviste esta respuesta
                </div>
             `;
             msgElement.appendChild(stopNoticeContainer); 
             
        } else {
            const bubble = document.createElement('div');
            bubble.className = `message-bubble bubble-${msg.sender}`;
            
            let finalContent = msg.content;
            
            if (msg.sender === 'user' && msg.image) {
                finalContent = `<div class="user-image-container"><img src="${msg.image}" alt="Imagen subida" class="user-uploaded-image"></div>` + finalContent;
            }

            if (msg.sender === 'ia') {
                if (msg.sources && msg.sources.length > 0) {
                    const sourceBar = createSourceBar(msg.sources);
                    finalContent = sourceBar + finalContent;
                }
                
                // Muestra la barra de acciones solo si NO es un prompt de herramienta
                if (!msg.isToolPrompt && !msg.isToolResult) { 
                    const actionsBar = createActionsBar(currentChatId, index);
                    finalContent += actionsBar;
                }
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
    const image = uploadedImageBase64; 
    const normalizedQuery = query.toLowerCase();

    if (!query && !image) {
        alert("Por favor, escribe una consulta o sube una imagen.");
        return;
    }

    // 1. LÓGICA DE HERRAMIENTAS: Si estamos en modo herramienta, creamos el documento
    if (isToolMode && currentTool) {
        const userMessage = { 
            sender: 'user', 
            content: query, 
            image: null
        };
        history[currentChatId].messages.push(userMessage);
        renderChatWindow(history[currentChatId].messages);
        searchInput.value = ''; // Limpiar input después del usuario
        removeImage();

        createStyledDocument(query);
        return; // Salimos de la función sin contactar al servidor
    }


    // 2. Ejecución Normal (Chat/Análisis de Imagen)
    
    // Añadir el mensaje del USUARIO al historial
    const userMessage = { 
        sender: 'user', 
        content: query || "Consulta de imagen sin texto", 
        image: image 
    };
    history[currentChatId].messages.push(userMessage);
    
    let iaContent = '';
    let textToRead = '';
    let sources = []; 
    let isCustomResponse = false; 

    // Reiniciamos la barra de entrada y la vista previa inmediatamente
    removeImage();
    searchInput.value = '';

    // Lógica de Respuestas PERSONALIZADAS (sin servidor)
    if (!image && (normalizedQuery.includes('que hace') || normalizedQuery.includes('pacure ia'))) {
        isCustomResponse = true;
        iaContent = `<h3 class="result-title">PACURE IA: ¿Qué Hago?</h3><p class="result-text">Soy PACURE IA, un asistente de chat. **Puedes preguntarme sobre cualquier tema, o usar el botón (+) para crear apuntes Word o Excel** y también puedo analizar imágenes que subas.</p>`;
        textToRead = "Soy PACURE IA, un asistente de chat.";
    } 
    // Si no es respuesta personalizada, contactar al servidor
    else {
        try {
            const response = await fetch('/buscar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query, image: image }) 
            });
            
            const data = await response.json();
            
            if (response.ok && data.text) {
                sources = data.external_sources || [];
                iaContent = `
                    <div class="result-header">
                        <h3 class="result-title">${data.title}</h3>
                    </div>
                    <p class="result-text">${data.text}</p>
                    ${data.url !== '#' && data.url ? `<a href="${data.url}" target="_blank" class="result-link">Ver fuente completa →</a>` : ''}
                `;
                textToRead = `${data.title}. El resumen es: ${data.text}`;
            } else {
                iaContent = `<p class="error-text">❌ ${data.error || 'Error desconocido al buscar o error de servidor.'}</p>`;
                textToRead = "Hubo un error al buscar la información.";
            }
            
        } catch (err) {
            iaContent = '<p class="error-text">⚠️ Error de conexión con el servidor.</p>';
            textToRead = "Error de conexión con el servidor.";
        }
    }
    
    // 3. Generar y mostrar la respuesta de la IA
    const iaMessage = { 
        sender: 'ia', 
        content: iaContent, 
        stopped: false, 
        sources: sources 
    };
    history[currentChatId].messages.push(iaMessage);
    
    speakText(textToRead);
    renderChatWindow(history[currentChatId].messages);
    renderHistoryList(); 
    saveHistory(); 
}


// --- LISTENERS DE EVENTOS ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Lógica de Sidebar y Búsqueda
    document.getElementById('menuToggle').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const wrapper = document.getElementById('mainContentWrapper');
        const menuToggle = document.getElementById('menuToggle');
        
        const isOpen = sidebar.classList.toggle('open');
        wrapper.classList.toggle('sidebar-open', isOpen);
        menuToggle.classList.toggle('sidebar-open', isOpen);

        menuToggle.innerHTML = isOpen ? 
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; 
    });
    
    document.getElementById('searchBtn').addEventListener('click', buscar);
    
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscar();
        }
    });
    
    // Listener para el botón "¿Qué hora es?" (simulación de quick query)
    const quickQueryBtn = document.getElementById('quickQueryBtn');
    if (quickQueryBtn) {
        quickQueryBtn.addEventListener('click', () => {
             document.getElementById('searchInput').value = '¿Qué hora es?';
             buscar();
        });
    }

    // LISTENERS PARA IMAGEN
    const imageInput = document.getElementById('imageInput');
    const uploadBtn = document.getElementById('uploadImageBtn');
    const removeBtn = document.getElementById('removeImageBtn');

    uploadBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', handleImageUpload);
    removeBtn.addEventListener('click', removeImage);

    // LÓGICA DE HERRAMIENTAS
    const toolsBtn = document.getElementById('toolsBtn');
    const toolsMenu = document.getElementById('toolsMenu');
    
    toolsBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic propague y cierre el menú inmediatamente
        toggleToolsMenu();
    });
    
    toolsMenu.querySelectorAll('.tool-option').forEach(option => {
        option.addEventListener('click', () => {
            selectTool(option.getAttribute('data-tool'));
        });
    });
    
    // Ocultar menú si el usuario hace clic fuera de la barra de búsqueda o el menú
    document.addEventListener('click', (e) => {
        const searchGroup = document.querySelector('.search-group');
        if (!toolsBtn.contains(e.target) && !toolsMenu.contains(e.target) && !searchGroup.contains(e.target) && !toolsMenu.classList.contains('hidden')) {
            toolsMenu.classList.add('hidden');
        }
    });

    // Listener para detener TTS
    const stopBtn = document.getElementById('stopSpeakerBtn');
    if (stopBtn) stopBtn.addEventListener('click', () => stopSpeaking(true));
});
