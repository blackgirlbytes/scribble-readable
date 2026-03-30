# Scribble Readable

Turn messy handwriting into typed text — right from your camera.

A 100% client-side web app that uses your webcam to read handwritten text in real time. No API keys, no server, no cost.

## Features

- **Live Camera Mode** — point your camera at handwritten text and watch the transcription update in real time
- **Upload Mode** — drag and drop an image, paste from clipboard, or select a file
- **Image Preprocessing** — automatic grayscale, contrast enhancement, and binarization to improve OCR accuracy on messy handwriting
- **Works on Mobile** — defaults to the back camera so you can point your phone at paper

## How to Use

1. Open `index.html` in your browser, or serve it locally:
   ```
   npx serve .
   ```
2. **Camera mode:** Click "Start Camera" → "Start Reading" → hold up your handwriting
3. **Upload mode:** Switch to the "Upload Image" tab → drop an image → click "Convert to Text"

## How It Works

- [Tesseract.js](https://github.com/naptha/tesseract.js) runs OCR entirely in the browser via WebAssembly
- Frames are captured from the webcam every ~2 seconds
- Each frame is preprocessed (grayscale → contrast boost → black/white threshold) before OCR
- Text output is stabilized so it only updates when the result meaningfully changes

## Tech Stack

- Vanilla JavaScript (no frameworks, no build step)
- Tesseract.js v5 via CDN
- MediaStream API for webcam access
- Canvas API for image preprocessing
