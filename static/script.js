// script.js

document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // 1. ELEMENTOS DEL DOM
    // ============================================================
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const sidebarOptionsBtn = document.getElementById('sidebarOptionsBtn');
    const mainContentWrapper = document.getElementById('mainContentWrapper');
    const newChatBtn = document.getElementById('newChatBtn');
    const historyList = document.getElementById('historyList');
    const chatWindow = document.getElementById('chatWindow');
    
    // Menús contextuales
    const historyOptionsMenu = document.getElementById('historyOptionsMenu');
    const toolsMenu = document.getElementById('toolsMenu');
    
    // Elementos de la barra de búsqueda
    const multiUploadBtn = document.getElementById('multiUploadBtn'); // Se mantiene pero no se usa la lógica
    const multiFileInput = document.getElementById('multiFileInput'); // Se mantiene pero no se usa la lógica
    const toolsBtn = document.getElementById('toolsBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const previewContainer = document.getElementById('imagePreviewContainer'); // Se mantiene pero no se usa la lógica
    const fileNameDisplay = document.getElementById('fileNameDisplay'); // Se mantiene pero no se usa la lógica
    const imagePreview = document.getElementById('imagePreview'); // Se mantiene pero no se usa la lógica
    const removeImageBtn = document.getElementById('removeImageBtn'); // Se mantiene pero no se usa la lógica
    const ttsFloatingBtn = document.getElementById('ttsFloatingBtn');
    
    // Estado
    let currentChatId = `chat-${Date.now()}`;
    let chatHistory = loadHistory(currentChatId);
    let isAwaitingResponse = false;

    // ============================================================
    // 2. UTILIDADES
    // ============================================================

    function loadHistory(chatId = null) {
        // Carga la historia de localStorage o la inicializa
        if (chatId) {
            currentChatId = chatId;
        }
        chatHistory = JSON.parse(localStorage.getItem(currentChatId) || '[]');
        renderHistoryList();
        renderChatWindow();
        return chatHistory;
    }

    function saveHistory() {
        localStorage.setItem(currentChatId, JSON.stringify(chatHistory));
        renderHistoryList();
    }
    
    function newChat() {
        currentChatId = `chat-${Date.now()}`;
        chatHistory = [];
        saveHistory();
        renderChatWindow();
        searchInput.value = '';
    }

    function generateChatTitle(query) {
        // Genera un título simple para el historial a partir de la primera pregunta.
        const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
        return title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Nuevo Chat';
    }

    function clearFileInput() {
        // Función de limpieza de archivos (ya no usada, pero se mantiene para evitar errores si el HTML llama al evento)
        multiFileInput.value = '';
        previewContainer.classList.add('hidden');
        imagePreview.src = '';
        fileNameDisplay.textContent = '';
        // La lógica de la IA ya no necesita saber sobre archivos.
    }

    // ============================================================
    // 3. RENDERIZADO
    // ============================================================

    function renderHistoryList() {
        historyList.innerHTML = '';
        
        // Obtener todas las claves del historial y ordenarlas por fecha
        const historyKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('chat-'))
            .sort((a, b) => parseInt(b.split('-')[1]) - parseInt(a.split('-')[1]));

        historyKeys.forEach(key => {
            const historyData = JSON.parse(localStorage.getItem(key));
            if (historyData.length > 0) {
                const query = historyData[0].content;
                const title = historyData[0].title || generateChatTitle(query);
                
                const listItem = document.createElement('li');
                listItem.className = `history-item ${key === currentChatId ? 'active' : ''}`;
                listItem.dataset.chatId = key;
                listItem.innerHTML = `
                    <span class="chat-title">${title}</span>
                    <button class="delete-chat-btn" data-chat-id="${key}" aria-label="Eliminar chat">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                `;
                listItem.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-chat-btn')) {
                        loadHistory(key);
                    }
                });
                historyList.appendChild(listItem);
            }
        });
    }

    function renderChatWindow() {
        chatWindow.innerHTML = '';
        if (chatHistory.length === 0) {
            chatWindow.innerHTML = `
                <div class="welcome-message">
                    <h1>🎵 Generador Musical PACURE IA</h1>
                    <p>Hola! Soy tu asistente de composición. Para crear música, usa el siguiente comando:</p>
                    <p class="syntax-example">**Quiero musica del genero [Género] [Duración]**</p>
                    <p class="syntax-details">Ejemplo: <code class="inline-code">Quiero musica del genero Pop 5m</code></p>
                </div>
            `;
            return;
        }

        chatHistory.forEach(message => {
            const messageDiv = createMessageElement(message.role, message.content, message.sources);
            chatWindow.appendChild(messageDiv);
        });

        // Asegura que siempre se desplace hacia abajo después de renderizar
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function createMessageElement(role, content, sources) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message`;
        
        // Icono
        const icon = role === 'user' ? 
            `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C14 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/></svg>` : 
            `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM15.5 12.5H12V16.5H10V10.5H15.5V12.5Z" fill="currentColor"/></svg>`;
        
        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = 'message-content';
        
        // Reemplazar markdown simple (simulación)
        let htmlContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // negritas
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // cursivas
            .replace(/\n/g, '<br>'); // saltos de línea

        // Manejar el caso de URLs de descarga
        const downloadUrlMatch = htmlContent.match(/URL de Descarga(?: \(MIDI\))?: (https?:\/\/[^\s<]+)/);
        if (downloadUrlMatch) {
            const url = downloadUrlMatch[1];
            htmlContent = htmlContent.replace(
                downloadUrlMatch[0],
                `<br><a href="${url}" target="_blank" class="download-link">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M12 16V4M12 16L15 13M12 16L9 13M20 16V20H4V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Descargar Archivo MIDI
                </a>`
            );
        }

        messageContentDiv.innerHTML = htmlContent;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'message-icon';
        iconContainer.innerHTML = icon;

        messageDiv.appendChild(iconContainer);
        messageDiv.appendChild(messageContentDiv);
        
        // Manejo de fuentes/enlaces
        if (role !== 'user' && sources && sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'message-sources';
            
            // Si el primer source es una URL de descarga, no mostramos "Fuentes" genéricas
            if (!downloadUrlMatch) {
                 const uniqueSources = [...new Set(sources)].slice(0, 3); // Limita a 3 fuentes únicas
                 sourcesDiv.innerHTML = '<span class="sources-title">Fuentes:</span> ' +
                    uniqueSources.map(src => `<a href="${src}" target="_blank" rel="noopener noreferrer">${new URL(src).hostname}</a>`).join(', ');
                 messageContentDiv.appendChild(sourcesDiv);
            }
        }

        return messageDiv;
    }
    
    // ============================================================
    // 4. ENVÍO DE MENSAJES (LÓGICA CENTRAL)
    // ============================================================

    async function sendMessage() {
        if (isAwaitingResponse) return;

        const query = searchInput.value.trim();
        // const file = multiFileInput.files[0]; // **IGNORADO EN ESTA VERSIÓN**
        
        if (!query) {
            alert("Por favor, introduce un comando musical."); // Usamos alert para simular el mensaje de error, aunque se recomienda un modal personalizado.
            return;
        }

        isAwaitingResponse = true;
        searchInput.disabled = true;
        searchBtn.disabled = true;

        // 1. Mostrar mensaje del usuario
        if (chatHistory.length === 0) {
            chatHistory.push({ role: 'user', content: query, title: generateChatTitle(query) });
        } else {
            chatHistory.push({ role: 'user', content: query });
        }
        
        // 2. Mostrar mensaje de carga de la IA
        const loadingMessage = { role: 'ai', content: "Generando música, por favor espera...", sources: [] };
        chatHistory.push(loadingMessage);
        renderChatWindow();
        saveHistory();
        
        // 3. Crear FormData para el backend (solo texto, aunque use FormData)
        const formData = new FormData();
        formData.append('query', query);
        
        // **IGNORAMOS LA LÓGICA DE ARCHIVOS**
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.text || 'Error desconocido del servidor');
            }

            const data = await response.json();
            
            // 4. Actualizar el último mensaje con la respuesta real
            chatHistory.pop(); // Elimina el mensaje de carga
            chatHistory.push({ 
                role: 'ai', 
                content: data.text, 
                sources: data.sources || [], 
                imageTopic: data.imageTopic 
            });

            // 5. Limpieza y guardado
            searchInput.value = '';
            // clearFileInput(); // **IGNORADO EN ESTA VERSIÓN**
            renderChatWindow();
            saveHistory();

        } catch (error) {
            console.error('Error en la comunicación con el backend:', error);
            // 4. Actualizar el último mensaje con el error
            chatHistory.pop(); // Elimina el mensaje de carga
            chatHistory.push({ 
                role: 'ai', 
                content: `**[ERROR]** No pude generar la música. ${error.message || 'Verifica la consola para más detalles.'}`, 
                sources: ["pacureia.dev/error"],
                imageTopic: "error"
            });
            renderChatWindow();
            saveHistory();
        } finally {
            isAwaitingResponse = false;
            searchInput.disabled = false;
            searchBtn.disabled = false;
            searchInput.focus();
        }
    }

    // ============================================================
    // 5. MANEJADORES DE EVENTOS
    // ============================================================

    // Toggle de la barra lateral en móvil
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mainContentWrapper.classList.toggle('pushed');
    });

    // Cerrar barra lateral al hacer clic en el botón de opciones (para móviles)
    sidebarOptionsBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mainContentWrapper.classList.remove('pushed');
    });

    // Enviar mensaje con el botón de búsqueda
    searchBtn.addEventListener('click', sendMessage);

    // Enviar mensaje al presionar Enter en el input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    // Nueva conversación
    newChatBtn.addEventListener('click', newChat);
    
    // Abrir/Cerrar menú de historial
    historyOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        historyOptionsMenu.classList.toggle('hidden');
    });

    // Eliminar historial
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
            Object.keys(localStorage).filter(key => key.startsWith('chat-')).forEach(key => {
                localStorage.removeItem(key);
            });
            newChat();
            historyOptionsMenu.classList.add('hidden');
        }
    });

    // Eliminar chat individual
    historyList.addEventListener('click', (e) => {
        if (e.target.closest('.delete-chat-btn')) {
            const chatIdToDelete = e.target.closest('.delete-chat-btn').dataset.chatId;
            if (confirm('¿Estás seguro de que quieres eliminar este chat?')) {
                localStorage.removeItem(chatIdToDelete);
                if (chatIdToDelete === currentChatId) {
                    newChat();
                } else {
                    renderHistoryList();
                }
            }
        }
    });

    // Cerrar menús contextuales al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!historyOptionsBtn.contains(e.target) && !historyOptionsMenu.contains(e.target)) {
            historyOptionsMenu.classList.add('hidden');
        }
        if (!toolsBtn.contains(e.target) && !toolsMenu.contains(e.target)) {
            toolsMenu.classList.add('hidden');
        }
    });

    // Abrir/Cerrar menú de herramientas rápidas
    toolsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toolsMenu.classList.toggle('hidden');
    });

    // Manejar clics en el menú de herramientas rápidas
    toolsMenu.addEventListener('click', (e) => {
        const queryType = e.target.dataset.queryType;
        if (queryType === 'music') {
            searchInput.value = "Quiero musica del genero Pop 5m";
            searchInput.focus();
        } else if (queryType === 'help') {
             searchInput.value = "Ayuda de Sintaxis";
             searchInput.focus();
        }
        toolsMenu.classList.add('hidden');
    });

    // **IGNORAMOS la lógica de manejo de archivos de la interfaz**
    // multiUploadBtn.addEventListener('click', function() { ... });
    // multiFileInput.addEventListener('change', function() { ... });
    removeImageBtn.addEventListener('click', clearFileInput);
    
    // ============================================================
    // 6. INICIALIZACIÓN
    // ============================================================
    loadHistory(); 
});
