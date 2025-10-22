import { SOUND_KEYS, SoundManager } from "../audio/SoundManager";

const UI_CONFIG = {
  HINT_DURATION: 2000, // default hint display duration (ms)
  CLICK_DEBOUNCE: 100, // minimum delay between click sounds (ms)
  DAY_SIGN_URL: "assets/images/sun.png",
  NIGHT_SIGN_URL: "assets/images/moon.png",
};

/**
 * Handles all user interface logic for the game:
 * buttons, menus, resource indicators, hints, and UI sounds.
 */
export class GameUI {
  constructor({ onBuildModeSelect, onCategorySelect, onItemSelect }) {
    this.onBuildModeSelect = onBuildModeSelect;
    this.onCategorySelect = onCategorySelect;
    this.onItemSelect = onItemSelect;

    this.activeMenu = null;
    this._menuOpenedCallbacks = {};
    this._animalCounters = {};
    this._lastClickSoundTime = 0;

    this.ready = this._loadUI();

    // Inject styles dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "ui/style.css";
    document.head.appendChild(link);
  }

  /** Loads HTML and initializes UI elements. */
  async _loadUI() {
    const res = await fetch("ui/index.html");
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
    this._initElements();
    this._createHintElements();
  }

  /** Initialize references and button handlers. */
  _initElements() {
    // Main category buttons
    this.$btnBuild = document.getElementById("btn-build");
    this.$btnPlants = document.getElementById("btn-plants");
    this.$btnAnimals = document.getElementById("btn-animals");

    // Submenu buttons
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

    // Category menu toggles
    this.$btnBuild.onclick = () => this._toggleMenu("build");
    this.$btnPlants.onclick = () => this._toggleMenu("plants");
    this.$btnAnimals.onclick = () => this._toggleMenu("animals");

    // Build submenu actions
    this.$subs["sub-garden"].onclick = () => this.onBuildModeSelect("garden");
    this.$subs["sub-pen"].onclick = () => this.onBuildModeSelect("pen");

    // Plant submenu
    ["sub-corn", "sub-grape", "sub-tomato", "sub-strawberry"].forEach((id) => {
      this.$subs[id].onclick = () => this.onItemSelect(id.replace("sub-", ""));
    });

    // Animal submenu
    ["sub-chicken", "sub-sheep", "sub-cow"].forEach((id) => {
      this.$subs[id].onclick = () => this.onItemSelect(id.replace("sub-", ""));
    });

    // Enable click sounds across all UI buttons
    this._setupClickSounds();
  }

  // ============================================================
  // 🎵 Universal click sound
  // ============================================================
  _setupClickSounds() {
    document.body.addEventListener("click", (e) => {
      // @ts-ignore
      const target = e.target.closest("button, .btn, .sub-btn");
      if (!target || target.classList.contains("disabled")) return;

      const now = performance.now();
      if (now - this._lastClickSoundTime < UI_CONFIG.CLICK_DEBOUNCE) return;
      this._lastClickSoundTime = now;

      SoundManager.instance.playSfx(SOUND_KEYS.CLICK);
    });
  }

  // ============================================================
  // 🎛️ Menu handling
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

    const map = {
      build: ["sub-garden", "sub-pen"],
      plants: ["sub-corn", "sub-grape", "sub-tomato", "sub-strawberry"],
      animals: ["sub-chicken", "sub-sheep", "sub-cow"],
    };

    this._showButtons(map[menu]);
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
  // 🔒 Button control
  // ============================================================
  disableAllButtons() {
    document
      .querySelectorAll(".btn")
      .forEach((btn) => btn.classList.add("disabled"));
  }

  enableButton(id) {
    const btn = document.getElementById(id);
    if (!btn) return console.warn(`⚠️ enableButton: element #${id} not found`);
    btn.classList.remove("disabled");
  }

  disableButton(id) {
    const btn = document.getElementById(id);
    if (!btn) return console.warn(`⚠️ disableButton: element #${id} not found`);
    btn.classList.add("disabled");
  }

  // ============================================================
  // 📲 CTA button
  // ============================================================
  showCTA(text = "Download Now", onClick = null) {
    if (!this.$cta) {
      this.$cta = document.getElementById("cta-button");
      if (!this.$cta) return;
    }

    this.$cta.textContent = text;
    this.$cta.classList.remove("hidden");
    if (onClick) this.$cta.onclick = () => onClick();
  }

  hideCTA() {
    if (!this.$cta) return;
    this.$cta.classList.add("hidden");
    this.$cta.onclick = null;
  }

  // ============================================================
  // 💰 Resources
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
  // 💬 Hints
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

  showHint(
    text,
    icon = null,
    { persist = false, duration = UI_CONFIG.HINT_DURATION } = {}
  ) {
    if (!this.$hint) return;
    this.$hint.innerHTML = icon
      ? `<img src="assets/images/${icon}.png" alt="" /> <span>${text}</span>`
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
  // ✨ Visual state
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
  // 🌗 Day/Night toggle
  // ============================================================
  onDayNightToggle(callback) {
    const toggle = document.getElementById("toggle-switch");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      SoundManager.instance.playSfx(SOUND_KEYS.CLICK);
      toggle.classList.toggle("night");
      callback?.();
    });
  }

  updateClock(timeStr) {
    const el = document.getElementById("clock");
    if (!el) return;
    const simplified = timeStr.replace(/:\d{2}/, "");
    el.textContent = simplified;
  }

  updateDayNight(isDay) {
    const icon = document.getElementById("day-night-icon");
    if (!icon) return;
    // @ts-ignore
    icon.src = isDay ? UI_CONFIG.DAY_SIGN_URL : UI_CONFIG.NIGHT_SIGN_URL;
    // @ts-ignore
    icon.alt = isDay ? "Day" : "Night";
  }

  // ============================================================
  // 🐔 Animal counters
  // ============================================================
  createAnimalCounter(id) {
    const el = document.createElement("div");
    el.className = "animal-counter";
    el.dataset.animalId = id;
    el.innerHTML = "<span>0</span>";
    document.body.appendChild(el);
    this._animalCounters[id] = el;
  }

  updateAnimalCounter(id, value, screenX, screenY) {
    const el = this._animalCounters?.[id];
    if (!el) return;
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
