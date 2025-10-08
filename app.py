from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

# ============================================================
# BASE DE CONOCIMIENTO LOCAL (Simulación de Búsqueda en 10 Fuentes)
# ============================================================
LOCAL_KNOWLEDGE_BASE = {
    "marketing": {
        "summary": "El **plan de marketing digital** para YouTube, tras analizar 10 fuentes (incluyendo Wikipedia), debe enfocarse en: 1) **SEO de Video** (títulos, etiquetas, descripciones ricas en palabras clave), 2) **Miniaturas Clickbait Éticas** y 3) **Análisis de Retención** (mantener al espectador en los primeros 30 segundos). La IA ha consolidado las mejores prácticas de los sitios de estrategia de contenido. Este es un resumen analizado y depurado.",
        "sources": ["Wikipedia", "MarketingHub", "SearchEngineJournal", "YouTubeCreators", "ContentStrategy.io", "VidIQ", "SocialMediaToday", "NeilPatel", "HubSpot", "PACURE-Research"],
        "imageTopic": "estrategia de marketing"
    },
    "música": {
        "summary": "El análisis de las 10 mejores fuentes sobre **generación musical por IA** concluye que una pieza de **música electrónica alegre de 15 segundos** debe tener un tempo entre 128 y 135 BPM y utilizar un *sidechain compression* sutil. Se recomienda la escala **Do Mayor** o **Sol Mayor**. La IA ha sintetizado los requisitos técnicos para garantizar una pieza enérgica y libre de derechos.",
        "sources": ["Wikipedia", "MusicTheory.net", "SynthesizerMag", "AudioProTools", "BPMAnalyzer", "AI-Music-Blog", "SoundOnSound", "PACURE-Syntesis", "Reddit/WeAreTheMusicMakers", "Synthtopia"],
        "musicUrl": "/static/music_output/music_simulado.mp3",
        "imageTopic": "generación de música"
    },
    "google": {
        "summary": "La búsqueda en 10 fuentes (incluyendo el artículo histórico de Wikipedia) revela que **Google** inició como el motor 'Backrub' en 1996, desarrollado por Larry Page y Sergey Brin en Stanford. Su principal innovación, el algoritmo **PageRank**, revolucionó la búsqueda al usar los enlaces entrantes (backlinks) como 'votos' de importancia, superando a los métodos de indexación basados únicamente en la frecuencia de palabras.",
        "sources": ["Wikipedia", "HistoryOfTech", "Stanford.edu", "TechCrunch", "Wired", "PACURE-Historial", "EncyclopediaBritannica", "SEOHistory.com", "PageRankPaper", "GoogleBlog"],
        "imageTopic": "historia de google"
    },
    "defecto": {
        "summary": "La IA ha intentado buscar y analizar información en 10 páginas diferentes, incluyendo Wikipedia, pero no se ha encontrado una correlación clara para **'{{query}}'**. Por favor, intenta reformular la pregunta para que la búsqueda sea más precisa y permita un resumen consolidado.",
        "sources": ["PACURE-Search", "PACURE-Analysis", "PACURE-Summary"],
        "imageTopic": "búsqueda fallida"
    }
}

# ============================================================
# RUTAS DE FLASK
# ============================================================

@app.route('/')
def index():
    """Ruta principal para cargar el frontend."""
    # Necesitas un archivo templates/index.html para que esto funcione
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def process_query():
    """
    Ruta API para simular el proceso de Búsqueda Web, Análisis y Resumen.
    """
    
    # 1. Obtener datos de la consulta
    query = request.form.get('query', '').lower()
    files = request.files.getlist('files')

    print(f"Consulta recibida: {query}")
    print(f"Archivos adjuntos: {len(files)}")
    
    # 2. Lógica de Búsqueda (Simulada para 10 fuentes)
    
    found_key = None
    
    # Buscamos coincidencias con las claves de nuestra base de conocimiento simulada
    for key in LOCAL_KNOWLEDGE_BASE:
        if key in query:
            found_key = key
            break
            
    
    # 3. GENERACIÓN DE RESPUESTA Y RESUMEN
    
    # Si hay archivos adjuntos, priorizamos el análisis de documentos
    if files:
        response_data = {
            "text": f"**[PROCESAMIENTO DE DOCUMENTOS]** La IA ha subido y está analizando el contenido de **{len(files)} archivo(s)**. El proceso de resumen de documentos y extracción de información clave ha comenzado.",
            "sources": ["PACURE-File-Processor", "PACURE-Document-Analysis"],
            "imageTopic": "analizando documentos"
        }
        
    # Si encontramos una palabra clave, generamos el resumen basado en 10 fuentes
    elif found_key and found_key != 'defecto':
        knowledge = LOCAL_KNOWLEDGE_BASE[found_key]
        
        # Generamos la respuesta con el resumen
        response_data = {
            "text": knowledge['summary'],
            "sources": knowledge['sources'][:random.randint(3, 7)], # Mostramos un subconjunto aleatorio de fuentes
            "imageTopic": knowledge.get('imageTopic', 'analisis'),
            "musicUrl": knowledge.get('musicUrl')
        }
        
    # Si no encontramos nada, usamos la respuesta por defecto
    else:
        # Usamos la plantilla de defecto y reemplazamos la variable {{query}}
        default_knowledge = LOCAL_KNOWLEDGE_BASE['defecto']
        response_data = {
            "text": default_knowledge['summary'].replace("{{query}}", request.form.get('query')),
            "sources": default_knowledge['sources'],
            "imageTopic": default_knowledge['imageTopic']
        }
        
    # 4. Devolver la respuesta al frontend (como JSON)
    return jsonify(response_data)

if __name__ == '__main__':
    # Siempre que trabajes con Python y Flask, usa debug=True para desarrollo.
    app.run(debug=True, port=5000)
