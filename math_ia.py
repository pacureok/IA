# music_ia.py - Generación de música con LÓGICA DE GÉNERO ESTRICTA y DURACIÓN VARIABLE

from midiutil import MIDIFile
import random
import os

# --- Mapeo de Instrumentos General MIDI (GM) por Nombre y ID (0-127) ---
GM_INSTRUMENTS = {
    # Pianos y Teclados
    "Acoustic Piano": 0, "Bright Piano": 1, "Electric Grand": 2, "Electric Piano": 4, 
    # Guitarras y Bajos
    "Acoustic Bass": 32, "Electric Bass": 34, "Overdriven Guitar": 30, "Distortion Guitar": 31,
    # Cuerdas y Orquestales
    "Strings Ensemble": 48, "Synth Strings": 50, "Cello": 43, "Violin": 41,
    # Metales y Viento
    "Trumpet": 56, "Trombone": 57, "Sax": 65, "Flute": 73,
    # Sintetizadores y Pads
    "Synth Lead": 80, "Sawtooth": 81, "Pad Choir": 89, "Pad Warm": 88,
    # Otros
    "Accordion": 21, "Timpani": 47,
    # Percusión (CLAVE 'Percussion' AÑADIDA PARA SOLUCIONAR EL KEYERROR)
    "Percussion": 118, 
    "Standard Kit": 0, 
    "Jazz Kit": 1, 
    "Brush Kit": 8, 
}

# --- Mapeo de Géneros a Parámetros y 4 Instrumentos ESPECÍFICOS ---
GENRE_MAPPING = {
    "rock": {"tempo": 110, "chords": [0, 4, 7], "lead": GM_INSTRUMENTS["Overdriven Guitar"], "harmony": GM_INSTRUMENTS["Electric Piano"], "bass": GM_INSTRUMENTS["Electric Bass"], "drums": GM_INSTRUMENTS["Standard Kit"]},
    "rock gotico": {"tempo": 90, "chords": [0, 3, 7], "lead": GM_INSTRUMENTS["Distortion Guitar"], "harmony": GM_INSTRUMENTS["Strings Ensemble"], "bass": GM_INSTRUMENTS["Electric Bass"], "drums": GM_INSTRUMENTS["Standard Kit"]},
    "rock metal": {"tempo": 180, "chords": [0, 7], "lead": GM_INSTRUMENTS["Distortion Guitar"], "harmony": GM_INSTRUMENTS["Overdriven Guitar"], "bass": GM_INSTRUMENTS["Electric Bass"], "drums": GM_INSTRUMENTS["Standard Kit"]},
    "pop": {"tempo": 100, "chords": [0, 4, 7, 10], "lead": GM_INSTRUMENTS["Bright Piano"], "harmony": GM_INSTRUMENTS["Synth Strings"], "bass": GM_INSTRUMENTS["Electric Bass"], "drums": GM_INSTRUMENTS["Standard Kit"]},
    "jazz": {"tempo": 95, "chords": [0, 3, 7, 10], "lead": GM_INSTRUMENTS["Sax"], "harmony": GM_INSTRUMENTS["Electric Piano"], "bass": GM_INSTRUMENTS["Acoustic Bass"], "drums": GM_INSTRUMENTS["Jazz Kit"]},
    "electronica": {"tempo": 130, "chords": [0, 7, 12], "lead": GM_INSTRUMENTS["Synth Lead"], "harmony": GM_INSTRUMENTS["Sawtooth"], "bass": GM_INSTRUMENTS["Synth Lead"], "drums": GM_INSTRUMENTS["Standard Kit"]},
    "hip hop": {"tempo": 85, "chords": [0, 3, 7], "lead": GM_INSTRUMENTS["Synth Lead"], "harmony": GM_INSTRUMENTS["Pad Warm"], "bass": GM_INSTRUMENTS["Electric Bass"], "drums": GM_INSTRUMENTS["Standard Kit"]},
    "ambiente": {"tempo": 60, "chords": [0, 7, 12], "lead": GM_INSTRUMENTS["Pad Choir"], "harmony": GM_INSTRUMENTS["Strings Ensemble"], "bass": GM_INSTRUMENTS["Cello"], "drums": GM_INSTRUMENTS["Percussion"]}, 
    "clasica": {"tempo": 75, "chords": [0, 4, 7], "lead": GM_INSTRUMENTS["Violin"], "harmony": GM_INSTRUMENTS["Strings Ensemble"], "bass": GM_INSTRUMENTS["Cello"], "drums": GM_INSTRUMENTS["Timpani"]},
}

# Directorio donde se guardarán los archivos temporales de música
MUSIC_DIR = "generated_music"
os.makedirs(MUSIC_DIR, exist_ok=True)

# ----------------- Funciones de Configuración -----------------

def get_genre_parameters(genre):
    """
    Obtiene parámetros detallados. Devuelve None si el género no está mapeado.
    """
    genre_lower = genre.lower()
    params = GENRE_MAPPING.get(genre_lower)
    
    if not params:
        return None 
    
    drums_program = params["drums"] 

    return (
        params["tempo"], 
        params["chords"], 
        params["lead"], 
        params["harmony"], 
        params["bass"], 
        drums_program 
    )

# ----------------- Función Principal de Generación -----------------

def generate_music_sequence(genre, total_duration_seconds):
    """
    Genera una secuencia MIDI con duración específica en segundos.
    """
    
    params = get_genre_parameters(genre)
    if not params:
        return None # Género no soportado
        
    tempo, chord_structure, LEAD_INST, HARMONY_INST, BASS_INST, DRUM_INST = params
    
    # Usa la duración pasada como argumento
    TOTAL_DURATION = float(total_duration_seconds)
    midi_file = MIDIFile(4) 
    
    # Tracks y Canales
    TRACK_LEAD, CHANNEL_LEAD = 0, 0
    TRACK_HARMONY, CHANNEL_HARMONY = 1, 1
    TRACK_BASS, CHANNEL_BASS = 2, 2
    TRACK_DRUMS, CHANNEL_DRUMS = 3, 9 # Canal 9 es para percusión MIDI

    # Configuración de Tempo e Instrumentos
    for track in range(4):
        midi_file.addTempo(track, 0, tempo)
    
    midi_file.addProgramChange(TRACK_LEAD, CHANNEL_LEAD, 0, LEAD_INST)
    midi_file.addProgramChange(TRACK_HARMONY, CHANNEL_HARMONY, 0, HARMONY_INST)
    midi_file.addProgramChange(TRACK_BASS, CHANNEL_BASS, 0, BASS_INST)
    midi_file.addProgramChange(TRACK_DRUMS, CHANNEL_DRUMS, 0, DRUM_INST) 

    # Parámetros de la secuencia
    time = 0.0
    volume_lead = 100
    volume_harmony = 85
    volume_bass = 95
    volume_drums = 110
    
    base_note_chord = random.randint(55, 60) 
    base_note_lead = base_note_chord + 12 
    
    # Loop de Generación: Itera hasta alcanzar TOTAL_DURATION
    while time < TOTAL_DURATION:
        
        # Longitud del compás (4 tiempos)
        beat_length = 60 / tempo
        
        # --- DRUMS (Track 3) ---
        midi_file.addNote(TRACK_DRUMS, CHANNEL_DRUMS, 35, time, beat_length, volume_drums)
        midi_file.addNote(TRACK_DRUMS, CHANNEL_DRUMS, 35, time + beat_length * 2, beat_length, volume_drums)
        midi_file.addNote(TRACK_DRUMS, CHANNEL_DRUMS, 38, time + beat_length, beat_length, volume_drums)
        midi_file.addNote(TRACK_DRUMS, CHANNEL_DRUMS, 38, time + beat_length * 3, beat_length, volume_drums)
        for i in range(8):
             midi_file.addNote(TRACK_DRUMS, CHANNEL_DRUMS, 42, time + (i * beat_length / 2), beat_length / 4, volume_drums - 10)
        
        # --- BASS (Track 2) ---
        bass_note = base_note_chord - 12 
        for i in range(4): 
            midi_file.addNote(TRACK_BASS, CHANNEL_BASS, bass_note, time + (i * beat_length), beat_length, volume_bass)

        
        # --- HARMONY (Track 1) ---
        for interval in chord_structure:
            pitch = base_note_chord + interval
            midi_file.addNote(TRACK_HARMONY, CHANNEL_HARMONY, pitch, time, beat_length * 4, volume_harmony) 


        # --- LEAD (Track 0) ---
        current_time = time
        for _ in range(int(8)): 
            note_duration = random.choice([beat_length / 2, beat_length, beat_length * 1.5]) 
            if current_time + note_duration > time + beat_length * 4: break

            note_choice = random.choice(chord_structure + [2, 5, 9, 14]) 
            pitch = base_note_lead + note_choice + random.randint(-3, 3) 
            
            if random.random() < 0.75: 
                midi_file.addNote(TRACK_LEAD, CHANNEL_LEAD, pitch, current_time, note_duration, volume_lead)

            current_time += note_duration

        
        # --- Progresión Armónica ---
        if random.random() < 0.6:
             base_note_chord += random.choice([0, 5, -5, 7, -7]) 
        else:
             base_note_chord += random.choice([-2, 2, 4]) 
        
        base_note_chord = max(45, min(65, base_note_chord)) 
        base_note_lead = base_note_chord + 12 

        time += beat_length * 4 


    # 6. Guardar el archivo
    filename = f"music_{genre.replace(' ', '_')}_{total_duration_seconds}s_{random.randint(1000, 9999)}.mid"
    filepath = os.path.join(MUSIC_DIR, filename)

    try:
        with open(filepath, "wb") as output_file:
            midi_file.writeFile(output_file)
        
        return filename
    except Exception as e:
        print(f"Error al escribir el archivo MIDI: {e}")
        return None
