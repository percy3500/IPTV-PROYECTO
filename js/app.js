/* ==========================================================================
   PERCY TV - APLICACION IPTV WEBOS SMART TV (LG LF6350 & MODERN WEBOS)
   Codigo 100% compatible con ES5 (Chromium 38+)
   Navegacion Ultra-Rapida (Sin Lag / Sin Bloqueos)
   Retorno Inmediato con Tecla Atras
   Audio Predeterminado Pista 1 Espanol y Menu con Flecha Derecha
   ========================================================================== */

(function () {
  "use strict";

  var state = {
    currentView: "channels",
    focusedIndex: 0,
    playingIndex: -1,
    osdVisible: true,
    osdTimer: null,
    zapTimer: null,
    isBuffering: false,
    retryTimer: null,
    retryCount: 0,
    maxRetries: 3,
    hlsInstance: null,
    loadTimer: null,
    audioTimers: [],
    audioMenuOpen: false,
    audioMenuIndex: 0,
    manualAudioSelected: false,
    manualAudioIndex: 1
  };

  var dom = {};
  var cardElements = [];

  // 6 columnas por fila en la cuadricula horizontal
  var COLS = 6;

  var digitBuffer = "";
  var digitTimer = null;

  var KEYS = {
    ENTER: 13, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
    BACK_WEBOS: 461, BACKSPACE: 8, ESCAPE: 27, BACK_SAMSUNG: 10009,
    CH_UP: 33, CH_UP_WEBOS: 427, CH_DOWN: 34, CH_DOWN_WEBOS: 428,
    PLAY: 415, PAUSE: 19, STOP: 413,
    RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406,
    NUM_0: 48, NUM_1: 49, NUM_2: 50, NUM_3: 51, NUM_4: 52, NUM_5: 53,
    NUM_6: 54, NUM_7: 55, NUM_8: 56, NUM_9: 57
  };

  // ============================================================
  // HLS PLAYER WRAPPER CON FALLBACK AUTOMÁTICO DIRECTO / XHR
  // ============================================================
  var HLSPlayer = {

    destroy: function () {
      if (state.hlsInstance) {
        try { state.hlsInstance.destroy(); } catch (e) {}
        state.hlsInstance = null;
      }
    },

    getBaseDir: function (url) {
      var clean = url.split("?")[0];
      var idx = clean.lastIndexOf("/");
      return idx !== -1 ? url.substring(0, idx + 1) : url;
    },

    getOrigin: function (url) {
      var m = url.match(/^(https?:\/\/[^\/]+)/);
      return m ? m[1] : "";
    },

    resolveUrl: function (url, baseDir, fullBase) {
      if (!url) return url;
      if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
      if (url.charAt(0) === "/") return HLSPlayer.getOrigin(fullBase) + url;
      return baseDir + url;
    },

    extractBestVariant: function (content, baseUrl) {
      var lines = content.split("\n");
      var baseDir = HLSPlayer.getBaseDir(baseUrl);
      var variants = [];
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf("#EXT-X-STREAM-INF") === 0) {
          var nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : "";
          if (nextLine && nextLine.charAt(0) !== "#" && nextLine.length > 0) {
            var bw = 0;
            var bwM = line.match(/BANDWIDTH=(\d+)/);
            if (bwM) bw = parseInt(bwM[1], 10);
            variants.push({ bandwidth: bw, url: HLSPlayer.resolveUrl(nextLine, baseDir, baseUrl) });
          }
        }
      }
      if (variants.length === 0) return null;
      variants.sort(function (a, b) { return b.bandwidth - a.bandwidth; });
      if (variants.length >= 3) return variants[2].url;
      if (variants.length >= 2) return variants[1].url;
      return variants[0].url;
    },

    playDirect: function (videoEl, url, onSuccess, onError) {
      try {
        videoEl.pause();
        videoEl.src = url;
        var p = videoEl.play();
        if (p && typeof p.catch === "function") {
          p.catch(function () {});
        }
        scheduleAudioSelection();
        if (typeof onSuccess === "function") onSuccess();
      } catch (e) {
        if (typeof onError === "function") onError(e);
      }
    },

    fetchPlaylistAndResolve: function (videoEl, masterUrl, onSuccess, onError) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", masterUrl, true);
      xhr.timeout = 10000;
      xhr.setRequestHeader("Accept", "application/vnd.apple.mpegurl, application/x-mpegURL, */*");

      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 400) {
          var content = xhr.responseText || "";
          var finalUrl = (xhr.responseURL && xhr.responseURL.length > 0) ? xhr.responseURL : masterUrl;

          var playUrl = masterUrl;
          if (content.indexOf("#EXT-X-STREAM-INF") !== -1) {
            playUrl = HLSPlayer.extractBestVariant(content, finalUrl) || masterUrl;
          }

          try {
            videoEl.pause();
            videoEl.src = playUrl;
            var p = videoEl.play();
            if (p && typeof p.catch === "function") {
              p.catch(function () {});
            }
            scheduleAudioSelection();
            if (typeof onSuccess === "function") onSuccess();
          } catch (e) {
            if (typeof onError === "function") onError(e);
          }
        } else {
          // Fallback a reproduccion directa
          HLSPlayer.playDirect(videoEl, masterUrl, onSuccess, onError);
        }
      };

      xhr.onerror = function () { HLSPlayer.playDirect(videoEl, masterUrl, onSuccess, onError); };
      xhr.ontimeout = function () { HLSPlayer.playDirect(videoEl, masterUrl, onSuccess, onError); };

      try {
        xhr.send();
      } catch (e) {
        HLSPlayer.playDirect(videoEl, masterUrl, onSuccess, onError);
      }
    },

    load: function (videoEl, url, onSuccess, onError, directPlay) {
      HLSPlayer.destroy();

      if (typeof Hls !== "undefined" && Hls.isSupported()) {
        var hls = new Hls({
          enableWorker: false,
          lowLatencyMode: false,
          maxBufferLength: 20,
          maxMaxBufferLength: 60,
          maxBufferHole: 1,
          nudgeMaxRetry: 10
        });
        state.hlsInstance = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          forceSpanishAudio();
          var p = videoEl.play();
          if (p && typeof p.catch === "function") p.catch(function () {});
          if (typeof onSuccess === "function") onSuccess();
        });

        hls.on(Hls.Events.AUDIO_TRACK_LOADED, function () {
          forceSpanishAudio();
        });

        hls.on(Hls.Events.ERROR, function (evt, data) {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              HLSPlayer.destroy();
              if (typeof onError === "function") onError("Error HLS: " + data.details);
            }
          }
        });

        hls.loadSource(url);
        hls.attachMedia(videoEl);

      } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        if (directPlay) {
          HLSPlayer.playDirect(videoEl, url, onSuccess, function () {
            HLSPlayer.fetchPlaylistAndResolve(videoEl, url, onSuccess, onError);
          });
        } else {
          HLSPlayer.fetchPlaylistAndResolve(videoEl, url, onSuccess, function () {
            HLSPlayer.playDirect(videoEl, url, onSuccess, onError);
          });
        }
      } else {
        if (typeof onError === "function") onError("No hay soporte HLS en este televisor.");
      }
    },

    stop: function (videoEl) {
      HLSPlayer.destroy();
      clearAudioTimers();
      try {
        videoEl.pause();
        videoEl.src = "";
      } catch (e) {}
    }
  };

  // ============================================================
  // PISTA DE AUDIO 1 ESPANOL POR PREDETERMINADO
  // ============================================================
  function clearAudioTimers() {
    for (var i = 0; i < state.audioTimers.length; i++) {
      clearTimeout(state.audioTimers[i]);
    }
    state.audioTimers = [];
  }

  function updateAudioOSDLabel(index) {
    if (!dom.audioTrackLabel) return;
    var list = getAudioTrackList();
    var name = trackDisplayName(list[index], index);
    var label = "Pista " + (index + 1);
    if (name.indexOf("Pista ") !== 0) label += " · " + name;
    dom.audioTrackLabel.textContent = label;
  }

  // Lista REAL de pistas que expone el reproductor (vacio si el TV no lo permite)
  function getAudioTrackList() {
    var out = [];
    try {
      var t = dom.video && dom.video.audioTracks;
      if (t && t.length > 0) {
        for (var i = 0; i < t.length; i++) {
          out.push({
            label: t[i].label || "",
            language: t[i].language || t[i].lang || "",
            enabled: !!t[i].enabled
          });
        }
        return out;
      }
    } catch (e) {}
    try {
      var h = state.hlsInstance && state.hlsInstance.audioTracks;
      if (h && h.length > 0) {
        for (var k = 0; k < h.length; k++) {
          out.push({
            label: h[k].name || "",
            language: h[k].lang || "",
            enabled: (k === state.hlsInstance.audioTrack)
          });
        }
      }
    } catch (e2) {}
    return out;
  }

  function trackDisplayName(track, index) {
    var lang = String((track && (track.language || track.lang)) || "").toLowerCase();
    if (lang.indexOf("spa") === 0 || lang === "es" || lang.indexOf("es-") === 0 || lang.indexOf("lat") === 0) {
      return "Español";
    }
    if (lang.indexOf("eng") === 0 || lang === "en" || lang.indexOf("en-") === 0) {
      return "Inglés";
    }
    if (track && track.label) return track.label;
    return "Pista " + (index + 1);
  }

  // Aplica el cambio en el reproductor nativo y/o en hls.js. Devuelve true si pudo.
  function applyAudioIndex(idx) {
    var applied = false;

    // 1. webOS / WebKit: video.audioTracks
    try {
      var tracks = dom.video && dom.video.audioTracks;
      if (tracks && tracks.length > 0) {
        if (idx < 0) idx = 0;
        if (idx >= tracks.length) idx = tracks.length - 1;
        for (var i = 0; i < tracks.length; i++) {
          tracks[i].enabled = (i === idx);
        }
        applied = true;
      }
    } catch (e) {}

    // 2. hls.js
    try {
      var hTracks = state.hlsInstance && state.hlsInstance.audioTracks;
      if (hTracks && hTracks.length > 0) {
        var hi = idx;
        if (hi < 0) hi = 0;
        if (hi >= hTracks.length) hi = hTracks.length - 1;
        state.hlsInstance.audioTrack = hi;
        applied = true;
      }
    } catch (e2) {}

    return applied;
  }

  function forceSpanishAudio() {
    // PISTA 2 PREDETERMINADA. Si el canal solo tiene una, usa la 1.
    var target = state.manualAudioSelected ? state.manualAudioIndex : 1;
    if (typeof target !== "number" || isNaN(target)) target = 0;

    var list = getAudioTrackList();
    if (list.length > 0 && target >= list.length) target = list.length - 1;
    if (target < 0) target = 0;

    var applied = applyAudioIndex(target);
    if (applied) updateAudioOSDLabel(target);
    return applied;
  }

  // Reaplica la pista elegida varias veces: en webOS la lista de audio
  // puede llegar tarde o reconstruirse despues del cambio.
  function reapplyAudioSelection() {
    clearAudioTimers();
    var delays = [0, 120, 350, 800, 1500, 2600];
    for (var i = 0; i < delays.length; i++) {
      state.audioTimers.push(setTimeout(function () {
        forceSpanishAudio();
      }, delays[i]));
    }
  }

  function scheduleAudioSelection() {
    clearAudioTimers();
    var intervals = [0, 200, 500, 1000, 2000, 3500];
    for (var i = 0; i < intervals.length; i++) {
      state.audioTimers.push(setTimeout(function () {
        forceSpanishAudio();
      }, intervals[i]));
    }
  }

  // ============================================================
  // MENU MANUAL DE CAMBIO DE IDIOMA (FLECHA DERECHA)
  // ============================================================
  function getAudioTracksCount() {
    var list = getAudioTrackList();
    return list.length > 0 ? list.length : 1;
  }

  function getActiveAudioIndex() {
    var list = getAudioTrackList();
    for (var i = 0; i < list.length; i++) {
      if (list[i].enabled) return i;
    }
    return state.manualAudioIndex;
  }

  function buildAudioMenu() {
    if (!dom.audioMenuList) return;
    var list = dom.audioMenuList;
    list.innerHTML = "";

    var tracks = getAudioTrackList();
    var count = tracks.length > 0 ? tracks.length : 1;
    var currentIdx = state.manualAudioSelected ? state.manualAudioIndex : getActiveAudioIndex();

    for (var i = 0; i < count; i++) {
      var row = document.createElement("div");
      var isSelected = (i === state.audioMenuIndex);
      var isActive = (i === currentIdx);

      row.className = "audio-menu-item" + (isSelected ? " selected" : "") + (isActive ? " active-track" : "");

      var nameSpan = document.createElement("span");
      nameSpan.className = "audio-item-name";
      var name = trackDisplayName(tracks[i], i);
      if (tracks.length > 0) {
        nameSpan.textContent = "Pista " + (i + 1) + " · " + name;
      } else {
        nameSpan.textContent = "Pista 1 · Audio del canal";
      }

      var tagSpan = document.createElement("span");
      tagSpan.className = "audio-item-tag";
      tagSpan.textContent = isActive ? "ACTIVA" : "ELEGIR";

      row.appendChild(nameSpan);
      row.appendChild(tagSpan);

      (function (idx) {
        row.onclick = function () {
          selectAudioTrackIndex(idx);
        };
      })(i);

      list.appendChild(row);
    }
  }

  function openAudioMenu() {
    if (!dom.audioMenu) return;
    var count = getAudioTracksCount();
    var idx = state.manualAudioSelected ? state.manualAudioIndex : getActiveAudioIndex();
    if (idx >= count) idx = count - 1;
    if (idx < 0) idx = 0;
    state.audioMenuIndex = idx;
    state.audioMenuOpen = true;
    buildAudioMenu();
    dom.audioMenu.className = "audio-menu";
    showOsd();
  }

  function closeAudioMenu() {
    state.audioMenuOpen = false;
    if (dom.audioMenu) dom.audioMenu.className = "audio-menu hidden";
  }

  function moveAudioMenu(delta) {
    var count = getAudioTracksCount();
    var next = state.audioMenuIndex + delta;
    if (next < 0) next = count - 1;
    if (next >= count) next = 0;
    state.audioMenuIndex = next;
    buildAudioMenu();
  }

  function selectAudioTrackIndex(idx) {
    state.manualAudioSelected = true;
    state.manualAudioIndex = idx;

    // Cambio INMEDIATO en el reproductor y en el OSD
    var applied = applyAudioIndex(idx);
    if (applied) updateAudioOSDLabel(idx);
    reapplyAudioSelection();

    closeAudioMenu();

    var tracks = getAudioTrackList();
    var trackName = trackDisplayName(tracks[idx], idx);
    if (dom.osdStatusText) {
      if (applied) {
        dom.osdStatusText.textContent = "Audio cambiado: " + trackName;
      } else {
        dom.osdStatusText.textContent = "Este canal solo tiene una pista de audio";
      }
    }
    showOsd();
  }

  // ============================================================
  // INICIALIZACION Y RENDERIZADO ULTRA-LIVIANO
  // ============================================================
  function init() {
    cacheDom();
    renderChannels();
    setupClock();
    setupEventListeners();
    updateFocus(0);
    if (dom.channelsCountLabel) {
      dom.channelsCountLabel.textContent = CHANNELS_DATA.length + " Canales";
    }
  }

  function cacheDom() {
    dom.viewChannels = document.getElementById("view-channels");
    dom.viewPlayer = document.getElementById("view-player");
    dom.channelsContainer = document.getElementById("channels-container");
    dom.channelsCountLabel = document.getElementById("channels-count-label");
    dom.video = document.getElementById("tv-player");
    dom.clockTime = document.getElementById("clock-time");
    dom.clockDate = document.getElementById("clock-date");
    dom.footerChNum = document.getElementById("footer-ch-num");
    dom.footerChName = document.getElementById("footer-ch-name");
    dom.footerChFreq = document.getElementById("footer-ch-freq");
    dom.osdClockTime = document.getElementById("osd-clock-time");
    dom.playerOsdTop = document.getElementById("player-osd-top");
    dom.playerOsdBottom = document.getElementById("player-osd-bottom");
    dom.osdChannelNumber = document.getElementById("osd-channel-number");
    dom.osdChannelName = document.getElementById("osd-channel-name");
    dom.osdChannelFreq = document.getElementById("osd-channel-freq");
    dom.osdChannelSlogan = document.getElementById("osd-channel-slogan");
    dom.osdStatusText = document.getElementById("osd-status-text");
    dom.btnOsdBack = document.getElementById("btn-osd-back");
    dom.btnOsdAudio = document.getElementById("btn-osd-audio");
    dom.audioTrackLabel = document.getElementById("audio-track-label");
    dom.audioMenu = document.getElementById("audio-menu");
    dom.audioMenuList = document.getElementById("audio-menu-list");
    dom.playerLoader = document.getElementById("player-loader");
    dom.loaderTitle = document.getElementById("loader-title");
    dom.loaderSubtitle = document.getElementById("loader-subtitle");
    dom.playerError = document.getElementById("player-error");
    dom.errorDesc = document.getElementById("error-desc");
    dom.btnErrorRetry = document.getElementById("btn-error-retry");
    dom.btnErrorBack = document.getElementById("btn-error-back");
    dom.zapToast = document.getElementById("player-zap-toast");
    dom.zapBadge = document.getElementById("zap-badge");
    dom.zapName = document.getElementById("zap-name");
    dom.zapCategory = document.getElementById("zap-category");
  }

  function renderChannels() {
    var html = "";
    for (var i = 0; i < CHANNELS_DATA.length; i++) {
      var ch = CHANNELS_DATA[i];
      html += "<div class=\"channel-card\" id=\"channel-card-" + i + "\">";
      html += "  <div class=\"channel-card-badge\">" + ch.number + "</div>";
      html += "  <div class=\"channel-card-live\">EN VIVO</div>";
      html += "  <div class=\"channel-logo-container\">";
      html += "    <img class=\"channel-logo-img\" src=\"" + ch.logo + "\" alt=\"" + ch.name + "\" />";
      html += "  </div>";
      html += "  <div class=\"channel-info\">";
      html += "    <div class=\"channel-card-name\">" + ch.name + "</div>";
      html += "    <div class=\"channel-card-freq\">" + ch.frequency + "</div>";
      html += "  </div>";
      html += "</div>";
    }
    dom.channelsContainer.innerHTML = html;

    // Cachear referencias directas a las tarjetas para navegacion instantanea (sin querySelector repetido)
    cardElements = [];
    var children = dom.channelsContainer.children;
    for (var k = 0; k < children.length; k++) {
      cardElements.push(children[k]);
      (function (idx) {
        children[idx].addEventListener("click", function () {
          updateFocus(idx);
          playChannel(idx);
        });
      })(k);
    }
  }

  // Desplaza la grilla lo justo y necesario para que la tarjeta enfocada
  // SIEMPRE quede completamente visible (funciona en cualquier resolucion).
  function ensureCardVisible(card) {
    if (!card || !dom.channelsContainer) return;
    var view = dom.channelsContainer;
    var viewRect = view.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var topMargin = 8;
    var bottomMargin = 14;
    var delta = 0;

    if (cardRect.top < viewRect.top + topMargin) {
      delta = cardRect.top - viewRect.top - topMargin;
    } else if (cardRect.bottom > viewRect.bottom - bottomMargin) {
      delta = cardRect.bottom - viewRect.bottom + bottomMargin;
    }

    if (delta !== 0) {
      var next = view.scrollTop + delta;
      if (next < 0) next = 0;
      view.scrollTop = next;
    }
  }

  // NAVEGACION INSTANTANEA CON COSTO CERO DE CPU
  function updateFocus(newIndex) {
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= CHANNELS_DATA.length) newIndex = CHANNELS_DATA.length - 1;

    // Solo actualizar las 2 tarjetas que cambian (evita bucles pesados de 38 elementos)
    if (cardElements[state.focusedIndex]) {
      cardElements[state.focusedIndex].className = "channel-card";
    }
    state.focusedIndex = newIndex;
    if (cardElements[newIndex]) {
      cardElements[newIndex].className = "channel-card focused";
    }

    // Mantener el canal seleccionado siempre a la vista
    ensureCardVisible(cardElements[newIndex]);

    // Actualizar preview en footer
    var ch = CHANNELS_DATA[newIndex];
    if (dom.footerChNum) dom.footerChNum.textContent = ch.number;
    if (dom.footerChName) dom.footerChName.textContent = ch.name;
    if (dom.footerChFreq) dom.footerChFreq.textContent = ch.frequency + " • " + ch.category;
  }

  // ============================================================
  // REPRODUCCION DE CANALES Y RETORNO INSTANTANEO
  // ============================================================
  function playChannel(index) {
    if (index < 0 || index >= CHANNELS_DATA.length) return;
    if (state.retryTimer) { clearTimeout(state.retryTimer); state.retryTimer = null; }
    if (state.loadTimer)  { clearTimeout(state.loadTimer);  state.loadTimer = null; }
    state.retryCount = 0;
    state.playingIndex = index;
    state.currentView = "player";
    state.manualAudioSelected = false; // Pista 1 Espanol predeterminada
    state.manualAudioIndex = 1;
    closeAudioMenu();

    var ch = CHANNELS_DATA[index];
    dom.viewChannels.className = "view hidden";
    dom.viewPlayer.className = "view active";
    dom.osdChannelNumber.textContent = ch.number;
    dom.osdChannelName.textContent = ch.name;
    dom.osdChannelFreq.textContent = ch.frequency;
    dom.osdChannelSlogan.textContent = ch.slogan;
    dom.osdStatusText.textContent = "Conectando señal...";
    if (dom.audioTrackLabel) dom.audioTrackLabel.textContent = "Pista 2 (Predeterminada)";

    showOsd();
    showLoader("Sintonizando " + ch.name + "...", "Conectando señal en vivo");
    hideError();

    try {
      history.pushState({ inPlayer: true }, "");
    } catch (e) {}

    // Desenfocar video para evitar que webOS capture el control remoto
    if (dom.video) {
      dom.video.tabIndex = -1;
      dom.video.blur();
    }
    if (window.focus) window.focus();

    startPlayback(ch);

    state.loadTimer = setTimeout(function () {
      if (state.currentView === "player" && state.isBuffering && !state.retryTimer) {
        var chn = CHANNELS_DATA[state.playingIndex];
        if (chn) handlePlaybackError("Tiempo agotado: el servidor no responde temporalmente.", chn);
      }
    }, 18000);
  }

  function startPlayback(ch) {
    showLoader("Sintonizando " + ch.name + "...", "Conectando PERCY TV");
    HLSPlayer.load(dom.video, ch.url,
      function () {
        forceSpanishAudio();
      },
      function (err) {
        handlePlaybackError(err, ch);
      },
      !!ch.directPlay
    );
  }

  function handlePlaybackError(msg, ch) {
    state.retryCount++;
    if (state.retryCount <= state.maxRetries) {
      var secs = state.retryCount * 2;
      showLoader(
        "Reintentando (" + state.retryCount + "/" + state.maxRetries + ")...",
        "Conectando en " + secs + "s"
      );
      state.retryTimer = setTimeout(function () { startPlayback(ch); }, secs * 1000);
    } else {
      showError(msg || "No se pudo cargar la señal. Pulsa OK para reintentar.");
    }
  }

  // RETORNO INSTANTANEO AL MENU DE CANALES (0ms LAG)
  function stopAndReturnToMenu() {
    if (state.retryTimer) { clearTimeout(state.retryTimer); state.retryTimer = null; }
    if (state.loadTimer)  { clearTimeout(state.loadTimer);  state.loadTimer = null; }
    state.retryCount = 0;
    closeAudioMenu();

    // Detener video inmediatamente sin bloquear el hilo principal
    HLSPlayer.stop(dom.video);

    state.currentView = "channels";
    dom.viewPlayer.className = "view hidden";
    dom.viewChannels.className = "view active";

    if (state.playingIndex >= 0) {
      updateFocus(state.playingIndex);
    }

    if (window.focus) window.focus();
  }

  // ============================================================
  // OSD Y ESTADOS DE CARGA
  // ============================================================
  function showOsd() {
    state.osdVisible = true;
    dom.playerOsdTop.className = "player-osd-bar top";
    dom.playerOsdBottom.className = "player-osd-bar bottom";
    if (state.osdTimer) clearTimeout(state.osdTimer);
    state.osdTimer = setTimeout(function () {
      if (!state.isBuffering && !state.audioMenuOpen) hideOsd();
    }, 4500);
  }

  function hideOsd() {
    state.osdVisible = false;
    dom.playerOsdTop.className = "player-osd-bar top hidden-osd";
    dom.playerOsdBottom.className = "player-osd-bar bottom hidden-osd";
  }

  function toggleOsd() {
    if (state.osdVisible) hideOsd();
    else showOsd();
  }

  function showLoader(title, subtitle) {
    state.isBuffering = true;
    dom.loaderTitle.textContent = title || "Cargando...";
    dom.loaderSubtitle.textContent = subtitle || "Espera un momento";
    dom.playerLoader.className = "player-overlay-state";
  }

  function hideLoader() {
    state.isBuffering = false;
    dom.playerLoader.className = "player-overlay-state hidden";
  }

  function showError(msg) {
    hideLoader();
    state.isBuffering = false;
    dom.errorDesc.textContent = msg || "Error de conexión.";
    dom.playerError.className = "player-overlay-state";
    showOsd();
  }

  function hideError() {
    dom.playerError.className = "player-overlay-state hidden";
  }

  function zapChannel(dir) {
    var next = state.playingIndex + dir;
    if (next < 0) next = CHANNELS_DATA.length - 1;
    else if (next >= CHANNELS_DATA.length) next = 0;
    var nc = CHANNELS_DATA[next];
    dom.zapBadge.textContent = nc.number;
    dom.zapName.textContent = nc.name;
    dom.zapCategory.textContent = nc.frequency + " - Sintonizando...";
    dom.zapToast.className = "zap-toast";
    if (state.zapTimer) clearTimeout(state.zapTimer);
    state.zapTimer = setTimeout(function () { dom.zapToast.className = "zap-toast hidden"; }, 2000);
    playChannel(next);
  }

  function setupClock() {
    function update() {
      var now = new Date();
      var h = now.getHours(), m = now.getMinutes();
      var ampm = h >= 12 ? "PM" : "AM";
      h = h % 12; h = h ? h : 12;
      var ts = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + " " + ampm;
      var days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      var months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
      var ds = days[now.getDay()] + ", " + now.getDate() + " " + months[now.getMonth()];
      if (dom.clockTime) dom.clockTime.textContent = ts;
      if (dom.clockDate) dom.clockDate.textContent = ds;
      if (dom.osdClockTime) dom.osdClockTime.textContent = ts;
    }
    update();
    setInterval(update, 1000);
  }

  // ============================================================
  // EVENTOS DEL REPRODUCTOR Y CONTROL REMOTO
  // ============================================================
  function setupEventListeners() {
    dom.video.addEventListener("loadstart", function () {
      showLoader("Conectando señal...", "Iniciando buffer");
    });
    dom.video.addEventListener("waiting", function () {
      showLoader("Cargando buffer...", "Optimizando");
    });
    dom.video.addEventListener("playing", function () {
      if (state.loadTimer) { clearTimeout(state.loadTimer); state.loadTimer = null; }
      hideLoader();
      hideError();
      state.retryCount = 0;
      dom.osdStatusText.textContent = "Transmisión HD";
      forceSpanishAudio();
      scheduleAudioSelection();
    });
    dom.video.addEventListener("loadedmetadata", function () {
      forceSpanishAudio();
      scheduleAudioSelection();
    });
    dom.video.addEventListener("timeupdate", function () {
      if (dom.video.currentTime > 0 && dom.video.currentTime < 3) {
        forceSpanishAudio();
      }
    });

    try {
      if (dom.video.audioTracks && typeof dom.video.audioTracks.addEventListener === "function") {
        dom.video.audioTracks.addEventListener("addtrack", function () {
          // En webOS las pistas pueden aparecer despues del arranque
          forceSpanishAudio();
          if (state.audioMenuOpen) buildAudioMenu();
        });
      }
    } catch (e) {}

    dom.video.addEventListener("canplay", function () {
      if (state.loadTimer) { clearTimeout(state.loadTimer); state.loadTimer = null; }
      hideLoader();
      forceSpanishAudio();
    });
    dom.video.addEventListener("error", function () {
      if (state.loadTimer) { clearTimeout(state.loadTimer); state.loadTimer = null; }
      if (state.currentView === "player" && !state.retryTimer) {
        var ch = state.playingIndex >= 0 ? CHANNELS_DATA[state.playingIndex] : null;
        if (ch) handlePlaybackError("Error al reproducir señal.", ch);
      }
    });

    dom.btnOsdBack.addEventListener("click", function () { stopAndReturnToMenu(); });
    if (dom.btnOsdAudio) {
      dom.btnOsdAudio.addEventListener("click", function () {
        if (state.audioMenuOpen) closeAudioMenu();
        else openAudioMenu();
      });
    }
    dom.btnErrorRetry.addEventListener("click", function () {
      if (state.playingIndex >= 0) {
        hideError();
        state.retryCount = 0;
        playChannel(state.playingIndex);
      }
    });
    dom.btnErrorBack.addEventListener("click", function () { stopAndReturnToMenu(); });
    dom.viewPlayer.addEventListener("mousemove", function () {
      if (state.currentView === "player") showOsd();
    });

    window.addEventListener("popstate", function () {
      if (state.currentView === "player") {
        stopAndReturnToMenu();
      }
    });

    document.addEventListener("webOSBack", function (e) {
      if (state.currentView === "player") {
        stopAndReturnToMenu();
        if (e && e.preventDefault) e.preventDefault();
      }
    }, true);

    // Recalcular la posicion del foco si cambia la resolucion de pantalla
    window.addEventListener("resize", function () {
      if (state.currentView === "channels") updateFocus(state.focusedIndex);
    });

    // Captura global de teclado de alta velocidad
    window.addEventListener("keydown", handleKeyEvent, true);
    document.addEventListener("keydown", handleKeyEvent, true);
    window.addEventListener("keyup", handleKeyUpEvent, true);
    document.addEventListener("keyup", handleKeyUpEvent, true);
  }

  function isBackKey(code, keyName) {
    return code === KEYS.BACK_WEBOS ||
           code === KEYS.BACKSPACE ||
           code === KEYS.ESCAPE ||
           code === KEYS.BACK_SAMSUNG ||
           keyName === "Back" ||
           keyName === "GoBack" ||
           keyName === "Escape";
  }

  function handleKeyUpEvent(e) {
    // Evita doble ejecución: el evento llega a window Y a document (capture)
    if (e && e.__percyHandled) return;
    if (e) e.__percyHandled = true;
    var key = e.keyCode || e.which;
    var name = e.key || "";
    if (isBackKey(key, name)) {
      if (state.currentView === "player") {
        stopAndReturnToMenu();
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }
    }
  }

  function indexOfChannelNumber(num) {
    if (!num || num < 1) return -1;
    for (var i = 0; i < CHANNELS_DATA.length; i++) {
      if (parseInt(CHANNELS_DATA[i].number, 10) === num) return i;
    }
    return -1;
  }

  function handleDigit(digit, inPlayer) {
    digitBuffer += String(digit);
    if (digitBuffer.length > 2) digitBuffer = digitBuffer.slice(digitBuffer.length - 2);
    if (digitTimer) { clearTimeout(digitTimer); digitTimer = null; }

    var num = parseInt(digitBuffer, 10);
    if (digitBuffer.length >= 2) {
      digitBuffer = "";
      var idx = indexOfChannelNumber(num);
      if (idx < 0) idx = indexOfChannelNumber(digit);
      if (idx >= 0) { updateFocus(idx); if (inPlayer) playChannel(idx); }
      return;
    }

    digitTimer = setTimeout(function () {
      digitTimer = null;
      var n = parseInt(digitBuffer, 10);
      digitBuffer = "";
      var i2 = indexOfChannelNumber(n);
      if (i2 >= 0) { updateFocus(i2); if (inPlayer) playChannel(i2); }
    }, 1000);
  }

  // ============================================================
  // MANEJADOR PRINCIPAL DE CONTROL REMOTO (ALTA VELOCIDAD)
  // ============================================================
  function handleKeyEvent(e) {
    // FIX: el mismo evento se escucha en window y document (capture).
    // Sin este guardado cada pulsacion se procesaba 2 veces (saltaba 2 canales).
    if (e && e.__percyHandled) return;
    if (e) e.__percyHandled = true;
    var key = e.keyCode || e.which;
    var name = e.key || "";

    // 1. RETORNO INMEDIATO CON TECLA ATRAS EN EL REPRODUCTOR
    if (isBackKey(key, name)) {
      if (state.currentView === "player") {
        stopAndReturnToMenu();
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return;
      } else {
        if (window.webOS && typeof window.webOS.platformBack === "function") {
          window.webOS.platformBack();
        } else if (typeof window.close === "function") {
          window.close();
        }
        if (e.preventDefault) e.preventDefault();
        return;
      }
    }

    // 2. VISTA 1: NAVEGACION RAPIDA POR CANALES
    if (state.currentView === "channels") {
      switch (key) {
        case KEYS.LEFT:
          updateFocus(state.focusedIndex - 1);
          e.preventDefault();
          break;
        case KEYS.RIGHT:
          updateFocus(state.focusedIndex + 1);
          e.preventDefault();
          break;
        case KEYS.UP:
          updateFocus(state.focusedIndex - COLS);
          e.preventDefault();
          break;
        case KEYS.DOWN:
          updateFocus(state.focusedIndex + COLS);
          e.preventDefault();
          break;
        case KEYS.ENTER:
          playChannel(state.focusedIndex);
          e.preventDefault();
          break;
        default:
          if (key >= KEYS.NUM_0 && key <= KEYS.NUM_9) {
            handleDigit(key - KEYS.NUM_0, false);
            e.preventDefault();
          }
          break;
      }

    // 3. VISTA 2: REPRODUCTOR EN PANTALLA COMPLETA
    } else if (state.currentView === "player") {

      // SI EL MENU DE IDIOMA ESTA ABIERTO
      if (state.audioMenuOpen) {
        switch (key) {
          case KEYS.UP:
          case KEYS.CH_UP:
          case KEYS.CH_UP_WEBOS:
            moveAudioMenu(-1);
            e.preventDefault();
            return;
          case KEYS.DOWN:
          case KEYS.CH_DOWN:
          case KEYS.CH_DOWN_WEBOS:
            moveAudioMenu(1);
            e.preventDefault();
            return;
          case KEYS.ENTER:
            // Al presionar OK se selecciona y desaparece de inmediato
            selectAudioTrackIndex(state.audioMenuIndex);
            e.preventDefault();
            return;
          case KEYS.LEFT:
          case KEYS.RIGHT:
            closeAudioMenu();
            e.preventDefault();
            return;
        }
      }

      // REPRODUCTOR SIN MENU DE IDIOMA
      switch (key) {
        // Al presionar FLECHA DERECHA se abre el selector de idioma
        case KEYS.RIGHT:
          openAudioMenu();
          e.preventDefault();
          break;

        case KEYS.ENTER:
          if (dom.playerError.className.indexOf("hidden") === -1) {
            state.retryCount = 0;
            playChannel(state.playingIndex);
          } else {
            toggleOsd();
          }
          e.preventDefault();
          break;

        case KEYS.GREEN:
        case KEYS.YELLOW:
          openAudioMenu();
          e.preventDefault();
          break;

        case KEYS.UP:
        case KEYS.CH_UP:
        case KEYS.CH_UP_WEBOS:
          zapChannel(1);
          e.preventDefault();
          break;

        case KEYS.DOWN:
        case KEYS.CH_DOWN:
        case KEYS.CH_DOWN_WEBOS:
          zapChannel(-1);
          e.preventDefault();
          break;

        case KEYS.LEFT:
          showOsd();
          e.preventDefault();
          break;

        case KEYS.PAUSE: dom.video.pause(); showOsd(); break;
        case KEYS.PLAY:  dom.video.play();  showOsd(); break;
        case KEYS.STOP:  stopAndReturnToMenu(); break;

        default:
          if (key >= KEYS.NUM_0 && key <= KEYS.NUM_9) {
            handleDigit(key - KEYS.NUM_0, true);
            e.preventDefault();
          }
          break;
      }
    }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

})();
