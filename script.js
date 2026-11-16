const $ = (selector) => document.querySelector(selector);
const scene = $("#roomScene");
const pandaWrap = $("#pandaWrap");
const panda = $("#panda");
const toast = $("#toast");
const state = {
  room: "living", hunger: 72, happy: 88, clean: 64, energy: 79,
  mode: "idle", sound: true, x: 50, target: null, drag: null, bathStage: 0
};
let toastTimer;
let audioContext;

const food = [
  ["bamboo", "Bambus", 14, "Nom nom! Mein Lieblingsessen!"],
  ["berry", "Erdbeere", 9, "So süß und saftig!"], ["melon", "Melone", 12, "Erfrischend!"],
  ["apple", "Apfel", 10, "Knackig lecker!"], ["cake", "Cupcake", 7, "Ein kleiner süßer Traum!"],
  ["cookie", "Keks", 6, "Knusper knusper!"], ["milk", "Milch", 11, "Mmmh, Milchbart!"], ["ice", "Eis", 8, "Kalt und kuschelig!"]
];

function showToast(message) {
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function beep(kind = "pop") {
  if (!state.sound) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = kind === "happy" ? 650 : kind === "water" ? 280 : 420;
  gain.gain.setValueAtTime(.045, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .2);
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + .2);
}

function updateNeeds() {
  ["hunger", "happy", "clean", "energy"].forEach((key) => {
    state[key] = Math.max(0, Math.min(100, state[key]));
    $(`#${key}Value`).textContent = Math.round(state[key]);
    $(`#${key}Bar`).style.width = `${state[key]}%`;
  });
  const average = (state.hunger + state.happy + state.clean + state.energy) / 4;
  $("#moodText").textContent = average > 80 ? "ist super glücklich!" : average > 55 ? "fühlt sich richtig wohl!" : "braucht ein bisschen Liebe.";
}

function particles(items = ["♡", "✦", "♡"]) {
  items.forEach((item, index) => {
    const node = document.createElement("span");
    node.className = "particle"; node.textContent = item;
    node.style.left = `${state.x}%`; node.style.bottom = "34%";
    node.style.setProperty("--x", `${(Math.random() - .5) * 150}px`);
    node.style.animationDelay = `${index * .1}s`; $("#particles").appendChild(node);
    setTimeout(() => node.remove(), 1900);
  });
}

function setMode(mode, message) {
  state.mode = mode;
  panda.classList.remove("idle", "happy", "sleepy", "sad", "dance", "walking", "eating", "washing", "sitting", "blowing", "puff");
  panda.classList.add(mode === "walk" ? "walking" : mode);
  if (message) $("#speech").textContent = message;
}

function movePanda(target, done) {
  state.target = Math.max(14, Math.min(86, target));
  setMode("walk", "Ich komme!");
  const timer = setInterval(() => {
    const distance = state.target - state.x;
    if (Math.abs(distance) < 1) {
      clearInterval(timer); state.x = state.target; pandaWrap.classList.remove("turn-left", "turn-right");
      setMode("idle"); if (done) done(); return;
    }
    pandaWrap.classList.toggle("turn-left", distance < 0);
    pandaWrap.classList.toggle("turn-right", distance > 0);
    state.x += Math.sign(distance) * .8;
    pandaWrap.style.left = `${state.x}%`;
  }, 35);
}

function openModal(html) { $("#modal").innerHTML = html; $("#modalBackdrop").classList.add("open"); }
function closeModal() { $("#modalBackdrop").classList.remove("open"); }

function beginEating(selected) {
  closeModal();
  movePanda(62, () => {
    const held = document.createElement("span");
    held.className = `held-food food-hold-${selected[0]}`;
    pandaWrap.appendChild(held);
    setMode("eating", "Mampf, mampf!");
    const mouth = panda.querySelector(".lumi-mouth");
    mouth.classList.add("open-mouth"); beep("happy");
    setTimeout(() => { held.classList.add("bite-one"); particles(["♡", "✦"]); }, 550);
    setTimeout(() => { held.classList.add("bite-two"); state.hunger += selected[2]; state.happy += 6; particles(["♡", "✦", "♡"]); }, 1050);
    setTimeout(() => {
      held.remove(); mouth.classList.remove("open-mouth"); setMode("happy", selected[3]);
      showToast(`${selected[1]} aufgegessen! Lumi reibt sich den Bauch.`);
      updateNeeds();
    }, 1700);
  });
}

function openFood() {
  openModal(`<button class="close-modal">×</button><h2>Ziehe etwas zu Lumi</h2><p class="subtitle">Du kannst es auch direkt antippen.</p><div class="food-grid">${food.map((item, i) => `<button class="food food-${i}" draggable="true" data-food="${i}"><b></b>${item[1]}</button>`).join("")}</div>`);
  document.querySelectorAll("[data-food]").forEach((button) => {
    button.addEventListener("click", () => beginEating(food[button.dataset.food]));
    button.addEventListener("dragstart", (event) => {
      state.drag = { type: "food", value: food[button.dataset.food] };
      event.dataTransfer.setData("text/plain", "food");
      closeModal(); showToast("Ziehe das Futter zu Lumi!");
    });
  });
}

function createRoomObjects(room) {
  scene.querySelectorAll(".game-object, .bath-overlay, .room-art, .bath-controls").forEach((node) => node.remove());
  const art = document.createElement("div");
  art.className = `room-art art-${room}`;
  art.innerHTML = {
    living: '<span class="art-window">☼</span><span class="art-shelf">▰ ▰ ▰</span><span class="art-rug"></span>',
    kitchen: '<span class="art-cabinets">▰ ▰ ▰ ▰</span><span class="art-table">◯</span><span class="art-plate">● ● ●</span>',
    bathroom: '<span class="art-tiles"></span><span class="art-mirror">◯</span><span class="art-sink">◡</span><span class="art-towel">▥</span>',
    bedroom: '<span class="art-stars">✦ · ✧ · ✦</span><span class="art-wall-lamp">☾</span><span class="art-nightstand">▰</span>',
    playroom: '<span class="art-shelf">▰ ▰ ▰</span><span class="art-trampoline">◡</span><span class="art-pennant">△ △ △</span>',
    garden: '<span class="art-clouds">☁　☁</span><span class="art-tree">♣</span><span class="art-grass">⌁⌁⌁⌁⌁</span>'
  }[room] || "";
  scene.prepend(art);
  const objects = {
    kitchen: [["fridge", "🧊", "Kühlschrank", 15], ["counter", "🍓 🍉 🍎", "Frische Snacks", 78]],
    bathroom: [["tub", "▱", "Badewanne", 76], ["shower", "╱", "Dusche", 28], ["sink", "◡", "Waschbecken", 14]],
    bedroom: [["bed", "🛏️", "Bett", 76], ["lamp", "💡", "Licht", 25]],
    playroom: [["ball", "🎾", "Ball", 24], ["bubbles", "🫧", "Seifenblasen", 76], ["teddy", "🧸", "Teddy", 13]],
    garden: [["flower", "🌷", "Blumen", 75], ["swing", "🎠", "Schaukel", 22]]
  };
  (objects[room] || []).forEach(([type, icon, label, left]) => {
    const object = document.createElement("button");
    object.className = `game-object object-${type}`; object.dataset.type = type;
    object.style.left = `${left}%`; object.innerHTML = `<span aria-hidden="true"></span><small>${label}</small>`;
    object.addEventListener("click", () => interactObject(type, left));
    scene.appendChild(object);
  });
  if (room === "kitchen") {
    const tray = document.createElement("button");
    tray.className = "kitchen-tray"; tray.textContent = "Öffne den Snack-Schrank";
    tray.addEventListener("click", openFood); scene.appendChild(tray);
  }
}

function interactObject(type, left) {
  if (type === "fridge" || type === "counter") return openFood();
  movePanda(left, () => {
    if (type === "bed") {
      setMode("sleepy", "Zzz... gute Nacht"); state.energy += 24; showToast("Lumi kuschelt sich ein und schläft.");
    } else     if (type === "tub" || type === "shower") startBathGame();
    else if (type === "ball") startBallGame();
    else if (type === "bubbles") startBubbleGame();
    else if (type === "teddy") { state.happy += 10; setMode("happy", "Teddy-Kuscheln!"); particles(["♡", "🧸"]); }
    else { state.happy += 8; setMode("happy", "Wie schön!"); particles(["🌸", "✦"]); }
    updateNeeds(); beep("happy");
  });
}

function openBathGame() {
  const existing = scene.querySelector(".bath-controls");
  if (existing) return;
  const controls = document.createElement("div");
  controls.className = "bath-controls";
  controls.innerHTML = '<strong>Badetag</strong><span class="bath-status">Ziehe den Schwamm über Lumi</span><div class="bath-meter"><i></i></div><button class="bath-tool sponge-tool" draggable="true">Schwamm</button><button class="bath-tool shower-tool">Dusche an</button><button class="bath-tool towel-tool">Handtuch</button>';
  scene.appendChild(controls);
  state.bathStage = 0;
  const sponge = controls.querySelector(".sponge-tool");
  sponge.addEventListener("dragstart", () => {
    state.drag = { type: "sponge" }; setMode("washing", "Kitzel, kitzel!");
  });
  sponge.addEventListener("pointerdown", (event) => {
    state.drag = { type: "sponge" }; sponge.setPointerCapture(event.pointerId);
  });
  sponge.addEventListener("pointermove", (event) => {
    if (state.drag?.type !== "sponge") return;
    const rect = scene.getBoundingClientRect();
    sponge.style.left = `${event.clientX - rect.left - 20}px`; sponge.style.top = `${event.clientY - rect.top - 20}px`;
    if (event.clientX > rect.left + rect.width * .35 && event.clientX < rect.left + rect.width * .7) {
      state.bathStage = Math.min(1, state.bathStage + .03); controls.querySelector(".bath-meter i").style.width = `${state.bathStage * 100}%`;
      particles(["•", "•"]); setMode("washing", "Blubber-blubber!");
    }
  });
  sponge.addEventListener("pointerup", () => { state.drag = null; if (state.bathStage >= 1) controls.querySelector(".bath-status").textContent = "Jetzt abspülen!"; });
  controls.querySelector(".shower-tool").addEventListener("click", () => {
    if (state.bathStage < 1) return showToast("Lumi braucht erst den Schwamm!");
    state.bathStage = 2; setMode("washing", "Plitsch, platsch!"); particles(["•", "•", "•"]); beep("water");
    controls.querySelector(".bath-status").textContent = "Lumi ist sauber – abtrocknen!";
  });
  controls.querySelector(".towel-tool").addEventListener("click", () => {
    if (state.bathStage < 2) return showToast("Erst einseifen und abspülen!");
    state.clean += 40; state.bathStage = 3; setMode("happy", "Flauschig sauber!"); updateNeeds(); particles(["♡", "✦"]); beep("happy");
    controls.querySelector(".bath-status").textContent = "Fertig! Lumi duftet wunderbar.";
  });
}

function startBathGame() {
  if (state.room !== "bathroom") {
    const button = document.querySelector('[data-room="bathroom"]');
    changeRoom(button);
    setTimeout(openBathGame, 900);
    return;
  }
  openBathGame();
}

function startBubbleBlowing() {
  movePanda(52, () => {
    const wand = document.createElement("span");
    wand.className = "bubble-wand"; wand.textContent = "○";
    panda.querySelector(".arm.right").appendChild(wand);
    setMode("blowing", "Pfffff..."); panda.classList.add("puff");
    setTimeout(() => {
      wand.remove(); panda.classList.remove("puff");
      for (let i = 0; i < 9; i++) {
        const bubble = document.createElement("button");
        bubble.className = "game-bubble"; bubble.textContent = "○";
        bubble.style.left = `${42 + Math.random() * 22}%`; bubble.style.top = `${35 + Math.random() * 30}%`;
        bubble.style.setProperty("--size", `${18 + Math.random() * 20}px`);
        scene.appendChild(bubble);
        bubble.addEventListener("click", () => {
          bubble.classList.add("popped"); state.happy += 4; pandaReaction("happy", "Plopp!"); beep("pop"); updateNeeds();
          setTimeout(() => bubble.remove(), 220);
        });
        setTimeout(() => bubble.remove(), 5000);
      }
      showToast("Tippe auf die schwebenden Blasen!");
    }, 850);
  });
}

function startBallGame() {
  const ball = document.createElement("span"); ball.className = "throw-ball"; ball.textContent = "🎾"; scene.appendChild(ball);
  showToast("Ziehe den Ball und lass ihn los!");
  let dragging = false;
  ball.addEventListener("pointerdown", (event) => { dragging = true; ball.setPointerCapture(event.pointerId); });
  ball.addEventListener("pointermove", (event) => { if (!dragging) return; const rect = scene.getBoundingClientRect(); ball.style.left = `${event.clientX - rect.left - 15}px`; ball.style.top = `${event.clientY - rect.top - 15}px`; });
  ball.addEventListener("pointerup", () => {
    if (!dragging) return; dragging = false; const rect = scene.getBoundingClientRect();
    const x = ((parseFloat(ball.style.left) || rect.width * .7) / rect.width) * 100;
    ball.classList.add("thrown"); ball.style.left = `${Math.max(10, Math.min(88, x))}%`; ball.style.top = "48%";
    movePanda(x, () => { setMode("happy", "Ich hab ihn!"); state.happy += 12; state.energy -= 7; particles(["✦", "🎾", "♡"]); ball.remove(); updateNeeds(); showToast("Lumi bringt den Ball zurück!"); });
  });
}

function startBubbleGame() {
  showToast("Tippe auf die Blasen, bevor sie wegfliegen!");
  for (let i = 0; i < 5; i++) {
    const bubble = document.createElement("button"); bubble.className = "game-bubble"; bubble.textContent = "🫧";
    bubble.style.left = `${20 + Math.random() * 65}%`; bubble.style.top = `${35 + Math.random() * 35}%`; scene.appendChild(bubble);
    bubble.addEventListener("click", () => { bubble.remove(); state.happy += 4; pandaReaction("happy", "Plopp!"); particles(["✦", "💧"]); beep("pop"); updateNeeds(); });
    setTimeout(() => bubble.remove(), 5000);
  }
}

function pandaReaction(animation, message) { setMode(animation, message); particles(animation === "sad" ? ["💧"] : ["♡", "✦", "♡"]); }

function changeRoom(button) {
  document.querySelectorAll(".room-btn").forEach((item) => item.classList.remove("active"));
  button.classList.add("active"); state.room = button.dataset.room;
  scene.className = `room-scene ${state.room}`; $("#roomTitle").textContent = button.dataset.title;
  createRoomObjects(state.room); movePanda(50, () => setMode(state.room === "bedroom" ? "sleepy" : "happy", state.room === "bedroom" ? "Zeit für ein Nickerchen?" : "Neues Zimmer!"));
}

document.querySelectorAll(".action-card").forEach((button) => button.addEventListener("click", () => {
  const action = button.dataset.action;
  if (action === "feed") return openFood();
  if (action === "bath") return startBathGame();
  if (action === "play") return startBallGame();
  if (action === "sleep") return interactObject("bed", 76);
  if (action === "love") { state.happy += 12; pandaReaction("happy", "Kuschel-kuschel!"); updateNeeds(); beep("happy"); return; }
  if (action === "dance") { state.happy += 10; state.energy -= 8; pandaReaction("dance", "Tanz mit mir!"); updateNeeds(); beep("happy"); }
  if (action === "bubble") return startBubbleBlowing();
}));
document.querySelectorAll(".room-btn").forEach((button) => button.addEventListener("click", () => changeRoom(button)));
$("#pandaWrap").addEventListener("click", () => { state.happy += 5; pandaReaction("happy", ["Hihi!", "Nochmal!", "Du bist lieb!"][Math.floor(Math.random() * 3)]); updateNeeds(); beep("happy"); });
$("#pandaWrap").addEventListener("pointermove", (event) => { if (event.buttons !== 1) return; state.happy += .2; setMode("happy", "Hihi, das kitzelt!"); particles(["♡"]); updateNeeds(); });
document.querySelectorAll(".adventure").forEach((button) => button.addEventListener("click", () => {
  const type = button.dataset.adventure;
  if (type === "bubble") return startBubbleBlowing();
  if (type === "butterfly") {
    changeRoom(document.querySelector('[data-room="garden"]'));
    setTimeout(() => { state.happy += 10; pandaReaction("happy", "Fang sie, Lumi!"); particles(["✦", "✦", "♡"]); updateNeeds(); showToast("Lumi jagt die Schmetterlinge!"); }, 800);
  }
  if (type === "teddy") {
    changeRoom(document.querySelector('[data-room="playroom"]'));
    setTimeout(() => interactObject("teddy", 13), 800);
  }
}));
$("#soundButton").addEventListener("click", (event) => { state.sound = !state.sound; event.currentTarget.textContent = state.sound ? "🔊" : "🔇"; showToast(state.sound ? "Ton eingeschaltet" : "Ton ausgeschaltet"); });
$("#modalBackdrop").addEventListener("click", (event) => { if (event.target.id === "modalBackdrop" || event.target.classList.contains("close-modal")) closeModal(); });
scene.addEventListener("dragover", (event) => event.preventDefault());
scene.addEventListener("drop", (event) => {
  event.preventDefault();
  if (state.drag?.type === "food") beginEating(state.drag.value);
  state.drag = null;
});
scene.addEventListener("pointerup", () => { if (state.drag?.type === "sponge") state.drag = null; });

function autonomousAction() {
  if (state.mode !== "idle" || state.room !== "living") return;
  const choice = Math.random();
  if (choice < .55) movePanda(18 + Math.random() * 65);
  else if (choice < .75) { setMode("sitting", "Mmmh..."); setTimeout(() => setMode("idle"), 2200); }
  else if (choice < .88) { setMode("happy", "Hihi!"); particles(["✦"]); }
  else { setMode("sleepy", "Gähn..."); setTimeout(() => setMode("idle"), 1800); }
}
setInterval(autonomousAction, 4200);
setInterval(() => { state.hunger -= .7; state.energy -= .2; state.clean -= .15; updateNeeds(); }, 12000);
setInterval(() => { if (Math.random() < .55) panda.querySelectorAll(".lumi-eye").forEach((eye) => { eye.classList.add("blink"); setTimeout(() => eye.classList.remove("blink"), 180); }); }, 3000);
createRoomObjects("living"); updateNeeds();
