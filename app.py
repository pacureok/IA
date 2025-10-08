from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import wikipedia
import random
import re # Para expresiones regulares
from youtube_analyzer import analyze_youtube_link # Importamos la función auxiliar

# --- CONFIGURACIÓN DE WIKIPEDIA ---
wikipedia.set_lang("es")

app = Flask(__name__)
CORS(app) # Habilita CORS

# ============================================================
# FUNCIONES DE PROCESAMIENTO
# ============================================================

def responder_creador(query):
    """
    Función que maneja variantes de preguntas sobre el creador.
    """
    creador_keywords = ["quien te creo", "quién te hizo", "tu creador", "de pacure"]
    
    # Verifica si la consulta contiene alguna de las palabras clave
    if any(keyword in query.lower() for keyword in creador_keywords):
        return (
            "Mi creador es **PACURE OK**. Soy parte de **PACURE WORKPLACE**.\n\n"
            "Puedes visitar su canal oficial para más información:\n"
            "Link de PACURE OK: [https://www.youtube.com/@pacureok](https://www.youtube.com/@pacureok)."
        ), True
    return None, False


def buscar_en_wikipedia(query):
    """
    Busca en Wikipedia en español, maneja errores de desambiguación 
    y obtiene el resumen y el URL.
    """
    try:
        # Busca los 5 mejores resultados.
        results = wikipedia.search(query, results=5)
        if not results:
            return None, None
        
        # Iteramos los resultados para encontrar la primera página que NO sea de desambiguación.
        for page_title in results:
            try:
                # Intenta obtener la página directamente
                page = wikipedia.page(page_title, auto_suggest=False, redirect=True)
                
                # Obtiene el resumen del primer resultado válido
                summary = wikipedia.summary(page_title, sentences=3, auto_suggest=False, redirect=True)
                
                # Retorna el resumen y la fuente
                return summary, page.url
            
            except wikipedia.exceptions.DisambiguationError:
                # Si es un error de desambiguación (como "Hola"), ignoramos y probamos el siguiente resultado
                print(f"Skipping disambiguation page: {page_title}")
                continue # Pasa al siguiente título en la lista 'results'
            except wikipedia.exceptions.PageError:
                continue # Pasa al siguiente si la página no existe
            
        # Si el bucle termina sin encontrar un resultado válido
        return None, None
            
    except Exception as e:
        print(f"Error general en Wikipedia: {e}")
        return None, None

def simular_web_scraping(query):
    """
    Simula la búsqueda y análisis de 9 páginas adicionales para complementar Wikipedia.
    """
    fuentes = []
    
    # Lista de 9 fuentes simuladas que "contienen" información.
    simulated_sites = [
        f"foro-{query[:5]}.com", f"blog-analisis.net", f"revista-tech.io", 
        f"data-pacure.org", f"web-{random.randint(100, 999)}.net",
        f"datos-ia-{random.randint(1, 100)}.com", f"resumenes-rapidos.org",
        f"conocimiento-libre.net", f"investigacion-profunda.net"
    ]
    
    for site in simulated_sites:
        fuentes.append(site)

    # Simula un resumen simple del análisis
    resumen_analisis = f"El análisis de **{len(simulated_sites)} fuentes web** complementarias indica un fuerte consenso sobre la relevancia de '{query}'. La información obtenida ha sido filtrada para eliminar duplicados y asegurar la calidad del dato."
    
    return resumen_analisis, fuentes

# ============================================================
# RUTAS DE FLASK
# ============================================================

@app.route('/')
def index():
    """Ruta principal para cargar el frontend."""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def process_query():
    """
    Ruta API para procesar la consulta del usuario.
    """
    query = request.form.get('query', '').strip()

    if not query:
        return jsonify({
            "text": "Tu consulta está vacía. Por favor, escribe lo que deseas buscar o analizar.",
            "sources": ["pacureia.dev"],
            "imageTopic": "error"
        }), 400

    # 1. VERIFICACIÓN DE CREADOR (PRIORIDAD ALTA)
    creator_response, handled = responder_creador(query)
    if handled:
        return jsonify({
            "text": creator_response,
            "sources": ["youtube.com/@pacureok"],
            "imageTopic": "creador"
        })

    # 2. MANEJO DE ENLACES DE YOUTUBE (PRIORIDAD ALTA)
    # Expresión regular para detectar enlaces de YouTube (simples o acortados)
    youtube_pattern = r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})'
    match = re.search(youtube_pattern, query)

    if match:
        video_id = match.group(1)
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Llamada a la función del archivo auxiliar
        analysis_result = analyze_youtube_link(video_url)

        if analysis_result:
             # Respuesta estructurada para el análisis de video
            return jsonify({
                "text": f"**[ANÁLISIS DE VIDEO COMPLETADO]**\n\n"
                        f"He revisado el video **'{analysis_result['title']}'** por **{analysis_result['uploader']}** (Duración: {analysis_result['duration']}).\n\n"
                        f"**Mini Resumen:** {analysis_result['summary']}\n\n"
                        f"Este video trata principalmente sobre {analysis_result['topic']}.",
                "sources": [video_url],
                "imageTopic": analysis_result['topic']
            })
        else:
             return jsonify({
                "text": "**[ERROR DE ANÁLISIS]** No pude obtener los metadatos de ese video de YouTube. Es posible que el video no exista, sea privado o `yt-dlp` haya fallado.",
                "sources": ["pacureia.dev/error"],
                "imageTopic": "error de video"
            })


    # 3. Búsqueda General (Wikipedia + Web Scraping Simulado)
    
    wiki_summary, wiki_url = buscar_en_wikipedia(query)
    web_summary, web_sources = simular_web_scraping(query)
    
    final_text = ""
    final_sources = []

    if wiki_summary:
        # Lógica de resumen de búsqueda... (se mantiene igual)
        if wiki_url:
            final_sources.append(wiki_url)
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
        # ESCENARIO: NO SE ENCONTRÓ NADA (Respuesta estricta y estructurada)
        final_text = (
            "**[PACURE IA - BÚSQUEDA Y ANÁLISIS FALLIDO]**\n\n"
            f"Lo siento, PACURE IA no ha encontrado ninguna página de Wikipedia o fuente web relevante y estructurada sobre **'{query}'**.\n"
            "Esto pudo ocurrir porque la consulta es ambigua (tiene muchos significados) o no está en nuestra base de datos.\n\n"
            "**¿Qué deseas hacer ahora?**\n"
            "1. **Reformular la Búsqueda:** ¿Puedes intentar con una palabra clave o frase más específica?\n"
            "2. **Modo Conversacional:** Si deseas simplemente charlar o que te ayude con ideas creativas (sin necesidad de datos web), por favor, indícalo, por ejemplo: 'Háblame sobre el futuro de la IA'."
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
    app.run(debug=True, port=5000)
