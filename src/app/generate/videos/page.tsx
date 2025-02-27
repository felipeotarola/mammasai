"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import MediaGrid from "@/components/media-grid";
import { Loader2 } from "lucide-react";

// Helper to convert a File to a base64 data URL
const convertFileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function GeneratePage() {
  const [image, setImage] = useState<File | string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [encouragingMessageIndex, setEncouragingMessageIndex] = useState(0);
  const [modelChoice, setModelChoice] = useState("minimax"); // "minimax" or "kling"

  // Generate handler now converts File to data URL if needed
  const handleGenerate = async () => {
    if (!image) return;
    setLoading(true);
    setIsGenerating(true);
    try {
      let firstFrameImage: string;
      if (typeof image !== "string") {
        firstFrameImage = await convertFileToDataUrl(image);
      } else {
        firstFrameImage = image;
      }

      const payload = {
        prompt: text,
        systemPrompt: "", // Optionally set a system prompt
        firstFrameImage, // Now a string (data URL)
        modelChoice, // "minimax" or "kling"
      };

      const response = await fetch("/api/generate/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      console.log("Generation result:", data);
      // Additional logic to display the generated video can go here.
    } catch (error) {
      console.error("Error generating video:", error);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const imagePreview =
    typeof image === "string" ? image : image ? URL.createObjectURL(image) : null;

  return (
    <div className="bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Video</CardTitle>
            <CardDescription>
              Upload an image or drag one from the grid below to generate a video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed p-4 rounded-md">
              <Label htmlFor="image">Image</Label>
              <ImageUpload
                value={imagePreview}
                onChange={(file) => setImage(file)}
                onRemove={() => setImage(null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Text</Label>
              <Textarea
                id="text"
                placeholder="Enter text for your video..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelChoice">Choose Model</Label>
              <select
                id="modelChoice"
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="minimax">Minimax (Default)</option>
                <option value="kling">Kling</option>
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={!image || loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              {loading ? "Generating..." : "Generate Video"}
              {isGenerating && (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {encouragingMessageIndex >= 0 && (
                    <span>
                      {/* Rotate your encouraging messages if desired */}
                    </span>
                  )}
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
        <MediaGrid />
      </div>
    </div>
  );
}
