# app.py
from flask import Flask, render_template, request, jsonify
import re
from math_ia import evaluate_expression

app = Flask(__name__)
# Configuración para que el navegador no cachee los archivos estáticos durante el desarrollo
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
    # files_attached = data.get('files', [])  # Si el JS enviara la info de los archivos

    # 1. Procesamiento de la consulta
    response_text, tool_used, image_topic, sources = process_query_with_ia(user_query)
    
    # 2. Construcción de la respuesta JSON
    response = {
        'text': response_text,
        'toolUsed': tool_used,
        'imageTopic': image_topic,
        'sources': sources
    }
    
    return jsonify(response)

# ============================================================
# 2. Lógica del Procesamiento de la IA
# ============================================================

def process_query_with_ia(query: str):
    """
    Analiza la consulta y genera la respuesta utilizando comprensión de lenguaje
    y delegando a módulos especializados.
    """
    query_lower = query.lower()
    tool_used = None
    image_topic = "información general"
    sources = ["pacureia.dev", "google.com"]

    # --- Delegación a Matemáticas ---
    math_match = re.search(r'calcula|resuelve|operación|matemática|cuánto es', query_lower)
    if math_match:
        # Intenta extraer una expresión matemática simple (ej: "5+3", "sqrt(16)")
        expression_match = re.search(r'(\d[\d\+\-\*/\^\s\.\(\)a-z]+)', query_lower)
        
        if expression_match:
            expression = expression_match.group(1).strip()
            result = evaluate_expression(expression)
            
            if "Error" in str(result):
                response_text = f"Intenté resolver la expresión '{expression}', pero encontré un error: {result} 😔."
            else:
                response_text = f"Según el módulo de matemáticas (`math_ia.py`), la operación **{expression}** es igual a **{result}**. 📐"
                image_topic = "fórmulas matemáticas"
            return response_text, 'math', image_topic, sources + ["modulo-matematicas.ai"]

    # --- Detección de Herramientas de Productividad ---
    if "excel" in query_lower or "tabla" in query_lower:
        tool_used = 'excel-word'
        response_text = "Comprendido. Voy a preparar una estructura de tabla o una hoja de cálculo para tu proyecto de Excel/Word. ¿Qué columnas necesitas? 📊"
        image_topic = "hoja de cálculo"
    elif "apunte" in query_lower or "word" in query_lower or "resumen" in query_lower:
        tool_used = 'excel-word'
        response_text = "¡Excelente! Estoy generando un apunte formateado estilo Word sobre el tema que pediste. Dame un momento. 📝"
        image_topic = "escritura y documentos"
    
    # --- Procesamiento General de Lenguaje ---
    else:
        # Aquí iría la lógica compleja de tu modelo de IA (emocional, comprensivo, etc.)
        response_text = f"Analicé y comprendí tu consulta: '{query}'. Como un modelo capaz de generar texto y entender emociones, te doy esta respuesta completa. Si necesitas algo más, no dudes en preguntar. ✨😊"
        image_topic = query_lower # Usa la consulta como tema de la imagen

    return response_text, tool_used, image_topic, sources

# ============================================================
# 3. Inicialización
# ============================================================

if __name__ == '__main__':
    # Usar debug=True solo en entorno de desarrollo
    # app.run(debug=True)
    pass # Dejar pass si la ejecución se hará desde un servidor WSGI (como gunicorn) o un entorno de Flask preconfigurado
