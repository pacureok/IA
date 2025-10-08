import yt_dlp
import math

def format_duration(seconds):
    """Convierte segundos a formato H:MM:SS."""
    if seconds is None:
        return "N/A"
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    remaining_seconds = seconds % 60
    
    if hours > 0:
        return f"{hours}:{minutes:02}:{remaining_seconds:02}"
    return f"{minutes:02}:{remaining_seconds:02}"

def analyze_youtube_link(url):
    """
    Extrae metadatos reales de un video de YouTube y simula un resumen.
    Esta función es REAL para la extracción, pero SIMULA el resumen.
    """
    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'skip_download': True,
        'forcemetadata': True,
        'extract_flat': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        # Extracción de metadatos reales
        title = info.get('title', 'Título Desconocido')
        uploader = info.get('uploader', 'Canal Desconocido')
        description = info.get('description', 'Sin descripción')
        duration_sec = info.get('duration')
        
        formatted_duration = format_duration(duration_sec)
        
        # SIMULACIÓN DEL RESUMEN Y TEMA (Requiere IA real, aquí es heurística)
        
        # Usamos la descripción para crear una simulación de resumen
        summary_sentences = description.split('.')
        mini_summary = summary_sentences[0] if summary_sentences else "El video no tiene descripción detallada."
        
        # Tema basado en la longitud del título (simulación)
        topic = "entretenimiento general"
        if len(title.split()) > 7 and "tutorial" in title.lower():
            topic = "guía técnica y tutoriales"
        elif "marketing" in title.lower() or "negocio" in title.lower():
             topic = "negocios y finanzas"
        elif "pacure" in uploader.lower() or "pacure" in title.lower():
             topic = "contenido de PACURE OK"


        return {
            "title": title,
            "uploader": uploader,
            "duration": formatted_duration,
            "summary": mini_summary,
            "topic": topic
        }

    except Exception as e:
        print(f"Error al analizar YouTube con yt-dlp: {e}")
        return None
