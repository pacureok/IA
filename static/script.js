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
    const httpsAiBtn = document.getElementById('httpsAiBtn');
    
    // Menús contextuales
    const historyOptionsMenu = document.getElementById('historyOptionsMenu');
    const toolsMenu = document.getElementById('toolsMenu');
    
    // Elementos de la barra de búsqueda
    const multiUploadBtn = document.getElementById('multiUploadBtn');
    const multiFileInput = document.getElementById('multiFileInput');
    const toolsBtn = document.getElementById('toolsBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');

    // ============================================================
    // 2. ESTRUCTURA DE DATOS
    // ============================================================
    let currentChatId = null;
    let chats = [
        { 
            id: 1, 
            title: "Plan de Marketing Digital", 
            messages: [
                { type: 'user', text: "Dame un plan de marketing para mi canal de YouTube." },
                { 
                    type: 'ia', 
                    text: "Un excelente plan para un canal de YouTube debe centrarse en la creación de contenido de alta calidad y la optimización SEO. 🚀 ¡A crecer! 😄", 
                    imageTopic: "marketing digital",
                    sources: ["youtube.com", "blogmarketing.net", "seo-tools.org"]
                }
            ]
        },
    ];

    // ============================================================
    // 3. FUNCIONES DE MANEJO DE VISTAS
    // ============================================================

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        mainContentWrapper.classList.toggle('sidebar-open');
    }

    function loadHistory() {
        historyList.innerHTML = '';
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.chatId = chat.id;
            item.innerHTML = `
                <span>${chat.title.substring(0, 25)}${chat.title.length > 25 ? '...' : ''}</span>
                <button class="chat-options-dots" aria-label="Opciones de chat"></button>
            `;
            
            item.querySelector('span').addEventListener('click', () => {
                loadChat(chat.id);
                if (window.innerWidth <= 1024) { 
                    toggleSidebar(); 
                }
            });

            item.querySelector('.chat-options-dots').addEventListener('click', (e) => {
                e.stopPropagation(); 
                showHistoryMenu(e.currentTarget, chat.id);
            });

            historyList.appendChild(item);
        });
        
        if (chats.length > 0 && currentChatId === null) {
            loadChat(chats[chats.length - 1].id);
        }
    }

    function showHistoryMenu(buttonElement, chatId) {
        historyOptionsMenu.dataset.chatId = chatId;
        const rect = buttonElement.getBoundingClientRect();
        
        historyOptionsMenu.style.top = `${rect.bottom + 5}px`;
        historyOptionsMenu.style.left = `${rect.right - historyOptionsMenu.offsetWidth}px`;

        historyOptionsMenu.classList.remove('hidden');
    }
    
    function loadChat(chatId) {
        currentChatId = chatId;
        const chat = chats.find(c => c.id === chatId);

        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.chatId) === chatId) {
                item.classList.add('active');
            }
        });
        
        chatWindow.innerHTML = '';
        
        if (!chat || chat.messages.length === 0) {
            chatWindow.innerHTML = `<h1 class="main-title">Hola, <span class="user-name">YouTuber pacure</span></h1>`;
            return;
        }

        chat.messages.forEach(msg => {
            appendMessage(msg);
        });
        
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function appendMessage(msg) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-${msg.type}`;

        const textElement = document.createElement('p');
        textElement.innerHTML = msg.text.replace(/\n/g, '<br>');
        messageDiv.appendChild(textElement);

        if (msg.type === 'ia') {
            
            // Lógica para el Reproductor de Música
            if (msg.musicUrl) {
                appendMusicPlayer(msg.musicUrl, messageDiv);
            }
            
            // Lógica para mostrar imagen (simulada)
            if (msg.imageTopic) {
                fetchAndDisplayImage(msg.imageTopic, messageDiv); 
            }
            
            // Lógica para mostrar Fuentes Consultadas
            if (msg.sources && msg.sources.length > 0) {
                const sourcesDiv = document.createElement('div');
                sourcesDiv.className = 'ia-sources';
                sourcesDiv.innerHTML = `
                    <div class="ia-sources-icons">
                        ${msg.sources.map(s => `<img src="https://www.google.com/s2/favicons?domain=${s}&sz=32" alt="${s.substring(0, s.indexOf('.'))}">`).join('')}
                    </div>
                    Fuentes consultadas
                    <svg class="expand-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15L17 10H7L12 15Z" fill="currentColor"/></svg>
                `;
                messageDiv.appendChild(sourcesDiv);
            }
            
            // Simulación de acciones de IA (Botones de Reacción)
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'ia-actions';
            actionsDiv.innerHTML = `
                 <button class="action-btn" title="Respuesta correcta"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 13.5L10.5 17L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                 <button class="action-btn" title="Rehacer"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 2V8M21.5 8H15.5M21.5 8C19.0348 4.3986 15.176 2 11 2C5.47715 2 1 6.47715 1 12C1 17.5228 5.47715 22 11 22C15.9392 22 20.0461 18.2575 21.0969 13.4357" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                 <button class="action-btn" title="Copiar respuesta"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 6H6C4.89543 6 4 6.89543 4 8V20C4 21.1046 4.89543 22 6 22H16C17.1046 22 18 21.1046 18 20V16M16 2V10M16 10H8V16H16V10ZM16 10L20 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            `;
            messageDiv.appendChild(actionsDiv);
        }

        chatWindow.appendChild(messageDiv);
    }

    function appendMusicPlayer(musicUrl, messageContainer) {
        const audioDiv = document.createElement('div');
        audioDiv.className = 'music-player';
        audioDiv.innerHTML = `
            <audio controls>
                <source src="${musicUrl}" type="audio/mpeg">
                Tu navegador no soporta el reproductor de audio.
            </audio>
            <a href="${musicUrl}" download="pacure_music.mp3" class="download-music-btn">Descargar MP3</a>
        `;
        messageContainer.appendChild(audioDiv);
    }
    
    function fetchAndDisplayImage(topic, messageContainer) {
        const imageUrl = topic.toLowerCase().includes('marketing') 
            ? "https://media.giphy.com/media/l4FGyFh1q5QO1xVp6/giphy.gif"
            : "https://via.placeholder.com/300x200.png?text=Imagen+relacionada+con+" + encodeURIComponent(topic); 
        
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = `Imagen relacionada con: ${topic}`;
        imageElement.className = 'chat-image';
        
        messageContainer.appendChild(imageElement);
    }

    // Envío de la consulta (REAL)
    async function handleNewQuery() {
        const query = searchInput.value.trim();
        if (!query) return;

        // 1. Recolección de archivos adjuntos (FormData)
        const formData = new FormData();
        formData.append('query', query);
        
        const filesInfo = [];
        if (multiFileInput.files.length > 0) {
            for (const file of multiFileInput.files) {
                // Adjunta el archivo real para el backend de Flask
                formData.append('files', file); 
                // Guarda info simple para el frontend (historial)
                filesInfo.push({ name: file.name, type: file.type, size: file.size }); 
            }
        }
        
        // 2. Determinar o crear el chat actual
        let chatToUpdate = chats.find(c => c.id === currentChatId);
        if (!chatToUpdate || chatToUpdate.messages.length === 0) {
            const newId = chats.length > 0 ? chats[chats.length - 1].id + 1 : 1;
            chatToUpdate = { id: newId, title: query.substring(0, 50), messages: [] };
            chats.push(chatToUpdate);
            loadHistory(); 
            loadChat(newId);
        }

        // 3. Agrega el mensaje del usuario
        chatToUpdate.messages.push({ type: 'user', text: query, files: filesInfo });
        
        // 4. Muestra mensaje de "escribiendo"
        const typingMessage = { type: 'ia', text: "PACURE IA está escribiendo... 🤖" };
        chatToUpdate.messages.push(typingMessage);
        loadChat(chatToUpdate.id);
        
        // 5. Llama al backend Flask
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData // Envía el FormData con query y archivos
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 6. Reemplaza el mensaje de tipeo con la respuesta real
            chatToUpdate.messages.pop(); 
            
            chatToUpdate.messages.push({ 
                type: 'ia', 
                text: data.text,
                imageTopic: data.imageTopic,
                sources: data.sources,
                musicUrl: data.musicUrl 
            });
            
        } catch (error) {
            console.error("Error al comunicarse con la IA:", error);
            chatToUpdate.messages.pop(); 
            chatToUpdate.messages.push({ type: 'ia', text: `Lo siento, el backend falló. Error: ${error.message}. Asegúrate de que Flask esté corriendo. 😥` });
        }
        
        // 7. Recarga la vista y limpia
        loadChat(chatToUpdate.id); 
        searchInput.value = '';
        clearFileInput();
    }

    function clearFileInput() {
        multiFileInput.value = ''; 
        previewContainer.classList.add('hidden');
        fileNameDisplay.textContent = '';
        imagePreview.src = '';
    }

    // ============================================================
    // 4. MANEJO DE EVENTOS DEL DOM
    // ============================================================

    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOptionsBtn.addEventListener('click', toggleSidebar); 
    newChatBtn.addEventListener('click', () => {
        const newId = chats.length > 0 ? chats[chats.length - 1].id + 1 : 1;
        const newChat = { id: newId, title: "Nueva Conversación", messages: [] };
        chats.push(newChat);
        loadHistory();
        loadChat(newId);
    });
    
    // Botón HTTPS AI
    httpsAiBtn.addEventListener('click', () => {
        alert("Redirigiendo a la página de Solicitudes HTTPS AI. Aquí puedes interactuar con la IA mediante peticiones estructuradas (Subpágina sin interfaz de chat).");
        // En una app real: window.location.href = '/https-ai-interface'; 
    });

    searchBtn.addEventListener('click', handleNewQuery);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleNewQuery();
        }
    });

    document.addEventListener('click', (event) => {
        if (!toolsMenu.contains(event.target) && event.target !== toolsBtn) {
            toolsMenu.classList.add('hidden');
        }
        if (!historyOptionsMenu.contains(event.target) && !event.target.closest('.chat-options-dots')) {
            historyOptionsMenu.classList.add('hidden');
        }
    });

    historyOptionsMenu.addEventListener('click', (e) => {
        const option = e.target.closest('.menu-option');
        const chatId = historyOptionsMenu.dataset.chatId;
        if (!option) return;

        const action = option.textContent.trim();
        const chat = chats.find(c => c.id == chatId);
        
        alert(`Simulando acción: "${action}" en chat: ${chat.title}`);
        
        if (action === "Borrar") {
            chats = chats.filter(c => c.id != chatId);
            loadHistory();
            loadChat(chats.length > 0 ? chats[chats.length - 1].id : null);
        }
        historyOptionsMenu.classList.add('hidden');
    });

    toolsBtn.addEventListener('click', function(e) {
        e.stopPropagation(); 
        
        toolsMenu.classList.toggle('hidden');
        
        if (!toolsMenu.classList.contains('hidden')) {
             const rect = toolsBtn.getBoundingClientRect();
             toolsMenu.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; 
             toolsMenu.style.left = (rect.left) + 'px';
             toolsMenu.style.transform = 'none';
        }
    });
    
    // Manejo de las opciones del menú Herramientas
    toolsMenu.addEventListener('click', (e) => {
        const option = e.target.closest('.tool-option');
        if (!option) return;

        const tool = option.dataset.tool;
        
        if (tool === 'upload-single-image') {
            multiFileInput.setAttribute('accept', 'image/*');
            multiFileInput.click();
        } else if (tool === 'music') {
            searchInput.value = "Crea una música electrónica alegre de 15 segundos.";
            searchInput.focus();
        } else if (tool === 'canvas') {
             searchInput.value = "Diseña un diagrama de flujo para la aprobación de documentos.";
             searchInput.focus();
        } else if (tool === 'excel-word') {
             searchInput.value = "Genera un resumen ejecutivo de un documento de texto para proyecto Word.";
             searchInput.focus();
        }
        toolsMenu.classList.add('hidden');
    });

    multiUploadBtn.addEventListener('click', function() {
        multiFileInput.setAttribute('accept', 'image/*, application/pdf, .doc, .docx, .xls, .xlsx'); 
        multiFileInput.click();
    });

    multiFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            previewContainer.classList.remove('hidden');
            
            const file = this.files[0];
            const otherCount = this.files.length > 1 ? ` (+${this.files.length - 1} archivos)` : '';
            fileNameDisplay.textContent = file.name + otherCount;

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.src = 'https://via.placeholder.com/40x40.png?text=DOC';
            }
            
        } else {
            clearFileInput();
        }
    });

    removeImageBtn.addEventListener('click', clearFileInput);
    
    // ============================================================
    // 5. INICIALIZACIÓN
    // ============================================================
    loadHistory(); 
});
