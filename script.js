// script.js
document.addEventListener('DOMContentLoaded', function(){
  // UI elements
  const startBtn = document.getElementById('startBtn');
  const stepWelcome = document.getElementById('step-welcome');
  const stepAttend = document.getElementById('step-attend');
  const stepFamily = document.getElementById('step-family');
  const stepThanks = document.getElementById('step-thanks');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const familySelect = document.getElementById('familySelect');
  const qrContainer = document.getElementById('qrContainer');
  const confirmBtn = document.getElementById('confirmBtn');
  const visitorNameInput = document.getElementById('visitorName');

  let families = []; // cargadas desde API
  let attending = false;
  let selectedFamily = null;
  let selectedQrs = []; // lista de nombres de archivos QR mostrados

  // Inicial
  startBtn.addEventListener('click', ()=> {
    stepWelcome.classList.add('hidden');
    stepAttend.classList.remove('hidden');
  });

  yesBtn.addEventListener('click', ()=> {
    attending = true;
    stepAttend.classList.add('hidden');
    stepFamily.classList.remove('hidden');
    loadFamilies();
  });

  noBtn.addEventListener('click', ()=> {
    attending = false;
    // preguntar familia incluso si no asiste? Por ahora, guardar direct y mostrar gracias.
    submitResponse({family_name:'', attending:'No', selected_qr:'', visitor_name: visitorNameInput.value})
      .then(()=> showThanks());
  });

  familySelect.addEventListener('change', function(){
    const idx = this.value;
    if(idx === '') return;
    selectedFamily = families[parseInt(idx)];
    renderQrsForFamily(selectedFamily);
  });

  confirmBtn.addEventListener('click', function(){
    if(!selectedFamily){
      alert('Por favor selecciona una familia.');
      return;
    }
    // por simplicidad, enviaremos los nombres de archivos QR visibles
    const qrNames = selectedQrs.join(',');
    const payload = {
      family_name: selectedFamily.family_name,
      attending: attending ? 'Sí' : 'No',
      selected_qr: qrNames,
      visitor_name: visitorNameInput.value || ''
    };
    submitResponse(payload).then(()=> showThanks());
  });

  // ---- funciones ----
  function showThanks(){
    stepFamily.classList.add('hidden');
    stepAttend.classList.add('hidden');
    stepThanks.classList.remove('hidden');
    // animación o temporizador opcional para volver al inicio
  }

  async function loadFamilies(){
    try {
      const resp = await fetch(API_BASE_URL);
      const data = await resp.json();
      families = data.families || [];
      populateFamilySelect();
    } catch (err){
      console.error('Error cargando familias:', err);
      familySelect.innerHTML = '<option value="">Error al cargar familias</option>';
    }
  }

  function populateFamilySelect(){
    familySelect.innerHTML = '';
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Selecciona tu familia --';
    familySelect.appendChild(emptyOption);

    families.forEach((f, i)=>{
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = f.family_name;
      familySelect.appendChild(opt);
    });
  }

  function renderQrsForFamily(family){
    qrContainer.innerHTML = '';
    selectedQrs = [];

    // convencion de nombres: qr_prefix + "_1.png", "_2.png" ...
    // Ajusta si usas otra convención.
    // Intentaremos buscar hasta 6 archivos por familia (puedes aumentar).
    const prefix = family.qr_prefix;
    const maxQ = 6;
    for(let i=1;i<=maxQ;i++){
      const filename = `${prefix}_${i}.png`;
      const img = document.createElement('img');
      img.src = `qrs/${filename}`;
      img.alt = filename;
      img.loading = 'lazy';
      img.onerror = function(){ this.style.display='none'; } // oculta si no existe
      img.onclick = function(){
        // toggle seleccionado visualmente (simple)
        if(this.classList.contains('selected')) {
          this.classList.remove('selected');
          selectedQrs = selectedQrs.filter(x=> x !== filename);
          this.style.outline = '';
        } else {
          this.classList.add('selected');
          selectedQrs.push(filename);
          this.style.outline = '4px solid rgba(208,150,170,0.25)';
        }
      }
      qrContainer.appendChild(img);
    }
  }

  async function submitResponse(payload){
    try {
      await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
    } catch (err){
      console.error('Error enviando respuesta', err);
      alert('Ocurrió un error guardando tu respuesta. Intenta de nuevo.');
    }
  }
});
