"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Briefcase, Users } from "lucide-react";

interface StaffMember {
  id: number;
  name?: string;
  name_romaji?: string;
  name_native?: string;
  image_url?: string;
  slug?: string;
  bio?: string;
  primary_occupations?: string[];
  gender?: string;
  date_of_birth?: string;
  hometown?: string;
  favorites_count?: number;
  role: string;
}

interface StaffDisplayProps {
  mediaId: number;
  mediaType: 'anime' | 'manga';
}

export default function StaffDisplay({ mediaId, mediaType }: StaffDisplayProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoading(true);
        const response = await fetch(`/api/${mediaType}/${mediaId}/staff`);
        
        if (!response.ok) {
          throw new Error('Error al cargar staff');
        }

        const result = await response.json();
        
        if (result.success) {
          setStaff(result.data);
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar staff');
        console.error('Error fetching staff:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStaff();
  }, [mediaId, mediaType]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Staff & Producción
          </CardTitle>
          <CardDescription>Cargando información del staff...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Staff & Producción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No hay staff registrado aún.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {staff.map((member) => (
        <div 
          key={`${member.id}-${member.role}`}
          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex gap-4">
            {/* Staff Image */}
            <Link href={`/staff/${member.slug || member.id}`} className="flex-shrink-0">
              <div className="relative w-16 h-24 overflow-hidden rounded border bg-muted">
                {member.image_url ? (
                  <Image
                    src={member.image_url}
                    alt={member.name_romaji || member.name || 'Staff'}
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-200"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>

            {/* Staff Info */}
            <div className="flex-1 min-w-0">
              <Link 
                href={`/staff/${member.slug || member.id}`}
                className="hover:text-primary transition-colors"
              >
                <h4 className="font-semibold text-sm line-clamp-1">
                  {member.name_romaji || member.name || 'Nombre no disponible'}
                </h4>
              </Link>
              {member.name_native && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {member.name_native}
                </p>
              )}
              <Badge variant="outline" className="mt-1 text-[10px] h-5">
                {member.role}
              </Badge>
              {member.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                  {member.bio}
                </p>
              )}
              {member.primary_occupations && member.primary_occupations.length > 0 && (
                <div className="flex gap-2 mt-1 flex-wrap">
                  {member.primary_occupations.map((occupation, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] h-4">
                      {occupation}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                {member.gender && <span>{member.gender}</span>}
                {member.hometown && <span>📍 {member.hometown}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
