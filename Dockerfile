# Usa una imagen base de Python
FROM python:3.10-slim

# Instala ffmpeg y otras dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    # Limpia el cache de apt para reducir el tamaño de la imagen
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de requerimientos e instala las dependencias de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto de tu código
COPY . .

# Comando para ejecutar la aplicación (cambia si usas gunicorn)
CMD [ "python", "app.py" ]
