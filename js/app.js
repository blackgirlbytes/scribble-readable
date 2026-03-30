(() => {
  // DOM elements
  const tabs = document.querySelectorAll('.tab');
  const cameraMode = document.getElementById('camera-mode');
  const uploadMode = document.getElementById('upload-mode');
  const results = document.getElementById('results');
  const output = document.getElementById('output');
  const confidenceEl = document.getElementById('confidence');
  const timeEl = document.getElementById('processing-time');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  // Camera elements
  const startCameraBtn = document.getElementById('start-camera');
  const stopCameraBtn = document.getElementById('stop-camera');
  const cameraSelect = document.getElementById('camera-select');
  const startOcrBtn = document.getElementById('start-ocr');
  const stopOcrBtn = document.getElementById('stop-ocr');
  const ocrStatus = document.getElementById('ocr-status');

  // Upload elements
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const previewWrapper = document.getElementById('image-preview-wrapper');
  const imagePreview = document.getElementById('image-preview');
  const clearImageBtn = document.getElementById('clear-image');
  const convertBtn = document.getElementById('convert-btn');
  const copyBtn = document.getElementById('copy-btn');

  let ocrInterval = null;
  let lastText = '';
  let ocrInitialized = false;

  // ---- Mode switching ----

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const mode = tab.dataset.mode;
      cameraMode.classList.toggle('active', mode === 'camera');
      uploadMode.classList.toggle('active', mode === 'upload');
    });
  });

  // ---- Camera controls ----

  startCameraBtn.addEventListener('click', async () => {
    try {
      await Camera.start(cameraSelect.value);
      startCameraBtn.disabled = true;
      stopCameraBtn.disabled = false;
      startOcrBtn.disabled = false;
    } catch (err) {
      alert('Could not access camera: ' + err.message);
    }
  });

  stopCameraBtn.addEventListener('click', () => {
    stopLiveOcr();
    Camera.stop();
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    startOcrBtn.disabled = true;
    stopOcrBtn.disabled = true;
  });

  cameraSelect.addEventListener('change', async () => {
    if (Camera.isActive()) {
      await Camera.start(cameraSelect.value);
    }
  });

  // ---- Live OCR ----

  startOcrBtn.addEventListener('click', async () => {
    await ensureOcrReady();
    startOcrBtn.disabled = true;
    stopOcrBtn.disabled = false;
    ocrStatus.textContent = 'Reading...';
    results.hidden = false;

    ocrInterval = setInterval(async () => {
      if (OCR.isBusy() || !Camera.isActive()) return;

      const frame = Camera.captureFrame();
      if (!frame) return;

      const processed = Preprocess.process(frame);
      const result = await OCR.recognize(processed);

      if (result && result.text && result.text !== lastText) {
        lastText = result.text;
        output.value = result.text;
        confidenceEl.textContent = 'Confidence: ' + result.confidence + '%';
        timeEl.textContent = result.timeMs + 'ms';
      }

      ocrStatus.textContent = 'Reading...';
    }, 2000);
  });

  stopOcrBtn.addEventListener('click', () => {
    stopLiveOcr();
  });

  function stopLiveOcr() {
    if (ocrInterval) {
      clearInterval(ocrInterval);
      ocrInterval = null;
    }
    startOcrBtn.disabled = !Camera.isActive();
    stopOcrBtn.disabled = true;
    ocrStatus.textContent = '';
  }

  // ---- Upload mode ----

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      loadImage(fileInput.files[0]);
    }
  });

  // Paste from clipboard
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        loadImage(item.getAsFile());
        break;
      }
    }
  });

  function loadImage(file) {
    const url = URL.createObjectURL(file);
    imagePreview.src = url;
    previewWrapper.hidden = false;
    convertBtn.hidden = false;
    dropZone.hidden = true;
  }

  clearImageBtn.addEventListener('click', () => {
    imagePreview.src = '';
    previewWrapper.hidden = true;
    convertBtn.hidden = true;
    dropZone.hidden = false;
    fileInput.value = '';
  });

  convertBtn.addEventListener('click', async () => {
    await ensureOcrReady();
    convertBtn.disabled = true;
    showProgress(true);
    results.hidden = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagePreview.src;
    await new Promise((r) => (img.onload = r));

    const processed = Preprocess.process(img);
    const result = await OCR.recognize(processed);

    if (result) {
      output.value = result.text;
      confidenceEl.textContent = 'Confidence: ' + result.confidence + '%';
      timeEl.textContent = result.timeMs + 'ms';
    }

    showProgress(false);
    convertBtn.disabled = false;
  });

  // ---- Copy to clipboard ----

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.value);
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = original), 1500);
  });

  // ---- Helpers ----

  async function ensureOcrReady() {
    if (ocrInitialized) return;
    showProgress(true);
    progressText.textContent = 'Loading OCR engine...';
    await OCR.init((progress) => {
      progressFill.style.width = Math.round(progress * 100) + '%';
      progressText.textContent = 'Recognizing... ' + Math.round(progress * 100) + '%';
    });
    ocrInitialized = true;
    showProgress(false);
  }

  function showProgress(show) {
    progressContainer.hidden = !show;
    if (!show) {
      progressFill.style.width = '0%';
      progressText.textContent = '';
    }
  }
})();
