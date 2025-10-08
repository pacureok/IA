# app.py

from flask import Flask, render_template, request, jsonify
import re
from math_ia import evaluate_expression
from music_ia import generate_music
from typing import Tuple, List, Dict, Any

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 

# ============================================================
# 1. Rutas de la Aplicación
# ============================================================

@app.route('/')
def index():
    """Ruta principal que sirve la interfaz de chat."""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat_api():
    """Endpoint para procesar la consulta del usuario y generar la respuesta de la IA."""
    data = request.json
    user_query = data.get('query', '')
    files_attached = data.get('files', [])

    try:
        # 1. Procesamiento de la consulta
        response = process_query_with_ia(user_query, files_attached)
        return jsonify(response)
    except Exception as e:
        print(f"Error grave en el backend: {e}")
        return jsonify({
            'text': f"Lo siento, ocurrió un error interno al procesar tu solicitud: {e}. ❌",
            'toolUsed': None,
            'imageTopic': 'error',
            'sources': ['system-error.log']
        }), 500

# ============================================================
# 2. Lógica del Procesamiento de la IA
# ============================================================

def process_query_with_ia(query: str, files: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analiza la consulta y genera la respuesta utilizando comprensión de lenguaje
    y delegando a módulos especializados.
    """
    query_lower = query.lower()
    tool_used = None
    image_topic = query
    sources = ["pacureia.dev", "analisis.ia"]
    music_url = None
    
    # ------------------------------------------------------------------------
    # I. DELEGACIÓN A HERRAMIENTAS ESPECÍFICAS
    # ------------------------------------------------------------------------

    # --- 1. Módulo de Música ---
    if "crear música" in query_lower or "generar canción" in query_lower:
        tool_used = 'music'
        # Intenta determinar género y estado de ánimo
        genre = "pop" if "pop" in query_lower or "cumbia" in query_lower else "electrónica"
        mood = "alegre" if "alegre" in query_lower or "feliz" in query_lower else "relajante"
        
        music_url = generate_music(genre, mood, duration_sec=15)
        
        if "Error" in music_url:
             response_text = f"Intenté generar una pista de {genre} con ánimo {mood}, pero falló: {music_url} 😔."
             image_topic = "error de audio"
        else:
             response_text = f"¡Música creada! 🎶 He generado una pista de {genre} en tono {mood} de 15 segundos. Puedes reproducirla desde la URL: {music_url}. ¡Disfruta!🎧"
             image_topic = "nota musical"
        return {
            'text': response_text, 'toolUsed': tool_used, 'imageTopic': image_topic, 
            'sources': sources + ["music-generator.ai"], 'musicUrl': music_url
        }


    # --- 2. Módulo de Matemáticas ---
    if re.search(r'calcula|resuelve|operación|matemática|cuánto es|promedio', query_lower):
        tool_used = 'math'
        expression_match = re.search(r'(\d[\d\+\-\*/\^\s\.\(\)a-z]+)', query_lower)
        
        if expression_match:
            expression = expression_match.group(1).strip()
            result = evaluate_expression(expression)
            response_text = f"Según el módulo matemático, la operación **{expression}** es igual a **{result}**. 📐"
            image_topic = "fórmulas matemáticas"
        else:
            response_text = "Necesito una expresión matemática clara para calcular. Por ejemplo: 'calcula 5 * (10 + 2)'. 🤔"
            image_topic = "matemáticas"
        return {'text': response_text, 'toolUsed': tool_used, 'imageTopic': image_topic, 'sources': sources + ["math-module.py"]}

    # ------------------------------------------------------------------------
    # II. PROCESAMIENTO DE ARCHIVOS Y HERRAMIENTAS DE PRODUCTIVIDAD
    # ------------------------------------------------------------------------

    # --- 3. Herramientas Excel/Word ---
    if "excel" in query_lower or "tabla" in query_lower or "word" in query_lower or "resumen" in query_lower:
        tool_used = 'excel-word'
        if files:
            file_names = ", ".join([f['name'] for f in files])
            response_text = f"Analizando tus {len(files)} archivos ({file_names}). Estoy creando un proyecto **Excel/Word** con esta información. La comprensión de los archivos es clave para el resumen. 📁"
        else:
             response_text = "Generando estructura base para un **Proyecto Excel/Word**."
        
        response_text += " Por ejemplo, puedo generar un resumen de un documento o una tabla de presupuestos."
        image_topic = "documentos y datos"
        return {'text': response_text, 'toolUsed': tool_used, 'imageTopic': image_topic, 'sources': sources + ["office-analysis.ai"]}

    # --- 4. Herramienta Canvas (Diseño/Visual) ---
    if "canvas" in query_lower or "diagrama" in query_lower or "dibujo" in query_lower or "diseño" in query_lower:
        tool_used = 'canvas'
        response_text = "Comprendido. Te ayudaré a generar un **diseño visual** (Canvas). Descríbeme el diagrama, la paleta de colores o el flujo que necesitas. 🎨"
        image_topic = "diseño gráfico"
        return {'text': response_text, 'toolUsed': tool_used, 'imageTopic': image_topic, 'sources': sources + ["visual-design.ai"]}

    # ------------------------------------------------------------------------
    # III. PROCESAMIENTO DE LENGUAJE NATURAL (General)
    # ------------------------------------------------------------------------
    
    # Simulación de la comprensión emocional y contextual profunda
    if "feliz" in query_lower or "alegre" in query_lower:
         sentiment = "muy positivo. 😄"
    elif "triste" in query_lower or "problema" in query_lower:
         sentiment = "preocupante. 😟 Te ofrezco apoyo y soluciones."
    else:
         sentiment = "neutro."

    if files:
        file_list = ", ".join([f['name'] for f in files])
        response_text = f"He analizado los **{len(files)} archivos** ({file_list}) y tu consulta. Tu estado de ánimo detectado es {sentiment}. Mi respuesta integral abarca el análisis de tus documentos y la comprensión contextual de tu pregunta. ✨"
    else:
        response_text = f"Tu estado de ánimo detectado es {sentiment}. Mi comprensión del tema '{query}' es completa, usando mi capacidad de análisis contextual. ¿Te puedo ayudar con más detalles o una de mis herramientas especializadas? 💡"

    return {'text': response_text, 'toolUsed': None, 'imageTopic': image_topic, 'sources': sources}


if __name__ == '__main__':
    # Creación del directorio de salida de música al iniciar
    os.makedirs(os.path.join(os.getcwd(), 'static', 'music_output'), exist_ok=True)
    app.run(debug=True)
