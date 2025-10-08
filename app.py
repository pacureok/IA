from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import wikipedia
import re
from wikipedia.exceptions import PageError, DisambiguationError

app = Flask(__name__)
CORS(app)

# La función clean_text ya no se usa si eliminamos BeautifulSoup, pero la mantenemos por si acaso
def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text

def get_time_info():
    try:
        response = requests.get('http://worldtimeapi.org/api/ip', timeout=2) # Reducimos el timeout
        if response.status_code == 200:
            data = response.json()
            datetime_str = data.get('datetime', '')
            timezone = data.get('timezone', '')
            day_of_week = data.get('day_of_week', '')
            
            days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            day_name = days[day_of_week - 1] if 1 <= day_of_week <= 7 else ''
            
            time_parts = datetime_str.split('T')
            if len(time_parts) == 2:
                date = time_parts[0]
                time = time_parts[1].split('.')[0]
                return f"{day_name}, {date} {time} ({timezone})"
        return None
    except:
        return None

def search_wikipedia(query):
    # Función de utilidad para generar la respuesta de éxito
    def create_success_result(title, summary, url, source):
        return {
            'success': True,
            'source': source,
            'title': title,
            'text': summary,
            'url': url
        }

    try:
        wikipedia.set_lang('es')
        
        # Intento 1: Búsqueda exacta
        summary = wikipedia.summary(query, sentences=5)
        page = wikipedia.page(query)
        return create_success_result(page.title, summary, page.url, 'Wikipedia')

    # Intento 2: Manejo de Múltiples Opciones (Desambiguación)
    except DisambiguationError as e:
        try:
            first_option = e.options[0]
            summary = wikipedia.summary(first_option, sentences=5)
            page = wikipedia.page(first_option)
            return create_success_result(page.title, summary, page.url, f'Wikipedia (opción: {first_option})')
        except:
            return {'success': False}

    # Intento 3: Manejo de Página No Encontrada (Búsqueda Inteligente)
    except PageError:
        try:
            suggestions = wikipedia.search(query, results=3)
            if suggestions:
                first_suggestion = suggestions[0]
                summary = wikipedia.summary(first_suggestion, sentences=5)
                page = wikipedia.page(first_suggestion)
                return create_success_result(page.title, summary, page.url, f'Wikipedia (sugerencia: {first_suggestion})')
            else:
                return {'success': False}
        except:
            return {'success': False}
            
    # Manejo de Otros Errores (Conexión, etc.)
    except Exception:
        return {'success': False}

# ⚠️ FUNCIÓN DE SCRAPING ELIMINADA para mejorar la velocidad.

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/buscar', methods=['POST'])
def buscar():
    data = request.get_json()
    query = data.get('query', '').strip()
    
    if not query:
        return jsonify({'success': False, 'error': 'Por favor, ingresa una consulta de búsqueda'}), 400
    
    time_info = get_time_info()
    
    wiki_result = search_wikipedia(query)
    
    if wiki_result['success']:
        result = wiki_result
    else:
        # 💡 NUEVO FLUJO: Si falla la búsqueda inteligente, retornamos el error inmediatamente (¡es mucho más rápido!)
        return jsonify({'success': False, 'error': 'No se encontró información relevante en Wikipedia. Intenta con una consulta diferente.'}), 404
    
    if time_info:
        result['time_info'] = time_info
    
    return jsonify(result), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
