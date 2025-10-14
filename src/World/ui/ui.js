export class GameUI {
  constructor({ onCategorySelect, onItemSelect }) {
    this.onCategorySelect = onCategorySelect;
    this.onItemSelect = onItemSelect;

    fetch("/src/World/ui/index.html")
      .then((res) => res.text())
      .then((html) => {
        document.body.insertAdjacentHTML("beforeend", html);
        this._initElements();
      });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/src/World/ui/style.css";
    document.head.appendChild(link);
  }

  _initElements() {
    this.$coins = document.getElementById("coins");
    this.$subButtons = document.getElementById("sub-buttons");

    document.getElementById("btn-plants").onclick = () =>
      this._showSubButtons("plants");
    document.getElementById("btn-animals").onclick = () =>
      this._showSubButtons("animals");
  }

  _showSubButtons(category) {
    this.$subButtons.innerHTML = "";
    this.onCategorySelect(category);

    const items =
      category === "plants"
        ? ["corn", "grape", "tomato", "strawberry"]
        : ["cow", "sheep", "chicken"];

    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.textContent = item;
      btn.className = "btn";
      btn.onclick = () => this.onItemSelect(item);
      this.$subButtons.appendChild(btn);
    });
  }

  updateCoins(value) {
    if (this.$coins) this.$coins.textContent = `💰 Coins: ${value}`;
  }
}
