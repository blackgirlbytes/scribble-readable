const Preprocess = (() => {
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d');

  /**
   * Run the full preprocessing pipeline on an image source.
   * Accepts ImageData, HTMLImageElement, or HTMLCanvasElement.
   * Returns a canvas element ready for Tesseract.
   */
  function process(source) {
    if (source instanceof ImageData) {
      offscreen.width = source.width;
      offscreen.height = source.height;
      ctx.putImageData(source, 0, 0);
    } else {
      offscreen.width = source.naturalWidth || source.width;
      offscreen.height = source.naturalHeight || source.height;
      ctx.drawImage(source, 0, 0);
    }

    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;

    grayscale(data);
    adjustContrast(data, 60);
    binarize(data, 128);

    ctx.putImageData(imageData, 0, 0);
    return offscreen;
  }

  function grayscale(data) {
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = avg;
    }
  }

  function adjustContrast(data, amount) {
    const factor = (259 * (amount + 255)) / (255 * (259 - amount));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(factor * (data[i] - 128) + 128);
      data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
      data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
    }
  }

  function binarize(data, threshold) {
    for (let i = 0; i < data.length; i += 4) {
      const val = data[i] >= threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = val;
    }
  }

  function clamp(v) {
    return Math.max(0, Math.min(255, v));
  }

  return { process };
})();
