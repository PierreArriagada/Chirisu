/**
 * @fileoverview Página de detalles para un miembro del staff.
 * 
 * Muestra información sobre un miembro del staff (director, escritor, etc.),
 * incluyendo su foto, biografía y una lista de los proyectos en los que
 * ha trabajado con sus respectivos roles.
 */

import { pool } from '@/lib/database';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, MapPin } from 'lucide-react';
import { FavoriteButton } from '@/components/shared';
import { CommentsSection } from '@/components/comments';

type Props = {
  params: Promise<{ slug: string }>
}

async function getStaffBySlug(slug: string) {
  const result = await pool.query(`
    SELECT 
      id,
      name,
      name_romaji,
      name_native,
      image_url,
      slug,
      bio,
      primary_occupations,
      gender,
      date_of_birth,
      hometown,
      favorites_count
    FROM app.staff
    WHERE slug = $1
    LIMIT 1
  `, [slug]);

  return result.rows[0] || null;
}

async function getStaffWorks(staffId: number) {
  const result = await pool.query(`
    SELECT 
      ss.staffable_type as media_type,
      ss.staffable_id as media_id,
      ss.role,
      CASE 
        WHEN ss.staffable_type = 'anime' THEN a.title_romaji
        WHEN ss.staffable_type = 'manga' THEN m.title_romaji
        WHEN ss.staffable_type = 'novel' THEN n.title_romaji
      END as media_title,
      CASE 
        WHEN ss.staffable_type = 'anime' THEN a.slug
        WHEN ss.staffable_type = 'manga' THEN m.slug
        WHEN ss.staffable_type = 'novel' THEN n.slug
      END as media_slug,
      CASE 
        WHEN ss.staffable_type = 'anime' THEN a.cover_image_url
        WHEN ss.staffable_type = 'manga' THEN m.cover_image_url
        WHEN ss.staffable_type = 'novel' THEN n.cover_image_url
      END as media_image,
      CASE 
        WHEN ss.staffable_type = 'anime' THEN a.start_date
        WHEN ss.staffable_type = 'manga' THEN m.start_date
        WHEN ss.staffable_type = 'novel' THEN n.start_date
      END as media_start_date
    FROM app.staffable_staff ss
    LEFT JOIN app.anime a ON ss.staffable_type = 'anime' AND a.id = ss.staffable_id
    LEFT JOIN app.manga m ON ss.staffable_type = 'manga' AND m.id = ss.staffable_id
    LEFT JOIN app.novels n ON ss.staffable_type = 'novel' AND n.id = ss.staffable_id
    WHERE ss.staff_id = $1
    ORDER BY media_start_date DESC NULLS LAST, media_title
  `, [staffId]);

  return result.rows;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const staff = await getStaffBySlug(slug);

  if (!staff) {
    return {
      title: 'Staff no encontrado',
    }
  }

  return {
    title: `${staff.name_romaji || staff.name} | Chirisu`,
    description: `Works and information about ${staff.name_romaji || staff.name}.`,
  }
}

export default async function StaffPage({ params }: Props) {
  const { slug } = await params;
  
  const staff = await getStaffBySlug(slug);
  
  if (!staff) {
    notFound();
  }

  const works = await getStaffWorks(staff.id);

  // Agrupar trabajos por rol
  const worksByRole = works.reduce((acc: any, work: any) => {
    const role = work.role || 'Other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(work);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Staff Image & Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6">
              {staff.image_url && (
                <div className="relative w-full aspect-[2/3] mb-4 rounded-lg overflow-hidden">
                  <Image 
                    src={staff.image_url} 
                    alt={staff.name_romaji || staff.name} 
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold mb-1">{staff.name_romaji || staff.name}</h1>
                    <FavoriteButton itemType="staff" itemId={staff.id} />
                  </div>
                  {staff.name_native && (
                    <p className="text-muted-foreground">{staff.name_native}</p>
                  )}
                </div>

                {/* Occupations */}
                {staff.primary_occupations && staff.primary_occupations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {staff.primary_occupations.map((occupation: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {occupation}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t">
                  {staff.gender && (
                    <div>
                      <span className="text-muted-foreground">Género:</span>
                      <p className="font-medium capitalize">{staff.gender}</p>
                    </div>
                  )}
                  {staff.hometown && (
                    <div className="flex items-start gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground text-xs">Ciudad:</span>
                        <p className="font-medium">{staff.hometown}</p>
                      </div>
                    </div>
                  )}
                  {staff.date_of_birth && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Nacimiento:</span>
                      <p className="font-medium">
                        {new Date(staff.date_of_birth).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {staff.favorites_count > 0 && (
                    <div>
                      <span className="text-muted-foreground">Favoritos:</span>
                      <p className="font-medium">{staff.favorites_count}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bio & Works */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biography */}
          {staff.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{staff.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Works */}
          {works.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Trabajos ({works.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(worksByRole).map(([role, roleWorks]: [string, any]) => (
                  <div key={role}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {role}
                      <Badge variant="outline" className="text-xs">
                        {roleWorks.length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {roleWorks.map((work: any, index: number) => (
                        <Link 
                          key={`${work.media_id}-${work.media_type}-${index}`}
                          href={`/${work.media_type}/${work.media_slug}`}
                          className="group"
                        >
                          <Card className="p-3 transition-all hover:bg-accent hover:shadow-md">
                            <div className="flex items-center gap-3">
                              {work.media_image && (
                                <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                                  <Image 
                                    src={work.media_image} 
                                    alt={work.media_title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                  {work.media_title}
                                </p>
                                <Badge variant="outline" className="text-xs mt-1 capitalize">
                                  {work.media_type}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Sistema de comentarios */}
          <CommentsSection 
            commentableType="staff"
            commentableId={staff.id.toString()}
          />
        </div>
      </div>
    </div>
  );
}
