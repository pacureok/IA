document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos principales ---
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const mainContentWrapper = document.getElementById('mainContentWrapper');
    
    // --- Elementos de la barra de búsqueda ---
    const uploadBtn = document.getElementById('uploadImageBtn');
    const imageInput = document.getElementById('imageInput');
    const toolsMenu = document.getElementById('toolsMenu');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');

    // ============================================================
    // 1. FUNCIONALIDAD DE LA BARRA LATERAL (Menú de hamburguesa)
    // ============================================================
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        // Mover el contenido principal a la derecha en pantallas grandes
        mainContentWrapper.classList.toggle('sidebar-open');
    });

    // ============================================================
    // 2. FUNCIONALIDAD DEL BOTÓN '+' (Subir Archivo / Herramientas)
    // ============================================================
    uploadBtn.addEventListener('click', function() {
        // Al hacer clic en el '+', activa la selección de archivos
        imageInput.click();
        
        // Y también muestra el menú de Word/Excel
        toggleToolsMenu(); 
    });

    // Función para mostrar/ocultar el menú Word/Excel y posicionarlo
    function toggleToolsMenu() {
        toolsMenu.classList.toggle('hidden');
        if (!toolsMenu.classList.contains('hidden')) {
             // Posicionar el menú justo encima del search-group
             const searchGroup = document.querySelector('.search-group');
             const rect = searchGroup.getBoundingClientRect();
             
             // Posicionar encima (10px de margen + altura de la barra)
             toolsMenu.style.bottom = (window.innerHeight - rect.top + 10) + 'px'; 
             
             // Centrar horizontalmente basado en el centro del search-group
             toolsMenu.style.left = (rect.left + rect.width / 2) + 'px';
             toolsMenu.style.transform = 'translateX(-50%)'; 
        }
    }
    
    // Manejar clics fuera del menú para cerrarlo
    document.addEventListener('click', (event) => {
        if (!toolsMenu.contains(event.target) && event.target !== uploadBtn) {
            toolsMenu.classList.add('hidden');
        }
    });

    // ============================================================
    // 3. FUNCIONALIDAD DE VISTA PREVIA DE IMAGEN
    // ============================================================
    imageInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            // Mostrar la vista previa
            previewContainer.classList.remove('hidden');
            
            // Mostrar nombre del archivo (solo el primero para simplificar)
            const fileName = this.files[0].name;
            fileNameDisplay.textContent = fileName;
            fileNameDisplay.classList.remove('hidden');

            // Mostrar la imagen real 
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(this.files[0]);
            
        } else {
            // Ocultar si no hay archivos
            previewContainer.classList.add('hidden');
            fileNameDisplay.classList.add('hidden');
        }
    });

    // Botón para quitar la imagen
    removeImageBtn.addEventListener('click', function() {
        // Resetear el input de archivo y ocultar la vista previa
        imageInput.value = ''; 
        previewContainer.classList.add('hidden');
        fileNameDisplay.textContent = '';
    });
});
