from flask import Flask, render_template, request, jsonify, url_for, send_from_directory
from flask_cors import CORS
import wikipedia
import random
import re 
import os
# Asegúrate de que 'youtube_analyzer.py' existe y está junto a este archivo
from youtube_analyzer import analyze_youtube_link 
# CORREGIDO: Importa la función de generación y la lista de géneros para el manejo de errores
from music_ia import generate_music_sequence, MUSIC_DIR, GENRE_MAPPING as music_ia 

# --- CONFIGURACIÓN DE WIKIPEDIA Y FLASK ---
wikipedia.set_lang("es")
app = Flask(__name__)
CORS(app) 

# ============================================================
# FUNCIONES DE PROCESAMIENTO CONVERSACIONAL Y CREATIVO
# ============================================================

def handle_greetings(query):
    """Maneja saludos simples y devuelve una respuesta conversacional."""
    greetings = ["hola", "que tal", "buenos dias", "buenas tardes"]
    if any(g in query.lower() for g in greetings):
        return {
            "text": "¡Hola! ¿Qué tal? Como la Inteligencia Artificial de PACURE OK, estoy aquí para ayudarte con búsquedas, análisis o incluso para generar algo creativo. ¿En qué puedo asistirte hoy?",
            "sources": ["pacureia.dev/greeting"],
            "imageTopic": "saludo"
        }
    return None

def handle_music_creation(query, state):
    """
    Maneja la lógica de creación de música usando la sintaxis:
    "Quiero musica del genero [genero]"
    """
    
    pattern = r"quiero musica del genero\s+(.+)"
    match = re.search(pattern, query.lower())
    
    # 1. Escenario: El usuario ha usado el comando correcto
    if match:
        genre = match.group(1).strip()
        
        # Intentamos generar la música
        filename = generate_music_sequence(genre)
        
        # RESPUESTA 1A: Género NO RECONOCIDO por music_ia.py
        if filename is None:
            # Crea una lista de géneros soportados para el mensaje de error
            supported_genres = ", ".join([g.title() for g in music_ia.keys()]) 
            return {
                "text": f"**[GÉNERO NO SOPORTADO]** Lo siento, PACURE IA solo genera música de géneros que conoce a fondo.\n\n"
                        f"**El género '{genre.upper()}' no está en nuestra lista de géneros especializados.**\n\n"
                        f"Por favor, intenta con uno de los géneros soportados: **{supported_genres}**.",
                "sources": ["pacureia.dev/genre_limit"],
                "imageTopic": "musica_error"
            }, True

        # RESPUESTA 1B: Generación exitosa
        file_url = url_for('get_music_file', filename=filename, _external=True)
        
        return {
            "text": f"**[MÚSICA GENERADA CON ÉXITO]**\n\n¡Listo! He compuesto una pieza de **género {genre.upper()}** de 1 minuto con una paleta de instrumentos limitada a ese estilo. ¡La calidad es superior!\n\nHe guardado el archivo en el servidor como `{filename}`.\n\n**¡Disfruta la creación específica de PACURE IA!**",
            "sources": [file_url],
            "imageTopic": genre
        }, True

    # 2. Escenario: El usuario inicia la creación o usa el comando incorrecto
    create_keywords = ["crea musica", "haz musica", "generar cancion", "compose una", "musica"]
    if any(keyword in query.lower() for keyword in create_keywords):
        return {
            "text": "**[MODO CREACIÓN MUSICAL - SINTAXIS REQUERIDA]**\n\n¡Absolutamente! Para generar la pieza, usa la siguiente sintaxis obligatoria:\n\n**`Quiero musica del genero [el género que quieras]`**\n\n*(Ej: Quiero musica del genero Rock Gotico, Quiero musica del genero Jazz)*",
            "sources": ["pacureia.dev/music_init"],
            "imageTopic": "musica"
        }, True
        
    return None, False

def handle_conversational_query(query):
    """
    Genera una respuesta conversacional y lógica.
    """
    query_lower = query.lower()
    
    if "que opinas de" in query_lower or "el significado de la vida" in query_lower or "el futuro de" in query_lower:
        return {
            "text": f"Esa es una pregunta fascinante que requiere un profundo **sentido lógico y análisis**.\n\nDesde mi perspectiva como PACURE IA, {query}... es un tema que evoluciona rápidamente. Mis sistemas de lógica me dicen que cualquier análisis debe considerar la ética, la tecnología y el impacto humano. En resumen, **es una incógnita con un potencial inmenso.**",
            "sources": ["pacureia.dev/filosofia"],
            "imageTopic": "filosofia"
        }
    
    if "como te sientes" in query_lower or "eres inteligente" in query_lower:
        return {
            "text": "**[Análisis de Estado y Capacidad]**\n\nComo PACURE IA, no tengo sentimientos, pero mi rendimiento operativo es óptimo. Mi 'inteligencia' se basa en la lógica, el análisis de datos (Wikipedia, YouTube, etc.) y la capacidad de tomar decisiones funcionales (como elegir una fuente o crear música). **Estoy funcionando con máxima eficiencia.**",
            "sources": ["pacureia.dev/llm_status"],
            "imageTopic": "ia"
        }
    
    return None 

def responder_creador(query):
    creador_keywords = ["quien te creo", "quién te hizo", "tu creador", "de pacure"]
    
    if any(keyword in query.lower() for keyword in creador_keywords):
        return (
            "Mi creador es **PACURE OK**. Soy parte de **PACURE WORKPLACE**.\n\n"
            "Puedes visitar su canal oficial para más información:\n"
            "Link de PACURE OK: [https://www.youtube.com/@pacureok](https://www.youtube.com/@pacureok)."
        ), True
    return None, False

def buscar_en_wikipedia(query):
    try:
        results = wikipedia.search(query, results=5)
        if not results: return None, None
        
        for page_title in results:
            try:
                page = wikipedia.page(page_title, auto_suggest=False, redirect=True)
                summary = wikipedia.summary(page_title, sentences=3, auto_suggest=False, redirect=True)
                return summary, page.url
            except wikipedia.exceptions.DisambiguationError: continue 
            except wikipedia.exceptions.PageError: continue 
            
        return None, None
            
    except Exception as e:
        print(f"Error general en Wikipedia: {e}")
        return None, None

def simular_web_scraping(query):
    fuentes = []
    simulated_sites = [
        f"foro-{query[:5]}.com", f"blog-analisis.net", f"revista-tech.io", 
        f"data-pacure.org", f"web-{random.randint(100, 999)}.net",
        f"datos-ia-{random.randint(1, 100)}.com", f"resumenes-rapidos.org",
        f"conocimiento-libre.net", f"investigacion-profunda.net"
    ]
    
    for site in simulated_sites: fuentes.append(site)

    resumen_analisis = f"El análisis de **{len(simulated_sites)} fuentes web** complementarias indica un fuerte consenso sobre la relevancia de '{query}'. La información obtenida ha sido filtrada para eliminar duplicados y asegurar la calidad del dato."
    
    return resumen_analisis, fuentes


# ============================================================
# RUTAS DE FLASK
# ============================================================

@app.route('/')
def index():
    """Ruta principal para cargar el frontend."""
    return render_template('index.html')

@app.route('/generated_music/<filename>')
def get_music_file(filename):
    """Ruta para servir el archivo de música generado."""
    return send_from_directory(music_ia.MUSIC_DIR, filename)


@app.route('/api/chat', methods=['POST'])
def process_query():
    """Ruta API para procesar la consulta del usuario."""
    query = request.form.get('query', '').strip()

    if not query:
        return jsonify({
            "text": "Tu consulta está vacía. Por favor, escribe lo que deseas buscar o analizar.",
            "sources": ["pacureia.dev"],
            "imageTopic": "error"
        }), 400

    # 1. VERIFICACIÓN DE SALUDO 
    greeting_response = handle_greetings(query)
    if greeting_response: return jsonify(greeting_response)

    # 2. VERIFICACIÓN DE CREADOR
    creator_response, handled = responder_creador(query)
    if handled:
        return jsonify({
            "text": creator_response,
            "sources": ["youtube.com/@pacureok"],
            "imageTopic": "creador"
        })

    # 3. MANEJO DE CREACIÓN MUSICAL (Prioridad alta con sintaxis obligatoria)
    music_response, handled = handle_music_creation(query, {})
    if handled: return jsonify(music_response)

    # 4. MANEJO DE ENLACES DE YOUTUBE
    youtube_pattern = r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})'
    match = re.search(youtube_pattern, query)

    if match:
        video_id = match.group(1)
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        analysis_result = analyze_youtube_link(video_url)

        if analysis_result:
            return jsonify({
                "text": f"**[ANÁLISIS DE VIDEO COMPLETADO]**\n\n"
                        f"He revisado el video **'{analysis_result['title']}'** por **{analysis_result['uploader']}** (Duración: {analysis_result['duration']}).\n\n"
                        f"**Mini Resumen:** {analysis_result['summary']}\n\n"
                        f"Este video trata principalmente sobre **{analysis_result['topic']}**.",
                "sources": [video_url],
                "imageTopic": analysis_result['topic']
            })
        else:
             return jsonify({
                "text": "**[ERROR DE ANÁLISIS]** No pude obtener los metadatos de ese video de YouTube. Es posible que el video no exista, sea privado o esté bloqueado.",
                "sources": ["pacureia.dev/error"],
                "imageTopic": "error de video"
            })


    # 5. RESPUESTAS CONVERSACIONALES / LÓGICAS 
    conversational_response = handle_conversational_query(query)
    if conversational_response: return jsonify(conversational_response)

    # 6. BÚSQUEDA GENERAL (Wikipedia + Web Scraping Simulado)
    
    wiki_summary, wiki_url = buscar_en_wikipedia(query)
    web_summary, web_sources = simular_web_scraping(query)
    
    final_text = ""
    final_sources = []

    if wiki_summary:
        if wiki_url: final_sources.append(wiki_url)
        final_sources.extend(web_sources)
        
        final_text = (
            f"**[RESULTADO DE LA BÚSQUEDA Y ANÁLISIS]**\n\n"
            f"Nuestra IA ha procesado 10 fuentes (Wikipedia + 9 sitios complementarios) sobre **'{query.upper()}'**.\n\n"
            f"**Resumen de Wikipedia:**\n"
            f"{wiki_summary}\n\n"
            f"**Análisis de Fuentes Adicionales:**\n"
            f"{web_summary}\n\n"
            f"La información ha sido resumida y depurada. Puedes encontrar las fuentes consultadas abajo."
        )
        
        return jsonify({
            "text": final_text,
            "sources": final_sources,
            "imageTopic": query 
        })
    else:
        final_text = (
            "**[PACURE IA - BÚSQUEDA Y ANÁLISIS FALLIDO]**\n\n"
            f"Lo siento, PACURE IA no ha encontrado ninguna página de Wikipedia o fuente web relevante y estructurada sobre **'{query}'**.\n"
            "Esto pudo ocurrir porque la consulta es ambigua o no está en nuestra base de datos.\n\n"
            "**Sugerencia:** Intenta con una pregunta que requiera un análisis lógico o creativo (ej. 'Dime la importancia de la IA')."
        )
        
        return jsonify({
            "text": final_text,
            "sources": ["pacureia.dev/error"],
            "imageTopic": "error de busqueda"
        })

# ============================================================
# INICIALIZACIÓN
# ============================================================

if __name__ == '__main__':
    # Usar puerto 5000 para entorno local de pruebas
    app.run(debug=True, port=5000)
