# app.py

from flask import Flask, render_template, request, jsonify, url_for, send_from_directory
from flask_cors import CORS
import re
import os
import random
import time
from werkzeug.utils import secure_filename

# Importa el módulo de música personalizado
from music_ia import (
    generate_music_sequence, 
    analyze_audio_file, 
    get_supported_music_genres, 
    get_voice_details,
    MUSIC_DIR
)

# Directorio para archivos subidos temporalmente (asegúrate de que exista)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp3', 'mp4', 'wav'}

# --- CONFIGURACIÓN DE FLASK ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app) 

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ============================================================
# FUNCIONES DE AYUDA
# ============================================================

def allowed_file(filename):
    """Verifica que la extensión del archivo esté permitida."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_greetings(query):
    """Maneja saludos simples."""
    greetings = ["hola", "qué tal", "buenos días", "buenas tardes", "que tal"]
    if any(g in query.lower() for g in greetings):
        return {
            "text": "¡Hola! Soy PACURE IA. Puedo **buscar información**, **generar música**, o **analizar archivos de audio** que subas. ¿Cómo te ayudo hoy?",
            "sources": ["pacureia.dev/greeting"],
            "imageTopic": "saludo"
        }
    return None

def handle_music_creation(query):
    """
    Maneja la lógica de creación de música, incluyendo el comando de voz custom.
    """
    query_lower = query.lower().strip()
    
    # Expresión regular para capturar el género, el valor numérico y la unidad de duración
    # También busca la frase "con voz" o "voz custom"
    pattern = r"(?:quiero musica del genero|crear|haz musica)\s+([\w\s]+?)\s+(\d+)\s*(m|hr|h)\b(.*)"
    match = re.search(pattern, query_lower)
    
    if match:
        genre = match.group(1).strip()
        duration_value = int(match.group(2))
        duration_unit_raw = match.group(3).lower()
        extra_command = match.group(4).strip()
        
        wants_voice = "con voz" in extra_command or "voz custom" in extra_command
        
        total_duration_seconds = 0
        
        if duration_unit_raw in ['h', 'hr']:
            total_duration_seconds = duration_value * 3600
        elif duration_unit_raw == 'm':
            total_duration_seconds = duration_value * 60

        supported_durations_sec = [60, 300, 600, 3600] # 1m, 5m, 10m, 1hr

        if total_duration_seconds not in supported_durations_sec:
            return {
                "text": f"**[DURACIÓN NO SOPORTADA]** La duración solicitada no es válida.\n\n"
                        f"Por favor, elige entre las duraciones soportadas: **1m, 5m, 10m, 60m, o 1hr**.",
                "sources": ["pacureia.dev/duration_error"],
                "imageTopic": "error"
            }

        # Intentamos generar la música
        voice_details = get_voice_details(genre) if wants_voice else None
        
        filename = generate_music_sequence(genre, total_duration_seconds, voice_details)
        
        if filename is None:
            supported_genres = ", ".join(get_supported_music_genres())
            return {
                "text": f"**[GÉNERO NO SOPORTADO]** El género '{genre.upper()}' no está en nuestra lista.\n\n"
                        f"Por favor, intenta con uno de los géneros soportados: **{supported_genres}**.",
                "sources": ["pacureia.dev/genre_limit"],
                "imageTopic": "musica_error"
            }

        file_url = url_for('get_music_file', filename=filename, _external=True)
        duration_display = f"{total_duration_seconds // 3600} hora(s)" if total_duration_seconds >= 3600 else f"{total_duration_seconds // 60} minuto(s)"
        
        voice_message = ""
        if wants_voice:
            voice_message = f"\n\n**Voz Custom:** Se ha generado una pista de voz en el estilo **{voice_details}**."
            
        return {
            "text": f"**[MÚSICA GENERADA CON ÉXITO]**\n\n¡Listo! He compuesto una pieza de **género {genre.upper()}** de **{duration_display}**.{voice_message}\n\n**URL de Descarga:** {file_url}",
            "sources": [file_url],
            "imageTopic": genre
        }

    # Mensaje de ayuda si se detectó la intención pero falló la sintaxis
    if "musica" in query_lower or "crear" in query_lower:
        return {
            "text": "**[MODO CREACIÓN MUSICAL - SINTAXIS REQUERIDA]**\n\nPara generar, usa la sintaxis:\n\n**`Quiero musica del genero [el género] [duración] [opcionalmente: con voz]`**\n\n*(Ej: Quiero musica del genero Pop 5m con voz)*\n\n**Duraciones soportadas:** 1m, 5m, 10m, 60m, 1hr.",
            "sources": ["pacureia.dev/music_init"],
            "imageTopic": "musica"
        }
        
    return None

# ============================================================
# RUTAS DE FLASK
# ============================================================

@app.route('/')
def index():
    """Ruta principal para cargar el frontend (asume index.html)."""
    return render_template('index.html')

@app.route('/generated_music/<filename>')
def get_music_file(filename):
    """Ruta para servir el archivo de música generado."""
    return send_from_directory(MUSIC_DIR, filename)

@app.route('/api/upload_audio', methods=['POST'])
def upload_and_analyze_audio():
    """
    Ruta API para recibir un archivo de audio/video, analizar su estilo
    y generar una respuesta basada en la intención de replicarlo.
    """
    if 'file' not in request.files:
        return jsonify({"text": "**[ERROR]** No se encontró el archivo subido.", "sources": []}), 400

    file = request.files['file']
    
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"text": "**[ERROR]** Tipo de archivo no permitido. Solo MP3, MP4, y WAV son soportados.", "sources": []}), 400

    try:
        # Guardar el archivo de forma segura
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Simular análisis del archivo
        analysis_result = analyze_audio_file(filepath)
        
        # Eliminar el archivo después del análisis simulado (buena práctica)
        os.remove(filepath)

        if analysis_result:
            # Usar los resultados del análisis simulado para generar la música de estilo similar
            detected_genre = analysis_result['detected_genre']
            voice_style = analysis_result['voice_style']
            
            # Generamos una pista de 5 minutos en el género detectado (simulado)
            simulated_filename = generate_music_sequence(detected_genre, 300, voice_style)
            file_url = url_for('get_music_file', filename=simulated_filename, _external=True)

            return jsonify({
                "text": f"**[ANÁLISIS DE AUDIO COMPLETADO]**\n\n"
                        f"Hemos analizado tu archivo **'{analysis_result['original_filename']}'**.\n"
                        f"**Estilo Detectado:** Género {detected_genre.upper()} (Tempo {analysis_result['detected_tempo']} BPM).\n"
                        f"**Voz Detectada:** {voice_style}.\n\n"
                        f"He generado una nueva pieza de **5 minutos** con un estilo similar. **URL de Descarga:** {file_url}",
                "sources": [file_url],
                "imageTopic": f"musica {detected_genre}"
            })
        else:
            return jsonify({
                 "text": "**[ERROR DE SISTEMA]** No pude procesar el archivo. Asegúrate de que **FFmpeg** esté correctamente instalado en el servidor para soportar MP3/MP4.", 
                 "sources": [], 
                 "imageTopic": "error"
            }), 500
            
    except Exception as e:
        print(f"Error en la ruta /api/upload_audio: {e}")
        return jsonify({
            "text": f"**[ERROR FATAL]** Ocurrió un error inesperado durante el procesamiento.", 
            "sources": [], 
            "imageTopic": "error"
        }), 500


@app.route('/api/chat', methods=['POST'])
def process_query():
    """Ruta API para procesar la consulta del usuario."""
    query = request.form.get('query', '').strip()

    if not query:
        return jsonify({
            "text": "Tu consulta está vacía. Por favor, escribe lo que deseas buscar o crear.",
            "sources": ["pacureia.dev"],
            "imageTopic": "error"
        }), 400

    # 1. VERIFICACIÓN DE SALUDO (Prioridad 1)
    greeting_response = handle_greetings(query)
    if greeting_response: return jsonify(greeting_response)

    # 2. MANEJO DE CREACIÓN MUSICAL Y VOZ (Prioridad 2)
    music_response = handle_music_creation(query)
    if music_response: return jsonify(music_response)

    # 3. BÚSQUEDA GENERAL EN LA WEB (Fallback)
    # Aquí iría tu lógica de búsqueda web o de respuesta genérica
    
    return jsonify({
        "text": f"**[PACURE IA - BÚSQUEDA GENERAL]**\n\n"
                f"No detecté un comando de música o de voz custom, así que buscaré sobre **'{query[:30]}...'** en la web. (Esta función debe ser implementada con Google Search Tool)",
        "sources": ["pacureia.dev/busqueda_general"],
        "imageTopic": "busqueda"
    })

# ============================================================
# INICIALIZACIÓN
# ============================================================

if __name__ == '__main__':
    # Usar puerto 5000 para entorno local de pruebas
    app.run(debug=True, port=5000)
