import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SynopsisCard({ description }: { description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Synopsis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
