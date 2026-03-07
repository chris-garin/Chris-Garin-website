const toggle = document.getElementById("mobile-menu");
const nav = document.getElementById("primary-nav");

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  toggle.classList.toggle("is-active");
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});