// Boarding Pass & Flight Status Suite Logic

// Default configuration for a quick start
const DEFAULT_FLIGHT = {
  passenger: "Johnathan Doe",
  airline: "emirates",
  airlineName: "Emirates",
  flight: "EK 201",
  class: "First Class",
  gate: "A18",
  seat: "04A",
  seq: "088",
  group: "Zone 1",
  fromCode: "DXB",
  fromCity: "Dubai",
  toCode: "JFK",
  toCity: "New York",
  depDate: "18 JUN 26",
  depTime: "08:30 AM",
  arrTime: "02:15 PM",
  alertType: "security",
  alertDelay: "5",
  alertTitle: "SECURITY ENFORCEMENT NOTICE",
  alertMsg: "PASSENGER UNDER SECURITY HOLD. Passenger has been flagged by custom authorities for 'excessive level of silliness' and 'carrying contraband snacks'. Please remain where you are. Air Marshal has been dispatched."
};

// State management
let currentConfig = { ...DEFAULT_FLIGHT };
let mapAnimationId = null;

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  // Check URL parameters first to see if we are in "Victim Mode"
  const urlParams = new URLSearchParams(window.location.search);
  const ticketData = urlParams.get("t");
  const directTracker = urlParams.get("track");

  // Helper function to download an element as PDF
  const downloadPDF = (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Check if html2pdf is loaded (online)
    if (typeof html2pdf !== "undefined") {
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     'BoardingPass.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'pt', format: [440, 720], orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } else {
      // Fallback to native print dialog if offline
      window.print();
    }
  };

  // Bind print button click listener (Victim Card)
  const printBtn = document.getElementById("btn-print-ticket");
  if (printBtn) {
    printBtn.onclick = () => {
      downloadPDF("victim-boarding-pass");
    };
  }

  // Bind print preview button click listener (Creator Card)
  const printPreviewBtn = document.getElementById("btn-print-preview");
  if (printPreviewBtn) {
    printPreviewBtn.onclick = () => {
      downloadPDF("preview-boarding-pass");
    };
  }

  if (ticketData) {
    try {
      const decoded = decodeState(ticketData);
      currentConfig = { ...DEFAULT_FLIGHT, ...decoded };
      
      if (directTracker === "true") {
        showView("tracker-view");
        startFlightTracker();
      } else {
        showView("ticket-view");
        renderBoardingPass("victim-boarding-pass");
      }
    } catch (e) {
      console.error("Error decoding ticket parameters:", e);
      // Fallback to creator mode if decoding fails
      setupCreatorView();
    }
  } else {
    // Normal Creator Mode
    setupCreatorView();
  }
}

// Route to a specific view
function showView(viewId) {
  document.querySelectorAll(".view-section").forEach(section => {
    section.classList.remove("active");
  });
  const activeSection = document.getElementById(viewId);
  if (activeSection) {
    activeSection.classList.add("active");
  }
}

// Setup the creator form and live binding
function setupCreatorView() {
  showView("creator-view");
  
  // Fill inputs with default values
  Object.keys(DEFAULT_FLIGHT).forEach(key => {
    const input = document.getElementById(`input-${key}`);
    if (input) {
      input.value = DEFAULT_FLIGHT[key];
    }
  });

  // Bind live updates
  const formInputs = document.querySelectorAll(".creator-form input, .creator-form select, .creator-form textarea");
  formInputs.forEach(input => {
    input.addEventListener("input", (e) => {
      const key = e.target.id.replace("input-", "");
      currentConfig[key] = e.target.value;
      
      // Auto-update Airline Name if key changes
      if (key === "airline") {
        const selectedOption = e.target.options[e.target.selectedIndex];
        currentConfig.airlineName = selectedOption.text;
        document.getElementById("input-airlineName").value = selectedOption.text;
      }
      
      renderBoardingPass("preview-boarding-pass");
    });
  });

  // Render initial preview
  renderBoardingPass("preview-boarding-pass");

  // Share buttons
  document.getElementById("btn-generate-ticket").addEventListener("click", () => {
    generateShareLink(false);
  });
  
  document.getElementById("btn-generate-tracker").addEventListener("click", () => {
    generateShareLink(true);
  });
}

// Render boarding pass structure
function renderBoardingPass(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const config = currentConfig;
  
  // Create QR Code URL (points back to the tracking site)
  const baseShareUrl = window.location.origin + window.location.pathname;
  const trackingData = encodeState(config);
  const trackingUrl = `${baseShareUrl}?t=${trackingData}&track=true`;
  
  // Fallback to visual barcode if API goes offline (increased size and lower ECC density for easy scanning)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=L&data=${encodeURIComponent(trackingUrl)}`;

  // Update theme class on boarding pass
  container.className = `boarding-pass-card theme-${config.airline}`;

  container.innerHTML = `
    <div class="ticket-header">
      <div class="airline-logo">
        <i class="fas fa-plane-departure"></i>
        <span>${config.airlineName}</span>
      </div>
      <div class="ticket-class">${config.class}</div>
    </div>
    
    <div class="ticket-body">
      <div class="flight-route">
        <div class="airport-info">
          <span class="airport-code">${config.fromCode}</span>
          <span class="airport-city">${config.fromCity}</span>
        </div>
        <div class="flight-plane-icon">
          <i class="fas fa-plane"></i>
        </div>
        <div class="airport-info align-right">
          <span class="airport-code">${config.toCode}</span>
          <span class="airport-city">${config.toCity}</span>
        </div>
      </div>
      
      <div class="detail-grid">
        <div class="detail-item span-2">
          <span class="detail-label">Passenger Name</span>
          <span class="detail-value">${config.passenger}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Flight</span>
          <span class="detail-value">${config.flight}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Gate</span>
          <span class="detail-value">${config.gate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Seat</span>
          <span class="detail-value">${config.seat}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Boarding Group</span>
          <span class="detail-value">${config.group}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">Date</span>
          <span class="detail-value">${config.depDate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Departure</span>
          <span class="detail-value">${config.depTime}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Arrival</span>
          <span class="detail-value">${config.arrTime}</span>
        </div>
      </div>
      
      <div class="ticket-perforation"></div>
      
      <div class="ticket-barcode-section">
        <div class="qr-code-wrapper">
          <img src="${qrCodeUrl}" alt="Scan to Track" class="qr-code-placeholder" onerror="this.outerHTML=drawSVGBarcode()">
        </div>
        <span class="barcode-subtext">SEQ-${config.seq}</span>
      </div>
    </div>
  `;

  // Bind the track button in Victim Boarding Pass View
  const trackBtn = document.getElementById("btn-track-flight");
  if (trackBtn) {
    trackBtn.onclick = () => {
      showView("tracker-view");
      startFlightTracker();
    };
  }
}

// Generate simple SVG linear barcode for offline/error safety
function drawSVGBarcode() {
  let lines = "";
  let x = 10;
  for (let i = 0; i < 30; i++) {
    const width = Math.random() > 0.4 ? 2 : 5;
    lines += `<rect x="${x}" y="5" width="${width}" height="60" fill="black" />`;
    x += width + (Math.random() > 0.5 ? 2 : 4);
  }
  return `<svg width="220" height="70" style="background:#fff;border-radius:4px;">${lines}</svg>`;
}

// Encode state as compressed UTF-8 Base64
function encodeState(data) {
  const jsonStr = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(jsonStr)));
}

// Decode state from Base64
function decodeState(base64) {
  const jsonStr = decodeURIComponent(escape(atob(base64)));
  return JSON.parse(jsonStr);
}

// Generate shareable link and show notification toast
function generateShareLink(directToTracker) {
  const baseShareUrl = window.location.origin + window.location.pathname;
  const data = encodeState(currentConfig);
  const link = `${baseShareUrl}?t=${data}${directToTracker ? '&track=true' : ''}`;
  
  // Display result panel
  const resultCard = document.getElementById("share-result");
  const linkInput = document.getElementById("share-link-url");
  const qrImage = document.getElementById("share-qr-code");
  
  resultCard.style.display = "flex";
  linkInput.value = link;
  
  // Update QR Code image source (increased size and lower ECC density for easy scanning)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=L&data=${encodeURIComponent(link)}`;
  if (qrImage) {
    qrImage.src = qrCodeUrl;
  }
  
  // Select text
  linkInput.select();
  
  // Try copying to clipboard
  navigator.clipboard.writeText(link).then(() => {
    showToast("📋 Flight link copied! Send it to your friend.");
  }).catch(() => {
    showToast("Link generated! Copy it from the field below.");
  });
}

// Toast notification trigger
function showToast(message) {
  let toast = document.getElementById("toast-msg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-msg";
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }
  
  toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// -------------------------------------------------------------------
// MOCK FLIGHT TRACKER CANVAS ANIMATION
// -------------------------------------------------------------------
function startFlightTracker() {
  const config = currentConfig;
  
  // Set text labels
  document.getElementById("track-airline").innerText = config.airlineName;
  document.getElementById("track-flight-no").innerText = config.flight;
  document.getElementById("track-passenger-name").innerText = config.passenger;
  document.getElementById("track-route-title").innerText = `${config.fromCode} → ${config.toCode}`;
  document.getElementById("track-from-city").innerText = config.fromCity;
  document.getElementById("track-to-city").innerText = config.toCity;
  document.getElementById("track-seat").innerText = config.seat;
  
  // Reset logs console
  const consoleEl = document.getElementById("tracker-logs");
  consoleEl.innerHTML = "";
  
  // Setup radar canvas
  const canvas = document.getElementById("radar-canvas");
  const ctx = canvas.getContext("2d");
  
  // Resize handler
  function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }
  
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  
  // Animation coordinates
  let startX = canvas.width * 0.15;
  let startY = canvas.height * 0.65;
  let endX = canvas.width * 0.85;
  let endY = canvas.height * 0.35;
  
  // Flight state variables
  let progress = 0.0;
  let speed = 520;
  let altitude = 0;
  let targetAltitude = 36000;
  let timeRemaining = 245; // minutes
  
  // Status state
  let flightStatus = "on-time";
  
  // Log sequence triggers
  const logMessages = [
    { time: 500, msg: "Establishing ADS-B link with satellite network..." },
    { time: 1500, msg: `ADS-B Signal Locked. Flight ${config.flight} transponder active.` },
    { time: 2500, msg: `Loading telemetry for carrier: ${config.airlineName.toUpperCase()}.` },
    { time: 3500, msg: `Passenger details confirmed: ${config.passenger.toUpperCase()}` },
    { time: 4500, msg: "Warning: Unconventional cabin logs detected." },
    { time: 5500, msg: "System status: Cabin pressure normal, fuel weight nominal." },
    { time: 7000, msg: "ALERT: Air Traffic Control override detected!" },
    { time: 8000, msg: "CRITICAL: Custom border control notice issued." }
  ];
  
  logMessages.forEach(item => {
    setTimeout(() => {
      addConsoleLine(item.msg);
    }, item.time);
  });
  
  // Telemetry loop
  const telemetryInterval = setInterval(() => {
    // Dynamic values
    if (progress < 1.0) {
      speed = 520 + Math.floor(Math.random() * 10 - 5);
      if (altitude < targetAltitude) {
        altitude += 2400;
      } else {
        altitude = targetAltitude + Math.floor(Math.random() * 200 - 100);
      }
      
      timeRemaining = Math.max(1, timeRemaining - Math.floor(Math.random() * 2));
      progress += 0.003;
      
      document.getElementById("telemetry-speed").innerText = speed.toLocaleString();
      document.getElementById("telemetry-alt").innerText = altitude.toLocaleString();
      
      const hours = Math.floor(timeRemaining / 60);
      const mins = timeRemaining % 60;
      document.getElementById("telemetry-eta").innerText = `${hours}h ${mins}m`;
    }
  }, 1000);
  
  // Alert Reveal Timer
  const delayMs = parseInt(config.alertDelay) * 1000;
  
  const alertTimer = setTimeout(() => {
    // Update badge to ALERT
    const badge = document.getElementById("track-status-badge");
    badge.className = "status-badge status-cancelled";
    badge.innerHTML = `<span class="pulse-dot"></span> ALERT`;
    
    // Play alert sound mock / trigger alert logs
    addConsoleLine("!!! EMERGENCY SYSTEM HALT INITIATED !!!");
    addConsoleLine("Enforcing TSA flight protocol 404...");
    addConsoleLine(`REDIRECTING LINK TO PRANK CONSOLE...`);
    
    setTimeout(() => {
      triggerAlertReveal();
    }, 1500);
  }, delayMs);
  
  // Radar Sweep Angle
  let sweepAngle = 0;
  
  // Draw Loop
  function draw() {
    // Coordinate recalculations in case of resize
    startX = canvas.width * 0.15;
    startY = canvas.height * 0.65;
    endX = canvas.width * 0.85;
    endY = canvas.height * 0.35;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = "rgba(16, 185, 129, 0.05)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw Radar Sweeping Rings (Flightradar look)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.strokeStyle = "rgba(16, 185, 129, 0.1)";
    ctx.lineWidth = 1;
    for (let r = 80; r < Math.max(canvas.width, canvas.height); r += 80) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Sweeping beam
    ctx.save();
    ctx.translate(centerX, centerY);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(centerX, centerY) * 1.2);
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.15)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, Math.max(centerX, centerY) * 1.2, sweepAngle, sweepAngle + 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    sweepAngle += 0.01;
    
    // Bezier control point for curved flight path (curving upward)
    const ctrlX = (startX + endX) / 2;
    const ctrlY = Math.min(startY, endY) - 100;
    
    // Draw curved flight path
    ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dashed lines
    
    // Calculate Airplane coordinates along Bezier Curve
    const t = progress; // 0.0 to 1.0
    const planeX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
    const planeY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
    
    // Draw flight origin & destination dots
    drawAirportNode(ctx, startX, startY, config.fromCode, "DEP");
    drawAirportNode(ctx, endX, endY, config.toCode, "ARR");
    
    // Draw already traveled solid green line
    ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    // Draw part of bezier up to current progress
    for (let i = 0; i <= t * 100; i++) {
      const step = i / 100;
      const stepX = (1 - step) * (1 - step) * startX + 2 * (1 - step) * step * ctrlX + step * step * endX;
      const stepY = (1 - step) * (1 - step) * startY + 2 * (1 - step) * step * ctrlY + step * step * endY;
      if (i === 0) ctx.moveTo(stepX, stepY);
      else ctx.lineTo(stepX, stepY);
    }
    ctx.stroke();
    
    // Draw aircraft pointer
    // Calculate tangent slope for aircraft heading angle
    const tangentX = 2 * (1 - t) * (ctrlX - startX) + 2 * t * (endX - ctrlX);
    const tangentY = 2 * (1 - t) * (ctrlY - startY) + 2 * t * (endY - ctrlY);
    const angle = Math.atan2(tangentY, tangentX);
    
    ctx.save();
    ctx.translate(planeX, planeY);
    ctx.rotate(angle);
    
    // Drawing a glowing airplane icon shape
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#10b981";
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    // Simple sleek jet geometry pointing right
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -10);
    ctx.lineTo(-4, -3);
    ctx.lineTo(-12, -4);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-12, 4);
    ctx.lineTo(-4, 3);
    ctx.lineTo(-6, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Radar pulse around plane
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(planeX, planeY, 15 + (Date.now() % 1000) / 25, 0, Math.PI * 2);
    ctx.stroke();
    
    // Loop animation
    mapAnimationId = requestAnimationFrame(draw);
  }
  
  // Trigger animation loop
  draw();
  
  // Cleanup functions
  window.onbeforeunload = () => {
    clearInterval(telemetryInterval);
    clearTimeout(alertTimer);
    if (mapAnimationId) cancelAnimationFrame(mapAnimationId);
  };
}

function drawAirportNode(ctx, x, y, code, label) {
  // Glow effect
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#06b6d4";
  
  // Node Core
  ctx.fillStyle = "#06b6d4";
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0; // reset
  
  // Ring
  ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.stroke();
  
  // Airport label text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px 'Outfit', sans-serif";
  ctx.fillText(code, x - 13, y - 18);
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 9px 'Inter', sans-serif";
  ctx.fillText(label, x - 10, y + 25);
}

// Add line to terminal output box
function addConsoleLine(text) {
  const consoleEl = document.getElementById("tracker-logs");
  if (!consoleEl) return;
  
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = "console-line";
  line.innerText = `[${time}] ${text}`;
  
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

// -------------------------------------------------------------------
// THE PRANK REVEAL OVERLAY INJECTOR
// -------------------------------------------------------------------
function triggerAlertReveal() {
  const overlay = document.getElementById("alert-popup");
  const config = currentConfig;
  
  // Populate alert card text
  document.getElementById("alert-reveal-title").innerText = config.alertTitle;
  document.getElementById("alert-reveal-msg").innerText = config.alertMsg;
  
  // Show it!
  overlay.classList.add("show");
  
  // Play custom beep if API allowed
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(120, audioCtx.currentTime); // Low warning buzz
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    
    oscillator.start();
    
    setTimeout(() => {
      oscillator.stop();
    }, 800);
  } catch (e) {
    console.log("Audio not supported or blocked by user gesture:", e);
  }
  
  // Bind close button to simply dismiss overlay
  const revealBtn = document.getElementById("btn-alert-close");
  revealBtn.onclick = () => {
    overlay.classList.remove("show");
  };
}
