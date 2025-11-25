/**
 * @fileoverview CoreInfoCard - Tarjeta principal de información de un título.
 * 
 * Este es uno de los componentes más importantes de la página de detalles de un medio.
 * Muestra la información esencial:
 * - Título e imagen de portada.
 * - Estadísticas clave como ranking, popularidad, y puntuación.
 * - Botones de acción principales para añadir a favoritos o a una lista.
 * Se presenta de forma destacada en la parte superior de la página.
 */
'use client';

import { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, ListPlus, MessageCircle, TrendingUp, Trophy, Star, Edit } from "lucide-react";
import type { TitleInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { cn, formatNumber } from "@/lib/utils";
import { AddToListDialog } from "@/components/lists";
import { ReviewDialog } from "@/components/reviews";


type StatProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-background p-2 text-left w-full">
      <div className="text-primary flex-shrink-0">{icon}</div>
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  );
}

export default function CoreInfoCard({ titleInfo }: { titleInfo: TitleInfo }) {
  const { user, toggleFavorite, addToList, createCustomList, refreshUserLists } = useAuth();
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // Mapear tipo de media al formato de la API
  const mapMediaTypeToAPI = (type: string): string => {
    const mapping: Record<string, string> = {
      'Anime': 'anime',
      'Manga': 'manga',
      'Novela': 'novel',
      'Donghua': 'donghua',
      'Manhua': 'manhua',
      'Manhwa': 'manhwa',
      'Fan Comic': 'fan_comic',
    };
    return mapping[type] || type.toLowerCase();
  };
  
  const isFavorite = user?.lists?.favorites?.some((item: { id: string }) => item.id === titleInfo.id) ?? false;
  
  // Verificar si el item está en alguna lista del usuario
  const isInAnyList = user ? (
    user.lists?.favorites?.some((item: { id: string }) => item.id === titleInfo.id) ||
    user.lists?.pending?.some((item: { id: string }) => item.id === titleInfo.id) ||
    user.lists?.following?.some((item: { id: string }) => item.id === titleInfo.id) ||
    user.lists?.watched?.some((item: { id: string }) => item.id === titleInfo.id) ||
    user.customLists?.some(list => list.items.some((item: { id: string }) => item.id === titleInfo.id))
  ) : false;

  const handleFavoriteClick = async () => {
    await toggleFavorite(titleInfo);
  }

  const handleAddToListClick = () => {
    setIsAddToListOpen(true);
  };

  const handleReviewClick = async () => {
    if (!user) return;
    
    // Cargar review existente si hay
    setIsLoadingReview(true);
    try {
      const apiType = mapMediaTypeToAPI(titleInfo.type);
      const response = await fetch(
        `/api/user/reviews?reviewableType=${apiType}&reviewableId=${titleInfo.id}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Reviews recibidas:', data);
        
        // Buscar review del usuario actual
        const userReview = data.reviews?.find((r: any) => 
          String(r.userId) === String(user.id)
        );
        
        if (userReview) {
          console.log('✅ Review existente encontrada:', userReview);
          setExistingReview({
            id: userReview.id,
            content: userReview.content,
            overallScore: userReview.overallScore,
          });
        } else {
          console.log('ℹ️ No se encontró review del usuario');
          setExistingReview(null);
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar review:', error);
    } finally {
      setIsLoadingReview(false);
      setIsReviewDialogOpen(true);
    }
  };

  const handleAddToList = async (listName: string, isCustom: boolean) => {
    await addToList(titleInfo, listName, isCustom);
  };

  const handleCreateList = async (name: string) => {
    await createCustomList(name);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col ss:flex-row ss:items-start ss:justify-between gap-2">
            <CardTitle className="font-headline text-lg">
              {titleInfo.title}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col ss:flex-row gap-4">
            <div className="relative flex-shrink-0 ss:w-2/5">
              <Badge variant="outline" className="absolute top-2 right-2 text-sm capitalize bg-background/80 backdrop-blur-sm z-10">{titleInfo.type}</Badge>
              <Image
                id="media-cover-image"
                src={titleInfo.imageUrl}
                alt={`Cover for ${titleInfo.title}`}
                width={300}
                height={450}
                className="rounded-lg object-cover shadow-lg aspect-[2/3] w-full"
                data-ai-hint={titleInfo.imageHint}
                priority
              />
            </div>
            <div className="flex flex-col justify-start gap-2 ss:w-3/5">
              {titleInfo.ranking !== undefined && (
                <Stat icon={<Trophy size={16} />} label="Ranking" value={`#${titleInfo.ranking}`} />
              )}
              <Stat icon={<MessageCircle size={16} />} label="Comentarios" value={formatNumber(titleInfo.commentsCount)} />
              <Stat icon={<Bookmark size={16} />} label="En Listas" value={formatNumber(titleInfo.listsCount)} />
              <div className="flex items-center gap-2 rounded-lg bg-background p-2 text-left w-full">
                <div className="text-primary flex-shrink-0"><TrendingUp size={16} /></div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium text-muted-foreground">Puntuación</span>
                  <p className="font-bold text-sm">{titleInfo.rating > 0 ? titleInfo.rating.toFixed(1) : 'N/A'}/10</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 p-4">
          <div className="flex gap-2 w-full">
            <Button size="lg" className="flex-1 text-xs px-2" variant={isFavorite ? "default" : "outline"} onClick={handleFavoriteClick}>
              <Heart className={cn("mr-2 h-4 w-4 shrink-0", { "fill-current": isFavorite })} /> Favoritos
            </Button>
            <Button size="lg" variant="secondary" className="flex-1 text-xs px-2" onClick={handleAddToListClick}>
              <ListPlus className="mr-2 h-4 w-4 shrink-0" /> Añadir a lista
            </Button>
          </div>
          
          {/* Botón de review - solo si está en alguna lista */}
          {user && isInAnyList && (
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full text-xs px-2"
              onClick={handleReviewClick}
              disabled={isLoadingReview}
            >
              <Star className="mr-2 h-4 w-4 shrink-0" /> 
              {existingReview ? 'Editar mi reseña' : 'Escribir reseña'}
            </Button>
          )}

          {/* Botón de editar - solo para moderadores y admins */}
          {user && (user.isAdmin || user.isModerator) && (
            <Link href={`/dashboard/admin/edit/${titleInfo.type.toLowerCase()}/${titleInfo.id}`} className="w-full">
              <Button 
                size="lg" 
                variant="default" 
                className="w-full text-xs px-2"
              >
                <Edit className="mr-2 h-4 w-4 shrink-0" /> 
                Editar información
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* Diálogo para añadir a lista */}
      {user && (
        <AddToListDialog
          isOpen={isAddToListOpen}
          onOpenChange={setIsAddToListOpen}
          titleInfo={titleInfo}
          onAddToList={handleAddToList}
          onCreateList={handleCreateList}
          customLists={user.customLists || []}
          userLists={user.lists || {
            pending: [],
            following: [],
            watched: [],
            favorites: [],
          }}
          refreshUserLists={refreshUserLists}
        />
      )}

      {/* Diálogo para escribir/editar reseña */}
      {user && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          mediaId={titleInfo.id}
          mediaType={mapMediaTypeToAPI(titleInfo.type) as 'anime' | 'manga' | 'novel'}
          mediaTitle={titleInfo.title}
          existingReview={existingReview}
          onReviewSubmitted={() => {
            // Recargar la review después de guardar
            setExistingReview(null);
          }}
        />
      )}
    </>
  );
}
