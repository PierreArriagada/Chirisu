/**
 * @fileoverview Layout principal para el panel de control del dashboard.
 * 
 * Este layout envuelve todas las páginas dentro de la sección /dashboard (admin, moderator, etc.).
 * Proporciona un encabezado consistente y un contenedor para las páginas de gestión,
 * asegurando una apariencia y estructura unificadas para el área de administración.
 */

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-8">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold font-headline">Panel de Control</CardTitle>
                    <CardDescription className="text-xl text-muted-foreground">
                        Gestión de contenido y administración de la comunidad.
                    </CardDescription>
                </CardHeader>
            </Card>
            {children}
        </div>
    );
}
