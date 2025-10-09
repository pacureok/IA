# music_ia.py - Generación de música con 128 instrumentos y 4 tracks

from midiutil import MIDIFile
import random
import os

# --- Mapeo de Instrumentos General MIDI (GM) ---
# Usamos el estándar completo de 128 instrumentos (ID 0 a 127)
GM_INSTRUMENTS = {
    "Piano": 0, "Bright Piano": 1, "Electric Piano": 4, 
    "Guitar": 26, "Overdriven Guitar": 30, "Acoustic Bass": 32, "Electric Bass": 34,
    "Strings": 40, "Violin": 41, "Cello": 43, "Synth Strings": 50,
    "Trumpet": 56, "Trombone": 57, "Sax": 65, "Flute": 73,
    "Synth Lead": 80, "Sawtooth": 81, "Pad Choir": 89,
    "Drum Kit": 118, "Percussion": 119, "Accordion": 21 # Ejemplo de instrumento no cubierto antes
}

# --- Mapeo de Géneros a Sets de Instrumentos y Tempo ---
# Esta es la base. Si un género no está aquí, usará la lógica ALEATORIA de 128 instrumentos.
GENRE_MAPPING = {
    "rock": {"tempo": 120, "chords": [0, 4, 7], "lead": GM_INSTRUMENTS["Overdriven Guitar"], "harmony": GM_INSTRUMENTS["Guitar"], "bass": GM_INSTRUMENTS["Electric Bass"], "drums": GM_INSTRUMENTS["Drum Kit"]},
    "pop": {"tempo": 100, "chords": [0, 4, 7, 10], "lead": GM_INSTRUMENTS["Bright Piano"], "harmony": GM_INSTRUMENTS["Synth Strings"], "bass": GM_INSTRUMENTS["Electric Bass"], "drums": GM_INSTRUMENTS["Drum Kit"]},
    "jazz": {"tempo": 95, "chords": [0, 3, 7, 10], "lead": GM_INSTRUMENTS["Sax"], "harmony": GM_INSTRUMENTS["Electric Piano"], "bass": GM_INSTRUMENTS["Acoustic Bass"], "drums": GM_INSTRUMENTS["Percussion"]},
    "electronica": {"tempo": 130, "chords": [0, 7, 12], "lead": GM_INSTRUMENTS["Synth Lead"], "harmony": GM_INSTRUMENTS["Sawtooth"], "bass": GM_INSTRUMENTS["Synth Lead"], "drums": GM_INSTRUMENTS["Drum Kit"]},
    "ambiente": {"tempo": 60, "chords": [0, 7, 12], "lead": GM_INSTRUMENTS["Pad Choir"], "harmony": GM_INSTRUMENTS["Strings"], "bass": GM_INSTRUMENTS["Cello"], "drums": GM_INSTRUMENTS["Percussion"]},
    "clasica": {"tempo": 75, "chords": [0, 4, 7], "lead": GM_INSTRUMENTS["Violin"], "harmony": GM_INSTRUMENTS["Strings"], "bass": GM_INSTRUMENTS["Cello"], "drums": GM_INSTRUMENTS["Percussion"]},
    "cumbia": {"tempo": 90, "chords": [0, 4, 7], "lead": GM_INSTRUMENTS["Accordion"], "harmony": GM_INSTRUMENTS["Trumpet"], "bass": GM_INSTRUMENTS["Acoustic Bass"], "drums": GM_INSTRUMENTS["Percussion"]},
}

# Directorio donde se guardarán los archivos temporales de música
MUSIC_DIR = "generated_music"
os.makedirs(MUSIC_DIR, exist_ok=True)

# ----------------- Funciones de Configuración -----------------

def get_genre_parameters(genre):
    """
    Obtiene parámetros detallados. Si el género no se encuentra, 
    selecciona instrumentos ALEATORIOS de los 128 disponibles.
    Esto permite simular MÁS de 100 géneros con combinaciones únicas.
    """
    genre_lower = genre.lower()
    
    params = GENRE_MAPPING.get(genre_lower)
    
    if not params:
        # Lógica de "todos los generos": Asigna 4 instrumentos aleatorios de los 128
        print(f"Género '{genre}' no encontrado. Usando 4 instrumentos aleatorios de los 128.")
        
        # Rango de 0 a 127 para seleccionar cualquier instrumento MIDI
        random_instruments = random.sample(range(128), 4) 
        
        params = {
            "tempo": random.randint(70, 140),
            "chords": random.choice([[0, 4, 7], [0, 3, 7], [0, 7, 12]]),
            "lead": random_instruments[0],
            "harmony": random_instruments[1],
            "bass": random_instruments[2],
            "drums": random_instruments[3] 
        }
    
    return params["tempo"], params["chords"], params["lead"], params["harmony"], params["bass"], params["drums"]


# ----------------- Función Principal de Generación -----------------

def generate_music_sequence(genre="ambiente"):
    """
    Genera una secuencia MIDI compleja de ~60 segundos usando 4 tracks e instrumentos únicos.
    """
    
    tempo, chord_structure, LEAD_INST, HARMONY_INST, BASS_INST, DRUM_INST = get_genre_parameters(genre)
    
    TOTAL_DURATION = 60.0 
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

    time = 0.0
    volume_lead = 100
    volume_harmony = 85
    volume_bass = 95
    volume_drums = 110
    
    base_note_chord = random.randint(55, 60) 
    base_note_lead = base_note_chord + 12 
    
    # Loop de Generación
    while time < TOTAL_DURATION:
        
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
    filename = f"music_{genre.replace(' ', '_')}_{random.randint(1000, 9999)}.mid"
    filepath = os.path.join(MUSIC_DIR, filename)

    try:
        with open(filepath, "wb") as output_file:
            midi_file.writeFile(output_file)
        
        return filename
    except Exception as e:
        print(f"Error al escribir el archivo MIDI: {e}")
        return None
