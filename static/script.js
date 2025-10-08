// Variable global para controlar la síntesis de voz (TTS)
let speaking = false;

// Función para detener la lectura actual
function stopSpeaking() {
    if (speaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        speaking = false;
        // Opcional: Cambiar el texto del botón si existe
        const stopBtn = document.getElementById('stopSpeakerBtn');
        if (stopBtn) stopBtn.classList.add('hidden');
    }
}

// Función para leer el texto
function speakText(text) {
    stopSpeaking(); // Detiene cualquier lectura previa
    if ('speechSynthesis' in window) {
        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        
        const stopBtn = document.getElementById('stopSpeakerBtn');
        
        // Configuración de la voz
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
    const voiceBtn = document.getElementById('voiceBtn');
    
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
    if (voiceBtn) voiceBtn.disabled = true;
    
    try {
        const response = await fetch('/buscar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        
        if (response.ok) { // Usamos response.ok para manejar códigos 200-299
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
            
            // --- Iniciar lectura de los resultados ---
            const textToRead = `${data.title}. El resumen es: ${data.text}`;
            speakText(textToRead);
        } else {
            // Maneja el error 404/400 del backend (que ahora solo será el fallo de Wikipedia)
             showError(data.error || 'Error desconocido al procesar la búsqueda');
        }
    } catch (err) {
        showError('Error de conexión con el servidor');
    } finally {
        loading.classList.add('hidden');
        searchBtn.disabled = false;
        if (voiceBtn) voiceBtn.disabled = false;
    }
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.classList.remove('hidden');
}

// Función de entrada de voz (sin cambios)
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Lo sentimos, tu navegador no soporta la función de búsqueda por voz.');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
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
        buscar();
    };

    recognition.onerror = function(event) {
        voiceBtn.textContent = '🎤 Voz';
        voiceBtn.classList.remove('listening');
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

// Función para el botón "Hora y Clima" (sin cambios)
function getWeatherAndSpeak() {
    stopSpeaking();
    document.getElementById('searchInput').value = 'la hora de hoy';
    buscar();
}

// Event Listeners
document.getElementById('searchBtn').addEventListener('click', buscar);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscar();
    }
});
document.getElementById('voiceBtn').addEventListener('click', startVoiceInput);
document.getElementById('timeWeatherBtn').addEventListener('click', getWeatherAndSpeak);
// 💡 NUEVO: Event listener para detener la voz
document.getElementById('stopSpeakerBtn').addEventListener('click', stopSpeaking);
