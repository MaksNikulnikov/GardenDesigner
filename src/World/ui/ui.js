export class GameUI {
  constructor({ onBuildModeSelect, onCategorySelect, onItemSelect }) {
    this.onBuildModeSelect = onBuildModeSelect;
    this.onCategorySelect = onCategorySelect;
    this.onItemSelect = onItemSelect;

    this.ready = this._loadUI();

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/src/World/ui/style.css";
    document.head.appendChild(link);
  }

  async _loadUI() {
    const res = await fetch("/src/World/ui/index.html");
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
    this._initElements();
    this._createHintElements();
  }

  _initElements() {
    this.$coins = document.getElementById("coins");
    this.$subButtons = document.getElementById("sub-buttons");

    this.$btnBuild = document.getElementById("btn-build");
    this.$btnPlants = document.getElementById("btn-plants");
    this.$btnAnimals = document.getElementById("btn-animals");

    this.$subs = {
      garden: document.getElementById("sub-garden"),
      pen: document.getElementById("sub-pen"),
      corn: document.getElementById("sub-corn"),
      grape: document.getElementById("sub-grape"),
      tomato: document.getElementById("sub-tomato"),
      strawberry: document.getElementById("sub-strawberry"),
      chicken: document.getElementById("sub-chicken"),
      sheep: document.getElementById("sub-sheep"),
      cow: document.getElementById("sub-cow"),
    };

    this.$btnBuild.onclick = () => this._showBuildOptions();
    this.$btnPlants.onclick = () => this._showSubButtons("plants");
    this.$btnAnimals.onclick = () => this._showSubButtons("animals");

    this.$subs.garden.onclick = () => this.onBuildModeSelect("garden");
    this.$subs.pen.onclick = () => this.onBuildModeSelect("pen");
    ["corn", "grape", "tomato", "strawberry"].forEach((p) => {
      this.$subs[p].onclick = () => this.onItemSelect(p);
    });
    ["chicken", "sheep", "cow"].forEach((a) => {
      this.$subs[a].onclick = () => this.onItemSelect(a);
    });
  }

  _showBuildOptions() {
    this._hideAllSubButtons();
    this.$subs.garden.classList.remove("hidden");
    this.$subs.pen.classList.remove("hidden");
  }

  _showSubButtons(category) {
    if (this._isDisabled(category)) return;
    this._hideAllSubButtons();
    this.onCategorySelect(category);

    const items =
      category === "plants"
        ? ["corn", "grape", "tomato", "strawberry"]
        : ["chicken", "sheep", "cow"];

    items.forEach((item) => {
      this.$subs[item].classList.remove("hidden");
    });
  }

  _hideAllSubButtons() {
    Object.values(this.$subs).forEach((btn) => btn.classList.add("hidden"));
  }

  _isDisabled(category) {
    const btn = category === "plants" ? this.$btnPlants : this.$btnAnimals;
    return btn.classList.contains("disabled");
  }

  unlockCategory(category) {
    if (category === "plants") this.$btnPlants.classList.remove("disabled");
    if (category === "animals") this.$btnAnimals.classList.remove("disabled");
  }

  updateCoins(value) {
    const el = document.getElementById("coin-amount");
    if (el) el.textContent = value;
  }

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

  // --- Generic hint ---
  showHint(text, icon = null) {
    if (!this.$hint) return;

    this.$hint.innerHTML = icon
      ? `<img src="/assets/images/${icon}.png" class="hint-icon" alt=""> <span>${text}</span>`
      : text;

    this.$hint.classList.remove("hidden");
  }

  // --- Specialized helpers ---
  showPlantHint(text) {
    this.showHint(text, "plants"); // expects /assets/images/plants.png
  }

  showAnimalHint(text) {
    this.showHint(text, "animals"); // expects /assets/images/animals.png
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
    document
      .querySelectorAll(".highlight")
      .forEach((b) => b.classList.remove("highlight"));
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

  onDayNightToggle(callback) {
    const btn = document.getElementById("toggle-day-night");
    if (!btn) {
      console.warn("⚠️ toggle-day-night not found yet");
      return;
    }
    btn.addEventListener("click", () => callback?.());
  }

  updateClock(timeStr) {
    const el = document.getElementById("clock");
    if (el) el.textContent = timeStr;
  }

  updateDayNight(isDay) {
    const icon = document.getElementById("day-night-icon");
    if (!icon) return;
    icon.src = isDay ? "/assets/images/sun.png" : "/assets/images/moon.png";
    icon.alt = isDay ? "Day" : "Night";
  }

}
