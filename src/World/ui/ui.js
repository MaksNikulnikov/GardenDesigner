export class GameUI {
  constructor({ onBuildModeSelect, onCategorySelect, onItemSelect }) {
    this.onBuildModeSelect = onBuildModeSelect;
    this.onCategorySelect = onCategorySelect;
    this.onItemSelect = onItemSelect;

    fetch("/src/World/ui/index.html")
      .then((res) => res.text())
      .then((html) => {
        document.body.insertAdjacentHTML("beforeend", html);
        this._initElements();
        this._createHintElements();
      });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/src/World/ui/style.css";
    document.head.appendChild(link);
  }

  _initElements() {
    this.$coins = document.getElementById("coins");
    this.$subButtons = document.getElementById("sub-buttons");

    this.$btnBuild = document.getElementById("btn-build");
    this.$btnPlants = document.getElementById("btn-plants");
    this.$btnAnimals = document.getElementById("btn-animals");

    this.$btnBuild.onclick = () => this._showBuildOptions();
    this.$btnPlants.onclick = () => this._showSubButtons("plants");
    this.$btnAnimals.onclick = () => this._showSubButtons("animals");
  }

  // --- BUILD MODE ---
  _showBuildOptions() {
    this.$subButtons.innerHTML = "";
    const options = [
      { label: "🌿 Build Garden Plot", type: "garden" },
      { label: "🐔 Build Animal Pen", type: "pen" },
    ];

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.textContent = opt.label;
      btn.className = "btn";
      btn.onclick = () => this.onBuildModeSelect(opt.type);
      this.$subButtons.appendChild(btn);
    });
  }

  // --- CATEGORY ITEMS ---
  _showSubButtons(category) {
    if (this._isDisabled(category)) return;

    this.$subButtons.innerHTML = "";
    this.onCategorySelect(category);

    const items =
      category === "plants"
        ? ["corn", "grape", "tomato", "strawberry"]
        : ["chicken"];

    items.forEach((item) => {
      const btn = document.createElement("button");
      btn.textContent = item;
      btn.className = "btn";
      btn.onclick = () => this.onItemSelect(item);
      this.$subButtons.appendChild(btn);
    });
  }

  _isDisabled(category) {
    const btn =
      category === "plants" ? this.$btnPlants : this.$btnAnimals;
    return btn.classList.contains("disabled");
  }

  unlockCategory(category) {
    if (category === "plants") this.$btnPlants.classList.remove("disabled");
    if (category === "animals") this.$btnAnimals.classList.remove("disabled");
  }

  updateCoins(value) {
    if (this.$coins) this.$coins.textContent = `💰 Coins: ${value}`;
  }

  // --- HINTS AND CTA ---
  _createHintElements() {
    this.$hint = document.createElement("div");
    this.$hint.id = "hint-box";
    this.$hint.className = "hint-box hidden";
    document.body.appendChild(this.$hint);

    this.$cta = document.createElement("button");
    this.$cta.id = "cta-button";
    this.$cta.className = "cta-button hidden";
    this.$cta.textContent = "Download Now";
    document.body.appendChild(this.$cta);
  }

  showHint(text) {
    if (!this.$hint) return;
    this.$hint.textContent = text;
    this.$hint.classList.remove("hidden");
  }

  hideHint() {
    if (this.$hint) this.$hint.classList.add("hidden");
  }

  showCTA(text = "Download Now") {
    if (!this.$cta) return;
    this.$cta.textContent = text;
    this.$cta.classList.remove("hidden");
  }

  hideCTA() {
    if (this.$cta) this.$cta.classList.add("hidden");
  }

  highlightButton(id) {
    const btn = document.getElementById(id);
    if (btn) btn.classList.add("highlight");
  }

  removeHighlights() {
    document.querySelectorAll(".highlight").forEach((b) => b.classList.remove("highlight"));
  }

  onClick(callback) {
    if (this._globalClickHandler) {
      document.removeEventListener("pointerdown", this._globalClickHandler);
    }
    this._globalClickHandler = (e) => {
      e.stopPropagation();
      callback?.();
    };
    document.addEventListener("pointerdown", this._globalClickHandler);
  }
}
