# 🚀 API Quick Reference - Chirisu

## Base URL
`http://localhost:9002/api`

---

## 📺 Anime APIs

### Characters
```http
GET /anime/3/characters
```
**Response**: Personajes principales y secundarios del anime

### Staff
```http
GET /anime/3/staff
```
**Response**: Equipo de producción (director, compositor, etc.)

### Episodes
```http
GET /anime/3/episodes
```
**Response**: Lista completa de episodios

### Studios
```http
GET /anime/3/studios
```
**Response**: Estudios de animación

---

## 📖 Manga APIs

### Characters
```http
GET /manga/2/characters
```
**Response**: Personajes principales y secundarios del manga

### Staff
```http
GET /manga/2/staff
```
**Response**: Equipo creativo (mangaka, asistentes, etc.)

---

## 🧪 Ejemplos de Uso

### Fetch Characters (JavaScript)
```javascript
const response = await fetch('/api/anime/3/characters');
const data = await response.json();

if (data.success) {
  console.log('Principales:', data.data.main);
  console.log('Secundarios:', data.data.supporting);
  console.log('Total:', data.data.total);
}
```

### Fetch Episodes (JavaScript)
```javascript
const response = await fetch('/api/anime/3/episodes');
const data = await response.json();

if (data.success) {
  data.data.forEach(ep => {
    console.log(`Ep ${ep.episode_number}: ${ep.title}`);
    console.log(`  Fecha: ${ep.air_date}`);
    console.log(`  Filler: ${ep.is_filler ? 'Sí' : 'No'}`);
  });
}
```

---

## 📊 Response Formats

### Characters Response
```json
{
  "success": true,
  "data": {
    "main": [
      {
        "id": 1,
        "name": "Yuji Itadori",
        "name_romaji": "Yuji Itadori",
        "name_native": "虎杖悠仁",
        "role": "main",
        "image_url": "..."
      }
    ],
    "supporting": [...],
    "total": 10,
    "mainCount": 5,
    "supportingCount": 5
  }
}
```

### Staff Response
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name_romaji": "Gege Akutami",
      "name_native": "芥見下々",
      "role": "Original Creator"
    }
  ],
  "total": 5
}
```

### Episodes Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "episode_number": 1,
      "title": "Ryomen Sukuna",
      "synopsis": "...",
      "air_date": "2020-10-03",
      "duration": 24,
      "is_filler": false,
      "is_recap": false
    }
  ],
  "total": 10
}
```

### Studios Response
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "MAPPA",
      "is_main_studio": true,
      "website_url": "https://www.mappa.co.jp"
    }
  ],
  "total": 1
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "ID de anime inválido"
}
```

### 404 Not Found
```json
{
  "error": "Anime no encontrado"
}
```

### 500 Server Error
```json
{
  "error": "Error al obtener personajes del anime",
  "details": "Database connection failed"
}
```

---

## 🔗 URLs de Prueba

### Jujutsu Kaisen (Anime ID: 3)
- Characters: http://localhost:9002/api/anime/3/characters
- Staff: http://localhost:9002/api/anime/3/staff
- Episodes: http://localhost:9002/api/anime/3/episodes
- Studios: http://localhost:9002/api/anime/3/studios

### Jujutsu Kaisen (Manga ID: 2)
- Characters: http://localhost:9002/api/manga/2/characters
- Staff: http://localhost:9002/api/manga/2/staff

---

## 📝 Notas

- Todas las APIs requieren ID numérico válido
- Las respuestas siempre incluyen campo `success`
- Timestamps en formato ISO 8601
- Duraciones en minutos
- Fechas en formato `YYYY-MM-DD`

---

**Última actualización**: 2025-01-17
