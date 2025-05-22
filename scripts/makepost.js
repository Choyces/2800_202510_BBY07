document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('photo').click();
});

const photoInput   = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');
const previewContainer = document.getElementById('mediaPreviewContainer');

photoInput.addEventListener('change', () => {
  // Remove existing video preview if present
  const oldVideo = document.getElementById('videoPreview');
  if (oldVideo) oldVideo.remove();

  const file = photoInput.files[0];
  if (!file) {
    photoPreview.style.display = 'none';
    photoPreview.src = '';
    return;
  }

  if (file.type.startsWith('image/')) {
    // Show image preview
    const reader = new FileReader();
    reader.onload = e => {
      photoPreview.src = e.target.result;
      photoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else if (file.type.startsWith('video/')) {
    // Hide image preview
    photoPreview.style.display = 'none';
    photoPreview.src = '';

    // Show video preview
    const video = document.createElement('video');
    video.id = 'videoPreview';
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.height = 'auto';
    video.style.border = '1px solid #ccc';
    video.style.padding = '4px';
    video.src = URL.createObjectURL(file);
    previewContainer.appendChild(video);
  }
});
