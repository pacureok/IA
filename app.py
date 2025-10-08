import os
import io
import base64
from flask import Flask, render_template, request, jsonify
from PIL import Image, ImageStat

# CONFIGURACIÓN
app = Flask(__name__, static_folder='static', template_folder='templates')

# --- LÓGICA DE SIMULACIÓN DE IA (USANDO PILLOW) ---
def analyze_image_pillow(base64_string, query):
    """
    Simula el análisis de una imagen usando la librería Pillow.
    No es un modelo de IA real, pero demuestra el procesamiento en Python.
    """
    try:
        # Decodificar Base64
        header, encoded = base64_string.split(',')
        data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(data))
        
        # 1. Obtener datos básicos
        width, height = image.size
        mode = image.mode
        
        # 2. Análisis de color (promedio)
        if mode == 'RGB':
            stat = ImageStat.Stat(image)
            avg_color = [int(c) for c in stat.mean]
            dominant_feature = ""

            # Lógica simple para detectar colores dominantes
            if avg_color[0] > 180 and avg_color[1] < 100 and avg_color[2] < 100:
                dominant_feature = "Rojo (posible atardecer, fuego o tierra)."
            elif avg_color[1] > 180 and avg_color[0] < 100 and avg_color[2] < 100:
                dominant_feature = "Verde (posible vegetación, bosque)."
            elif avg_color[2] > 180 and avg_color[0] < 100 and avg_color[1] < 100:
                dominant_feature = "Azul (posible cielo, agua o escena oscura)."
            else:
                dominant_feature = "Color dominante mixto o neutro."
        else:
            dominant_feature = "Imagen en escala de grises o formato no RGB."


        analysis_result = {
            "title": "Análisis Simple de Imagen (PACURE IA)",
            "text": f"He procesado la imagen de {width}x{height} píxeles. "
                    f"El color promedio de la imagen es RGB({avg_color[0]}, {avg_color[1]}, {avg_color[2]}). "
                    f"**Interpretación:** Detecto un fuerte componente {dominant_feature} "
                    f"Tu consulta: '{query}' fue procesada, pero el análisis se basó en el color y tamaño. "
                    f"Para una comprensión real, necesitaría un modelo de IA más avanzado.",
            "url": "#", # No hay fuente web para el análisis
            "source": "PACURE Vision"
        }
        return analysis_result

    except Exception as e:
        print(f"Error al analizar la imagen: {e}")
        return {
            "title": "Error de Procesamiento de Imagen",
            "text": "Lo siento, hubo un error al decodificar o procesar la imagen.",
            "url": "#",
            "source": "Error"
        }

# --- RUTAS DE FLASK ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/buscar', methods=['POST'])
def buscar():
    data = request.json
    query = data.get('query', '')
    image_base64 = data.get('image', None)
    
    # 1. SI HAY IMAGEN, HACER ANÁLISIS
    if image_base64:
        result = analyze_image_pillow(image_base64, query)
        
        # Dado que no estamos haciendo una búsqueda real, simulamos fuentes
        # para que la interfaz se vea bien (usamos el mismo código JS)
        if result['source'] == 'PACURE Vision':
             sources = [{ 'name': result['source'], 'url': '#' }]
        else:
             sources = []
             
        return jsonify({
            "title": result['title'],
            "text": result['text'],
            "url": result['url'],
            "source": result['source'],
            "external_sources": sources 
        })
        
    # 2. SI NO HAY IMAGEN, HACER BÚSQUEDA NORMAL (Simulación)
    else:
        # Simulación de respuesta de búsqueda (como tu script.js anterior)
        # En un sistema real, aquí llamarías a una API o a tu lógica de búsqueda
        if "pacure ia" in query.lower() or "que hace" in query.lower():
            # El script.js maneja las respuestas personalizadas en el cliente
            return jsonify({"error": "Respuesta personalizada manejada en el cliente.", "code": 400}) 

        # Respuesta simulada de Wikipedia para demostrar la barra de fuentes
        simulated_response = {
            "title": "Río Pacuare y Rafting",
            "text": "El Río Pacuare, ubicado en Costa Rica, es famoso mundialmente por sus emocionantes rápidos de clase III y IV, que lo hacen ideal para el rafting. Es un río prístino que atraviesa una densa selva tropical.",
            "url": "https://es.wikipedia.org/wiki/R%C3%ADo_Pacuare",
            "source": "Wikipedia",
            "external_sources": [
                { "name": "Wikipedia (Río Pacuare)", "url": "https://es.wikipedia.org/wiki/R%C3%ADo_Pacuare" },
                { "name": "National Geographic - Aventuras", "url": "https://www.nationalgeographic.com/aventura-pacuare" },
                { "name": "Pacuare Lodge Oficial", "url": "https://www.pacuarelodge.com/" }
            ]
        }
        return jsonify(simulated_response)

if __name__ == '__main__':
    # Usar un puerto dinámico en un entorno de producción (como Heroku)
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
