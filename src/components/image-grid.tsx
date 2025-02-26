"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Expand,
  Trash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

interface ImageGridProps {
  onImageExpand: (image: { id: string; url: string; prompt: string }) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ImageGrid: React.FC<ImageGridProps> = ({ onImageExpand }) => {
  const { data, isLoading, error } = useSWR<{ images: GeneratedImage[] }>(
    "/api/generate",
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false }
  );
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  const togglePrompt = (imageId: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [imageId]: !prev[imageId],
    }));
  };

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bild-${prompt
        .slice(0, 30)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna bild?")) return;
    try {
      const response = await fetch(`/api/media/images/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Något gick fel");
      mutate("/api/generate");
      toast.success("Bilden har tagits bort!");
    } catch (error) {
      toast.error("Kunde inte ta bort bilden. Försök igen.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin text-pink-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Kunde inte ladda bilderna. Försök uppdatera sidan.
      </div>
    );
  }

  if (!data || data.images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Inga bilder skapade än. Prova att skapa din första!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {data.images.map((image) => (
        <Card
          key={image.id}
          className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-pink-100 dark:border-pink-900"
        >
          <CardContent className="p-2">
            <div className="relative aspect-square group">
              <Image
                src={image.imageUrl || "/placeholder.svg"}
                alt={image.prompt}
                fill
                className="object-cover rounded-lg cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
                onClick={() =>
                  onImageExpand({
                    id: image.id,
                    url: image.imageUrl,
                    prompt: image.prompt,
                  })
                }
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg" />
              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image.imageUrl, image.prompt);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ladda ner bild</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageExpand({
                            id: image.id,
                            url: image.imageUrl,
                            prompt: image.prompt,
                          });
                        }}
                      >
                        <Expand className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Visa större bild</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ta bort bild</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Collapsible open={expandedPrompts[image.id]}>
              <div className="flex items-center justify-between p-2">
                <p className="text-sm text-muted-foreground line-clamp-1 flex-1 mr-2">
                  {image.prompt}
                </p>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePrompt(image.id)}
                  >
                    {expandedPrompts[image.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="px-2 pb-2">
                <p className="text-sm text-muted-foreground">{image.prompt}</p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ImageGrid;
