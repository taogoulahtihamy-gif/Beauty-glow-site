// FORMULAIRE -> envoi vers WhatsApp
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const nameInput = bookingForm.querySelector('input[type="text"]');
    const phoneInput = bookingForm.querySelector('input[type="tel"]');
    const serviceSelect = bookingForm.querySelector("select");
    const dateInput = bookingForm.querySelector('input[type="date"]');
    const messageInput = bookingForm.querySelector("textarea");

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const service = serviceSelect ? serviceSelect.value.trim() : "";
    const date = dateInput ? dateInput.value.trim() : "";
    const message = messageInput ? messageInput.value.trim() : "";

    const whatsappNumber = "221778492779";

    const text =
      `Bonjour Beauty Glow,%0A%0A` +
      `Je souhaite réserver un rendez-vous.%0A%0A` +
      `Nom : ${name}%0A` +
      `Téléphone : ${phone}%0A` +
      `Prestation : ${service}%0A` +
      `Date souhaitée : ${date || "Non précisée"}%0A` +
      `Message : ${message || "Aucun message"}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
  });
}

// MENU MOBILE
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", function () {
    navLinks.classList.toggle("active");
    navToggle.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", function () {
      navLinks.classList.remove("active");
      navToggle.classList.remove("active");
    });
  });
}

// ANIMATIONS AU SCROLL
const revealElements = document.querySelectorAll(
  ".hero-text, .hero-image, .card, .price-card, .gallery-grid img, .booking-intro, .booking-form, .contact-card, .map-container, .footer"
);

const revealOnScroll = () => {
  const triggerBottom = window.innerHeight * 0.88;

  revealElements.forEach((el) => {
    const rect = el.getBoundingClientRect();

    if (rect.top < triggerBottom) {
      el.classList.add("show");
    }
  });
};

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);