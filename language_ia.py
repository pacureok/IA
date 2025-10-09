import spacy
from typing import Tuple, List

# --- CONFIGURACIÓN E INICIALIZACIÓN DE SPACY ---

# Carga el modelo pequeño de español. 
# Esto se hace UNA VEZ cuando la aplicación inicia (al cargar el módulo).
try:
    # Intenta cargar el modelo ya descargado/instalado
    # El modelo 'es_core_news_sm' es un paquete ligero y eficiente.
    NLP = spacy.load("es_core_news_sm")
    print("Módulo language_ia: spaCy cargado exitosamente para análisis.")
except OSError:
    # Este error ocurre si el modelo no está disponible en el entorno de hosting.
    print("Módulo language_ia: ERROR - El modelo 'es_core_news_sm' no pudo cargarse.")
    print("El análisis de PNL avanzado no estará disponible.")
    # Fallback: crea un objeto None
    NLP = None


def analyze_query_intent(query: str) -> Tuple[str, str, List[str]]:
    """
    Analiza una consulta para identificar su intención, tema central y entidades clave.
    
    Retorna: (intención, tema_central, entidades_nombradas)
    """
    if not NLP:
        # Fallback si spaCy no pudo cargar
        return "desconocido", query, [] 

    doc = NLP(query.lower())
    
    # 1. INTENCIÓN (Clasificación simple por lemas/palabras clave)
    intent = "busqueda"
    
    # Intenciones de Creación y Cálculo
    if any(token.lemma_ in ["crear", "generar", "componer", "haz"] for token in doc):
        intent = "creacion_musica"
    elif any(token.lemma_ in ["calcular", "resolver", "cuánto", "resultado"] for token in doc):
        intent = "calculo"
        
    # Intenciones Conversacionales/Identidad
    elif any(token.lemma_ in ["opinar", "sentir", "quién", "como"] for token in doc):
        intent = "conversacion"
    elif any(token.lemma_ in ["analizar", "resumir", "explica"] for token in doc):
        intent = "analisis" # Útil para enlaces de YouTube/Wikipedia

    # 2. TEMA CENTRAL (Entidades Nombradas o Fragmentos Nominales)
    subject = ""
    # Filtramos entidades por tipo (Persona, Organización, Lugar, Misceláneo)
    entities = [ent.text for ent in doc.ents if ent.label_ in ['PER', 'ORG', 'LOC', 'MISC']]
    
    if entities:
        subject = entities[0]
    elif doc.noun_chunks:
        try:
            # Si no hay entidad nombrada, toma el primer fragmento nominal (sujeto/objeto)
            subject = doc.noun_chunks.__next__().text
        except StopIteration:
            pass # No hay fragmentos nominales

    # Limpia el sujeto de artículos o determinantes al inicio para la búsqueda
    subject = subject.replace("el ", "").replace("la ", "").replace("un ", "").strip()
    
    return intent, subject, entities

# --- FIN del language_ia.py ---
