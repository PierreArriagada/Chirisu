# Chirisu - Tu Portal de Anime y Manga

This is a Next.js project bootstrapped with Firebase Studio.

## Cómo Ejecutar el Proyecto en Local

Para poder ver y trabajar con la aplicación en tu propio ordenador, sigue estos pasos.

### Requisitos Previos

Asegúrate de tener instalado lo siguiente:
- **Node.js**: Se recomienda la última versión LTS. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
- **npm**: Generalmente se instala automáticamente con Node.js.

### 1. Instalación de Dependencias

Una vez que hayas clonado el repositorio, abre una terminal en la carpeta raíz del proyecto y ejecuta el siguiente comando para instalar todas las librerías necesarias:

```bash
npm install
```

### 2. Configuración del Entorno (Variables de Entorno)

Este proyecto utiliza Genkit para las funcionalidades de Inteligencia Artificial (IA), las cuales requieren una clave de API para funcionar.

1.  Busca el archivo llamado `.env.example` en la raíz del proyecto.
2.  Crea una copia de este archivo y renómbrala a `.env`.
3.  Abre el nuevo archivo `.env` y añade tu clave de API de Google (Gemini).

```env
# Clave de API para los modelos de Google Generative AI (Gemini)
# Necesaria para las funcionalidades de IA como las recomendaciones.
GEMINI_API_KEY=TU_API_KEY_AQUÍ
```

### 3. Ejecución de la Aplicación

Para que la aplicación funcione completamente (tanto la parte visual como la de IA), necesitas ejecutar dos procesos en paralelo. Deberás abrir **dos terminales** en la carpeta del proyecto.

#### Terminal 1: Iniciar la Aplicación Next.js

Este comando inicia el servidor de desarrollo para la interfaz de usuario.

```bash
npm run dev
```

Una vez que se inicie, podrás acceder a la aplicación en tu navegador, generalmente en `http://localhost:9002`.

#### Terminal 2: Iniciar el Servidor de IA (Genkit)

Este comando inicia el servidor que gestiona los flujos de IA, como la generación de recomendaciones.

```bash
npm run genkit:dev
```

**¡Y eso es todo!** Con ambos servidores en ejecución, la aplicación será completamente funcional en tu entorno local.
