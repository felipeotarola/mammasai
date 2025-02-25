// /app/api/stitch/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";

export async function POST(request: Request) {
  try {
    const { clips } = await request.json();
    if (!clips || !Array.isArray(clips)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Array to hold paths for trimmed segments.
    const trimmedFiles: string[] = [];

    // Process each clip: download, trim, and store the trimmed segment.
    for (const clip of clips) {
      const { videoUrl, trimStart, trimEnd } = clip;
      // Generate unique filenames for input and output.
      const inputFilePath = path.join(tmpdir(), `${uuidv4()}.mp4`);
      const outputFilePath = path.join(tmpdir(), `${uuidv4()}_trimmed.mp4`);

      // Download the video file
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${videoUrl}`);
      }
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(inputFilePath, Buffer.from(buffer));

      // Calculate duration for trimming
      const duration = Number(trimEnd) - Number(trimStart);
      if (duration <= 0) {
        throw new Error("Invalid trim values; trimEnd must be greater than trimStart");
      }

      // Trim the video using FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputFilePath)
          .setStartTime(trimStart)
          .setDuration(duration)
          .output(outputFilePath)
          .on("end", () => {
            console.log(`Trimmed clip saved: ${outputFilePath}`);
            resolve();
          })
          .on("error", (err:any) => {
            console.error("Error during trimming:", err);
            reject(err);
          })
          .run();
      });

      trimmedFiles.push(outputFilePath);
      // Optionally remove the downloaded input file
      fs.unlinkSync(inputFilePath);
    }

    // Create a temporary file listing all trimmed segment file paths for FFmpeg concat
    const fileListPath = path.join(tmpdir(), `${uuidv4()}_files.txt`);
    const fileListContent = trimmedFiles
      .map((filePath) => `file '${filePath}'`)
      .join("\n");
    fs.writeFileSync(fileListPath, fileListContent);

    // Define a filename for the stitched output
    const outputStitchedPath = path.join(tmpdir(), `${uuidv4()}_stitched.mp4`);

    // Use FFmpeg to concatenate the trimmed segments.
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(fileListPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        // Using copy might not work if the segments differ in encoding.
        // For a robust solution, re-encoding may be required.
        .outputOptions(["-c", "copy"])
        .output(outputStitchedPath)
        .on("end", () => {
          console.log(`Stitched video saved: ${outputStitchedPath}`);
          resolve();
        })
        .on("error", (err:any) => {
          console.error("Error during stitching:", err);
          reject(err);
        })
        .run();
    });

    // In production, you might upload outputStitchedPath to a storage service and return its public URL.
    // For this example, we'll return a dummy URL.
    const outputUrl = "https://example.com/stitched-video.mp4";

    // Cleanup temporary files (optional)
    fs.unlinkSync(fileListPath);
    trimmedFiles.forEach((filePath) => {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file ${filePath}`, err);
      }
    });
    // Optionally, you might also remove outputStitchedPath if not needed.

    return NextResponse.json({ outputUrl });
  } catch (error: any) {
    console.error("Error stitching videos:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
