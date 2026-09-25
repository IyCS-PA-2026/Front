# Imagen de desarrollo (la levanta Back/proyecto/docker-compose.yml)
FROM node:20-alpine

# Instalar inotify-tools para que Vite pueda detectar cambios
RUN apk add --no-cache inotify-tools

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de definición de dependencias (el proyecto usa yarn)
COPY package.json yarn.lock ./

# Instalar dependencias respetando el lockfile
RUN yarn install --frozen-lockfile

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto que usa Vite por defecto
EXPOSE 5173

# Comando para iniciar Vite en modo desarrollo
CMD ["yarn", "dev"]
