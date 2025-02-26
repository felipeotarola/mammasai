"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import MediaGrid from "@/components/media-grid"; // Adjust the import path as needed
import { Loader2, Wand2 } from "lucide-react";

export default function GeneratePage() {
  const [image, setImage] = useState<File | string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [encouragingMessageIndex, setEncouragingMessageIndex] = useState(0);

  // ... your existing generate logic and file handling functions

  // For example purposes, here is a simple generate button handler:
  const handleGenerate = async () => {
    if (!image) return;
    setLoading(true);
    setIsGenerating(true);
    // Your generation logic here
    // ...
    setLoading(false);
    setIsGenerating(false);
  };

  const imagePreview = typeof image === "string" ? image : image ? URL.createObjectURL(image) : null;

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
              <ImageUpload value={imagePreview} onChange={(file) => setImage(file)} onRemove={() => setImage(null)} />
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
                      {/* Here you can rotate your encouraging messages */}
                      {/* Example: ENCOURAGING_MESSAGES[encouragingMessageIndex] */}
                    </span>
                  )}
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Use the reusable MediaGrid component */}
        <MediaGrid />
      </div>
    </div>
  );
}
