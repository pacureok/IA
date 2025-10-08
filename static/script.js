document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // 1. ELEMENTOS DEL DOM
    // ============================================================
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebarBtn = document.querySelector('.close-sidebar-btn');
    const mainContentWrapper = document.getElementById('mainContentWrapper');
    const newChatBtn = document.getElementById('newChatBtn');
    const historyList = document.getElementById('historyList');
    const chatWindow = document.getElementById('chatWindow');
    
    // Elementos de la barra de búsqueda
    const toolsOrUploadBtn = document.getElementById('toolsOrUploadBtn');
    const fileInput = document.getElementById('fileInput');
    const toolsMenu = document.getElementById('toolsMenu');
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
                    text: "Un excelente plan para un canal de YouTube debe centrarse en la creación de contenido de alta calidad y la optimización SEO. Los pilares son: 1. Investigación de Palabras Clave. 2. Calendario Editorial Consistente. 3. Promoción Cruzada en redes.", 
                    imageTopic: "marketing digital" 
                }
            ]
        },
        { 
            id: 2, 
            title: "Ajuste de estilos CSS", 
            messages: [
                { type: 'user', text: "Cómo puedo reducir el tamaño de los emojis en CSS?" },
                { type: 'ia', text: "Puedes usar selectores CSS específicos o envolver tus emojis en una clase con un tamaño de fuente reducido, como `font-size: 1.2rem;` para evitar que hereden tamaños gigantes." }
            ]
        }
    ];

    // ============================================================
    // 3. FUNCIONES PRINCIPALES
    // ============================================================

    // Maneja la apertura y cierre de la barra lateral
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        mainContentWrapper.classList.toggle('sidebar-open');
    }

    // Carga los elementos del historial en la barra lateral
    function loadHistory() {
        historyList.innerHTML = '';
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.chatId = chat.id;
            item.innerHTML = `
                <span>${chat.title.substring(0, 25)}...</span>
                <button class="chat-options-dots">...</button>
            `;
            item.addEventListener('click', () => {
                loadChat(chat.id);
                // Cierra la sidebar en móvil después de seleccionar chat
                if (window.innerWidth <= 768) {
                    toggleSidebar(); 
                }
            });
            historyList.appendChild(item);
        });
        
        // Carga el último chat por defecto al iniciar
        if (chats.length > 0 && currentChatId === null) {
            loadChat(chats[0].id);
        }
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
        
        // Si es la conversación inicial (nueva), muestra el título de bienvenida
        if (chat.messages.length === 0) {
            chatWindow.innerHTML = `<h1 class="main-title">Hola, <span class="user-name">YouTuber pacure</span></h1>`;
            return;
        }

        chat.messages.forEach(msg => {
            appendMessage(msg);
        });
        
        // Desplazarse al final
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Agrega un mensaje al DOM y lo simula
    function appendMessage(msg) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-${msg.type}`;

        const textElement = document.createElement('p');
        textElement.innerHTML = msg.text; 
        messageDiv.appendChild(textElement);

        if (msg.type === 'ia' && msg.imageTopic) {
            // Lógica para buscar y mostrar la imagen
            fetchAndDisplayImage(msg.imageTopic, messageDiv);
            
            // Simulación de acciones de IA
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
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Simula la búsqueda de imágenes (PNG o GIF)
    function fetchAndDisplayImage(topic, messageContainer) {
        // En una implementación real de Flask/Python, esto llamaría a un API de búsqueda
        // Aquí, usamos una URL de ejemplo (un placeholder de imagen)
        
        // Simulación: Si el tema es 'marketing', usa un GIF, si no, usa un PNG
        const imageUrl = topic.toLowerCase().includes('marketing') 
            ? "https://media.giphy.com/media/l4FGyFh1q5QO1xVp6/giphy.gif" // Ejemplo de GIF
            : "https://via.placeholder.com/300x200.png?text=Imagen+relacionada+con+" + encodeURIComponent(topic); // Ejemplo de PNG

        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = `Imagen relacionada con: ${topic}`;
        imageElement.className = 'chat-image';
        
        // Agrega la imagen después del texto de la IA
        messageContainer.appendChild(imageElement);
    }
    
    // Simula el envío de una nueva pregunta
    function handleNewQuery() {
        const query = searchInput.value.trim();
        if (!query) return;

        // 1. Crear un nuevo chat si estamos en la vista inicial o si la conversación está vacía
        let chatToUpdate = chats.find(c => c.id === currentChatId);
        
        if (!chatToUpdate || chatToUpdate.messages.length === 0) {
            const newId = chats.length > 0 ? chats[chats.length - 1].id + 1 : 1;
            chatToUpdate = { 
                id: newId, 
                title: query.substring(0, 50), 
                messages: [] 
            };
            chats.push(chatToUpdate);
            loadHistory(); // Recarga la barra lateral con el nuevo chat
            loadChat(newId); // Carga el nuevo chat
        }

        // 2. Agrega el mensaje del usuario
        chatToUpdate.messages.push({ type: 'user', text: query });
        
        // 3. Simula la respuesta de la IA (¡Aquí es donde se integraría tu IA real!)
        // La IA real también devolvería el 'imageTopic' si fuera necesario.
        setTimeout(() => {
            chatToUpdate.messages.push({ 
                type: 'ia', 
                text: `¡Hola! Entiendo que quieres saber sobre: "${query}". Aquí está mi respuesta simulada.`,
                imageTopic: query.includes('youtube') ? 'youtube' : 'información'
            });
            loadChat(chatToUpdate.id); // Recarga la conversación
        }, 800); 

        // 4. Limpia la entrada
        searchInput.value = '';
        previewContainer.classList.add('hidden'); // Oculta la vista previa de imagen
        fileInput.value = ''; // Resetea el input de archivos
    }


    // ============================================================
    // 4. MANEJO DE EVENTOS
    // ============================================================

    // Toggle de la barra lateral (Botón de hamburguesa)
    menuToggle.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    
    // Manejar el envío de la consulta
    searchBtn.addEventListener('click', handleNewQuery);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleNewQuery();
        }
    });

    // --- Funcionalidad del Botón Herramientas/Upload (El '+') ---
    
    // Muestra/Oculta el menú de Herramientas Y abre el input de archivo
    toolsOrUploadBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Evita que el clic se propague y cierre el menú inmediatamente
        
        // Lógica para abrir el input de archivos al hacer clic en el botón '+'
        // Esto permite que el botón sirva para ambos propósitos
        fileInput.click();
        
        // Alternar el menú de Word/Excel
        toolsMenu.classList.toggle('hidden');
        
        if (!toolsMenu.classList.contains('hidden')) {
             // Posicionar el menú (copiado de CSS para el posicionamiento dinámico)
             const searchGroup = document.querySelector('.search-group');
             const rect = searchGroup.getBoundingClientRect();
             toolsMenu.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; 
             toolsMenu.style.left = (rect.left + rect.width / 2) + 'px';
             toolsMenu.style.transform = 'translateX(-50%)'; 
        }
    });

    // Cierra el menú de herramientas al hacer clic fuera
    document.addEventListener('click', (event) => {
        if (!toolsMenu.contains(event.target) && event.target !== toolsOrUploadBtn) {
            toolsMenu.classList.add('hidden');
        }
    });

    // --- Manejo de la Vista Previa de Archivos ---

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            previewContainer.classList.remove('hidden');
            
            // Muestra el nombre y maneja la vista previa de la primera imagen
            const file = this.files[0];
            fileNameDisplay.textContent = file.name;

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                // Si no es imagen (PDF, DOCX), muestra un icono genérico
                imagePreview.src = 'https://via.placeholder.com/40x40.png?text=FILE';
            }
            
        } else {
            previewContainer.classList.add('hidden');
        }
    });

    removeImageBtn.addEventListener('click', function() {
        fileInput.value = ''; 
        previewContainer.classList.add('hidden');
        fileNameDisplay.textContent = '';
    });
    
    // ============================================================
    // 5. INICIALIZACIÓN
    // ============================================================
    loadHistory(); 
});
