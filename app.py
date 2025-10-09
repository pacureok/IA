# Importa spaCy y otras librerías aquí
import spacy
import wikipedia
import json

# Cargar el modelo de spaCy (asumiendo que es_core_news_sm fue descargado en el Build Command)
try:
    nlp = spacy.load("es_core-news-sm") # Corregido: spacy utiliza guion (-) no guion bajo (_) en el nombre del paquete
    print("Módulo language_ia: spaCy cargado exitosamente para análisis.")
except OSError:
    print("Módulo language_ia: Error al cargar el modelo de spaCy. Asegúrate de que 'es_core-news-sm' fue descargado.")
    nlp = None

# Configurar Wikipedia
wikipedia.set_lang("es")

def get_wikipedia_summary(search_term, sentences=2):
    """Busca en Wikipedia y devuelve el resumen."""
    try:
        # Intenta obtener el resumen directamente
        return wikipedia.summary(search_term, sentences=sentences, auto_suggest=False, redirect=True)
    except wikipedia.exceptions.PageError:
        return None
    except wikipedia.exceptions.DisambiguationError as e:
        # Manejar si el término es ambiguo
        # Aquí se podría elegir el primer resultado, pero es más seguro no devolver nada si es ambiguo.
        return f"Término ambiguo, opciones: {', '.join(e.options[:3])}..."
    except Exception:
        return None

def analyze_and_search(query):
    """
    Usa spaCy para extraer entidades o sujetos de la consulta para una búsqueda precisa.
    """
    doc = nlp(query)
    
    # Intenta encontrar la entidad o sujeto principal de la oración (ej: "presidente de España")
    search_term = ""
    for ent in doc.ents:
        # Priorizar Nombres Propios (PERSON, LOC, ORG)
        # Nota: Algunos modelos de spaCy para español usan etiquetas como 'PER'
        if ent.label_ in ["PER", "LOC", "ORG", "MISC", "PERSON", "GPE"]: 
            search_term = ent.text
            break
            
    # Si no hay entidades claras, busca el sujeto principal (Noun Phrase)
    if not search_term:
        for chunk in doc.noun_chunks:
            # Selecciona el chunk más largo como término de búsqueda potencial
            search_term = chunk.text
            break
            
    # Si sigue vacío, usa la consulta completa
    if not search_term:
        search_term = query
        
    # Limpia el término de búsqueda de artículos y preposiciones iniciales
    if search_term.lower().startswith(('el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'de ', 'del ')):
        search_term = search_term.split(' ', 1)[-1]

    summary = get_wikipedia_summary(search_term, sentences=3)
    
    if summary:
        return f"**[Resultado de Wikipedia para '{search_term}']**\n{summary}"
    else:
        return None

def process_user_query(user_text):
    """
    Función principal llamada por app.py.
    Clasifica la pregunta y decide si buscar o responder directamente.
    """
    user_text = user_text.strip()
    
    if not nlp:
        return "Lo siento, el modelo de análisis de lenguaje no se cargó correctamente en el servidor."

    # --- 1. CLASIFICACIÓN (Simplificada) ---
    
    # Clasificación de búsqueda: Preguntas que requieren información externa
    # Esta lógica intenta ser más flexible.
    if user_text.lower().startswith(("quién es", "¿quién es", "qué es", "¿qué es", "dónde está", "cuándo fue", "¿cuál es", "dime sobre")):
        
        # Primero, intenta realizar la búsqueda usando spaCy
        result = analyze_and_search(user_text)
        
        if result:
            # Si spaCy encuentra un buen término y Wikipedia devuelve un resumen
            return result
        # Si la búsqueda falla (por PageError, etc.), cae a la respuesta genérica/conversacional
        
    # Clasificación de matemáticas: Si contiene números y operadores (si se requiere)
    if any(op in user_text for op in ['+', '-', '*', '/', '^']) and any(c.isdigit() for c in user_text):
        # Esta es la ruta para el módulo math_ia, que no está importado aquí.
        return "Esta es una operación matemática, pero la lógica de cálculo aún no está implementada en este servidor."
        
    # --- 2. RESPUESTA GENERADA (SI FALLA O ES CONVERSACIONAL) ---
    
    # Si no es una búsqueda exitosa ni una matemática, responde con IA (simulación de respuesta propia)
    if "hola" in user_text.lower() or "saludo" in user_text.lower():
        return "¡Hola! Soy PACURE IA, tu asistente de IA. Estoy lista para buscar información o conversar contigo. ¿En qué puedo ayudarte hoy?"
    
    if "marketing" in user_text.lower():
        return "Un excelente plan para un canal de YouTube debe centrarse en la creación de contenido de alta calidad y la optimización SEO. El uso de miniaturas atractivas y títulos optimizados es crucial para el crecimiento. ¡A crecer! 🚀"

    # Respuesta predeterminada
    return "Gracias por tu pregunta. He analizado el lenguaje pero no encontré una respuesta específica en mi base de conocimientos. ¿Podrías reformularla o preguntar algo diferente? 💡"
