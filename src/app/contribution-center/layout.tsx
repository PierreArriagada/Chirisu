import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ContributionCenterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-8">
            <Card className="bg-card/50 text-center">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold font-headline">Centro de Aportes</CardTitle>
                    <CardDescription className="text-xl text-muted-foreground">
                        Tu ayuda es fundamental para hacer de Chirisu la mejor comunidad.
                    </CardDescription>
                </CardHeader>
            </Card>
            {children}
        </div>
    );
}
