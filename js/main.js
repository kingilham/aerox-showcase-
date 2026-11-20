'use strict';

/* ═══ BIKE DATA: URUTAN BIRU -> MERAH -> UNGU ═══ */
var bikes = [
  {
    theme: 'blue',
    color: 'BLUE',
    name: 'NASGORGORENG',
    img: 'assets/images/nasgororeng-main.png'
  },
  {
    theme: 'red',
    color: 'RED',
    name: '',
    img: 'assets/images/hlztt.png'
  },
  {
    theme: 'purple',
    color: 'PURPLE',
    name: '',
    img: 'assets/images/engkolkkriuk.png'
  }
];

/* Preload all images in memory for instant transitions */
bikes.forEach(function(b) {
  var preloadImg = new Image();
  preloadImg.src = b.img;
});

var current = 0;
var animating = false;
var loadingDone = false; // Flag status loading
var isFocused = false;   // Flag status zoom motor ke tengah

/* DOM elements */
var body          = document.body;
var pageWrap      = document.getElementById('pageWrap');
var simpleLoader  = document.getElementById('simpleLoader');
var loaderFill    = document.getElementById('loaderFill');
var loaderPct     = document.getElementById('loaderPct');

var motoStage    = document.getElementById('motoStage');
var cardVisual   = document.getElementById('cardVisual');
var motoCurrent  = document.getElementById('motoCurrent');
var motoNext     = document.getElementById('motoNext');
var infoColor    = document.getElementById('infoColor');
var motoLabel    = document.getElementById('motoLabel');
var dots         = document.querySelectorAll('.ndot');
var colorSels    = document.querySelectorAll('.color-sel');
var arrowL       = document.getElementById('arrowLeft');
var arrowR       = document.getElementById('arrowRight');
var card         = document.getElementById('productCard');

/* ═══ BACKGROUND MUSIC: AUTOPLAY TEPAT SETELAH LOADING SELESAI ═══ */
var bgMusic = document.getElementById('bgMusic');
if (bgMusic) {
  bgMusic.loop = true;
  bgMusic.volume = 0; // Mulai dari 0 untuk efek fade-in halus
}

function playMusicAfterLoading() {
  if (!loadingDone || !bgMusic) return;
  if (!bgMusic.paused) return; // Sudah berjalan

  var playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise.then(function() {
      removeAudioListeners();
      // Efek smooth audio swell / fade-in masuk ke dashboard
      var targetVol = 0.75;
      var curVol = 0;
      var step = targetVol / 25;
      var fadeTimer = setInterval(function() {
        curVol += step;
        if (curVol >= targetVol) {
          bgMusic.volume = targetVol;
          clearInterval(fadeTimer);
        } else {
          bgMusic.volume = curVol;
        }
      }, 35);
    }).catch(function(err) {
      console.log('Autoplay pending user gesture:', err);
    });
  }
}

function onUserGesture() {
  if (loadingDone) {
    playMusicAfterLoading();
  }
}

function removeAudioListeners() {
  ['click', 'pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function(ev) {
    window.removeEventListener(ev, onUserGesture);
  });
}

['click', 'pointerdown', 'touchstart', 'keydown', 'wheel'].forEach(function(ev) {
  window.addEventListener(ev, onUserGesture, { passive: true });
});

/* ═══ MINIMALIST MOTION LOADER & CARD ZOOM-IN TRANSITION ═══ */
(function runMinimalistLoader() {
  if (!simpleLoader || !loaderFill || !loaderPct) {
    loadingDone = true;
    if (pageWrap) pageWrap.classList.add('card-zoomed-in');
    document.body.classList.remove('loading-active');
    playMusicAfterLoading();
    return;
  }

  var progress = 0;
  var startTime = performance.now();
  var targetDuration = 3300; // ~3.3 detik

  function updateProgress(now) {
    var elapsed = now - startTime;
    var rawRatio = Math.min(elapsed / targetDuration, 1);
    
    // Smooth natural easing (cubic ease-out curve)
    var easeRatio = 1 - Math.pow(1 - rawRatio, 2.5);
    progress = Math.min(Math.round(easeRatio * 100), 100);

    loaderFill.style.width = progress + '%';
    loaderPct.textContent = progress + '%';

    if (rawRatio < 1) {
      requestAnimationFrame(updateProgress);
    } else {
      // ═══ 100% SELESAI: MASUK KE DASHBOARD & PUTAR MUSIK ═══
      setTimeout(function() {
        loadingDone = true;

        simpleLoader.classList.add('loader-closing');

        if (pageWrap) {
          pageWrap.classList.add('card-zoomed-in');
        }
        document.body.classList.remove('loading-active');

        playMusicAfterLoading();

        setTimeout(function() {
          simpleLoader.classList.add('loader-hidden');
        }, 950);

      }, 180);
    }
  }

  requestAnimationFrame(updateProgress);
})();

/* ═══ MOTOR FOCUS TOGGLE (ZOOM KE TENGAH & TEKS HILANG SMOOTH) ═══
   - Klik 1: Motor membesar dan meluncur ke posisi tengah card.
             Teks-teks hilang perlahan & smooth secara bertahap.
   - Klik 2: Motor kembali ke posisi semula.
             Seluruh teks muncul kembali dengan transisi elegan seperti awal.
═════════════════════════════════════════════════════════════════ */
function triggerRipple(x, y) {
  if (!cardVisual) return;
  var flash = document.createElement('div');
  flash.className = 'select-flash';
  flash.style.left = x + 'px';
  flash.style.top = y + 'px';
  cardVisual.appendChild(flash);
  setTimeout(function() {
    if (flash.parentNode) flash.parentNode.removeChild(flash);
  }, 700);
}

function toggleMotorFocus(forceState) {
  if (animating || !loadingDone) return;

  var nextState = (typeof forceState === 'boolean') ? forceState : !isFocused;
  if (nextState === isFocused) return;

  playMusicAfterLoading();

  if (nextState) {
    // ── MASUK FOCUS MODE: MOTOR KE TENGAH & MEMBESAR ──
    var cardRect = card.getBoundingClientRect();
    var motoRect = motoStage.getBoundingClientRect();

    // Hitung titik tengah matematis persis antara motor dan kartu
    var cardCenterX = cardRect.left + cardRect.width / 2;
    var cardCenterY = cardRect.top + cardRect.height / 2;

    var motoCenterX = motoRect.left + motoRect.width / 2;
    var motoCenterY = motoRect.top + motoRect.height / 2;

    var deltaX = cardCenterX - motoCenterX;
    var deltaY = cardCenterY - motoCenterY;

    var scale = window.innerWidth < 860 ? 1.25 : 1.42;

    motoStage.style.setProperty('--focus-tx', deltaX.toFixed(1) + 'px');
    motoStage.style.setProperty('--focus-ty', deltaY.toFixed(1) + 'px');
    motoStage.style.setProperty('--focus-scale', scale);

    // Reset inline tilt transform agar transisi CSS halus
    motoStage.style.transform = '';

    motoStage.classList.add('focused');
    pageWrap.classList.add('moto-focused');
    isFocused = true;

    triggerRipple(motoRect.width / 2, motoRect.height / 2);

  } else {
    // ── KELUAR FOCUS MODE: MOTOR KEMBALI & TEKS MUNCUL SEPERTI AWAL ──
    isFocused = false;
    pageWrap.classList.remove('moto-focused');
    motoStage.classList.remove('focused');

    setTimeout(function() {
      if (!isFocused) {
        motoStage.style.removeProperty('--focus-tx');
        motoStage.style.removeProperty('--focus-ty');
        motoStage.style.removeProperty('--focus-scale');
        motoStage.style.transform = '';
      }
    }, 950);
  }
}

/* Klik pada motor stage mentoggle focus */
if (motoStage) {
  motoStage.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleMotorFocus();
  });
}

/* Klik di luar motor saat mode fokus akan mengembalikan ke posisi normal */
document.addEventListener('click', function(e) {
  if (!isFocused) return;
  if (motoStage && motoStage.contains(e.target)) return;
  toggleMotorFocus(false);
});

/* Tombol Escape untuk kembali dari mode fokus */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && isFocused) {
    toggleMotorFocus(false);
  }
});

/* Jika ukuran layar berubah saat fokus, sesuaikan posisi */
window.addEventListener('resize', function() {
  if (isFocused) {
    toggleMotorFocus(false);
  }
});

/* ═══ 3D MOUSE PARALLAX TILT OVER VISUAL AREA ═══ */
(function initTilt() {
  if (!cardVisual || !motoStage) return;

  var currentRotX = 0, currentRotY = 0;
  var targetRotX = 0, targetRotY = 0;
  var isHovered = false;

  cardVisual.addEventListener('mouseenter', function() {
    isHovered = true;
  });

  cardVisual.addEventListener('mousemove', function(e) {
    if (isFocused) return; // Nonaktif saat motor fokus di tengah
    var rect = cardVisual.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var centerX = rect.width / 2;
    var centerY = rect.height / 2;

    targetRotY = ((x - centerX) / centerX) * 8; // Max 8 deg
    targetRotX = -((y - centerY) / centerY) * 6; // Max 6 deg
  });

  cardVisual.addEventListener('mouseleave', function() {
    isHovered = false;
    targetRotX = 0;
    targetRotY = 0;
  });

  function renderTilt() {
    if (isHovered && !animating && !isFocused && !motoStage.classList.contains('focused')) {
      currentRotX += (targetRotX - currentRotX) * 0.1;
      currentRotY += (targetRotY - currentRotY) * 0.1;
      motoStage.style.transform = 'perspective(1000px) rotateX(' + currentRotX.toFixed(2) + 'deg) rotateY(' + currentRotY.toFixed(2) + 'deg) translateZ(8px)';
    } else if (!isHovered && !animating && !isFocused && !motoStage.classList.contains('focused')) {
      if (motoStage.style.transform && motoStage.style.transform !== '') {
        motoStage.style.transform = '';
      }
    }
    requestAnimationFrame(renderTilt);
  }
  requestAnimationFrame(renderTilt);
})();

/* ═══ APPLY THEME & LABELS ═══ */
function syncTheme(index) {
  var b = bikes[index];
  body.setAttribute('data-theme', b.theme);
  infoColor.textContent = b.color;

  /* Tampilkan tulisan NASGORGORENG hanya untuk motor BLUE */
  if (b.theme === 'blue') {
    motoLabel.classList.remove('hidden');
  } else {
    motoLabel.classList.add('hidden');
  }

  /* Update active dots & color selectors */
  dots.forEach(function(d, i) { d.classList.toggle('active', i === index); });
  colorSels.forEach(function(s, i) { s.classList.toggle('active', i === index); });
}

/* ═══ SMOOTH MOTORCYCLE TRANSITION ═══ */
function goTo(targetIndex, direction) {
  if (animating || targetIndex === current) return;
  if (targetIndex < 0) targetIndex = bikes.length - 1;
  if (targetIndex >= bikes.length) targetIndex = 0;

  // Tutup mode fokus bila sedang aktif sebelum berganti motor
  if (isFocused) {
    toggleMotorFocus(false);
  }

  animating = true;
  var nextBike = bikes[targetIndex];
  var isRight = direction === 'right';

  /* Pause idle/tilt during slide transition */
  if (motoStage) {
    motoStage.classList.add('sliding');
    motoStage.style.transform = '';
  }

  /* 1. Sync theme, background gradient, and labels simultaneously */
  syncTheme(targetIndex);
  playMusicAfterLoading();

  /* 2. Setup incoming next image */
  motoNext.src = nextBike.img;
  motoNext.alt = 'Aerox New 155 ' + nextBike.color;
  motoNext.style.transition = 'none';
  motoNext.style.opacity = '0';
  motoNext.style.transform = isRight ? 'translateX(90px) scale(0.96)' : 'translateX(-90px) scale(0.96)';

  /* Force DOM reflow to apply initial state without animation */
  void motoNext.offsetHeight;

  /* 3. Animate both current and incoming image in parallel */
  var animDuration = '0.52s';
  var animEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var transitionRule = 'transform ' + animDuration + ' ' + animEasing + ', opacity ' + animDuration + ' ' + animEasing;

  motoCurrent.style.transition = transitionRule;
  motoNext.style.transition = transitionRule;

  /* Current slides out */
  motoCurrent.style.opacity = '0';
  motoCurrent.style.transform = isRight ? 'translateX(-90px) scale(0.96)' : 'translateX(90px) scale(0.96)';

  /* Next slides in to center */
  motoNext.style.opacity = '1';
  motoNext.style.transform = 'translateX(0) scale(1)';

  /* 4. Complete transition after duration */
  setTimeout(function() {
    current = targetIndex;

    /* Transfer next image back into current image container seamlessly */
    motoCurrent.src = nextBike.img;
    motoCurrent.alt = 'Aerox New 155 ' + nextBike.color;
    motoCurrent.style.transition = 'none';
    motoCurrent.style.opacity = '1';
    motoCurrent.style.transform = 'translateX(0) scale(1)';

    /* Reset next layer */
    motoNext.style.transition = 'none';
    motoNext.style.opacity = '0';
    motoNext.style.transform = 'translateX(0)';

    if (motoStage) {
      motoStage.classList.remove('sliding');
    }
    animating = false;
  }, 530);
}

/* ═══ INTERACTION LISTENERS ═══ */
arrowL.addEventListener('click', function() {
  goTo(current - 1, 'left');
});

arrowR.addEventListener('click', function() {
  goTo(current + 1, 'right');
});

dots.forEach(function(dot) {
  dot.addEventListener('click', function() {
    var t = parseInt(dot.getAttribute('data-i'), 10);
    goTo(t, t > current ? 'right' : 'left');
  });
});

colorSels.forEach(function(sel) {
  sel.addEventListener('click', function() {
    var t = parseInt(sel.getAttribute('data-index'), 10);
    goTo(t, t > current ? 'right' : 'left');
  });
});

/* Keyboard arrow support */
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowLeft') goTo(current - 1, 'left');
  if (e.key === 'ArrowRight') goTo(current + 1, 'right');
});

/* Touch swipe for mobile */
(function() {
  var startX = 0;
  var startY = 0;
  var isSwiping = false;

  card.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = true;
    }
  }, { passive: true });

  card.addEventListener('touchend', function(e) {
    if (!isSwiping || animating || isFocused) return;
    isSwiping = false;
    var deltaX = startX - e.changedTouches[0].clientX;
    var deltaY = Math.abs(startY - e.changedTouches[0].clientY);

    /* Check if horizontal swipe dominant */
    if (Math.abs(deltaX) > 40 && deltaY < 80) {
      if (deltaX > 0) {
        goTo(current + 1, 'right');
      } else {
        goTo(current - 1, 'left');
      }
    }
  }, { passive: true });
})();

/* Initial state on load: BLUE first */
syncTheme(0);
