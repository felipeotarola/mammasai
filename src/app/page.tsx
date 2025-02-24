"use client"

import React from "react"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Wand2, ChevronDown, ChevronUp, Settings2, HeartHandshake, Sparkles, Palette } from "lucide-react"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import Link from "next/link"

interface GeneratedImage {
  id: string
  prompt: string
  imageUrl: string
  createdAt: string
}

interface StyleTemplate {
  id: string
  name: string
  prompt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PREDEFINED_STYLES = [
  {
    id: "default",
    name: "Standard Stil",
    prompt:
      "Du är en professionell konstnär. Skapa en mycket detaljerad bild av hög kvalitet med följande beskrivning:",
  },
  {
    id: "watercolor",
    name: "Akvarell",
    prompt:
      "Skapa en mjuk och luftig akvarellmålning med subtila färgövergångar och ett drömliknande uttryck. Använd ljusa, flytande färger och låt dem smälta samman naturligt.",
  },
  // {
  //   id: "oil-painting",
  //   name: "Oljemålning",
  //   prompt:
  //     "Skapa en rik och texturerad oljemålning med djupa färger och tydliga penseldrag. Fokusera på ljus och skugga för att skapa djup och dimension.",
  // },
  // {
  //   id: "impressionist",
  //   name: "Impressionistisk",
  //   prompt:
  //     "Måla i impressionistisk stil, med små, synliga penseldrag och fokus på ljusets effekter. Fånga stämningen och atmosfären snarare än exakta detaljer.",
  // },
  // {
  //   id: "folk-art",
  //   name: "Folkkonst",
  //   prompt:
  //     "Skapa en glad och färgglad bild i skandinavisk folkkonststil. Använd starka färger, dekorativa mönster och förenklade former.",
  // },
  // {
  //   id: "realistic",
  //   name: "Realistisk",
  //   prompt:
  //     "Skapa en fotorealistisk bild med exakta detaljer och naturlig ljussättning. Fokusera på att återge texturer och material på ett verklighetstroget sätt.",
  // },
  // {
  //   id: "children-book",
  //   name: "Barnboksillustration",
  //   prompt:
  //     "Skapa en glad och inbjudande barnboksillustration med mjuka former och varma färger. Gör bilden lekfull och fantasifull.",
  // },
  // {
  //   id: "vintage",
  //   name: "Vintage",
  //   prompt:
  //     "Skapa en bild med vintage-känsla från 50-60-talet. Använd dova färger och retro-element för att fånga den tidstypiska stilen.",
  // },
]

const DEFAULT_SYSTEM_PROMPT = PREDEFINED_STYLES[0].prompt

const ENCOURAGING_MESSAGES = [
  "Skapar något vackert åt dig...",
  "Låt kreativiteten flöda...",
  "Din bild är på väg...",
  "Målar din vision...",
  "Nästan klar...",
]

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({})
  const [encouragingMessageIndex, setEncouragingMessageIndex] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState<string>("default")

  const {
    data,
    isLoading,
    error: fetchError,
  } = useSWR<{ images: GeneratedImage[] }>("/api/generate", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const { data: customTemplates } = useSWR<{ templates: StyleTemplate[] }>("/api/style-templates", fetcher)

  const togglePrompt = (imageId: string) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [imageId]: !prev[imageId],
    }))
  }

  const resetSystemPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
  }

  // Handle style selection
  const handleStyleChange = (styleId: string) => {
    if (styleId.startsWith("custom-")) {
      const templateId = styleId.replace("custom-", "")
      const template = customTemplates?.templates.find((t) => t.id === templateId)
      if (template) {
        setSelectedStyle(styleId)
        setSystemPrompt(template.prompt)
      }
    } else {
      const style = PREDEFINED_STYLES.find((s) => s.id === styleId)
      if (style) {
        setSelectedStyle(styleId)
        setSystemPrompt(style.prompt)
      }
    }
  }

  // Rotate encouraging messages during generation
  React.useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setEncouragingMessageIndex((prev) => (prev === ENCOURAGING_MESSAGES.length - 1 ? 0 : prev + 1))
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isGenerating])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsGenerating(true)
    setError("")
    setEncouragingMessageIndex(0)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          systemPrompt: systemPrompt.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      setPrompt("")
      mutate("/api/generate")
    } catch (err) {
      setError("Något gick fel. Försök igen.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <HeartHandshake className="h-8 w-8 text-pink-500" />
          <h1 className="text-3xl font-bold text-center">Bildkreatören</h1>
        </div>

        <Card className="mb-8 border-pink-100 dark:border-pink-900">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* System Prompt Toggle */}
              <div className="flex items-center justify-end mb-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                        className="text-muted-foreground"
                      >
                        <Settings2 className="h-4 w-4 mr-2" />
                        {showSystemPrompt ? "Dölj" : "Visa"} Avancerade Inställningar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Anpassa hur AI:n skapar dina bilder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center justify-between mb-2">
                <Link href="/style-templates">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Hantera Stilmallar
                  </Button>
                </Link>
              </div>

              {/* System Prompt */}
              <Collapsible open={showSystemPrompt}>
                <CollapsibleContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Palette className="h-4 w-4 text-pink-500" />
                    Välj Konststil
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr,auto]">
                    <Select value={selectedStyle} onValueChange={handleStyleChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Välj en stil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Fördefinierade Stilar</SelectLabel>
                          {PREDEFINED_STYLES.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {(customTemplates?.templates?.length ?? 0) > 0 && (
                          <SelectGroup>
                            <SelectLabel>Mina Stilar</SelectLabel>
                            {customTemplates?.templates?.map((template) => (
                              <SelectItem key={template.id} value={`custom-${template.id}`}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={resetSystemPrompt}
                      className="text-xs"
                    >
                      Återställ till Standard
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Anpassa Stilinstruktioner</label>
                    <Textarea
                      placeholder="Ge specifika instruktioner om bildens stil och kvalitet..."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="min-h-[100px] text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Du kan välja en förinställd stil ovan eller skriva egna instruktioner här.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Main Prompt */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  Beskriv Din Bild
                </label>
                <Textarea
                  placeholder="Beskriv vad du vill skapa... (t.ex. 'En vacker trädgård med färgglada blommor och fjärilar')"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ENCOURAGING_MESSAGES[encouragingMessageIndex]}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Skapa Bild
                  </span>
                )}
              </Button>
            </form>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        )}

        {/* Error state */}
        {fetchError && (
          <div className="text-center py-8 text-red-500">Kunde inte ladda bilderna. Försök uppdatera sidan.</div>
        )}

        {/* Images grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.images.map((image) => (
            <Card
              key={image.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-pink-100 dark:border-pink-900"
            >
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <Image
                    src={image.imageUrl || "/placeholder.svg"}
                    alt={image.prompt}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>

                <Collapsible open={expandedPrompts[image.id]}>
                  <div className="flex items-center justify-between p-2">
                    <p className="text-sm text-muted-foreground line-clamp-1 flex-1 mr-2">{image.prompt}</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => togglePrompt(image.id)}>
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

        {/* Empty state */}
        {data?.images.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Inga bilder skapade än. Prova att skapa din första!
          </div>
        )}
      </div>
    </div>
  )
}

