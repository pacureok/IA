# music_ia.py

import os
import time
import random
from midiutil import MIDIFile
from pydub import AudioSegment # Requiere FFmpeg instalado en el sistema

# Directorio donde se guardará la música generada
# **IMPORTANTE**: Este directorio debe existir y ser escribible.
MUSIC_DIR = "generated_music"
os.makedirs(MUSIC_DIR, exist_ok=True)

# Mapeo de géneros a configuraciones de tempo/clave simuladas
GENRE_MAPPING = {
    "pop": {"tempo": 120, "key": 0, "instrument": 0},    # C Mayor
    "jazz": {"tempo": 90, "key": 2, "instrument": 65},   # D Mayor, Saxofón
    "rock": {"tempo": 140, "key": 4, "instrument": 33},   # E Mayor, Guitarra eléctrica
    "electronica": {"tempo": 130, "key": -5, "instrument": 103}, # F Menor, Sintetizador
    "clasica": {"tempo": 75, "key": 7, "instrument": 41}   # G Mayor, Violín
}

VOICES = {
    "pop": "Pop Vocalist - Clear & Bright",
    "rock": "Rock Singer - Gravelly & Energetic",
    "jazz": "Jazz Crooner - Smooth & Mellow"
}

def generate_music_sequence(genre, duration_seconds, voice_type=None):
    """
    Simula la generación de una secuencia MIDI basada en el género y duración.
    Si voice_type es proporcionado, simula la mezcla de voz.
    """
    genre_lower = genre.lower().strip()
    config = GENRE_MAPPING.get(genre_lower)
    
    if not config:
        return None # Género no soportado

    # Parámetros MIDI
    track = 0
    channel = 0
    tempo = config['tempo']
    volume = 100
    
    # Crea el archivo MIDI
    midi = MIDIFile(1)
    midi.addTempo(track, 0, tempo)
    
    # Generación de notas simple (simulando una melodía)
    num_beats = int((duration_seconds * tempo) / 60)
    current_time = 0
    
    # Usar una escala simple para simular musicalidad
    scale = [60, 62, 64, 65, 67, 69, 71] # Escala C Mayor (C4, D4, E4, F4, G4, A4, B4)
    
    for _ in range(num_beats // 4): # Iterar para llenar la duración
        # Generar acordes o melodía simple
        duration = 1  # Un tiempo por nota/acorde
        pitch = random.choice(scale)
        
        # Añadir una nota principal
        midi.addNote(track, channel, pitch, current_time, duration, volume)
        
        # Simular una segunda voz o acompañamiento (una octava abajo)
        if random.random() < 0.5:
             midi.addNote(track, channel, pitch - 12, current_time, duration, volume - 20)

        current_time += duration

    # Generar nombre del archivo
    timestamp = int(time.time())
    voice_tag = "_VOZ" if voice_type else ""
    filename = f"music_{genre_lower}_{duration_seconds}s{voice_tag}_{timestamp}.mid"
    filepath = os.path.join(MUSIC_DIR, filename)
    
    # Guardar el archivo
    try:
        with open(filepath, "wb") as output_file:
            midi.writeFile(output_file)
        
        return filename
    except Exception as e:
        print(f"Error al escribir el archivo MIDI: {e}")
        return None

def analyze_audio_file(filepath):
    """
    Simula el análisis profundo de un archivo de audio (MP3/MP4) 
    para extraer género y estilo para replicar.
    
    NOTA: Requiere FFmpeg y librerías de audio/ML reales para un análisis no simulado.
    """
    try:
        # Pydub intenta cargar el archivo
        audio = AudioSegment.from_file(filepath)
        duration_ms = len(audio)
        
        # Simulación de extracción de características
        detected_genre = random.choice(list(GENRE_MAPPING.keys()))
        detected_tempo = random.randint(70, 150)
        
        # Simulación de la voz (si es pertinente)
        voice_style = "Voz Masculina Melódica" if "mp3" in filepath else "Voz Femenina Energética"
        
        return {
            "duration_seconds": duration_ms / 1000,
            "detected_genre": detected_genre,
            "detected_tempo": detected_tempo,
            "voice_style": voice_style,
            "original_filename": os.path.basename(filepath)
        }
    except Exception as e:
        # Esto atrapará errores si FFmpeg no está instalado
        print(f"Error al analizar archivo de audio: {e}")
        return None

def get_supported_music_genres():
    """Devuelve una lista de géneros soportados."""
    return [g.title() for g in GENRE_MAPPING.keys()]

def get_voice_details(genre):
    """Devuelve los detalles de voz simulados para un género."""
    return VOICES.get(genre.lower().strip(), "Voz Genérica")
