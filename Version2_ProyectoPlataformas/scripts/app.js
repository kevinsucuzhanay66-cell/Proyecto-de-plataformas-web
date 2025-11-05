const LS_CART = "net_cart_v1";
const $ = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> [...r.querySelectorAll(s)];

// ✅ Notificación visual (toast)
function showToast(msg){
  let t = document.querySelector(".toast");
  if(!t){
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"), 1500);
}


function fmtUSD(n){ return new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD'}).format(n); }

function leerCart(){ try{ return JSON.parse(localStorage.getItem(LS_CART)||"[]"); }catch{ return []; } }
function guardarCart(c){ localStorage.setItem(LS_CART, JSON.stringify(c)); pintarBadge(); }

function agregarAlCarrito(id, precio){
  const cart = leerCart();
  const i = cart.findIndex(x=>x.id===id);
  if(i>=0) cart[i].qty += 1;
  else cart.push({id, qty:1, precio});
  guardarCart(cart);
  showToast("Producto agregado correctamente ✅");
}


function quitarDelCarrito(id){
  let cart = leerCart().filter(x=>x.id!==id);
  guardarCart(cart);
}

function pintarBadge(){
  const el = $("#cart-link");
  if(!el) return;
  const count = leerCart().reduce((a,b)=> a+b.qty, 0);
  el.textContent = `🛒 Carrito (${count})`;
}

async function getProductos(){
  const res = await fetch("./data/productos.json");
  if(!res.ok) throw new Error("No se pudo cargar productos");
  return await res.json();
}

function badgeDisponibilidad(p){
  if(p.stock>0) return `<span class="badge ok">Disponible</span>`;
  return `<span class="badge soon">Próximamente</span>`;
}

function coloresDisponibles(p){
  if(!p.colores?.length) return "";
  return p.colores.map(c=>`<span class="badge ${c.disponible?'ok':'soon'}">${c.color}</span>`).join(" ");
}

function cardProducto(p){
  return `<li class="card">
    <div class="thumb"><img src="${p.imagen}" alt="${p.nombre}"></div>
    <div class="meta">
      <h3>${p.nombre}</h3>
      <span class="price">${fmtUSD(p.precio)}</span>
    </div>
    <div class="kv">
      <p>${p.resena}</p>
      <p>${badgeDisponibilidad(p)} &nbsp; ${coloresDisponibles(p)}</p>
      <p style="margin:.4rem 0 0 0; font-size:.85rem">${p.specs.slice(0,3).join(" · ")}</p>
      <div class="cta" style="margin-top:.6rem">
        <button class="btn btn-primary btn-add" data-id="${p.id}" data-precio="${p.precio}">Añadir al carrito</button>
        <button class="btn btn-more" data-id="${p.id}">Ver más</button>
      </div>
    </div>
  </li>`;
}

async function renderHome(){
  try{
    const data = await getProductos();
    const destacados = data.slice(0, 6);
    const grid = $("#grid-destacados");
    grid.innerHTML = destacados.map(cardProducto).join("");

    // 🔹 Delegación de eventos: Añadir y Ver más
    grid.addEventListener("click", (e)=>{
      const add = e.target.closest(".btn-add");
      if(add){
        agregarAlCarrito(add.dataset.id, Number(add.dataset.precio || 0));
        showToast("Producto agregado correctamente ✅");
        return;
      }

      // ✅ NUEVO: "Ver más" con carrusel integrado
      const more = e.target.closest(".btn-more");
      if(more){
        const card = more.closest(".card");
        const prod = data.find(x => x.id === more.dataset.id);
        if(!card || !prod) return;

        // Si ya está abierto, lo cierra
        let details = card.querySelector(".extra-info");
        if(details){ details.remove(); return; }

        // Crear bloque con carrusel
        const info = document.createElement("div");
        info.className = "extra-info";
        info.innerHTML = `
          <div class="carousel">
            <button class="prev">◀</button>
            <div class="slides">
              ${(prod.imagenes || [prod.imagen]).map(src => `
                <img src="${src}" alt="${prod.nombre}" class="slide">
              `).join("")}
            </div>
            <button class="next">▶</button>
          </div>
          <p style="margin-top:.6rem">${prod.resena}</p>
          <ul style="margin:.4rem 0 0 1rem;font-size:.9rem">
            ${prod.specs.map(s=>`<li>${s}</li>`).join("")}
          </ul>
        `;
        card.appendChild(info);

        // --- Carrusel funcional ---
        const slides = info.querySelectorAll(".slide");
        let i = 0;
        slides.forEach((s, idx)=> s.style.display = idx===0 ? "block" : "none");

        info.querySelector(".prev").onclick = ()=>{
          slides[i].style.display = "none";
          i = (i - 1 + slides.length) % slides.length;
          slides[i].style.display = "block";
        };
        info.querySelector(".next").onclick = ()=>{
          slides[i].style.display = "none";
          i = (i + 1) % slides.length;
          slides[i].style.display = "block";
        };
      }
    });
  }catch(e){
    $("#grid-destacados").innerHTML = "<li>Error cargando destacados.</li>";
  }
}


function aplicarFiltros(lista, q="", cat=""){
  q = q.trim().toLowerCase();
  return lista.filter(p=>{
    const okQ = !q || p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q);
    const okC = !cat || p.categoria===cat;
    return okQ && okC;
  });
}

async function renderProductos(){
  const el = $("#grid-productos");
  el.innerHTML = "<li>Cargando…</li>";
  try{
    const data = await getProductos();
    const $q = $("#q"), $c = $("#cat");
    const pintar = ()=>{
      const filtrados = aplicarFiltros(data, $q.value, $c.value);
      el.innerHTML = filtrados.map(cardProducto).join("");
    };
    [$q, $c].forEach(i=> i.addEventListener("input", pintar));
    pintar();

    // Delegación: clicks en Añadir y Ver más
    el.addEventListener("click", e=>{
      const add = e.target.closest(".btn-add");
      if(add){
        agregarAlCarrito(add.dataset.id, Number(add.dataset.precio||0));
        showToast("Producto agregado correctamente ✅");
        return;
      }

      // "Ver más" con carrusel de imágenes y detalles
      const more = e.target.closest(".btn-more");
      if(more){
        const card = more.closest(".card");
        const prod = data.find(x => x.id === more.dataset.id);
        if(!card || !prod) return;

        // Si ya está abierto, lo cierra
        let details = card.querySelector(".extra-info");
        if(details){ details.remove(); return; }

        // Crear bloque de detalles con carrusel
        const info = document.createElement("div");
        info.className = "extra-info";
        info.innerHTML = `
          <div class="carousel">
            <button class="prev">◀</button>
            <div class="slides">
              ${(prod.imagenes || [prod.imagen]).map(src => `
                <img src="${src}" alt="${prod.nombre}" class="slide">
              `).join("")}
            </div>
            <button class="next">▶</button>
          </div>
          <p style="margin-top:.6rem">${prod.resena}</p>
          <ul style="margin:.4rem 0 0 1rem;font-size:.9rem">
            ${prod.specs.map(s=>`<li>${s}</li>`).join("")}
          </ul>
        `;
        card.appendChild(info);

        // --- Carrusel funcional ---
        const slides = info.querySelectorAll(".slide");
        let i = 0;
        slides.forEach((s, idx)=> s.style.display = idx===0 ? "block" : "none");

        info.querySelector(".prev").onclick = ()=>{
          slides[i].style.display = "none";
          i = (i - 1 + slides.length) % slides.length;
          slides[i].style.display = "block";
        };
        info.querySelector(".next").onclick = ()=>{
          slides[i].style.display = "none";
          i = (i + 1) % slides.length;
          slides[i].style.display = "block";
        };
      }

    });
  }catch(e){
    el.innerHTML = "<li>Error cargando catálogo.</li>";
  }
} 
//Render que controla toda la funcionalidad del carrito
//Render que controla toda la funcionalidad del carrito
async function renderCarrito() {
  const host = $("#carrito-vista");
  const data = await getProductos().catch(() => []);
  const index = Object.fromEntries(data.map(p => [p.id, p]));
  const cart = leerCart();

  if (cart.length === 0) {
    host.innerHTML = "<p>Tu carrito está vacío.</p>";
    return;
  }

  const filas = cart.map(it => {
    const p = index[it.id];
    const nombre = p?.nombre || it.id;
    const precio = p?.precio ?? it.precio ?? 0;
    const subtotal = precio * it.qty;
    const imagen = p?.imagen || "./assets/images/placeholder.jpg";

    return `
      <tr>
        <td>
          <div class="cart-item">
            <img src="${imagen}" alt="${nombre}" class="cart-thumb">
            <strong>${nombre}</strong>
          </div>
        </td>
        <td>
          <div class="cart-qty">
            <button class="btn btn-more btn-qty" data-id="${it.id}" data-change="-1">-</button>
            <input type="number" class="input-qty" data-id="${it.id}" min="1" step="1" value="${it.qty}">
            <button class="btn btn-more btn-qty" data-id="${it.id}" data-change="1">+</button>
          </div>
        </td>
        <td>${fmtUSD(precio)}</td>
        <td>${fmtUSD(subtotal)}</td>
        <td><button class="btn btn-more btn-del" data-id="${it.id}">Quitar</button></td>
      </tr>`;
  }).join("");

  const total = cart.reduce((a, b) => a + (b.precio || (index[b.id]?.precio || 0)) * b.qty, 0);

  host.innerHTML = `
    <div class="card cart-card">
      <table class="cart-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <p class="cart-total">Total: ${fmtUSD(total)}</p>
      <div class="cta cart-actions">
        <button class="btn" id="vaciar">Vaciar</button>
        <button class="btn btn-primary" id="continuar">Continuar</button>
      </div>
    </div>`;

  // 🎯 Eventos: quitar, vaciar, modificar cantidad
  host.addEventListener("click", e => {
    const del = e.target.closest(".btn-del");
    if (del) { quitarDelCarrito(del.dataset.id); renderCarrito(); }

    if (e.target.id === "vaciar") {
      localStorage.removeItem(LS_CART);
      pintarBadge();
      renderCarrito();
    }

    if (e.target.id === "continuar") {
      alert("Demo: checkout en desarrollo 🚀");
    }

    const qtyBtn = e.target.closest(".btn-qty");
    if (qtyBtn) {
      const id = qtyBtn.dataset.id;
      const delta = parseInt(qtyBtn.dataset.change);
      const c = leerCart();
      const i = c.findIndex(x => x.id === id);
      if (i >= 0) {
        c[i].qty = Math.max(1, c[i].qty + delta);
        guardarCart(c);
        renderCarrito();
      }
    }
  });

  host.addEventListener("input", e => {
    const inp = e.target.closest(".input-qty");
    if (inp) {
      const id = inp.dataset.id;
      const val = Math.max(1, Number(inp.value || 1));
      const c = leerCart();
      const i = c.findIndex(x => x.id === id);
      if (i >= 0) {
        c[i].qty = val;
        guardarCart(c);
        renderCarrito();
      }
    }
  });
}



document.addEventListener("DOMContentLoaded", ()=>{
  pintarBadge();
  if(window.PAGE==="home") renderHome();
  if(window.PAGE==="productos") renderProductos();
  if(window.PAGE==="carrito") renderCarrito();
});

// --------- Filtros avanzados (marca, precio, orden) en productos ---------
function marcasUnicas(list){
  return [...new Set(list.map(p=>p.marca))].sort();
}
function boundsPrecio(list){
  if(!list.length) return [0,0];
  const min = Math.min(...list.map(p=>p.precio));
  const max = Math.max(...list.map(p=>p.precio));
  return [Math.floor(min), Math.ceil(max)];
}
function ordenar(list, criterio){
  const arr = [...list];
  switch(criterio){
    case "precio-asc": arr.sort((a,b)=> a.precio - b.precio); break;
    case "precio-desc": arr.sort((a,b)=> b.precio - a.precio); break;
    case "nombre-asc": arr.sort((a,b)=> a.nombre.localeCompare(b.nombre)); break;
    case "stock-desc": arr.sort((a,b)=> (b.stock||0) - (a.stock||0)); break;
  }
  return arr;
}

async function enhanceFiltros(data){
  if(!$("#filtros")) return;
  // insertar selects de marca, rango de precio y orden
  const f = $("#filtros");
  const marcas = marcasUnicas(data);
  const [pmin, pmax] = boundsPrecio(data);
  const bloque = document.createElement("div");
  bloque.className = "grid";
  bloque.style.gridTemplateColumns = "1fr 1fr";
  bloque.style.gap = ".6rem";
  bloque.innerHTML = `
    <select id="marca" aria-label="Marca">
      <option value="">Todas las marcas</option>
      ${marcas.map(m=>`<option>${m}</option>`).join("")}
    </select>
    <select id="orden" aria-label="Ordenar por">
      <option value="">Ordenar por…</option>
      <option value="precio-asc">Precio: menor a mayor</option>
      <option value="precio-desc">Precio: mayor a menor</option>
      <option value="nombre-asc">Nombre (A-Z)</option>
      <option value="stock-desc">Stock (mayor primero)</option>
    </select>
    <label>Precio mín.
      <input id="pmin" type="number" step="1" min="0" value="${pmin}">
    </label>
    <label>Precio máx.
      <input id="pmax" type="number" step="1" min="${pmin}" value="${pmax}">
    </label>
  `;
  f.appendChild(bloque);
}

function aplicarFiltrosAvanzados(list){
  const q = ($("#q")?.value||"").trim().toLowerCase();
  const cat = $("#cat")?.value||"";
  const marca = $("#marca")?.value||"";
  const pmin = Number($("#pmin")?.value||0);
  const pmax = Number($("#pmax")?.value||1e9);
  const orden = $("#orden")?.value||"";

  let res = list.filter(p=>{
    const okQ = !q || p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q);
    const okC = !cat || p.categoria===cat;
    const okM = !marca || p.marca===marca;
    const okP = (p.precio>=pmin && p.precio<=pmax);
    return okQ && okC && okM && okP;
  });
  res = ordenar(res, orden);
  return res;
}

// Reemplaza en renderProductos para usar filtros avanzados si existen
const _renderProductosOld = renderProductos;
renderProductos = async function(){
  const el = $("#grid-productos");
  el.innerHTML = "<li>Cargando…</li>";
  try{
    const data = await getProductos();
    await enhanceFiltros(data);
    const pintar = ()=>{
      const filtrados = aplicarFiltrosAvanzados(data);
      el.innerHTML = filtrados.map(cardProducto).join("");
    };
    $("#q")?.addEventListener("input", pintar);
    $("#cat")?.addEventListener("input", pintar);
    $("#marca")?.addEventListener("input", pintar);
    $("#pmin")?.addEventListener("input", pintar);
    $("#pmax")?.addEventListener("input", pintar);
    $("#orden")?.addEventListener("input", pintar);
    pintar();

    el.addEventListener("click", e=>{
      const add = e.target.closest(".btn-add");
      if(add){
        agregarAlCarrito(add.dataset.id, Number(add.dataset.precio||0));
        return;
      }
      const more = e.target.closest(".btn-more");
      if(more){
        location.href = `./producto.html?id=${encodeURIComponent(more.dataset.id)}`;
      }
    });
  }catch(e){
    el.innerHTML = "<li>Error cargando catálogo.</li>";
  }
}

// --------- Detalle de producto ---------
async function renderDetalle(){
  const host = $("#vista-detalle");
  if(!host) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if(!id){ host.innerHTML = "<p>Producto no especificado.</p>"; return; }
  try{
    const data = await getProductos();
    const p = data.find(x=>x.id===id);
    if(!p){ host.innerHTML = "<p>Producto no encontrado.</p>"; return; }
    host.innerHTML = `
      <article class="card" style="overflow:hidden">
        <div class="thumb"><img src="${p.imagen}" alt="${p.nombre}"></div>
        <div class="kv" style="padding:1rem">
          <h1 style="margin:.2rem 0">${p.nombre}</h1>
          <p>${badgeDisponibilidad(p)} &nbsp; ${coloresDisponibles(p)}</p>
          <p class="price" style="font-size:1.2rem">${fmtUSD(p.precio)}</p>
          <p>${p.resena}</p>
          <ul>${p.specs.map(s=>`<li>${s}</li>`).join("")}</ul>
          <div class="cta" style="margin-top:.6rem">
            <button class="btn btn-primary" id="add-detalle" data-id="${p.id}" data-precio="${p.precio}">Añadir al carrito</button>
            <a class="btn" href="./productos.html">Volver</a>
          </div>
        </div>
      </article>`;
    $("#add-detalle")?.addEventListener("click", (e)=>{
      agregarAlCarrito(e.target.dataset.id, Number(e.target.dataset.precio||0));
    });
  }catch{
    host.innerHTML = "<p>Error cargando producto.</p>";
  }
}

// --------- Contacto: validación y guardado ---------
function validarContacto(d){
  const errores = [];
  if(!d.nombre || d.nombre.trim().length<3) errores.push("Nombre muy corto.");
  if(!d.email || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(d.email)) errores.push("Correo inválido.");
  if(!d.telefono || !/^[0-9+\\-\\s]{7,20}$/.test(d.telefono)) errores.push("Teléfono inválido.");
  if(!d.asunto || d.asunto.trim().length<3) errores.push("Asunto muy corto.");
  if(!d.mensaje || d.mensaje.trim().length<10) errores.push("Mensaje muy corto.");
  if(!d.acepto) errores.push("Debes aceptar el uso de datos.");
  return errores;
}
function exportarTXTLocal(entries){
  const text = entries.map(e=>`${e.fecha}\\t${e.nombre}\\t${e.email}\\t${e.telefono}\\t${e.asunto}\\t${e.mensaje.replace(/\\n/g,' ')}`).join("\\n");
  const blob = new Blob([text], {type:"text/plain"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "contactos_export.txt";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
function leerBuzon(){ return JSON.parse(localStorage.getItem("net_contactos")||"[]"); }
function guardarBuzon(x){ localStorage.setItem("net_contactos", JSON.stringify(x)); }

async function renderContacto(){
  const f = $("#form-contacto");
  if(!f) return;
  const estado = $("#c-estado");
  $("#btn-exportar")?.addEventListener("click", ()=>{
    exportarTXTLocal(leerBuzon());
  });

  f.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const d = {
      nombre: $("#c-nombre").value.trim(),
      email: $("#c-email").value.trim(),
      telefono: $("#c-telefono").value.trim(),
      asunto: $("#c-asunto").value.trim(),
      mensaje: $("#c-mensaje").value.trim(),
      acepto: $("#c-acepto").checked
    };
    const errs = validarContacto(d);
    if(errs.length){
      estado.textContent = "Errores: " + errs.join(" ");
      return;
    }
    const payload = {...d, fecha: new Date().toISOString()};
    try{
      if(window.BACKEND){
        const res = await fetch("/api/contactos", {
          method:"POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error("HTTP " + res.status);
      }else{
        const buzon = leerBuzon();
        buzon.push(payload);
        guardarBuzon(buzon);
      }
      f.reset();
      estado.textContent = "Mensaje registrado correctamente.";
    }catch(ex){
      estado.textContent = "No se pudo guardar el mensaje.";
    }
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  if(window.PAGE==="producto") renderDetalle();
  if(window.PAGE==="contacto") renderContacto();
});

// ========== LOGIN DEMO LOCAL ==========
const LS_USER = "net_user";

function getUser(){ try{ return JSON.parse(localStorage.getItem(LS_USER)||"null"); }catch{return null;} }
function setUser(u){ localStorage.setItem(LS_USER, JSON.stringify(u)); pintarSesion(); }
function clearUser(){ localStorage.removeItem(LS_USER); pintarSesion(); }

function pintarSesion(){
  const nav = document.querySelector(".menu");
  if(!nav) return;
  const viejo = nav.querySelector("#user-info");
  if(viejo) viejo.remove();
  const u = getUser();
  const span = document.createElement("span");
  span.id = "user-info";
  span.style.marginLeft = ".4rem";
  if(u && u.email){
    span.innerHTML = `<span style="opacity:.8">Hola, ${u.email.split("@")[0]}</span> 
      <a href="#" id="logout" class="btn" style="padding:.2rem .5rem;font-size:.8rem">Salir</a>`;
  } else {
    span.innerHTML = `<a href="./login.html" class="btn" style="padding:.2rem .5rem;font-size:.8rem">Login</a>`;
  }
  nav.appendChild(span);
  span.querySelector("#logout")?.addEventListener("click",(e)=>{
    e.preventDefault();
    clearUser();
    showToast("Sesión cerrada 👋");
  });
}

function renderLogin(){
  const f = $("#form-login");
  if(!f) return;
  const estado = $("#l-estado");
  f.addEventListener("submit", e=>{
    e.preventDefault();
    const email = $("#l-email").value.trim();
    const pass = $("#l-pass").value.trim();

    // 🔹 Validación estricta de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|hotmail|outlook|yahoo|icloud|live|edu|empresa)\.[a-z]{2,}$/i;
    if(!emailRegex.test(email)){
      estado.textContent = "Por favor ingresa un correo válido (ej: nombre@dominio.com)";
      return;
    }

    if(pass.length < 6){
      estado.textContent = "La contraseña debe tener al menos 6 caracteres.";
      return;
    }

    setUser({email});
    showToast("Sesión iniciada 🔐");
    setTimeout(()=> location.href="./index.html", 800);
  });
}


// Ejecutar al cargar
document.addEventListener("DOMContentLoaded", ()=>{
  pintarSesion();
  if(window.PAGE==="login") renderLogin();
});
