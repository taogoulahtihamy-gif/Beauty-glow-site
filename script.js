const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const service = document.getElementById("service").value.trim();
    const date = document.getElementById("date").value.trim();
    const message = document.getElementById("message").value.trim();

    const whatsappNumber = "221778492779";

    const text = `Bonjour Chez MAMA Mari,%0A%0AJe souhaite faire une demande.%0A%0ANom : ${name}%0ATéléphone : ${phone}%0ACommande / Réservation : ${service}%0ADate souhaitée : ${date || "Non précisée"}%0AMessage : ${message || "Aucun message"}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
  });
}