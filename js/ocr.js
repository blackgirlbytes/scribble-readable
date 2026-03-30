const OCR = (() => {
  let worker = null;
  let busy = false;

  async function init(onProgress) {
    if (worker) return;
    worker = await Tesseract.createWorker('eng', 1, {
      logger: (info) => {
        if (onProgress && info.status === 'recognizing text') {
          onProgress(info.progress);
        }
      },
    });
  }

  /**
   * Recognize text from a canvas or image source.
   * Returns { text, confidence } or null if the worker is busy.
   */
  async function recognize(source) {
    if (busy) return null;
    if (!worker) throw new Error('OCR worker not initialized. Call init() first.');

    busy = true;
    try {
      const start = performance.now();
      const { data } = await worker.recognize(source);
      const elapsed = Math.round(performance.now() - start);
      return {
        text: data.text.trim(),
        confidence: Math.round(data.confidence),
        timeMs: elapsed,
      };
    } finally {
      busy = false;
    }
  }

  function isBusy() {
    return busy;
  }

  async function terminate() {
    if (worker) {
      await worker.terminate();
      worker = null;
    }
  }

  return { init, recognize, isBusy, terminate };
})();
