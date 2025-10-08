// Variable global para controlar la síntesis de voz (TTS)
let speaking = false;

// Función para detener la lectura actual
function stopSpeaking() {
    if (speaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        speaking = false;
    }
}

// Función para leer el texto
function speakText(text) {
    stopSpeaking(); // Detiene cualquier lectura previa
    if ('speechSynthesis' in window) {
        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configuración de la voz
        utterance.lang = 'es-ES';
        
        utterance.onstart = () => { speaking = true; };
        utterance.onend = () => { speaking = false; };
        utterance.onerror = (e) => { console.error('Error TTS:', e); speaking = false; };
        
        synthesis.speak(utterance);
    } else {
        console.warn('El navegador no soporta Text-to-Speech.');
    }
}

// Función principal de búsqueda (modificada para añadir el TTS)
async function buscar() {
    // 1. Elementos del DOM
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const timeInfo = document.getElementById('timeInfo');
    const resultSection = document.getElementById('resultSection');
    const sourceBadge = document.getElementById('sourceBadge');
    const resultTitle = document.getElementById('resultTitle');
    const resultText = document.getElementById('resultText');
    const resultLink = document.getElementById('resultLink');
    const speakerBtn = document.getElementById('speakerBtn');
    
    stopSpeaking(); // Detiene la voz antes de una nueva búsqueda
    
    const query = searchInput.value.trim();
    
    if (!query) {
        showError('Por favor, ingresa una consulta de búsqueda');
        return;
    }
    
    // 2. Control visual y de botones
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    timeInfo.classList.add('hidden');
    resultSection.classList.add('hidden');
    searchBtn.disabled = true;
    speakerBtn.disabled = true; // Deshabilita el botón de voz mientras busca
    
    try {
        const response = await fetch('/buscar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        
        if (data.success !== false) {
            // Mostrar información de la hora (si existe)
            if (data.time_info) {
                timeInfo.textContent = `⏰ ${data.time_info}`;
                timeInfo.classList.remove('hidden');
            }
            
            // Mostrar resultados
            sourceBadge.textContent = data.source;
            sourceBadge.className = 'source-badge';
            sourceBadge.classList.add(data.source.includes('Wikipedia') ? 'wikipedia' : 'scraping');
            
            resultTitle.textContent = data.title;
            resultText.textContent = data.text;
            resultLink.href = data.url;
            
            resultSection.classList.remove('hidden');
            
            // --- NUEVO: Iniciar lectura de los resultados ---
            const textToRead = `${data.title}. El resumen es: ${data.text}`;
            speakText(textToRead);
            // ------------------------------------------------
        } else {
            showError(data.error || 'Error al procesar la búsqueda');
        }
    } catch (err) {
        showError('Error de conexión con el servidor');
    } finally {
        loading.classList.add('hidden');
        searchBtn.disabled = false;
        speakerBtn.disabled = false;
    }
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.classList.remove('hidden');
}

// --- NUEVO: Función para iniciar la escucha por voz (Web Speech API) ---
function startVoiceInput() {
    // Verificar si el navegador soporta Speech Recognition
    if (!('webkitSpeechRecognition' in window)) {
        alert('Lo sentimos, tu navegador no soporta la función de búsqueda por voz.');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false; // Solo resultados finales
    recognition.maxAlternatives = 1;
    
    const searchInput = document.getElementById('searchInput');
    const voiceBtn = document.getElementById('voiceBtn');
    
    voiceBtn.textContent = '🔴 Escuchando...';
    voiceBtn.classList.add('listening');

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        voiceBtn.textContent = '🎤 Voz';
        voiceBtn.classList.remove('listening');
        buscar(); // Inicia la búsqueda automáticamente con el texto reconocido
    };

    recognition.onerror = function(event) {
        voiceBtn.textContent = '🎤 Voz';
        voiceBtn.classList.remove('listening');
        console.error('Error de reconocimiento de voz:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
             showError('Error al reconocer la voz. Asegúrate de que el micrófono esté encendido.');
        }
    };

    recognition.onend = function() {
        voiceBtn.textContent = '🎤 Voz';
        voiceBtn.classList.remove('listening');
    }
    
    recognition.start();
}
// ----------------------------------------------------------------------


// --- NUEVO: Función para el botón "Hora y Clima" ---
// Usaremos la función buscar() para obtener la hora, pero para el clima se necesita una API externa
function getWeatherAndSpeak() {
    // Detenemos cualquier lectura anterior
    stopSpeaking();
    
    // Como tu backend SÍ trae la hora (data.time_info), podemos iniciar la búsqueda con un query simple
    // para obtenerla junto con un mensaje de voz.
    document.getElementById('searchInput').value = 'la hora de hoy';
    
    // Llama a buscar, y como el backend siempre trae la hora, la leerá.
    // NOTA: Para el clima real necesitarías una API de clima y modificar tu Python.
    // Por ahora, solo usaremos la hora.
    buscar();
}
// -------------------------------------------------


// Event Listeners
document.getElementById('searchBtn').addEventListener('click', buscar);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Evita el envío del formulario si fuera un formulario
        buscar();
    }
});

// NUEVO: Conectar los nuevos botones
document.getElementById('voiceBtn').addEventListener('click', startVoiceInput);
document.getElementById('timeWeatherBtn').addEventListener('click', getWeatherAndSpeak);

// NUEVO: Botón para detener la lectura (opcional)
// document.getElementById('stopSpeakerBtn').addEventListener('click', stopSpeaking);
