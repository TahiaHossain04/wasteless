window.addEventListener("DOMContentLoaded", function () {
  const elements = document.querySelectorAll('[include-html]');
  elements.forEach(el => {
    const file = el.getAttribute("include-html");
    if (file) {
      fetch(file)
        .then(response => {
          if (!response.ok) throw new Error(`Could not load ${file}`);
          return response.text();
        })
        .then(data => {
          el.innerHTML = data;
          el.removeAttribute("include-html");
        })
        .catch(err => console.error("Include error:", err));
    }
  });
});
