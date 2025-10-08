from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import wikipedia
import re
from wikipedia.exceptions import PageError, DisambiguationError

app = Flask(__name__)
CORS(app)

def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text

def get_time_info():
    try:
        # Usa una API de hora más específica, aunque 'ip' es suficiente para hora local aproximada
        response = requests.get('http://worldtimeapi.org/api/ip', timeout=5)
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
        # Silencia la excepción si falla la API de hora, no es crítica
        return None

def search_wikipedia(query):
    try:
        wikipedia.set_lang('es')
        summary = wikipedia.summary(query, sentences=5)
        page = wikipedia.page(query)
        return {
            'success': True,
            'source': 'Wikipedia',
            'title': page.title,
            'text': summary,
            'url': page.url
        }
    
    # 1. MANEJO DE MÚLTIPLES OPCIONES (Desambiguación)
    except DisambiguationError as e:
        try:
            # Intenta con la primera opción de la lista de desambiguación
            first_option = e.options[0]
            summary = wikipedia.summary(first_option, sentences=5)
            page = wikipedia.page(first_option)
            return {
                'success': True,
                'source': f'Wikipedia (opción: {first_option})',
                'title': page.title,
                'text': summary,
                'url': page.url
            }
        except:
            return {'success': False}

    # 2. MANEJO DE PÁGINA NO ENCONTRADA (Búsqueda Inteligente)
    except PageError:
        try:
            # Intenta buscar términos similares
            suggestions = wikipedia.search(query, results=3)
            if suggestions:
                # Si hay sugerencias, intenta con el primer resultado
                first_suggestion = suggestions[0]
                summary = wikipedia.summary(first_suggestion, sentences=5)
                page = wikipedia.page(first_suggestion)
                return {
                    'success': True,
                    'source': f'Wikipedia (sugerencia: {first_suggestion})',
                    'title': page.title,
                    'text': summary,
                    'url': page.url
                }
            else:
                # Si no hay sugerencias, falla para ir al scraping
                return {'success': False}
        except:
            return {'success': False}
            
    # 3. OTROS ERRORES (como fallos de conexión)
    except Exception as e:
        # print(f"Error desconocido de Wikipedia: {e}") # Para debug
        return {'success': False}

def fallback_scraping(query):
    try:
        search_url = f"https://www.bbc.com/search?q={query}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Búsqueda más robusta de un bloque de contenido relevante
        article = soup.find('article') or soup.find('div', class_='ssrcss-1f3bvyz-Stack')
        if article:
            title_elem = article.find(['h1', 'h2', 'h3'])
            title = clean_text(title_elem.get_text()) if title_elem else 'Resultados de búsqueda'
            
            paragraphs = article.find_all('p')[:3]
            text_parts = [clean_text(p.get_text()) for p in paragraphs if len(clean_text(p.get_text())) > 20]
            text = ' '.join(text_parts) if text_parts else 'No se encontró contenido relevante.'
            
            return {
                'success': True,
                'source': 'Web Scraping (BBC)',
                'title': title,
                'text': text,
                'url': search_url
            }
        else:
            return {
                'success': True,
                'source': 'Web Scraping',
                'title': f'Búsqueda: {query}',
                'text': f'No se encontraron resultados específicos para "{query}". Intenta con otra consulta.',
                'url': search_url
            }
    except Exception as e:
        return {
            'success': False,
            'error': f'Error al hacer scraping: {str(e)}'
        }

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
        # Solo va a scraping si la búsqueda inteligente de Wikipedia también falla
        scrape_result = fallback_scraping(query)
        if scrape_result['success']:
            result = scrape_result
        else:
            return jsonify(scrape_result), 400
    
    if time_info:
        result['time_info'] = time_info
    
    return jsonify(result), 200

if __name__ == '__main__':
    # Usamos gunicorn en producción, pero esto es bueno para pruebas locales
    app.run(host='0.0.0.0', port=5000, debug=False)
