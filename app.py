# app.py

from flask import Flask, request, jsonify, url_for, send_from_directory, render_template
from flask_cors import CORS
import re
import os
import time

# Importa el módulo de música personalizado
# Asegúrate de que music_ia.py esté en el mismo directorio.
from music_ia import (
    generate_music_sequence, 
    get_supported_music_genres, 
    MUSIC_DIR
)

# --- CONFIGURACIÓN DE FLASK ---
app = Flask(__name__)
# Permite peticiones CORS si la aplicación se ejecuta en dominios diferentes
CORS(app) 

# Asegura que el directorio de música exista
os.makedirs(MUSIC_DIR, exist_ok=True)

# ============================================================
# FUNCIONES DE PROCESAMIENTO
# ============================================================

def handle_music_creation(query):
    """
    Maneja la lógica de creación de música a partir de comandos de texto.
    Sintaxis esperada: "Quiero musica del genero [el género] [duración]"
    """
    query_lower = query.lower().strip()
    
    # Expresión regular para capturar el género y la duración
    # Ejemplo: "quiero musica del genero pop 5m"
    pattern = r"(?:quiero musica del genero|crear|haz musica)\s+([\w\s]+?)\s+(\d+)\s*(m|hr|h)\b"
    match = re.search(pattern, query_lower)
    
    if match:
        genre = match.group(1).strip()
        duration_value = int(match.group(2))
        duration_unit_raw = match.group(3).lower()
        
        total_duration_seconds = 0
        
        if duration_unit_raw in ['h', 'hr']:
            total_duration_seconds = duration_value * 3600
        elif duration_unit_raw == 'm':
            total_duration_seconds = duration_value * 60

        # Duraciones soportadas para la simulación
        supported_durations_sec = [60, 300, 600, 3600] # 1m, 5m, 10m, 1hr

        if total_duration_seconds not in supported_durations_sec:
            return {
                "text": f"**[DURACIÓN NO VÁLIDA]** Por favor, solicita una duración válida.\n\n"
                        f"Duraciones soportadas: **1m, 5m, 10m, 60m, o 1hr**.",
                "sources": ["pacureia.dev/duration_error"],
                "imageTopic": "error"
            }

        # Intentamos generar la música
        filename = generate_music_sequence(genre, total_duration_seconds)
        
        if filename is None:
            supported_genres = ", ".join(get_supported_music_genres())
            return {
                "text": f"**[GÉNERO NO SOPORTADO]** El género '{genre.upper()}' no está disponible.\n\n"
                        f"Géneros soportados: **{supported_genres}**.",
                "sources": ["pacureia.dev/genre_limit"],
                "imageTopic": "musica_error"
            }

        # Generar la URL para que el usuario pueda descargar el archivo MIDI
        file_url = url_for('get_music_file', filename=filename, _external=True)
        duration_display = f"{total_duration_seconds // 3600} hora(s)" if total_duration_seconds >= 3600 else f"{total_duration_seconds // 60} minuto(s)"
        
        return {
            "text": f"**[MÚSICA GENERADA CON ÉXITO]**\n\n¡Listo! He compuesto una pieza de **género {genre.upper()}** de **{duration_display}**.\n\n**URL de Descarga (MIDI):** {file_url}",
            "sources": [file_url],
            "imageTopic": genre
        }

    # Mensaje de ayuda si se detectó la palabra clave 'musica' pero falló la sintaxis
    if "musica" in query_lower or "crear" in query_lower or "haz" in query_lower:
        supported_genres = ", ".join(get_supported_music_genres())
        return {
            "text": f"**[MODO CREACIÓN MUSICAL]**\n\nPara generar música, usa la sintaxis:\n\n**`Quiero musica del genero [género] [duración]`**\n\n*Ejemplo: Quiero musica del genero Jazz 5m*\n\n**Géneros soportados:** {supported_genres}.\n**Duraciones soportadas:** 1m, 5m, 10m, 60m, 1hr.",
            "sources": ["pacureia.dev/music_help"],
            "imageTopic": "musica"
        }
        
    return None # No es un comando de música

# ============================================================
# RUTAS DE FLASK
# ============================================================

@app.route('/')
def index():
    """Ruta principal para cargar el frontend (asume index.html)."""
    # Si usas render_template, necesitas tener un archivo index.html
    return render_template('index.html') 

@app.route('/generated_music/<filename>')
def get_music_file(filename):
    """Ruta para servir el archivo de música generado."""
    return send_from_directory(MUSIC_DIR, filename)

@app.route('/api/chat', methods=['POST'])
def process_query():
    """Ruta API principal para procesar la consulta del usuario."""
    query = request.form.get('query', '').strip()

    if not query:
        return jsonify({
            "text": "La consulta está vacía. Por favor, escribe el comando de música que deseas generar.",
            "sources": ["pacureia.dev"],
            "imageTopic": "error"
        }), 400

    # 1. MANEJO DE CREACIÓN MUSICAL (Única función)
    music_response = handle_music_creation(query)
    
    if music_response: 
        return jsonify(music_response)

    # 2. FALLBACK/RESPUESTA GENÉRICA
    return jsonify({
        "text": f"**[MODO MÚSICA]** Solo estoy configurada para generar música.\n"
                f"Por favor, usa el comando: **`Quiero musica del genero [género] [duración]`**.",
        "sources": ["pacureia.dev/fallback"],
        "imageTopic": "musica"
    })

# ============================================================
# INICIALIZACIÓN
# ============================================================

if __name__ == '__main__':
    # Ejecución local de prueba
    app.run(debug=True, port=5000)
