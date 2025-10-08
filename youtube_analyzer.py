import yt_dlp
import math
import requests
from bs4 import BeautifulSoup
import re # Ya estaba en app.py, pero es útil aquí

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

def fallback_scrape_youtube(url):
    """
    Intenta obtener el título y la descripción usando requests y BeautifulSoup
    si yt-dlp falla por bloqueo de bot.
    """
    try:
        # Usamos un user-agent que simula un navegador común para reducir el bloqueo.
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status() # Lanza un error para códigos de estado HTTP malos

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 1. Extraer Título de la etiqueta <title>
        title_tag = soup.find('title')
        raw_title = title_tag.text if title_tag else "Título no disponible por scrape."
        # Limpiar el título (eliminar "- YouTube")
        title = raw_title.replace(" - YouTube", "").strip()

        # 2. Extraer Descripción (de meta tag)
        description_meta = soup.find('meta', {'name': 'description'})
        description = description_meta.get('content') if description_meta else "No se pudo extraer la descripción."
        
        # 3. Extraer Uploader (más difícil, a veces está en meta tag o JSON)
        # Búsqueda de JSON dentro del HTML para encontrar el uploader (HEURÍSTICO)
        uploader = "Canal Desconocido (scrape)"
        uploader_match = re.search(r'"author":"([^"]+)"', response.text)
        if uploader_match:
            uploader = uploader_match.group(1)

        # 4. SIMULACIÓN DE DATOS FALTANTES (Duración, Resumen, Tema)
        
        # Simulación de resumen basado en la descripción
        summary_sentences = description.split('.')
        mini_summary = summary_sentences[0].strip() if summary_sentences and summary_sentences[0].strip() else "El resumen se basa en el análisis heurístico."
        
        # Simulación de tema basada en el título
        topic = "información variada"
        if "marketing" in title.lower() or "negocio" in title.lower():
            topic = "negocios y estrategias"
        elif "pacure" in uploader.lower() or "pacure" in title.lower():
            topic = "contenido exclusivo de PACURE OK"
        
        print(f"Éxito: Scrape fallback para el video. Título: {title}")

        return {
            "title": title,
            "uploader": uploader,
            "duration": "No Disponible (Bloqueo)",
            "summary": mini_summary,
            "topic": topic
        }
    
    except Exception as e:
        print(f"Error fatal en Scrape Fallback: {e}")
        return None


def analyze_youtube_link(url):
    """
    Intenta la extracción completa con yt-dlp y usa el fallback si falla.
    """
    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'skip_download': True,
        'forcemetadata': True,
        'extract_flat': True,
        # Importante: Añadir user-agent puede ayudar a evitar el bloqueo
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }
    
    try:
        # --- INTENTO 1: yt-dlp (El más completo) ---
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        # Extracción de metadatos reales de yt-dlp
        title = info.get('title', 'Título Desconocido')
        uploader = info.get('uploader', 'Canal Desconocido')
        description = info.get('description', 'Sin descripción')
        duration_sec = info.get('duration')
        
        formatted_duration = format_duration(duration_sec)
        
        # SIMULACIÓN DEL RESUMEN Y TEMA 
        summary_sentences = description.split('.')
        mini_summary = summary_sentences[0].strip() if summary_sentences and summary_sentences[0].strip() else "El resumen se basa en la descripción del video."
        
        topic = "entretenimiento general"
        if "marketing" in title.lower() or "tutorial" in title.lower():
            topic = "guía técnica y tutoriales"
        
        print(f"Éxito: Extracción completa con yt-dlp para el video: {title}")
        
        return {
            "title": title,
            "uploader": uploader,
            "duration": formatted_duration,
            "summary": mini_summary,
            "topic": topic
        }

    except Exception as e:
        # El error que reportaste entra aquí (Bloqueo por bot)
        error_message = str(e)
        
        if "Sign in to confirm you’re not a bot" in error_message or "ERROR: Private video" in error_message:
            print("FALLO: Bloqueo de bot/cookies. Intentando Scrape Fallback...")
            # --- INTENTO 2: Scrape Fallback (Solo título/descripción) ---
            return fallback_scrape_youtube(url)
        
        # Si es otro error (ej. video no existe)
        print(f"Error no manejado en yt-dlp: {error_message}")
        return None
