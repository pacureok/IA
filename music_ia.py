# music_ia.py

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
    
    # Instrumentos MIDI comunes (Preset)
    LEAD_INSTRUMENT = 1 # Bright Acoustic Piano
    BASS_INSTRUMENT = 34 # Electric Bass (Finger)

    if "jazz" in genre or "blues" in genre:
        tempo = 90
        chord_structure = [0, 3, 7, 10]  # Menor 7
        LEAD_INSTRUMENT = 49 # String Ensemble 1
    elif "electrónica" in genre or "techno" in genre or "dance" in genre:
        tempo = 135
        chord_structure = [0, 7, 12]  # Power chord
        LEAD_INSTRUMENT = 81 # Saw Wave
    elif "pop" in genre or "rock" in genre:
        tempo = 110
        chord_structure = [0, 4, 7]  # Mayor
        LEAD_INSTRUMENT = 30 # Overdriven Guitar
    else:
        # Por defecto: ambiente (Ambient/Simple)
        tempo = 70
        chord_structure = [0, 7] # Octave
        LEAD_INSTRUMENT = 89 # Pad 4 (Choir)

    return tempo, chord_structure, LEAD_INSTRUMENT, BASS_INSTRUMENT

def generate_music_sequence(genre="ambiente"):
    """
    Genera una secuencia MIDI compleja de ~60 segundos y la guarda en un archivo.
    """
    
    # 1. Definir parámetros
    tempo, chord_structure, LEAD_INSTRUMENT, BASS_INSTRUMENT = get_genre_parameters(genre)
    
    # Duración: Aumentamos a 1 minuto (60 segundos)
    TOTAL_DURATION = 60 
    
    # 2. Configuración MIDI
    
    # El archivo ahora tiene 2 tracks: 0 para LEAD, 1 para BASS
    midi_file = MIDIFile(2) 
    
    # Configurar Tempo
    midi_file.addTempo(0, 0, tempo) # Track 0
    midi_file.addTempo(1, 0, tempo) # Track 1
    
    # Configurar Instrumentos
    midi_file.addProgramChange(0, 0, 0, LEAD_INSTRUMENT) # Track 0, Channel 0, Time 0
    midi_file.addProgramChange(1, 1, 0, BASS_INSTRUMENT) # Track 1, Channel 1, Time 0
    
    # Parámetros de la secuencia
    time = 0.0
    volume = 100
    base_note_chord = random.randint(55, 60) # C3/D3 para los acordes
    base_note_lead = base_note_chord + 7 # Una octava superior para la melodía
    
    # Loop de Generación
    while time < TOTAL_DURATION:
        
        # Longitud base del beat (4 tiempos por minuto)
        beat_length = 60 / tempo * 4 / 4 
        
        # --------------- GENERACIÓN DEL BASS/RITMO (Track 1) ---------------
        
        # El bajo toca la nota tónica (base_note_chord) en un ritmo simple y constante
        bass_note = base_note_chord - 12 # Una octava más abajo
        
        # Patrón rítmico de bajo simple (ej: corchea y silencio)
        for i in range(4): # 4 beats por compás
            midi_file.addNote(1, 1, bass_note, time + (i * beat_length), beat_length, volume - 20)
        
        # --------------- GENERACIÓN DE LA MELODÍA/ACORDES (Track 0) ---------------
        
        # Toca el acorde completo (ritmo base)
        for interval in chord_structure:
            pitch = base_note_chord + interval
            midi_file.addNote(0, 0, pitch, time, beat_length * 4, volume) # Acorde largo
        
        # Toca la melodía (más complejo y rápido)
        current_time = time
        for _ in range(int(8 * (4 / beat_length))): # 8 secciones de variación rítmica por compás
            
            # 1. Variación Rítmica: Elige entre corchea (0.5), negra (1) o blanca (2)
            note_duration = random.choice([beat_length / 2, beat_length, beat_length * 2])
            
            if current_time + note_duration > time + beat_length * 4: # No exceder el compás
                break

            # 2. Variación Melódica: Elige una nota en la escala o una nota del acorde
            note_choice = random.choice(chord_structure + [2, 5, 9, 14]) 
            pitch = base_note_lead + note_choice + random.randint(-3, 3) # Leve variación de pitch
            
            if random.random() < 0.7: # 70% de probabilidad de que toque una nota
                midi_file.addNote(0, 0, pitch, current_time, note_duration, volume)

            current_time += note_duration


        # 3. Progresión Armónica: Cambia la nota base para el siguiente compás
        
        # Movimiento común en música (I-IV, I-V, etc.)
        if random.random() < 0.5:
             base_note_chord += random.choice([0, 5, -7]) # No cambia, o sube una 4ta (5), o baja una 5ta (-7)
        else:
             base_note_chord += random.choice([-2, 2, 4]) # Movimientos más pequeños
        
        # Asegurar que el rango sea razonable
        base_note_chord = max(50, min(70, base_note_chord)) 
        base_note_lead = base_note_chord + 12 # Melodía una octava arriba

        # Avanza 4 tiempos de beat length (un compás)
        time += beat_length * 4 


    # 4. Guardar el archivo
    filename = f"music_{genre.replace(' ', '_')}_{random.randint(1000, 9999)}.mid"
    filepath = os.path.join(MUSIC_DIR, filename)

    try:
        with open(filepath, "wb") as output_file:
            midi_file.writeFile(output_file)
        
        print(f"Música generada (60s) en: {filepath}")
        return filename
    except Exception as e:
        print(f"Error al escribir el archivo MIDI: {e}")
        return None
        
