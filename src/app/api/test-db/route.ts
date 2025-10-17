// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Importa el pool de conexión

export async function GET() {
  let client;
  try {
    // Obtiene un cliente del pool de conexiones
    client = await pool.connect();

    // Ejecuta una consulta simple y segura para probar
    const result = await client.query('SELECT NOW();');
    const time = result.rows[0].now;

    // Si todo va bien, devuelve la hora actual del servidor de la BD
    return NextResponse.json({ 
      message: "✅ Conexión a la base de datos exitosa", 
      time: time 
    }, { status: 200 });

  } catch (error) {
    // Si hay un error, lo muestra en la consola del servidor y devuelve un error 500
    console.error('Error al conectar con la base de datos:', error);
    return NextResponse.json({ 
      message: "❌ No se pudo conectar a la base de datos" 
    }, { status: 500 });

  } finally {
    // ¡MUY IMPORTANTE! Libera al cliente de vuelta al pool, esté todo bien o mal.
    if (client) {
      client.release();
    }
  }
}