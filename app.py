import spacy
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import sys

# ===============================================
# CONFIGURACIÓN E INICIALIZACIÓN DE SPACY
# (CRÍTICO: Depende de que el Build Command haya instalado el modelo)
# ===============================================

try:
    # Se carga el modelo de spaCy para español (guion bajo para el nombre del modelo instalado)
    nlp = spacy.load("es_core_news_sm")
    print("Módulo app: spaCy cargado exitosamente para análisis.")
except OSError as e:
    # Si el modelo no se encuentra, se imprime un error y se permite que Flask continúe (con funcionalidad limitada)
    print(f"Módulo app: Error CRÍTICO al cargar el modelo de spaCy: {e}")
    nlp = None

# Inicialización de la aplicación Flask
app = Flask(__name__,
            static_folder='static',
            template_folder='templates')
CORS(app)

# ===============================================
# FUNCIÓN DE BÚSQUEDA Y ANÁLISIS
# ===============================================

def google_search_and_summarize(query):
    """
    Usa spaCy para refinar el término de búsqueda y luego usa la herramienta
    de búsqueda de Google para obtener snippets y fuentes.
    """
    search_term = ""

    if nlp:
        doc = nlp(query)

        # 1. Priorizar Entidades Nombradas (PER, LOC, ORG)
        for ent in doc.ents:
            if ent.label_ in ["PER", "LOC", "ORG", "MISC", "PERSON", "GPE"]:
                search_term = ent.text
                break

        # 2. Si no hay entidades, buscar el Sujeto principal (Noun Chunk)
        if not search_term:
            for chunk in doc.noun_chunks:
                search_term = chunk.text
                break

    # 3. Si sigue vacío, usar la consulta completa
    if not search_term:
        search_term = query

    # Limpiar el término de búsqueda de artículos iniciales
    if search_term.lower().startswith(('el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'de ', 'del ', 'dime sobre ')):
        search_term = search_term.split(' ', 1)[-1]
        
    search_term = search_term.replace('?', '').replace('¿', '').strip()
    
    # Simulación de la herramienta de búsqueda de Google
    print(f"Buscando en Google el término refinado: '{search_term}'")
    
    # Paso 1: Llamar a la herramienta de búsqueda con el término refinado
    try:
        search_results = google.search(queries=[search_term])
    except Exception as e:
        return f"Lo siento, la herramienta de búsqueda de Google falló. Detalles: {e}", []

    # Paso 2: Formatear la respuesta
    summary = []
    sources = []
    
    if 'knowledge_graph' in search_results and search_results['knowledge_graph']:
        kg = search_results['knowledge_graph']
        summary.append(f"**{kg.get('title', search_term)}**")
        if 'snippet' in kg:
             summary.append(kg['snippet'])

    if 'snippets' in search_results and search_results['snippets']:
        # Tomar los 2-3 mejores snippets para el resumen
        for i, snippet in enumerate(search_results['snippets'][:3]):
            summary.append(snippet)
            sources.append(f"[{i+1}] {snippet.get('source_title', 'Fuente desconocida')}: {snippet.get('url', '#')}")

    if not summary:
        return f"No se encontró información relevante en la web para '{search_term}'.", []

    final_response = "**[Resultado de Búsqueda Web]**\n\n"
    final_response += "\n\n".join(summary)
    
    final_response += "\n\n---\n**Fuentes:**\n"
    final_response += "\n".join(sources)
    
    return final_response, sources


def process_user_query(user_text):
    """
    Función principal que clasifica y llama a la búsqueda.
    """
    user_text = user_text.strip()
    
    if not nlp:
        return "Lo siento, el módulo de análisis de lenguaje (spaCy) no se cargó correctamente en el servidor. La búsqueda avanzada está deshabilitada."

    # 1. Clasificación de búsqueda: Preguntas que requieren información externa
    if user_text.lower().startswith(("quién es", "¿quién es", "qué es", "¿qué es", "dónde está", "cuándo fue", "¿cuál es", "dime sobre", "busca", "como hago")):
        
        # Llama a la búsqueda en la web
        response, _ = google_search_and_summarize(user_text)
        return response
        
    # 2. Respuestas Conversacionales (Reglas Simples)
    if "hola" in user_text.lower() or "saludo" in user_text.lower():
        return "¡Hola! Soy PACURE IA, tu asistente de IA. Estoy lista para buscar información en la web o conversar contigo. ¿En qué puedo ayudarte hoy?"
    
    # 3. Respuesta Predeterminada (Fallback)
    return "No estoy seguro de cómo procesar esa solicitud o comentario. Por favor, pregunta algo que pueda buscar en la web (Ej: '¿Qué es la IA?') o salúdame. 💡"


# ===============================================
# RUTAS DE LA APLICACIÓN WEB
# ===============================================

@app.route('/')
def index():
    """Ruta principal para servir el HTML."""
    return render_template('index.html') 

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Ruta para servir archivos estáticos (CSS, JS)."""
    return send_from_directory(app.static_folder, filename)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Procesa la pregunta del usuario y devuelve la respuesta de la IA."""
    try:
        data = request.get_json()
        user_question = data.get('query', '').strip()
        
        if not user_question:
            return jsonify({"response": "Por favor, ingresa una pregunta válida."}), 400

        # LLAMA A LA LÓGICA DE LA IA
        ai_response = process_user_query(user_question) 
        
        # Devuelve la respuesta en formato JSON
        return jsonify({"response": ai_response})

    except Exception as e:
        print(f"Error interno del servidor al procesar la solicitud: {e}")
        return jsonify({
            "response": "Lo siento, el servidor PACURE IA falló al procesar tu solicitud. 😥"
        }), 500

# ===============================================
# EJECUCIÓN DEL SERVIDOR
# ===============================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Deshabilitar el reloader de Flask si se usa spaCy, para evitar doble carga del modelo
    app.run(host='0.0.0.0', port=port)
