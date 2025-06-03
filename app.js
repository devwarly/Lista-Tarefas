function pesquisar() {
    const input_text = document.getElementsByClassName("search-input")[0].value;

    alert(input_text);
}

const iconFavoritarDesativado = document.getElementById("iconFavoritoDesativado");

iconFavoritarDesativado.addEventListener("click", function() {
  if (iconFavoritarDesativado.classList.contains("bi-star")) {
    iconFavoritarDesativado.classList.remove("bi-star");
    iconFavoritarDesativado.classList.add("bi-star-fill");
  } else {
    iconFavoritarDesativado.classList.remove("bi-star-fill");
    iconFavoritarDesativado.classList.add("bi-star");
  }
});

