document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('photo').click();
});

const photoInput   = document.getElementById('photo');
const photoPreview = document.getElementById('photoPreview');

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) {
    photoPreview.style.display = 'none';
    photoPreview.src = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    photoPreview.src = e.target.result;      
    photoPreview.style.display = 'block';     
  };
  reader.readAsDataURL(file);
});