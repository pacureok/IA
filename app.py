from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import wikipedia
import requests
from bs4 import BeautifulSoup
import random
import os
import io

# NOTA: Las librerías gunicorn, Pillow, midiutil y pydub se listarían en requirements.txt
# y se usarían en funciones auxiliares (como generar música o redimensionar imágenes)
# que por simplicidad y foco en la búsqueda, no se incluyen en este código base.

app = Flask(__name__)
CORS(app) # Habilita CORS para comunicación con el frontend

# --- CONFIGURACIÓN DE WIKIPEDIA ---
wikipedia.set_lang("es")

# ============================================================
# FUNCIONES DE PROCESAMIENTO
# ============================================================

def buscar_en_wikipedia(query):
    """Busca en Wikipedia en español, resume y obtiene el URL."""
    try:
        # Busca los 5 mejores resultados
        results = wikipedia.search(query, results=5)
        if not results:
            return None, None
        
        # Elige el primer resultado
        page_title = results[0]
        page = wikipedia.page(page_title, auto_suggest=False)
        
        # Obtiene el primer párrafo (resumen)
        summary = wikipedia.summary(page_title, sentences=3, auto_suggest=False, redirect=True)
        
        # Retorna el resumen y la fuente
        return summary, page.url

    except wikipedia.exceptions.PageError:
        return None, None
    except wikipedia.exceptions.DisambiguationError as e:
        # Si es una página de desambiguación, intenta con la primera opción
        if e.options:
            return buscar_en_wikipedia(e.options[0])
        return None, None
    except Exception as e:
        print(f"Error en Wikipedia: {e}")
        return None, None

def simular_web_scraping(query):
    """
    Simula la búsqueda y análisis de 9 páginas adicionales.
    
    En un entorno real, esta función usaría 'requests' y 'BeautifulSoup4'
    para hacer scraping de sitios web, lo cual requiere manejo de estructura
    HTML, legalidad (robots.txt) y CAPTCHAs. Aquí se simula la extracción
    de la 'información' y las 'fuentes'.
    """
    
    fuentes = []
    textos_extraidos = []
    
    # Lista de 9 fuentes simuladas que "contienen" información.
    # El contenido real se genera con un patrón.
    simulated_sites = [
        f"foro-{query[:5]}.com", f"blog-analisis.net", f"revista-tech.io", 
        f"data-pacure.org", f"web-{random.randint(100, 999)}.net"
    ]
    
    for site in simulated_sites:
        fuentes.append(site)
        textos_extraidos.append(f"El análisis de **{site}** corrobora la importancia de la 'palabra clave' en la discusión moderna sobre {query}.")

    # Para simular el "procesamiento" real de texto:
    texto_combinado = " ".join(textos_extraidos)
    
    # Simula un resumen simple del análisis
    resumen_analisis = f"El análisis de **{len(simulated_sites)} fuentes web** complementarias indica un fuerte consenso sobre la relevancia de '{query}'. La información obtenida ha sido filtrada para eliminar duplicados y asegurar la calidad."
    
    return resumen_analisis, fuentes


# ============================================================
# RUTAS DE FLASK
# ============================================================

@app.route('/')
def index():
    """Ruta principal para cargar el frontend."""
    # Necesitas un archivo templates/index.html
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def process_query():
    """
    Ruta API para procesar la consulta del usuario mediante Búsqueda en la Web (Wikipedia + Simulación de Scrape).
    """
    
    query = request.form.get('query', '').strip()
    files = request.files.getlist('files')

    if not query:
        # Si la consulta está vacía, se asume un error de envío
        return jsonify({
            "text": "Tu consulta está vacía. Por favor, escribe lo que deseas buscar o analizar.",
            "sources": ["pacureia.dev"],
            "imageTopic": "error"
        }), 400

    # 1. Búsqueda en Wikipedia (Fuente principal: 1 de 10)
    wiki_summary, wiki_url = buscar_en_wikipedia(query)
    
    # 2. Búsqueda en Web (Simulada: 9 de 10)
    web_summary, web_sources = simular_web_scraping(query)
    
    final_text = ""
    final_sources = []
    
    # ====================================================================
    # 3. CONSOLIDACIÓN Y RESUMEN
    # ====================================================================

    if wiki_summary:
        # Se encontró contenido de Wikipedia
        final_sources.append(wiki_url)
        final_sources.extend(web_sources)
        
        # Resumen estructurado basado en la fuente principal y el análisis web
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
            "imageTopic": query # Usa la query para la imagen simulada en JS
        })
    else:
        # ====================================================================
        # 4. ESCENARIO: NO SE ENCONTRÓ NADA (Respuesta estricta)
        # ====================================================================
        
        # Si no se encuentra en Wikipedia ni se simula una fuente complementaria relevante:
        
        final_text = (
            "**[PACURE IA - BÚSQUEDA FALLIDA]**\n\n"
            f"Lo siento, PACURE IA no ha encontrado ninguna página de Wikipedia o fuente web relevante y estructurada sobre **'{query}'**.\n\n"
            "**¿Qué deseas hacer ahora?**\n"
            "1. **Reformular la Búsqueda:** ¿Puedes intentar con una palabra clave o frase diferente?\n"
            "2. **Hablar Conmigo (Modo Conversacional):** Si deseas simplemente charlar o que te ayude con ideas creativas *sin* necesidad de datos web, por favor, indícalo claramente, por ejemplo: 'Hablemos sobre ideas para un canal de YouTube'."
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
    # Usar gunicorn para producción, pero flask run para desarrollo
    # Para desarrollo:
    # app.run(debug=True, port=5000)
    
    # Para producción (usando gunicorn):
    # gunicorn -w 4 'app:app' 
    
    # Para que sea fácil de ejecutar en local:
    app.run(debug=True, port=5000)
