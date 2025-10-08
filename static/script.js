document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // 1. ELEMENTOS DEL DOM
    // ============================================================
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const sidebarOptionsBtn = document.getElementById('sidebarOptionsBtn'); // Botón de 3 puntos en la cabecera del sidebar
    const mainContentWrapper = document.getElementById('mainContentWrapper');
    const newChatBtn = document.getElementById('newChatBtn');
    const historyList = document.getElementById('historyList');
    const chatWindow = document.getElementById('chatWindow');
    
    // Menús contextuales
    const historyOptionsMenu = document.getElementById('historyOptionsMenu');
    const toolsMenu = document.getElementById('toolsMenu');
    
    // Elementos de la barra de búsqueda
    const multiUploadBtn = document.getElementById('multiUploadBtn'); // Botón '+'
    const multiFileInput = document.getElementById('multiFileInput'); // Input para 10 archivos
    const toolsBtn = document.getElementById('toolsBtn'); // Botón "Herramientas"
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');

    // ============================================================
    // 2. ESTRUCTURA DE DATOS (Simulación de historial y chat)
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
                    text: "Un excelente plan para un canal de YouTube debe centrarse en la creación de contenido de alta calidad y la optimización SEO. Los pilares son: 1. Investigación de Palabras Clave. 2. Calendario Editorial Consistente. 3. Promoción Cruzada en redes. 🚀 ¡A crecer! 😄", 
                    imageTopic: "marketing digital",
                    sources: ["youtube.com", "blogmarketing.net", "seo-tools.org"]
                }
            ]
        },
        // ... otros chats iniciales
    ];

    // ============================================================
    // 3. FUNCIONES DE MANEJO DE VISTAS
    // ============================================================

    // Maneja la apertura y cierre de la barra lateral (Botón de 3 puntos arriba)
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        mainContentWrapper.classList.toggle('sidebar-open');
    }

    // Carga los elementos del historial en la barra lateral con los 3 puntos
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
            
            // Evento para cargar el chat al hacer clic en el nombre (subpágina)
            item.querySelector('span').addEventListener('click', () => {
                loadChat(chat.id);
                if (window.innerWidth <= 1024) { // Cierra la sidebar en móvil/tablet
                    toggleSidebar(); 
                }
            });

            // Evento para el menú contextual de opciones (3 puntos)
            item.querySelector('.chat-options-dots').addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se dispare el evento de cargar chat
                showHistoryMenu(e.currentTarget, chat.id);
            });

            historyList.appendChild(item);
        });
        
        // Carga el chat más reciente por defecto
        if (chats.length > 0 && currentChatId === null) {
            loadChat(chats[chats.length - 1].id);
        }
    }

    // Muestra el menú contextual de opciones de un chat específico
    function showHistoryMenu(buttonElement, chatId) {
        historyOptionsMenu.dataset.chatId = chatId;
        const rect = buttonElement.getBoundingClientRect();
        
        // Posicionar el menú debajo y a la izquierda del botón
        historyOptionsMenu.style.top = `${rect.bottom + 5}px`;
        historyOptionsMenu.style.left = `${rect.right - historyOptionsMenu.offsetWidth}px`;

        historyOptionsMenu.classList.remove('hidden');
    }
    
    // Carga y muestra una conversación específica (simulando subpágina)
    function loadChat(chatId) {
        currentChatId = chatId;
        const chat = chats.find(c => c.id === chatId);

        // Actualiza el historial activo
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.chatId) === chatId) {
                item.classList.add('active');
            }
        });
        
        // Limpia y carga los mensajes en la ventana de chat
        chatWindow.innerHTML = '';
        
        if (!chat || chat.messages.length === 0) {
            chatWindow.innerHTML = `<h1 class="main-title">Hola, <span class="user-name">YouTuber pacure</span></h1>`;
            return;
        }

        chat.messages.forEach(msg => {
            appendMessage(msg);
        });
        
        // Desplazarse al final
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Agrega un mensaje al DOM
    function appendMessage(msg) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-${msg.type}`;

        const textElement = document.createElement('p');
        textElement.innerHTML = msg.text.replace(/\n/g, '<br>'); // Respeta saltos de línea
        messageDiv.appendChild(textElement);

        if (msg.type === 'ia') {
            // Lógica para mostrar imagen (si existe)
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

    // Simula la búsqueda de imágenes (PNG o GIF) - REAL: Esto llamaría al backend
    function fetchAndDisplayImage(topic, messageContainer) {
        const imageUrl = topic.toLowerCase().includes('marketing') 
            ? "https://media.giphy.com/media/l4FGyFh1q5QO1xVp6/giphy.gif" // Ejemplo de GIF
            : "https://via.placeholder.com/300x200.png?text=Imagen+relacionada+con+" + encodeURIComponent(topic); // Ejemplo de PNG
        
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = `Imagen relacionada con: ${topic}`;
        imageElement.className = 'chat-image';
        
        messageContainer.appendChild(imageElement);
    }
    
    // Simula el envío de una nueva pregunta al backend
    async function handleNewQuery() {
        const query = searchInput.value.trim();
        if (!query) return;

        // 1. Manejo de archivos adjuntos (simulado)
        let files = [];
        if (multiFileInput.files.length > 0) {
            files = Array.from(multiFileInput.files).map(file => ({
                name: file.name,
                type: file.type,
                size: file.size
            }));
            // En una app real, aquí se enviarían los archivos al servidor
            console.log("Archivos listos para enviar:", files);
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

        // 3. Agrega el mensaje del usuario (antes de la respuesta de la IA)
        chatToUpdate.messages.push({ type: 'user', text: query, files: files });
        loadChat(chatToUpdate.id);

        // 4. Simulación de la llamada al backend Flask
        try {
            // **REAL**: Aquí se haría un 'fetch' a tu endpoint Flask (ej: /api/chat)
            // const response = await fetch('/api/chat', { ... });
            // const data = await response.json();
            
            // **SIMULACIÓN** de la respuesta de la IA
            const simulatedResponse = {
                text: await simulateIaResponse(query),
                imageTopic: query.includes('matemática') ? 'cálculo' : (query.includes('youtube') ? 'marketing' : 'información'),
                sources: ["pacureia.dev", "google.com", "wikipedia.org"],
                toolUsed: query.includes('excel') ? 'excel-word' : null 
            };
            
            // 5. Agrega la respuesta de la IA
            chatToUpdate.messages.push({ 
                type: 'ia', 
                text: simulatedResponse.text,
                imageTopic: simulatedResponse.imageTopic,
                sources: simulatedResponse.sources
            });
            
        } catch (error) {
            console.error("Error al comunicarse con la IA:", error);
            chatToUpdate.messages.push({ type: 'ia', text: "Lo siento, hubo un error al procesar tu solicitud. 😥" });
        }
        
        // 6. Recarga la vista y limpia
        loadChat(chatToUpdate.id); 
        searchInput.value = '';
        clearFileInput();
    }
    
    // Simulación de respuesta de IA (Para evitar llamadas en el frontend)
    async function simulateIaResponse(query) {
        let text = `¡Hola! Entiendo que quieres saber sobre: "${query}". Aquí está mi respuesta simulada con emojis: 👍 `;
        if (query.includes('matemática') || query.includes('cálculo')) {
            text += `Para la parte de matemática, usé el módulo especial. El resultado de 5 + 3 es 8. 📐`;
        } else if (query.includes('youtube')) {
            text += `Un plan de YouTube incluye optimización SEO y calendario. 🗓️`;
        } else {
            text += `Toda la información ha sido analizada con éxito. ✨`;
        }
        return text;
    }

    // Limpia la vista previa y el input de archivo
    function clearFileInput() {
        multiFileInput.value = ''; 
        previewContainer.classList.add('hidden');
        fileNameDisplay.textContent = '';
        imagePreview.src = '';
    }

    // ============================================================
    // 4. MANEJO DE EVENTOS DEL DOM
    // ============================================================

    // Toggle de la barra lateral (Hamburguesa en móvil, 3 puntos en desktop)
    menuToggle.addEventListener('click', toggleSidebar);
    sidebarOptionsBtn.addEventListener('click', toggleSidebar); // Usamos el botón de 3 puntos para cerrar/abrir en móvil.

    // Botón de Nueva Conversación
    newChatBtn.addEventListener('click', () => {
        const newId = chats.length > 0 ? chats[chats.length - 1].id + 1 : 1;
        const newChat = { id: newId, title: "Nueva Conversación", messages: [] };
        chats.push(newChat);
        loadHistory();
        loadChat(newId);
    });

    // Manejar el envío de la consulta
    searchBtn.addEventListener('click', handleNewQuery);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleNewQuery();
        }
    });

    // --- Menú de Opciones del Historial (3 puntos en el chat item) ---
    
    // Evento genérico para cerrar menús flotantes al hacer clic fuera
    document.addEventListener('click', (event) => {
        // Cierra menú de herramientas
        if (!toolsMenu.contains(event.target) && event.target !== toolsBtn) {
            toolsMenu.classList.add('hidden');
        }
        // Cierra menú de opciones de historial
        if (!historyOptionsMenu.contains(event.target) && !event.target.closest('.chat-options-dots')) {
            historyOptionsMenu.classList.add('hidden');
        }
    });
    
    // Manejo de las opciones del History Menu (simulado)
    historyOptionsMenu.addEventListener('click', (e) => {
        const option = e.target.closest('.menu-option');
        const chatId = historyOptionsMenu.dataset.chatId;
        if (!option) return;

        const action = option.textContent.trim();
        const chat = chats.find(c => c.id == chatId);
        
        // **REAL**: Aquí harías una llamada a tu backend para persistir el cambio
        alert(`Simulando acción: "${action}" en chat: ${chat.title}`);
        
        if (action === "Borrar") {
            chats = chats.filter(c => c.id != chatId);
            loadHistory();
            loadChat(chats.length > 0 ? chats[chats.length - 1].id : null);
        }
        historyOptionsMenu.classList.add('hidden');
    });

    // --- Botón de Herramientas y Botón de Archivos ---

    // Muestra/Oculta el menú de Herramientas
    toolsBtn.addEventListener('click', function(e) {
        e.stopPropagation(); 
        
        toolsMenu.classList.toggle('hidden');
        
        if (!toolsMenu.classList.contains('hidden')) {
             // Posicionar el menú arriba del botón Herramientas
             const rect = toolsBtn.getBoundingClientRect();
             toolsMenu.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; 
             toolsMenu.style.left = (rect.left) + 'px'; // Alinear a la izquierda del botón
             toolsMenu.style.transform = 'none'; // Sin transformación de centrado
        }
    });
    
    // Manejo de las opciones del menú Herramientas (simulado)
    toolsMenu.addEventListener('click', (e) => {
        const option = e.target.closest('.tool-option');
        if (!option) return;

        const tool = option.dataset.tool;
        
        if (tool === 'upload-single-image') {
            // Simular el clic en el input de archivo, pero solo permitiendo imágenes (para este caso)
            multiFileInput.setAttribute('accept', 'image/*');
            multiFileInput.click();
        } else {
             // **REAL**: Aquí se podría enviar un mensaje predeterminado al chat o abrir un modal
            alert(`Simulando inicio de proyecto: ${tool}.`);
        }
        toolsMenu.classList.add('hidden');
    });


    // Botón '+' (Multi Upload)
    multiUploadBtn.addEventListener('click', function() {
        multiFileInput.setAttribute('accept', 'image/*, application/pdf, .doc, .docx, .xls, .xlsx'); // Restablecer a todos los tipos
        multiFileInput.click();
    });

    // --- Manejo de la Vista Previa de Archivos ---

    multiFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            previewContainer.classList.remove('hidden');
            
            // Muestra el nombre y maneja la vista previa del primer archivo
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
                // Icono genérico para archivos no imagen (PDF, DOCX, etc.)
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
