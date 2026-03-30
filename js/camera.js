const Camera = (() => {
  let stream = null;
  const video = document.getElementById('video');
  const canvas = document.getElementById('frame-canvas');
  const ctx = canvas.getContext('2d');

  async function start(facingMode = 'environment') {
    stop();
    const constraints = {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 960 },
      },
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.classList.add('active');
    document.getElementById('camera-placeholder').hidden = true;
    await video.play();
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    video.srcObject = null;
    video.classList.remove('active');
    document.getElementById('camera-placeholder').hidden = false;
  }

  function captureFrame() {
    if (!stream || video.readyState < 2) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function isActive() {
    return stream !== null;
  }

  return { start, stop, captureFrame, isActive };
})();
