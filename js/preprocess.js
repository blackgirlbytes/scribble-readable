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
    adjustContrast(data, 30);
    const threshold = otsuThreshold(data);
    binarize(data, threshold);

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

  /**
   * Otsu's method — finds the optimal binarization threshold by minimizing
   * intra-class variance. Adapts to each image instead of using a fixed cutoff.
   */
  function otsuThreshold(data) {
    const histogram = new Array(256).fill(0);
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }

    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let weightB = 0;
    let maxVariance = 0;
    let bestThreshold = 128;

    for (let t = 0; t < 256; t++) {
      weightB += histogram[t];
      if (weightB === 0) continue;

      const weightF = totalPixels - weightB;
      if (weightF === 0) break;

      sumB += t * histogram[t];
      const meanB = sumB / weightB;
      const meanF = (sum - sumB) / weightF;
      const variance = weightB * weightF * (meanB - meanF) * (meanB - meanF);

      if (variance > maxVariance) {
        maxVariance = variance;
        bestThreshold = t;
      }
    }

    return bestThreshold;
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
