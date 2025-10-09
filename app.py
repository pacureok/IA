from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import re
import os
import random
# Importa la herramienta de Google Search
from google import search

# --- CONFIGURACIÓN DE FLASK ---
app = Flask(__name__)
CORS(app) 

# ============================================================
# FUNCIONES DE PROCESAMIENTO
# ============================================================

def handle_greetings(query):
    """Maneja saludos simples y devuelve una respuesta conversacional."""
    greetings = ["hola", "qué tal", "buenos días", "buenas tardes", "que tal"]
    if any(g in query.lower() for g in greetings):
        return {
            "text": "¡Hola! Como la IA de PACURE OK, estoy lista para ayudarte a **buscar información** en la web y resumirla. ¿Qué deseas buscar hoy?",
            "sources": ["pacureia.dev/greeting"],
            "imageTopic": "saludo"
        }
    return None

def handle_search_query(query):
    """
    Usa la herramienta de búsqueda de Google para encontrar y resumir información.
    Utiliza la consulta completa del usuario.
    """
    search_term = query.strip()
    
    # 1. Ejecutar la búsqueda
    # La herramienta google.search devuelve una lista de resultados, 
    # donde cada elemento contiene los resultados de búsqueda.
    search_results = search(queries=[search_term])
    
    final_text = ""
    final_sources = []
    
    # Verificamos que haya resultados y que la estructura sea la esperada
    if search_results and 'search_results' in search_results[0]:
        
        # Recopilar los fragmentos (snippets) y las URLs de las fuentes
        for result in search_results[0]['search_results']:
            # Evita incluir resultados sin título o snippet
            if 'title' in result and 'snippet' in result and 'url' in result:
                final_text += f"**{result['title']}**\n{result['snippet']}\n\n"
                final_sources.append(result['url'])
        
        # Si encontramos contenido, lo formateamos
        if final_text:
            final_text = (
                f"**[RESUMEN DE BÚSQUEDA WEB PARA: '{search_term.upper()[:30]}...']**\n\n"
                f"He consolidado información de **{len(final_sources)} fuentes web**:\n\n"
                f"{final_text}"
            )

            return {
                "text": final_text,
                "sources": final_sources,
                "imageTopic": search_term 
            }

    # Fallback si la búsqueda no encuentra resultados o el formato es incorrecto
    final_text = (
        "**[PACURE IA - BÚSQUEDA FALLIDA]**\n\n"
        f"Lo siento, no pude encontrar resultados relevantes en la web para **'{search_term}'**.\n"
        "Por favor, intenta con una frase más clara o un tema específico."
    )
    
    return {
        "text": final_text,
        "sources": ["pacureia.dev/error"],
        "imageTopic": "error de busqueda"
    }

# ============================================================
# RUTAS DE FLASK
# ============================================================

@app.route('/')
def index():
    """Ruta principal para cargar el frontend."""
    # Asume que tienes un index.html en una carpeta 'templates'
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def process_query():
    """Ruta API para procesar la consulta del usuario."""
    query = request.form.get('query', '').strip()

    if not query:
        return jsonify({
            "text": "Tu consulta está vacía. Por favor, escribe lo que deseas buscar.",
            "sources": ["pacureia.dev"],
            "imageTopic": "error"
        }), 400

    # 1. VERIFICACIÓN DE SALUDO (Prioridad 1)
    greeting_response = handle_greetings(query)
    if greeting_response: 
        return jsonify(greeting_response)

    # 2. BÚSQUEDA GENERAL EN LA WEB (La única función)
    search_response = handle_search_query(query)
    return jsonify(search_response)

# ============================================================
# INICIALIZACIÓN
# ============================================================

if __name__ == '__main__':
    # Usar puerto 5000 para entorno local de pruebas
    app.run(debug=True, port=5000)
