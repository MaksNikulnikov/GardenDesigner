export class GameUI {
  constructor({ onBuildModeSelect, onCategorySelect, onItemSelect }) {
    this.onBuildModeSelect = onBuildModeSelect;
    this.onCategorySelect = onCategorySelect;
    this.onItemSelect = onItemSelect;
    this.activeMenu = null;
    this._menuOpenedCallbacks = {};
    this._animalCounters = {};

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
    this.$btnBuild = document.getElementById("btn-build");
    this.$btnPlants = document.getElementById("btn-plants");
    this.$btnAnimals = document.getElementById("btn-animals");

    this.$subs = {
      "sub-garden": document.getElementById("sub-garden"),
      "sub-pen": document.getElementById("sub-pen"),
      "sub-corn": document.getElementById("sub-corn"),
      "sub-grape": document.getElementById("sub-grape"),
      "sub-tomato": document.getElementById("sub-tomato"),
      "sub-strawberry": document.getElementById("sub-strawberry"),
      "sub-chicken": document.getElementById("sub-chicken"),
      "sub-sheep": document.getElementById("sub-sheep"),
      "sub-cow": document.getElementById("sub-cow"),
    };

    this.$btnBuild.onclick = () => this._toggleMenu("build");
    this.$btnPlants.onclick = () => this._toggleMenu("plants");
    this.$btnAnimals.onclick = () => this._toggleMenu("animals");

    this.$subs["sub-garden"].onclick = () => this.onBuildModeSelect("garden");
    this.$subs["sub-pen"].onclick = () => this.onBuildModeSelect("pen");

    ["sub-corn", "sub-grape", "sub-tomato", "sub-strawberry"].forEach((id) => {
      this.$subs[id].onclick = () => this.onItemSelect(id.replace("sub-", ""));
    });
    ["sub-chicken", "sub-sheep", "sub-cow"].forEach((id) => {
      this.$subs[id].onclick = () => this.onItemSelect(id.replace("sub-", ""));
    });
  }

  // ============================================================
  // 🎛️ MENU HANDLING
  // ============================================================
  onMenuOpened(menuName, callback) {
    this._menuOpenedCallbacks[menuName] = callback;
  }

  _toggleMenu(menu) {
    if (this.activeMenu === menu) {
      this.hideAllSubButtons();
      this.activeMenu = null;
      return;
    }

    this.activeMenu = menu;
    this.hideAllSubButtons();

    switch (menu) {
      case "build":
        this._showButtons(["sub-garden", "sub-pen"]);
        break;
      case "plants":
        this._showButtons([
          "sub-corn",
          "sub-grape",
          "sub-tomato",
          "sub-strawberry",
        ]);
        break;
      case "animals":
        this._showButtons(["sub-chicken", "sub-sheep", "sub-cow"]);
        break;
    }

    this._menuOpenedCallbacks?.[menu]?.();
  }

  _showButtons(ids = []) {
    ids.forEach((id) => {
      const btn = this.$subs[id];
      if (btn) btn.classList.remove("hidden");
    });
  }

  hideAllSubButtons() {
    Object.values(this.$subs).forEach((btn) => btn.classList.add("hidden"));
  }

  // ============================================================
  // 🔒 BUTTON CONTROL
  // ============================================================
  disableAllButtons() {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.classList.add("disabled");
    });
  }

  enableButton(id) {
    const btn = document.getElementById(id);
    if (!btn) {
      console.warn(`⚠️ enableButton: element #${id} not found`);
      return;
    }
    btn.classList.remove("disabled");
  }

  disableButton(id) {
    const btn = document.getElementById(id);
    if (!btn) {
      console.warn(`⚠️ disableButton: element #${id} not found`);
      return;
    }
    btn.classList.add("disabled");
  }

  // =============================
  // 📲 CTA button
  // =============================
  showCTA(text = "Download Now", onClick = null) {
    if (!this.$cta) {
      this.$cta = document.getElementById("cta-button");
      if (!this.$cta) return;
    }

    this.$cta.textContent = text;
    this.$cta.classList.remove("hidden");

    if (onClick) {
      this.$cta.onclick = () => onClick();
    }
  }

  hideCTA() {
    if (!this.$cta) return;
    this.$cta.classList.add("hidden");
    this.$cta.onclick = null;
  }
  // ============================================================
  // 💰 RESOURCES
  // ============================================================
  updateCoins(value) {
    const el = document.getElementById("coin-amount");
    if (el) el.textContent = value;
  }

  updateCorn(value) {
    const el = document.getElementById("res-corn");
    if (el) el.textContent = value;
  }

  updateEggs(value) {
    const el = document.getElementById("res-eggs");
    if (el) el.textContent = value;
  }

  // ============================================================
  // 💬 HINTS
  // ============================================================
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

  showHint(text, icon = null, { persist = false, duration = 2000 } = {}) {
    if (!this.$hint) return;
    this.$hint.innerHTML = icon
      ? `<img src="/assets/images/${icon}.png" alt="" /> <span>${text}</span>`
      : text;
    this.$hint.classList.remove("hidden");
    if (!persist) {
      clearTimeout(this._hintTimer);
      this._hintTimer = setTimeout(() => this.hideHint(), duration);
    }
  }

  hideHint() {
    if (!this.$hint) return;
    clearTimeout(this._hintTimer);
    this.$hint.classList.add("hidden");
  }

  // ============================================================
  // ✨ VISUAL STATE
  // ============================================================
  highlightButton(id) {
    const btn = document.getElementById(id);
    if (btn) btn.classList.add("highlight");
  }

  removeHighlights() {
    document
      .querySelectorAll(".highlight")
      .forEach((b) => b.classList.remove("highlight"));
  }

  // ============================================================
  // 🕹️ INPUT / MISC
  // ============================================================
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
    const toggle = document.getElementById("toggle-switch");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      toggle.classList.toggle("night");
      callback?.();
    });
  }

  updateClock(timeStr) {
    const el = document.getElementById("clock");
    const simplified = timeStr.replace(/:\d{2}/, "");
    if (el) el.textContent = simplified;
  }

  updateDayNight(isDay) {
    const icon = document.getElementById("day-night-icon");
    if (!icon) return;
    // @ts-ignore
    icon.src = isDay ? "/assets/images/sun.png" : "/assets/images/moon.png";
    // @ts-ignore
    icon.alt = isDay ? "Day" : "Night";
  }

  createAnimalCounter(id) {
    const el = document.createElement("div");
    el.className = "animal-counter";
    el.innerHTML = "<span>0</span>";
    document.body.appendChild(el);
    this._animalCounters ??= {};
    this._animalCounters[id] = el;
  }

  updateAnimalCounter(id, value, screenX, screenY) {
    if (!this._animalCounters?.[id]) return;

    const el = this._animalCounters[id];
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.querySelector("span").textContent = value;
  }

  removeAnimalCounter(id) {
    const el = this._animalCounters?.[id];
    if (el) {
      el.remove();
      delete this._animalCounters[id];
    }
  }
}
