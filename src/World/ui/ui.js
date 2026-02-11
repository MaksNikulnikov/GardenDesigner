import { SOUND_KEYS, SoundManager } from "../audio/SoundManager";
import { cameraHelper } from "../helpers/CameraHelper.js";

const UI_CONFIG = {
  HINT_DURATION: 2000, // default hint display duration (ms)
  CLICK_DEBOUNCE: 100, // minimum delay between click sounds (ms)
  DAY_SIGN_URL: "assets/images/sun.png",
  NIGHT_SIGN_URL: "assets/images/moon.png",
  SPOTLIGHT_PADDING: 10,
  SPOTLIGHT_RADIUS: 14,
  RESOURCE_FLY_DURATION: 980,
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
    this._spotlightTarget = null;
    this._spotlightOptions = null;
    this._spotlightRect = null;
    this._spotlightBounceTimer = null;
    this._spotlightHideTimer = null;
    this._spotlightFrameId = null;
    this._spotlightBounceRequested = false;
    this._spotlightTrackDynamic = false;
    this._spotlightMissingFrames = 0;
    this._onResize = () => this._refreshSpotlight();
    this._clickSoundHandler = null;
    this._timeToggleHandler = null;
    this._styleLink = null;

    this.ready = this._loadUI();

    // Inject styles dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "ui/style.css";
    document.head.appendChild(link);
    this._styleLink = link;
  }

  /** Loads HTML and initializes UI elements. */
  async _loadUI() {
    const res = await fetch("ui/index.html");
    const html = await res.text();
    document.body.insertAdjacentHTML("beforeend", html);
    this._initElements();
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

    this.$hint = document.querySelector("#hint-box");
    this.$dayNight = document.getElementById("day-night");
    this.$toggleSwitch = document.getElementById("toggle-switch");
    this.$timeWarpIndicator = document.getElementById("time-warp-indicator");
    this.$tutorialOverlay = document.getElementById("tutorial-overlay");
    this.$tutorialDims = {
      top: document.getElementById("tutorial-dim-top"),
      left: document.getElementById("tutorial-dim-left"),
      right: document.getElementById("tutorial-dim-right"),
      bottom: document.getElementById("tutorial-dim-bottom"),
    };
    this.$tutorialFocusRing = document.getElementById("tutorial-focus-ring");

    // Enable click sounds across all UI buttons
    this._setupClickSounds();
    window.addEventListener("resize", this._onResize);
  }

  // ============================================================
  // 🎵 Universal click sound
  // ============================================================
  _setupClickSounds() {
    this._clickSoundHandler = (e) => {
      const source = e.target;
      if (!(source instanceof Element)) return;
      const target = source.closest("button, .btn, .sub-btn");
      if (!target || target.classList.contains("disabled")) return;

      const now = performance.now();
      if (now - this._lastClickSoundTime < UI_CONFIG.CLICK_DEBOUNCE) return;
      this._lastClickSoundTime = now;

      SoundManager.instance.playSfx(SOUND_KEYS.CLICK);
    };

    document.body.addEventListener("click", this._clickSoundHandler);
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

  animateResourceFly({ resourceType, fromWorldPosition, count = 1, icon = null }) {
    const target = this._getResourceTarget(resourceType);
    if (!target || !fromWorldPosition) return;

    const start = cameraHelper.worldToScreen(fromWorldPosition);
    if (!Number.isFinite(start.x) || !Number.isFinite(start.y)) return;

    const maxCount = Math.max(1, Math.min(4, count));
    const iconSrc = icon || this._getResourceIcon(resourceType);

    for (let i = 0; i < maxCount; i++) {
      const el = document.createElement("img");
      el.className = "resource-fly-icon";
      el.src = iconSrc;
      el.alt = resourceType;

      const jitterX = (Math.random() - 0.5) * 18;
      const jitterY = (Math.random() - 0.5) * 14;
      const startX = start.x + jitterX;
      const startY = start.y + jitterY;
      const targetX = target.x + (Math.random() - 0.5) * 10;
      const targetY = target.y + (Math.random() - 0.5) * 8;

      el.style.left = `${startX}px`;
      el.style.top = `${startY}px`;
      document.body.appendChild(el);

      const delay = i * 70;
      setTimeout(() => {
        el.style.transition = `left ${UI_CONFIG.RESOURCE_FLY_DURATION}ms cubic-bezier(0.16, 0.84, 0.24, 1), top ${UI_CONFIG.RESOURCE_FLY_DURATION}ms cubic-bezier(0.16, 0.84, 0.24, 1), opacity ${UI_CONFIG.RESOURCE_FLY_DURATION}ms ease, transform ${UI_CONFIG.RESOURCE_FLY_DURATION}ms ease`;
        el.style.left = `${targetX}px`;
        el.style.top = `${targetY}px`;
        el.style.opacity = "0";
        el.style.transform = "translate(-50%, -50%) scale(0.4)";
      }, delay);

      setTimeout(() => {
        el.remove();
        if (i === maxCount - 1) this._pulseResourceTarget(resourceType);
      }, delay + UI_CONFIG.RESOURCE_FLY_DURATION + 30);
    }
  }

  _getResourceTarget(resourceType) {
    const targetId =
      resourceType === "corn"
        ? "res-corn"
        : resourceType === "eggs"
          ? "res-eggs"
          : resourceType === "coins"
            ? "coin-amount"
            : null;

    if (!targetId) return null;
    const valueNode = document.getElementById(targetId);
    if (!valueNode) return null;
    const container = valueNode.closest(".res-item") || valueNode;
    const rect = container.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5,
      node: container,
    };
  }

  _getResourceIcon(resourceType) {
    if (resourceType === "corn") return "assets/images/corn.png";
    if (resourceType === "eggs") return "assets/images/eggs.png";
    if (resourceType === "coins") return "assets/images/money.png";
    return "assets/images/money.png";
  }

  _pulseResourceTarget(resourceType) {
    const target = this._getResourceTarget(resourceType);
    const node = target?.node;
    if (!node) return;
    node.classList.remove("resource-hit");
    // Force reflow to restart the animation.
    void node.offsetWidth;
    node.classList.add("resource-hit");
    setTimeout(() => node.classList.remove("resource-hit"), 320);
  }

  // ============================================================
  // 💬 Hints
  // ============================================================

  showHint(
    text,
    icon = null,
    { persist = false, duration = UI_CONFIG.HINT_DURATION } = {}
  ) {
    if (!this.$hint) return;
    if (!this.$hintIcon || !this.$hintText) {
      this.$hintIcon = this.$hint.querySelector("#hint-icon");
      this.$hintText = this.$hint.querySelector("#hint-text");
    }
    if (!this.$hintIcon || !this.$hintText) return;
    this.$hintText.textContent = text ?? "";

    if (icon) {
      this.$hintIcon.src = `assets/images/${icon}.png`;
      this.$hintIcon.alt = icon;
      this.$hintIcon.classList.remove("hidden");
    } else {
      this.$hintIcon.classList.add("hidden");
    }

    // Show hint box
    this.$hint.classList.remove("hidden");

    // Auto-hide timer
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
  // Spotlight tutorial overlay
  // ============================================================
  showSpotlight(
    target,
    { padding = UI_CONFIG.SPOTLIGHT_PADDING, radius = UI_CONFIG.SPOTLIGHT_RADIUS } = {}
  ) {
    clearTimeout(this._spotlightHideTimer);
    const targetChanged = target !== this._spotlightTarget;
    this._spotlightTarget = target;
    this._spotlightOptions = { padding, radius };
    this._spotlightTrackDynamic = this._isDynamicSpotlightTarget(target);
    this._spotlightMissingFrames = 0;
    if (targetChanged) this._spotlightBounceRequested = true;
    if (!this.$tutorialOverlay) return;

    this.$tutorialOverlay.classList.remove("hidden");
    this._refreshSpotlight();
    if (this._spotlightTrackDynamic) {
      this._startSpotlightTracking();
    } else {
      this._stopSpotlightTracking();
    }
    requestAnimationFrame(() => {
      this.$tutorialOverlay?.classList.add("active");
    });
  }

  hideSpotlight() {
    this._spotlightTarget = null;
    this._spotlightOptions = null;
    this._spotlightRect = null;
    this._spotlightBounceRequested = false;
    this._spotlightTrackDynamic = false;
    this._spotlightMissingFrames = 0;
    this._stopSpotlightTracking();
    clearTimeout(this._spotlightBounceTimer);
    clearTimeout(this._spotlightHideTimer);
    if (!this.$tutorialOverlay) return;
    this.$tutorialOverlay.classList.remove("active", "bounce");
    this._spotlightHideTimer = setTimeout(() => {
      this.$tutorialOverlay?.classList.add("hidden");
    }, 260);
  }

  _refreshSpotlight() {
    if (!this._spotlightTarget || !this.$tutorialOverlay) return;

    const rect = this._resolveSpotlightRect(this._spotlightTarget);
    if (!rect) {
      this._spotlightMissingFrames += 1;
      if (this._spotlightMissingFrames > 12) {
        this.$tutorialOverlay.classList.remove("active", "bounce");
      }
      return;
    }
    this._spotlightMissingFrames = 0;

    const { padding = UI_CONFIG.SPOTLIGHT_PADDING, radius = UI_CONFIG.SPOTLIGHT_RADIUS } =
      this._spotlightOptions || {};

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(0, rect.left - padding);
    const top = Math.max(0, rect.top - padding);
    const right = Math.min(vw, rect.right + padding);
    const bottom = Math.min(vh, rect.bottom + padding);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);

    if (width === 0 || height === 0) {
      this._spotlightMissingFrames += 1;
      return;
    }

    // Guard against projection glitches that can briefly produce huge invalid rects.
    if (width > vw * 1.2 || height > vh * 1.2) {
      return;
    }

    this._spotlightRect = {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    };

    this.$tutorialDims.top.style.left = "0px";
    this.$tutorialDims.top.style.top = "0px";
    this.$tutorialDims.top.style.width = `${vw}px`;
    this.$tutorialDims.top.style.height = `${top}px`;

    this.$tutorialDims.bottom.style.left = "0px";
    this.$tutorialDims.bottom.style.top = `${bottom}px`;
    this.$tutorialDims.bottom.style.width = `${vw}px`;
    this.$tutorialDims.bottom.style.height = `${Math.max(0, vh - bottom)}px`;

    this.$tutorialDims.left.style.left = "0px";
    this.$tutorialDims.left.style.top = `${top}px`;
    this.$tutorialDims.left.style.width = `${left}px`;
    this.$tutorialDims.left.style.height = `${height}px`;

    this.$tutorialDims.right.style.left = `${right}px`;
    this.$tutorialDims.right.style.top = `${top}px`;
    this.$tutorialDims.right.style.width = `${Math.max(0, vw - right)}px`;
    this.$tutorialDims.right.style.height = `${height}px`;

    this.$tutorialFocusRing.style.left = `${left}px`;
    this.$tutorialFocusRing.style.top = `${top}px`;
    this.$tutorialFocusRing.style.width = `${width}px`;
    this.$tutorialFocusRing.style.height = `${height}px`;
    this.$tutorialFocusRing.style.borderRadius = `${radius}px`;

    if (this._spotlightBounceRequested) {
      this._spotlightBounceRequested = false;
      this._triggerSpotlightBounce();
    }
  }

  _startSpotlightTracking() {
    if (!this._spotlightTrackDynamic) return;
    if (this._spotlightFrameId) return;
    const tick = () => {
      if (!this._spotlightTrackDynamic || !this._spotlightTarget || !this.$tutorialOverlay) {
        this._spotlightFrameId = null;
        return;
      }
      this._refreshSpotlight();
      this._spotlightFrameId = requestAnimationFrame(tick);
    };
    this._spotlightFrameId = requestAnimationFrame(tick);
  }

  _stopSpotlightTracking() {
    if (!this._spotlightFrameId) return;
    cancelAnimationFrame(this._spotlightFrameId);
    this._spotlightFrameId = null;
  }

  _resolveSpotlightRect(target) {
    if (!target) return null;
    const resolvedTarget = typeof target === "function" ? target() : target;
    if (!resolvedTarget) return null;

    if (typeof resolvedTarget === "string") {
      const element = document.querySelector(resolvedTarget);
      return element ? element.getBoundingClientRect() : null;
    }

    if (resolvedTarget instanceof Element) {
      return resolvedTarget.getBoundingClientRect();
    }

    if (
      typeof resolvedTarget === "object" &&
      typeof resolvedTarget.left === "number" &&
      typeof resolvedTarget.top === "number" &&
      typeof resolvedTarget.right === "number" &&
      typeof resolvedTarget.bottom === "number"
    ) {
      return resolvedTarget;
    }

    if (
      typeof resolvedTarget === "object" &&
      typeof resolvedTarget.x === "number" &&
      typeof resolvedTarget.y === "number" &&
      typeof resolvedTarget.width === "number" &&
      typeof resolvedTarget.height === "number"
    ) {
      return {
        left: resolvedTarget.x,
        top: resolvedTarget.y,
        right: resolvedTarget.x + resolvedTarget.width,
        bottom: resolvedTarget.y + resolvedTarget.height,
      };
    }

    return null;
  }

  _triggerSpotlightBounce() {
    if (!this.$tutorialOverlay) return;
    clearTimeout(this._spotlightBounceTimer);
    this.$tutorialOverlay.classList.remove("bounce");
    // Force reflow so animation can restart.
    void this.$tutorialOverlay.offsetWidth;
    this.$tutorialOverlay.classList.add("bounce");
    this._spotlightBounceTimer = setTimeout(() => {
      this.$tutorialOverlay?.classList.remove("bounce");
    }, 560);
  }

  _isDynamicSpotlightTarget(target) {
    return typeof target === "function";
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

    if (this._timeToggleHandler) {
      toggle.removeEventListener("click", this._timeToggleHandler);
    }

    this._timeToggleHandler = () => {
      SoundManager.instance.playSfx(SOUND_KEYS.CLICK);
      toggle.classList.toggle("night");
      callback?.();
    };

    toggle.addEventListener("click", this._timeToggleHandler);
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
    icon.src = isDay ? UI_CONFIG.DAY_SIGN_URL : UI_CONFIG.NIGHT_SIGN_URL;
    icon.alt = isDay ? "Day" : "Night";
  }

  setTimeWarpActive(active) {
    if (this.$dayNight) {
      this.$dayNight.classList.toggle("time-warping", !!active);
    }
    if (this.$timeWarpIndicator) {
      this.$timeWarpIndicator.classList.toggle("hidden", !active);
    }
  }

  setTimeToggleLocked(locked) {
    if (!this.$toggleSwitch) return;
    this.$toggleSwitch.classList.toggle("disabled", !!locked);
    this.$toggleSwitch.setAttribute("aria-disabled", locked ? "true" : "false");
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

  dispose() {
    clearTimeout(this._hintTimer);
    clearTimeout(this._spotlightBounceTimer);
    clearTimeout(this._spotlightHideTimer);
    this._stopSpotlightTracking();

    window.removeEventListener("resize", this._onResize);
    if (this._clickSoundHandler) {
      document.body.removeEventListener("click", this._clickSoundHandler);
      this._clickSoundHandler = null;
    }

    if (this.$toggleSwitch && this._timeToggleHandler) {
      this.$toggleSwitch.removeEventListener("click", this._timeToggleHandler);
      this._timeToggleHandler = null;
    }

    for (const id of Object.keys(this._animalCounters)) {
      this.removeAnimalCounter(id);
    }

    document.querySelectorAll(".resource-fly-icon").forEach((node) => node.remove());
    document.getElementById("game-ui")?.remove();

    if (this._styleLink?.parentNode) {
      this._styleLink.parentNode.removeChild(this._styleLink);
      this._styleLink = null;
    }
  }
}
