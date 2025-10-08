# music_creator.py

from midiutil import MIDIFile
import random
import os

# Directorio donde se guardarán los archivos temporales de música
MUSIC_DIR = "generated_music"
os.makedirs(MUSIC_DIR, exist_ok=True)

def get_genre_parameters(genre):
    """
    Define parámetros musicales básicos basados en el género.
    """
    genre = genre.lower()
    if "jazz" in genre or "blues" in genre:
        # Tono más bajo y ritmo más lento, con más acordes.
        return 70, 0.75, [0, 4, 7, 10]  # BPM, Beat length, Chord structure (Minor 7th)
    elif "electrónica" in genre or "techno" in genre or "dance" in genre:
        # Ritmo rápido y repetitivo.
        return 130, 0.5, [0, 7, 12]  # BPM, Beat length, Chord structure (Power chord)
    elif "pop" in genre or "rock" in genre:
        # Ritmo intermedio, notas sencillas.
        return 100, 1, [0, 4, 7]  # BPM, Beat length, Chord structure (Major chord)
    else:
        # Por defecto: ambiente (Ambient/Simple)
        return 80, 2, [0, 7] # BPM, Beat length, Chord structure (Octave)


def generate_music_sequence(genre="ambiente"):
    """
    Genera una secuencia MIDI simple y la guarda en un archivo.
    Retorna el nombre del archivo generado.
    """
    
    # 1. Definir parámetros del género
    tempo, beat_length, chord_structure = get_genre_parameters(genre)
    
    # 2. Configuración MIDI
    track = 0
    channel = 0
    time = 0    # En segundos
    duration = 4 # Duración total de la pieza en segundos (simple)
    volume = 100 # Rango 0-127
    
    # Crear el objeto MIDI
    midi_file = MIDIFile(1) # Un track
    midi_file.addTempo(track, time, tempo)
    
    # 3. Generar la secuencia (4 compases de 4 tiempos)
    base_note = random.randint(55, 65) # Nota base aleatoria (e.g., C4)
    
    for _ in range(int(duration / beat_length)):
        # Toca el acorde (o notas simultáneas)
        for interval in chord_structure:
            pitch = base_note + interval
            midi_file.addNote(track, channel, pitch, time, beat_length, volume)
        
        # Avanza el tiempo
        time += beat_length
        
        # Hay una probabilidad de cambiar la nota base para el siguiente acorde
        if random.random() < 0.3:
             base_note += random.choice([-2, 0, 2, 4])
             # Asegurar que no se vaya demasiado lejos
             base_note = max(50, min(70, base_note)) 

    # 4. Guardar el archivo
    filename = f"music_{genre.replace(' ', '_')}_{random.randint(1000, 9999)}.mid"
    filepath = os.path.join(MUSIC_DIR, filename)

    try:
        with open(filepath, "wb") as output_file:
            midi_file.writeFile(output_file)
        
        # Nota importante: No se realiza la conversión a MP3/WAV aquí
        # porque requiere la librería pydub y la dependencia externa ffmpeg,
        # lo cual es difícil de configurar en Render. Solo confirmaremos el MIDI.
        
        return filename
    except Exception as e:
        print(f"Error al escribir el archivo MIDI: {e}")
        return None
