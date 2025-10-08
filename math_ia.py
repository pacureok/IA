# math_ia.py

import math
from typing import Union, List

def evaluate_expression(expression: str) -> Union[float, str]:
    """
    Evalúa una expresión matemática simple o compleja.

    Args:
        expression: La cadena que contiene la expresión matemática (ej: "5 + 3 * (2^4)").

    Returns:
        El resultado de la operación o un mensaje de error.
    """
    # Lista de funciones y constantes seguras
    safe_dict = {
        'sqrt': math.sqrt,
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'log': math.log,
        'exp': math.exp,
        'pi': math.pi,
        'e': math.e,
        'pow': math.pow,
        'sum': sum,
        'abs': abs
        # Agregar aquí cualquier otra función de math que se quiera permitir
    }
    
    # Reemplazar operadores y funciones comunes que podrían no ser seguras en 'eval'
    expression = expression.replace('^', '**')  # Potencia
    
    try:
        # Usar eval() con un diccionario limitado para mayor seguridad
        result = eval(expression, {"__builtins__": None}, safe_dict)
        return float(result) if isinstance(result, (int, float)) else str(result)
    except Exception as e:
        return f"Error de cálculo: {e}"

def calculate_average(numbers: List[float]) -> Union[float, str]:
    """Calcula el promedio de una lista de números."""
    if not numbers:
        return "La lista de números está vacía."
    try:
        return sum(numbers) / len(numbers)
    except TypeError:
        return "La lista debe contener solo números."

# Puedes agregar más funciones matemáticas aquí (ej: resolver_ecuacion, calcular_area, etc.)
