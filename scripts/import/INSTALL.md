# 📦 Instalación de Dependencias

Este script instala las dependencias necesarias para el sistema de importación.

## Dependencias Requeridas

- **commander**: CLI framework para parsear argumentos
- **pg**: PostgreSQL client (ya instalado)
- **@types/pg**: Type definitions para pg (dev)

## Instalación

```bash
npm install commander
npm install -D @types/pg
```

## Verificación

Después de instalar, verifica que todo esté correcto:

```bash
# Verificar que commander está instalado
npm list commander

# Probar CLI
npm run import -- --help
```

Deberías ver:

```
Usage: import [options] [command]

Importar anime, manga, manhwa, manhua, novels desde APIs externas (MyAnimeList, AniList)

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  run [options]      Ejecutar importación desde una fuente específica
  status             Mostrar estado de todas las importaciones
  summary [options]  Mostrar resumen detallado de una importación específica
  cleanup [options]  Limpiar checkpoints antiguos
  delete [options]   Eliminar checkpoint específico
  all [options]      Importar todo desde una fuente (anime + manga)
  help [command]     display help for command
```

## Alternativa: Instalar Todo de una Vez

```bash
npm install commander && npm install -D @types/pg
```

## Verificación de pg

`pg` ya debería estar instalado (viene en dependencies), pero si no:

```bash
npm install pg
npm install -D @types/pg
```
