# music_ia.py

from midiutil import MIDIFile
import random
import time
import os
from typing import Optional

# Definición de notas MIDI
# C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72
NOTES_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72] # C Mayor
NOTES_MINOR = [60, 62, 63, 65, 67, 68, 70, 72] # C Menor

def generate_music(genre: str, mood: str, duration_sec: int = 15) -> str:
    """
    Crea un archivo MIDI basado en el género y estado de ánimo.

    Args:
        genre: El estilo musical deseado (pop, jazz, techno, etc.).
        mood: El estado de ánimo (alegre, triste, relajante).
        duration_sec: Duración aproximada en segundos.

    Returns:
        La ruta simulada del archivo MP3 o un mensaje de error.
    """
    
    # 1. Parámetros basados en el estado de ánimo y género
    tempo = 120
    volume = 100
    instrument = 0  # 0: Piano acústico
    scale = NOTES_MAJOR
    
    if "triste" in mood.lower() or "melancólic" in mood.lower():
        scale = NOTES_MINOR
        tempo = 80
        instrument = 48 # Strings
    elif "tecn" in genre.lower() or "dance" in genre.lower():
        instrument = 118 # Synth Drum
        tempo = 140
    
    # Generar un nombre de archivo único
    output_filename = f"music_{int(time.time())}_{genre}_{mood}.mid"
    output_path = os.path.join(os.getcwd(), 'static', 'music_output', output_filename)

    # Asegurarse de que el directorio de salida exista
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # 2. Creación del archivo MIDI
    MyMIDI = MIDIFile(1)  # Un track
    track = 0
    time_cursor = 0
    channel = 0
    
    MyMIDI.addTempo(track, time_cursor, tempo)
    
    # Llenar el track con notas aleatorias basadas en la escala
    beats_per_measure = 4
    measures = int((duration_sec / 60) * tempo / beats_per_measure)
    
    for _ in range(measures * beats_per_measure):
        # Seleccionar una nota aleatoria de la escala
        pitch = random.choice(scale)
        duration = random.choice([0.5, 1, 2]) # Corchea, Negra, Blanca
        
        MyMIDI.addNote(track, channel, pitch, time_cursor, duration, volume)
        time_cursor += duration
        
    # 3. Guardar el archivo MIDI
    try:
        with open(output_path, "wb") as binfile:
            MyMIDI.writeFile(binfile)
        
        # 4. SIMULACIÓN DE CONVERSIÓN a MP3 (si no se tiene ffmpeg/pydub)
        # En una implementación real, aquí se usaría pydub.
        # file_mp3 = output_path.replace(".mid", ".mp3")
        # AudioSegment.from_midi(output_path).export(file_mp3, format="mp3")

        # Retorna la ruta accesible desde el frontend
        return f"/static/music_output/{output_filename.replace('.mid', '.mp3')}" # Simulamos que es mp3
    
    except Exception as e:
        # Esto podría fallar si falta el directorio o permisos
        return f"Error al generar archivo musical: {e}"

if __name__ == '__main__':
    # Ejemplo de uso: Generar una pieza pop alegre de 10 segundos
    result = generate_music(genre="pop", mood="alegre", duration_sec=10)
    print(f"Ruta del archivo generado (simulada/MIDI): {result}")
