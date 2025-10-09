import re
import math
import operator

# Diccionario de operadores para el módulo.
# Se usa para mapear strings a funciones de Python.
OP_MAP = {
    '+': operator.add,
    '-': operator.sub,
    '*': operator.mul,
    '/': operator.truediv,
    '^': operator.pow,
    'sqrt': math.sqrt,
    'sin': math.sin,
    'cos': math.cos,
    'tan': math.tan,
    'log': math.log,
}

def clean_expression(expression):
    """Limpia la expresión para el análisis, reemplazando símbolos comunes."""
    expression = expression.lower()
    expression = expression.replace('**', '^') # Exponentes
    expression = expression.replace(' ', '')    # Elimina espacios
    
    # Reemplaza 'x' con '*' en operaciones implícitas (ej: 2(3) -> 2*(3))
    # Esto es una simplificación; un parser completo sería mejor.
    expression = re.sub(r'(\d)\(', r'\1*(' , expression) 
    
    return expression

def tokenize_expression(expression):
    """Divide la expresión en tokens (números, operadores, paréntesis)."""
    # Regex para capturar números (incluyendo decimales) o cualquier operador/paréntesis
    tokens = re.findall(r'(\d+\.?\d*|\w+|\(|\)|\+|\-|\*|/|\^)', expression)
    return tokens

def evaluate_tokens(tokens):
    """
    Evalúa una lista de tokens. 
    Esta es una implementación simplificada que usa 'eval' (con restricciones de seguridad).
    """
    if not tokens:
        return 0
    
    try:
        # Reconstruir la expresión para una evaluación segura (limitando globals/locals)
        safe_expr = "".join(tokens).replace('^', '**')
        
        # Uso de eval limitado.
        return eval(safe_expr, {'__builtins__': None}, {'math': math})
    except Exception as e:
        # Devuelve el error para debugging
        return f"Error de evaluación: {e}" 

def solve_expression(raw_expression):
    """Función principal para resolver una expresión."""
    cleaned = clean_expression(raw_expression)
    tokens = tokenize_expression(cleaned)
    result = evaluate_tokens(tokens)
    return result
