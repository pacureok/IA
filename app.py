from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import sys

# Importa SOLO la función de IA desde language_ia.py.
# Es crucial que la inicialización de Spacy ocurra DENTRO de language_ia.py,
# para que el error de 'ModuleNotFoundError' no detenga el inicio del servidor Flask.
try:
    from language_ia import process_user_query 
except ImportError as e:
    # Si language_ia.py no existe o tiene un error de sintaxis al importarse.
    print(f"ERROR: No se pudo importar language_ia.py. Detalles: {e}")
    sys.exit(1)


# Inicialización de la aplicación Flask
# Asegúrate de que las carpetas 'static' y 'templates' existan en la raíz de tu proyecto
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates') 
CORS(app) 

# ===============================================
# RUTAS DE LA APLICACIÓN WEB
# ===============================================

@app.route('/')
def index():
    """Ruta principal para servir el HTML (la interfaz de chat)."""
    # Renderiza el archivo 'index.html' que debe estar en la carpeta 'templates'
    return render_template('index.html') 

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Ruta para servir archivos estáticos (CSS, JS, imágenes)."""
    return send_from_directory(app.static_folder, filename)

# ===============================================
# RUTA DE LA API DE CHAT (El corazón de la IA)
# ===============================================

@app.route('/api/chat', methods=['POST'])
def chat():
    """Procesa la pregunta del usuario y devuelve la respuesta de la IA."""
    try:
        data = request.get_json()
        user_question = data.get('query', '').strip()
        
        if not user_question:
            return jsonify({"response": "Por favor, ingresa una pregunta válida."}), 400

        # LLAMA A LA LÓGICA DE LA IA
        # process_user_query clasifica y genera la respuesta.
        ai_response = process_user_query(user_question) 
        
        # Devuelve la respuesta en formato JSON
        return jsonify({"response": ai_response})

    except Exception as e:
        # Captura cualquier error que ocurra durante el procesamiento de la IA (Error 500)
        print(f"Error interno del servidor al procesar la solicitud: {e}")
        return jsonify({
            "response": "Lo siento, el servidor PACURE IA falló al procesar tu solicitud. Asegúrate de que todas las dependencias estén instaladas correctamente. 😥"
        }), 500

# ===============================================
# EJECUCIÓN DEL SERVIDOR
# ===============================================

if __name__ == '__main__':
    # Usa el puerto de entorno de Render (PORT) o 5000 por defecto.
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
