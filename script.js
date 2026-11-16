"use strict";

// Site vitrine statique. Le salon doit confirmer son numéro WhatsApp local avant la mise en production.
const WHATSAPP_NUMBER = "221778492779"; // Ancien numéro du site : à vérifier pour le Tchad.

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const setMenuOpen = (open) => {
  if (!navToggle || !navLinks) return;
  navLinks.classList.toggle("is-open", open);
  navToggle.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
};

navToggle?.addEventListener("click", () => setMenuOpen(!navLinks.classList.contains("is-open")));
navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});
document.addEventListener("click", (event) => {
  if (!navLinks?.classList.contains("is-open")) return;
  if (navLinks.contains(event.target) || navToggle?.contains(event.target)) return;
  setMenuOpen(false);
});

const revealElements = document.querySelectorAll("[data-reveal]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((el) => el.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px 45px 0px" });
  revealElements.forEach((el) => observer.observe(el));
}

const filterButtons = [...document.querySelectorAll("[data-filter]")];
const galleryItems = [...document.querySelectorAll(".gallery-item")];
filterButtons.forEach((button) => button.addEventListener("click", () => {
  const filter = button.dataset.filter;
  filterButtons.forEach((el) => {
    const active = el === button;
    el.classList.toggle("is-active", active);
    el.setAttribute("aria-pressed", String(active));
  });
  galleryItems.forEach((item) => {
    item.hidden = filter !== "all" && item.dataset.category !== filter;
  });
}));

const galleryDialog = document.getElementById("galleryDialog");
const dialogImage = document.getElementById("dialogImage");
const dialogCaption = document.getElementById("dialogCaption");
const closeDialog = document.getElementById("closeDialog");
galleryItems.forEach((item) => item.addEventListener("click", () => {
  if (!galleryDialog?.showModal || !dialogImage || !dialogCaption) return;
  const image = item.querySelector("img");
  if (!image) return;
  dialogImage.src = image.currentSrc || image.src;
  dialogImage.alt = image.alt;
  dialogCaption.textContent = item.dataset.title || image.alt;
  galleryDialog.showModal();
}));
closeDialog?.addEventListener("click", () => galleryDialog?.close());
galleryDialog?.addEventListener("click", (event) => {
  if (event.target === galleryDialog) galleryDialog.close();
});
galleryDialog?.addEventListener("close", () => {
  if (dialogImage) dialogImage.removeAttribute("src");
});

const bookingForm = document.getElementById("bookingForm");
const serviceSelect = document.getElementById("serviceSelect");
const dateInput = document.getElementById("preferredDate");
const formatLocalDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0")
].join("-");
if (dateInput) dateInput.min = formatLocalDate(new Date());

document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => {
    if (serviceSelect) serviceSelect.value = link.dataset.service || "";
  });
});

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;

  const data = new FormData(bookingForm);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const service = String(data.get("service") || "").trim();
  const date = String(data.get("date") || "").trim();
  const time = String(data.get("time") || "").trim();
  const message = String(data.get("message") || "").trim();

  if (!name || !phone || !service || !date) return;
  if (date < formatLocalDate(new Date())) {
    dateInput?.setCustomValidity("Veuillez choisir une date aujourd'hui ou ultérieure.");
    dateInput?.reportValidity();
    return;
  }
  if (dateInput) dateInput.setCustomValidity("");

  const lines = [
    "Bonjour Beauty Glow,",
    "",
    "Je souhaite demander un rendez-vous.",
    "",
    `Nom : ${name}`,
    `Téléphone : ${phone}`,
    `Prestation : ${service}`,
    `Date souhaitée : ${date}`,
    `Créneau préféré : ${time || "À convenir"}`,
    `Précisions : ${message || "Aucune"}`,
    "",
    "Merci de me confirmer les disponibilités."
  ];
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (!newWindow) window.location.assign(url);
});
dateInput?.addEventListener("input", () => dateInput.setCustomValidity(""));

document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
  img.addEventListener("error", () => {
    img.closest(".gallery-item, .service-image, .about-image")?.classList.add("image-unavailable");
  }, { once: true });
});
