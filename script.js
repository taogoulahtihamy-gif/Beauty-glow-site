"use strict";

const WHATSAPP_NUMBER = "23561488544";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const params = new URLSearchParams(window.location.search);

function initNavigation() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("navLinks");
  const mobile = window.matchMedia("(max-width: 900px)");
  const header = document.getElementById("top");
  function setOpen(open, restoreFocus = false) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    nav.inert = mobile.matches && !open;
    if (mobile.matches) nav.setAttribute("aria-hidden", String(!open));
    else nav.removeAttribute("aria-hidden");
    if (restoreFocus) toggle.focus();
  }
  setOpen(false);
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("click", event => {
    if (!event.target.closest(".nav-inner")) setOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false, true);
  });
  document.addEventListener("focusin", event => {
    if (!event.target.closest(".nav-inner")) setOpen(false);
  });
  mobile.addEventListener("change", () => setOpen(false));
  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

function initReveals() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px 30px 0px" });
  document.querySelectorAll("[data-reveal]").forEach(el => observer.observe(el));
  document.documentElement.classList.add("reveal-ready");
}

function initGallery() {
  const dialog = document.getElementById("galleryDialog");
  if (!dialog) return;
  const items = [...document.querySelectorAll(".gallery-grid .gallery-item")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const status = document.getElementById("galleryStatus");
  const image = document.getElementById("dialogImage");
  const caption = document.getElementById("dialogCaption");
  const counter = document.getElementById("dialogCounter");
  const previous = document.getElementById("previousPhoto");
  const next = document.getElementById("nextPhoto");
  const choose = document.getElementById("chooseInspiration");
  let selected = null;
  let opener = null;
  let closeTimer = null;
  function applyFilter(filter, updateURL = true) {
    filters.forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    items.forEach(item => {
      item.hidden = filter !== "all" && item.dataset.category !== filter;
      item.style.animation = "none";
    });
    requestAnimationFrame(() => requestAnimationFrame(() => items.forEach(item => item.style.removeProperty("animation"))));
    const count = items.filter(item => !item.hidden).length;
    status.textContent = `${count} inspiration${count > 1 ? "s" : ""} affichée${count > 1 ? "s" : ""}`;
    if (updateURL) {
      const url = new URL(window.location.href);
      if (filter === "all") url.searchParams.delete("categorie");
      else url.searchParams.set("categorie", filter);
      url.searchParams.delete("photo");
      history.replaceState(null, "", url);
    }
  }
  filters.forEach(button => button.addEventListener("click", () => applyFilter(button.dataset.filter)));
  const initialFilter = params.get("categorie");
  if (filters.some(button => button.dataset.filter === initialFilter)) applyFilter(initialFilter, false);
  image.addEventListener("load", () => image.classList.add("is-loaded"));
  function displayPhoto(item) {
    selected = item;
    const visible = items.filter(photo => !photo.hidden);
    image.classList.remove("is-loaded");
    image.src = item.dataset.image;
    image.alt = item.querySelector("img").alt;
    if (image.complete && image.naturalWidth) image.classList.add("is-loaded");
    caption.textContent = item.dataset.title;
    counter.textContent = `${visible.indexOf(item) + 1} / ${visible.length}`;
    choose.href = `reservation.html?inspiration=${encodeURIComponent(item.dataset.id)}`;
    previous.disabled = next.disabled = visible.length < 2;
  }
  function openPhoto(item) {
    if (item.hidden) applyFilter("all", false);
    opener = item;
    displayPhoto(item);
    dialog.classList.remove("is-closing");
    clearTimeout(closeTimer);
    dialog.showModal();
    document.body.classList.add("modal-open");
    document.getElementById("closeDialog").focus();
  }
  function closePhoto() {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    if (reducedMotion.matches) return dialog.close();
    dialog.classList.add("is-closing");
    closeTimer = window.setTimeout(() => dialog.close(), 180);
  }
  function movePhoto(direction) {
    const visible = items.filter(item => !item.hidden);
    displayPhoto(visible[(visible.indexOf(selected) + direction + visible.length) % visible.length]);
  }
  items.forEach(item => item.addEventListener("click", event => {
    // Preserve normal modified-link behavior and the direct image link without JS.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openPhoto(item);
  }));
  previous.addEventListener("click", () => movePhoto(-1));
  next.addEventListener("click", () => movePhoto(1));
  document.getElementById("closeDialog").addEventListener("click", closePhoto);
  dialog.addEventListener("cancel", event => { event.preventDefault(); closePhoto(); });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePhoto();
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      const controls = [...dialog.querySelectorAll("button:not(:disabled), a[href]")];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  dialog.addEventListener("close", () => {
    clearTimeout(closeTimer);
    dialog.classList.remove("is-closing");
    document.body.classList.remove("modal-open");
    image.removeAttribute("src");
    opener?.focus({ preventScroll: true });
  });
  let touchStart = null;
  image.addEventListener("touchstart", event => {
    if (event.touches.length === 1) touchStart = { x:event.changedTouches[0].clientX, y:event.changedTouches[0].clientY };
    else touchStart = null;
  }, { passive: true });
  image.addEventListener("touchend", event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) movePhoto(dx < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });
  image.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
  const requestedPhoto = items.find(item => item.dataset.id === params.get("photo"));
  if (requestedPhoto) openPhoto(requestedPhoto);
}

function initBooking() {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const service = document.getElementById("serviceSelect");
  const date = document.getElementById("preferredDate");
  const name = document.getElementById("clientName");
  const phone = document.getElementById("clientPhone");
  const message = document.getElementById("clientMessage");
  const result = document.getElementById("bookingResult");
  const chosen = document.getElementById("chosenInspiration");
  const catalogue = JSON.parse(document.getElementById("inspirationData").textContent);
  let inspiration = catalogue.find(photo => photo.id === params.get("inspiration"));
  const requestedService = params.get("service");
  if ([...service.options].some(option => option.value === requestedService)) service.value = requestedService;
  if (inspiration) {
    chosen.hidden = false;
    document.getElementById("chosenImage").src = inspiration.image.replace(".webp", "-640.webp");
    document.getElementById("chosenImage").alt = inspiration.alt;
    document.getElementById("chosenTitle").textContent = inspiration.title;
    if (!service.value) service.value = inspiration.category === "twists" ? "Vanilles & twists" : ["braids", "nattes"].includes(inspiration.category) ? "Tresses" : "Coiffure";
  }
  document.getElementById("clearInspiration").addEventListener("click", () => {
    inspiration = null;
    chosen.hidden = true;
    result.hidden = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("inspiration");
    history.replaceState(null, "", url);
    service.focus();
  });
  function salonToday() {
    const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Ndjamena", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    return ["year", "month", "day"].map(type => parts.find(part => part.type === type).value).join("-");
  }
  function refreshDate() { date.min = salonToday(); }
  refreshDate();
  window.addEventListener("focus", refreshDate);
  date.addEventListener("focus", refreshDate);
  form.addEventListener("input", event => { event.target.setCustomValidity?.(""); result.hidden = true; });
  form.addEventListener("change", () => { result.hidden = true; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    refreshDate();
    name.setCustomValidity(name.value.trim() ? "" : "Veuillez indiquer votre nom.");
    const digits = phone.value.replace(/\D/g, "");
    const validPhone = /^[+\d\s().-]+$/.test(phone.value.trim()) && digits.length >= 8 && digits.length <= 15;
    phone.setCustomValidity(validPhone ? "" : "Veuillez saisir un numéro de téléphone valide (8 à 15 chiffres).");
    date.setCustomValidity(date.value && date.value < salonToday() ? "Choisissez aujourd’hui ou une date ultérieure." : "");
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const [year, month, day] = data.get("date").split("-");
    const lines = ["Bonjour Ets. Ndob_MagicShop,", "", "Je souhaite demander un rendez-vous.", "", `Nom : ${name.value.trim()}`, `Téléphone : ${phone.value.trim()}`, `Prestation : ${service.value}`, `Date souhaitée : ${day}/${month}/${year}`, `Créneau préféré : ${data.get("time") || "À convenir"}`, `Inspiration : ${inspiration ? inspiration.title : "À définir ensemble"}`, `Précisions : ${message.value.trim() || "Aucune"}`, "", "Merci de me confirmer le tarif et les disponibilités."];
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    document.getElementById("whatsappContinue").href = url;
    result.hidden = false;
    // noopener can return null even on success; never trigger a duplicate opening.
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

initNavigation();
initReveals();
initGallery();
initBooking();
