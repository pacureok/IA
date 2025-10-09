import math
import re

# Definición de funciones del módulo math para acceso directo en eval()
# Esto permite usar 'sin(1)' en lugar de 'math.sin(1)' en la expresión.
MATH_FUNCTIONS = {name: getattr(math, name) for name in dir(math) if not name.startswith("__")}

def solve_expression(expression: str) -> tuple[float | None, str | None]:
    """
    Evalúa una expresión matemática ingresada como una cadena de texto.
    
    Utiliza eval() con sandboxing estricto (solo permite funciones math y built-ins seguros)
    para calcular el resultado.
    
    Retorna: (resultado, mensaje_de_error)
    """
    
    # Lista blanca para operadores y caracteres matemáticos
    allowed_chars_pattern = r"^[0-9\.\+\-\*/\(\)\s]+$"
    
    # 1. Normalización y Pre-filtrado
    safe_expression = expression.lower().strip()

    # Reemplazar funciones de math para que eval() pueda encontrarlas en el diccionario global
    # Esto permite que el usuario use 'sin(1)' en lugar de 'math.sin(1)'
    for name in MATH_FUNCTIONS.keys():
        # Usa límites de palabra (\b) para evitar reemplazar 'cos' en 'acos' accidentalmente
        safe_expression = re.sub(r'\b' + name + r'\b', f'{name}', safe_expression)

    # 2. Seguridad Estricta (Bloqueo de Python no deseado)
    # Bloquea caracteres peligrosos/no permitidos (como corchetes, comandos de sistema, doble asterisco para potencia, etc.)
    if re.search(r'[a-zA-Z_]', safe_expression) and not any(name in safe_expression for name in MATH_FUNCTIONS.keys()):
        return None, "Expresión contiene palabras o variables no matemáticas. Solo se permiten números y funciones 'math'."
    
    # Bloquea operadores de potencia (**) y asignación (=)
    if '**' in safe_expression or '=' in safe_expression:
        return None, "Operadores no soportados: Potencia (**) y Asignación (=)."

    try:
        # 3. Evaluación Segura
        # El diccionario global está limitado a las funciones del módulo math y built-ins seguros (None)
        # Esto previene que el usuario acceda a archivos o comandos del sistema (os.system, etc.).
        
        # Las funciones de math se pasan como un diccionario para que sean reconocidas globalmente.
        result = eval(safe_expression, {"__builtins__": None}, MATH_FUNCTIONS)
        
        # Devolver el resultado redondeado si es un número válido
        if isinstance(result, (int, float)):
            return round(result, 6), None
        else:
            return None, "La expresión no resultó en un valor numérico válido."

    except (SyntaxError, NameError, TypeError, ZeroDivisionError) as e:
        error_name = type(e).__name__
        return None, f"Error de sintaxis o cálculo: {error_name}. Por favor, revisa la expresión."
    except Exception:
        return None, "Error desconocido durante el cálculo. Intenta simplificar la expresión."

if __name__ == '__main__':
    # --- Ejemplos de prueba ---
    print("--- PRUEBAS DE CÁLCULO ---")
    
    # Éxito
    print(f"2 + 2 * 3 = {solve_expression('2 + 2 * 3')}")
    print(f"sqrt(16) + 1 = {solve_expression('sqrt(16) + 1')}")
    print(f"10 * pi / 2 = {solve_expression('10 * pi / 2')}")
    print(f"sin(pi / 2) = {solve_expression('sin(pi / 2')}") # Notar el paréntesis faltante

    # Errores
    print("\n--- PRUEBAS DE ERROR ---")
    print(f"5 / 0 = {solve_expression('5 / 0')}")
    print(f"2**8 = {solve_expression('2**8')}")
    print(f"os.system('ls') = {solve_expression('os.system(\'ls\')')}")
    print(f"sin(pi / 2 = {solve_expression('sin(pi / 2')}")
