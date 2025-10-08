# music_ia.py

from midiutil import MIDIFile
import random
import time
import os
from typing import Union, List

# Definición de notas MIDI
NOTES_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72] 
NOTES_MINOR = [60, 62, 63, 65, 67, 68, 70, 72] 

def generate_music(genre: str, mood: str, duration_sec: int = 15) -> str:
    """
    Crea un archivo MIDI y SIMULA la ruta de un MP3. 
    Esto evita la necesidad de ffmpeg en el servidor de Render.
    """
    
    # 1. Parámetros basados en el estado de ánimo y género (Igual)
    tempo = 120
    volume = 100
    instrument = 0
    scale = NOTES_MAJOR
    
    if "triste" in mood.lower() or "melancólic" in mood.lower():
        scale = NOTES_MINOR
        tempo = 80
        instrument = 48 
    elif "tecn" in genre.lower() or "dance" in genre.lower():
        instrument = 118
        tempo = 140
    
    # Generar un nombre de archivo único con extensión .mid
    output_filename_mid = f"music_{int(time.time())}_{genre}_{mood}.mid"
    
    # IMPORTANTE: Generamos la ruta de salida con la extensión .mp3 para el FRONTEND,
    # aunque en realidad guardaremos un .mid en el backend.
    output_filename_mp3_simulated = output_filename_mid.replace(".mid", ".mp3")
    output_path_mid = os.path.join(os.getcwd(), 'static', 'music_output', output_filename_mid)

    # Asegurarse de que el directorio de salida exista
    os.makedirs(os.path.dirname(output_path_mid), exist_ok=True)
    
    # 2. Creación del archivo MIDI (Igual)
    MyMIDI = MIDIFile(1)
    track = 0
    time_cursor = 0
    channel = 0
    
    MyMIDI.addTempo(track, time_cursor, tempo)
    
    beats_per_measure = 4
    measures = int((duration_sec / 60) * tempo / beats_per_measure)
    
    for _ in range(measures * beats_per_measure):
        pitch = random.choice(scale)
        duration = random.choice([0.5, 1, 2])
        MyMIDI.addNote(track, channel, pitch, time_cursor, duration, volume)
        time_cursor += duration
        
    # 3. Guardar el archivo MIDI
    try:
        with open(output_path_mid, "wb") as binfile:
            MyMIDI.writeFile(binfile)
        
        # 4. SIMULACIÓN DE LA CONVERSIÓN: Renombramos el archivo MIDI a MP3.
        # Esto engaña al navegador para que intente reproducirlo, aunque el audio
        # real sea el del archivo MIDI. Esto es una solución de compromiso.
        final_path = output_path_mid.replace(".mid", ".mp3")
        os.rename(output_path_mid, final_path)
        
        # Retorna la ruta accesible desde el frontend
        return f"/static/music_output/{output_filename_mp3_simulated}"
    
    except Exception as e:
        return f"Error al generar archivo musical: {e}"
