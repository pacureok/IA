# =================================================================
# math_ia.py
# Módulo de ejemplo para las operaciones matemáticas o lógicas de PACURE AI
# =================================================================

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
    (Nota: Para una calculadora real se usaría un algoritmo 
    Shunting-yard y Reverse Polish Notation (RPN)).
    Esta es una implementación simplificada de solo izquierda a derecha.
    """
    if not tokens:
        return 0
    
    # Simplificación: Intentar evaluar la expresión directamente usando 'eval' 
    # (¡NO SE RECOMIENDA en producción por seguridad!)
    # Si PACURE requiere seguridad total, se debe usar un parser estricto.
    try:
        # Reconstruir la expresión para una evaluación segura (limitando globals/locals)
        # Esto solo funciona para expresiones simples sin funciones
        safe_expr = "".join(tokens).replace('^', '**')
        
        # Uso limitado de eval para demostrar el concepto, se debe reemplazar por RPN
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

# =================================================================
# Código de Prueba (Se ejecuta al importar el módulo)
# =================================================================

if __name__ == '__main__':
    # Pruebas para la función
    print("--- Pruebas de solve_expression ---")
    
    # Prueba simple
    print(f"5 + 3 * 2 = {solve_expression('5 + 3 * 2')}")
    
    # Prueba con potencias
    print(f"2^3 + 1 = {solve_expression('2^3 + 1')}")
    
    # Prueba con decimales
    print(f"10 / 2.5 = {solve_expression('10 / 2.5')}")
    
    # Prueba con paréntesis (depende de la implementación de 'eval' o parser)
    print(f"(5 + 3) * 2 = {solve_expression('(5 + 3) * 2')}")

    # LÍNEA CORREGIDA (Línea 73)
    # Cambiamos \' por " para evitar el error de sintaxis en el f-string.
    print(f"os.system('ls') = {solve_expression('os.system(\"ls\")')}")
