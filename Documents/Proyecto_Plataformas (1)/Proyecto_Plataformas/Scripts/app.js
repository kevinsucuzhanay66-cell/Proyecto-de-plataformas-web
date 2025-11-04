// ===============================
// VALIDACIÓN FORMULARIO CONTACTO
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const formContacto = document.getElementById('f-contacto');
  if (!formContacto) return;

  const campos = {
    nombre: formContacto.querySelector('#nombre'),
    correo: formContacto.querySelector('#correo'),
    mensaje: formContacto.querySelector('#mensaje'),
  };

    // ===============================
// CARRUSEL DE PRODUCTOS (3 por vista)
// ===============================
const track = document.querySelector('.carousel-track');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');

if (track && prevBtn && nextBtn) {
  const productos = Array.from(track.children);
  const porPagina = 3;
  let pagina = 0;
  const totalPaginas = Math.ceil(productos.length / porPagina);
  const tiempoCambio = 5000; // 5s
  let intervalo;

  function moverCarrusel() {
    track.style.transform = `translateX(-${pagina * 100}%)`;
  }

  function siguiente() {
    pagina = (pagina + 1) % totalPaginas;
    moverCarrusel();
  }

  function anterior() {
    pagina = (pagina - 1 + totalPaginas) % totalPaginas;
    moverCarrusel();
  }

  nextBtn.addEventListener('click', () => {
    siguiente();
    reiniciarAuto();
  });

  prevBtn.addEventListener('click', () => {
    anterior();
    reiniciarAuto();
  });

  function iniciarAuto() {
    intervalo = setInterval(siguiente, tiempoCambio);
  }

  function reiniciarAuto() {
    clearInterval(intervalo);
    iniciarAuto();
  }

  iniciarAuto();
}



  // Mapeo de mensajes personalizados
  const mensajes = {
    nombre: {
      valueMissing: 'Ingresa tu nombre.',
      tooShort: 'Debe tener al menos 2 caracteres.',
    },
    correo: {
      valueMissing: 'Ingresa tu correo electrónico.',
      typeMismatch: 'Ingresa un correo electrónico válido (usuario@dominio).',
    },
    mensaje: {
      valueMissing: 'Escribe tu mensaje o consulta.',
    },
  };

  // Mostrar error personalizado bajo el campo
  function mostrarError(el, mensaje) {
    const errId = el.id + '-err';
    const errSpan = document.getElementById(errId);
    if (!errSpan) return;

    if (mensaje) {
      errSpan.textContent = mensaje;
      errSpan.hidden = false;
      el.setAttribute('aria-invalid', 'true');
    } else {
      errSpan.textContent = '';
      errSpan.hidden = true;
      el.removeAttribute('aria-invalid');
    }
  }

  // Validar campo individualmente
  function validarCampo(el) {
    const val = el.validity;
    let msg = '';

    if (val.valueMissing) msg = mensajes[el.id]?.valueMissing;
    else if (val.tooShort) msg = mensajes[el.id]?.tooShort;
    else if (val.typeMismatch) msg = mensajes[el.id]?.typeMismatch;

    mostrarError(el, msg);
    return !msg;
  }

  // Eventos por campo (input + blur)
  Object.values(campos).forEach((campo) => {
    campo.addEventListener('input', () => validarCampo(campo));
    campo.addEventListener('blur', () => validarCampo(campo));
  });

  // Validación al enviar
  formContacto.addEventListener('submit', (e) => {
    e.preventDefault();
    let valido = true;

    Object.values(campos).forEach((campo) => {
      const ok = validarCampo(campo);
      if (!ok && valido) campo.focus();
      valido = valido && ok;
    });

    if (valido) {
      alert('✅ Formulario enviado correctamente (simulación).');
      formContacto.reset();
      Object.values(campos).forEach((c) => mostrarError(c, ''));
    }
  });
});
