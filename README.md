# Frontend — Sistema de Gestión de Productos e Inventario

Interfaz web del Proyecto 1 de Ingeniería y Calidad de Software (Grupo 5). React + Vite + TypeScript + Tailwind.
Consume la API del repositorio [Back](https://github.com/IyCS-PA-2026/Back).

La rama de trabajo integrada es **`develop`** (contiene CR-001 a CR-007).

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (corriendo)
- El **backend levantado** en http://localhost:3000 (ver el [README del Back](https://github.com/IyCS-PA-2026/Back#readme))

No hace falta instalar Node: el front corre dentro de un contenedor.

---

## Cómo correr el proyecto

### 1. Clonar (si todavía no lo hiciste)

```bash
git clone -b develop https://github.com/IyCS-PA-2026/Front.git
```

### 2. Revisar a qué API apunta

En modo desarrollo se usa `.env.development`, que ya viene en el repo apuntando al backend local:

```env
VITE_API_URL="http://localhost:3000/api"
```

`.env.production` apunta al backend desplegado en la nube; **no** se usa al correr en local. Si al probar un cambio del back no ves diferencias, revisá que el front esté usando `.env.development`.

### 3. Levantar el contenedor

```bash
cd Front
docker compose up -d --build
```

La primera vez tarda unos minutos (instala dependencias). Después abrir:

**http://localhost:5173**

Los cambios en `src/` se recargan solos.

### 4. Ingresar

Con el seed del backend ejecutado (`http://localhost:3000/api/seed-all/execute`):

| Usuario | Contraseña |
|---|---|
| `admin@gmail.com` | `admin123` |

Elegir la empresa en el selector del login.

---

## Tests

Vitest + React Testing Library, dentro del contenedor:

```bash
# Todos
docker compose exec frontend npx vitest run

# Solo una carpeta o archivo
docker compose exec frontend npx vitest run src/componentes/gestion-producto
```

---

## Comandos útiles

```bash
docker compose ps                          # estado del contenedor
docker compose stop                        # apagar
docker compose up -d                       # volver a prender
docker compose logs -f frontend            # ver la salida de Vite
docker compose up -d --build -V            # reconstruir tras cambios en package.json
docker compose exec frontend npx vite build   # verificar que compila para producción
```

`-V` recrea el volumen de `node_modules` con las dependencias actuales de `package.json`.

### Problemas comunes

| Problema | Solución |
|---|---|
| `error during connect ... dockerDesktopLinuxEngine` | Docker Desktop no está abierto. |
| La pantalla carga pero no trae datos / error de red | El backend no está levantado o `VITE_API_URL` no apunta a `http://localhost:3000/api`. |
| No puedo ingresar | Falta ejecutar el seed del backend. |
| `vitest: not found` o faltan dependencias después de un `git pull` | `docker compose up -d --build -V` |
| El puerto 5173 está ocupado | Cerrar el otro programa o cambiar el puerto izquierdo en `docker-compose.yml`. |

---

## Estructura

```
src/
├── componentes/
│   ├── gestion-producto/   # Producto, Marca, Línea, SuperLínea, precios (núcleo de los CR)
│   ├── herramientas/       # Tablas, formateo y componentes reutilizables
│   └── ui/                 # Componentes base (Card, Button, Dialog, ...)
├── interfaces/             # Tipos compartidos
├── context/                # Contextos de React (filtros, catálogos)
├── utils/                  # axios, ApiService, auth
└── test/setup.ts           # Configuración de Vitest
```

## Stack

React 19 · Vite 6 · TypeScript · Tailwind CSS · React Hook Form + Yup · AG Grid · Vitest + Testing Library · Docker Compose
