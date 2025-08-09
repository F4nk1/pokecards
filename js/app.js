// app.js — Versión completa y pulida (versión básica)
// Cópialo en tu archivo app.js y abre index.html con Live Server o en el navegador.

document.addEventListener('DOMContentLoaded', () => {
  /* ====== Datos y configuración ====== */
  const POKES = [
    { id: 1, name: 'Charmander', type: 'fuego', emoji: '🔥', hp: 40, atk: 12 },
    { id: 2, name: 'Squirtle', type: 'agua', emoji: '💧', hp: 44, atk: 10 },
    { id: 3, name: 'Bulbasaur', type: 'planta', emoji: '🌿', hp: 42, atk: 11 },
    { id: 4, name: 'Pikachu', type: 'electrico', emoji: '⚡', hp: 36, atk: 13 },
    { id: 5, name: 'Vulpix', type: 'fuego', emoji: '🦊', hp: 38, atk: 11 },
    { id: 6, name: 'Oddish', type: 'planta', emoji: '🍃', hp: 34, atk: 9 },
    { id: 7, name: 'Psyduck', type: 'agua', emoji: '🦆', hp: 40, atk: 10 },
  ];

  const EFFECTIVENESS = {
    fuego: { fuego: 1, agua: 0.5, planta: 2, electrico: 1 },
    agua: { fuego: 2, agua: 1, planta: 0.5, electrico: 0.5 },
    planta: { fuego: 0.5, agua: 2, planta: 1, electrico: 1 },
    electrico: { fuego: 1, agua: 2, planta: 0.5, electrico: 1 },
  };

  /* ====== Estado del juego ====== */
  let state = {
    deck: [],
    player: [],
    cpu: [],
    turn: 'player', // 'player' | 'cpu'
    selectedPlayer: null, // índice
    selectedCPU: null, // índice
  };

  /* ====== Helpers DOM ====== */
  const $ = (id) => document.getElementById(id);
  const startBtn = $('startBtn');
  const nextTurnBtn = $('nextTurnBtn');
  const playerHandEl = $('playerHand');
  const cpuHandEl = $('cpuHand');
  const logEl = $('log');
  const turnIndicatorEl = $('turnIndicator');
  const selectedPlayerEl = $('selectedPlayer');
  const selectedCPUEl = $('selectedCPU');

  function log(msg) {
    logEl.innerText = msg;
  }

  function clamp(v, a = 0, b = 100) {
    return Math.max(a, Math.min(b, v));
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ====== Inicializar / reiniciar partida ====== */
  function startGame() {
    // mezclar y repartir 3 cartas a player y 3 a cpu
    state.deck = shuffle(POKES);
    // clonar y añadir maxHp para poder calcular proporciones
    state.player = state.deck.slice(0, 3).map((p) => ({ ...p, maxHp: p.hp }));
    state.cpu = state.deck.slice(3, 6).map((p) => ({ ...p, maxHp: p.hp }));
    state.turn = 'player';
    state.selectedPlayer = null;
    state.selectedCPU = null;
    updateUI();
    renderHands();
    log('Partida iniciada. Es tu turno. Selecciona una carta y un objetivo.');
    nextTurnBtn.disabled = false;
    startBtn.innerText = 'Reiniciar partida';
  }

  /* ====== Renderizado de cartas ====== */
  function renderHands() {
    // Jugador
    playerHandEl.innerHTML = '';
    state.player.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      if (c.hp <= 0) card.classList.add('disabled');
      if (state.selectedPlayer === i) card.classList.add('selected');
      card.dataset.idx = i;

      const hpPercent = clamp(Math.round((c.hp / c.maxHp) * 100), 0, 100);
      card.innerHTML = `
        <div class="sprite">${c.emoji}</div>
        <h3>${c.name}</h3>
        <div class="types"><div class="type">${c.type}</div></div>
        <div class="stat">ATK: ${c.atk}</div>
        <div class="stat">HP: <span class="hp-text">${c.hp}</span> / ${c.maxHp}</div>
        <div class="hp-bar"><div class="hp-fill" style="width:${hpPercent}%"></div></div>
      `;

      card.addEventListener('click', () => selectPlayerCard(i));
      playerHandEl.appendChild(card);
    });

    // CPU
    cpuHandEl.innerHTML = '';
    state.cpu.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      if (c.hp <= 0) card.classList.add('disabled');
      if (state.selectedCPU === i) card.classList.add('selected');
      card.dataset.idx = i;

      const hpPercent = clamp(Math.round((c.hp / c.maxHp) * 100), 0, 100);
      // puedes ocultar más info si quieres (por ejemplo name/emoji)
      card.innerHTML = `
        <div class="sprite">${c.emoji}</div>
        <h3>${c.name}</h3>
        <div class="types"><div class="type">${c.type}</div></div>
        <div class="stat">ATK: ${c.atk}</div>
        <div class="stat">HP: <span class="hp-text">${c.hp}</span> / ${c.maxHp}</div>
        <div class="hp-bar"><div class="hp-fill" style="width:${hpPercent}%"></div></div>
      `;

      card.addEventListener('click', () => selectCPUCard(i));
      cpuHandEl.appendChild(card);
    });

    // actualizar detalles laterales
    selectedPlayerEl.innerText =
      state.selectedPlayer !== null ? state.player[state.selectedPlayer].name : '—';
    selectedCPUEl.innerText =
      state.selectedCPU !== null ? state.cpu[state.selectedCPU].name : '—';
  }

  /* ====== Selecciones ====== */
  function selectPlayerCard(i) {
    if (state.turn !== 'player') return log('No es tu turno.');
    if (!state.player[i] || state.player[i].hp <= 0) return log('Esa carta está K.O.');
    state.selectedPlayer = i;
    log(`Seleccionaste ${state.player[i].name}. Elige un objetivo enemigo.`);
    renderHands();
  }

  function selectCPUCard(i) {
    if (state.turn !== 'player') return;
    if (!state.cpu[i] || state.cpu[i].hp <= 0) return log('Esa carta ya está K.O.');
    state.selectedCPU = i;
    log(`Has elegido atacar a ${state.cpu[i].name}. Presiona "Confirmar ataque".`);
    renderHands();
  }

  /* ====== Lógica de daño ====== */
  function computeDamage(att, def) {
    const base = att.atk;
    const mult = (EFFECTIVENESS[att.type] && EFFECTIVENESS[att.type][def.type]) || 1;
    // asegurar al menos 1 de daño
    return Math.max(1, Math.round(base * mult));
  }

  /* ====== Confirmar ataque del jugador ====== */
  function confirmAttack() {
    if (state.turn !== 'player') return log('No es tu turno.');
    if (state.selectedPlayer === null) return log('Selecciona primero una de tus cartas.');
    if (state.selectedCPU === null) return log('Selecciona primero una carta enemiga para atacar.');

    const attacker = state.player[state.selectedPlayer];
    const defender = state.cpu[state.selectedCPU];
    if (!attacker || !defender) return log('Error: carta no encontrada.');

    const dmg = computeDamage(attacker, defender);
    defender.hp = Math.max(0, defender.hp - dmg);

    log(
      `${attacker.name} atacó a ${defender.name} y causó ${dmg} de daño (${attacker.type} → ${defender.type}).`
    );
    renderHands();

    // limpiar selección del jugador
    state.selectedPlayer = null;
    state.selectedCPU = null;

    // comprobar si hay ganador
    const winner = checkWin();
    if (winner) {
      finishGame(winner);
      return;
    }

    // pasar turno a la CPU
    state.turn = 'cpu';
    updateUI();
    nextTurnBtn.disabled = true;

    // dar un pequeño delay para que se vea la acción
    setTimeout(cpuTurn, 700);
  }

  /* ====== Turno de la CPU (IA simple mejorada) ====== */
  function cpuTurn() {
    // seleccionar atacante viv0 al azar entre los vivos
    const aliveCPU = state.cpu.map((c, i) => ({ c, i })).filter((x) => x.c.hp > 0);
    const alivePlayer = state.player.map((c, i) => ({ c, i })).filter((x) => x.c.hp > 0);
    if (aliveCPU.length === 0 || alivePlayer.length === 0) {
      const winner = checkWin();
      if (winner) return finishGame(winner);
      return;
    }

    // IA: elegir atacante al azar, objetivo con menor HP (intenta rematar)
    const pickA = aliveCPU[Math.floor(Math.random() * aliveCPU.length)];
    // priorizar objetivos débiles según la efectividad (intentar elegir objetivo al que haga más daño)
    let bestTarget = alivePlayer[0];
    let bestScore = -Infinity;
    for (const cand of alivePlayer) {
      const mult = (EFFECTIVENESS[pickA.c.type] && EFFECTIVENESS[pickA.c.type][cand.c.type]) || 1;
      // score = posibilidad de rematar + multiplicador de tipo - hp (queremos rematar cuanto antes)
      const score = mult * pickA.c.atk - cand.c.hp * 0.01;
      if (score > bestScore) {
        bestScore = score;
        bestTarget = cand;
      }
    }

    const attacker = pickA.c;
    const defender = bestTarget.c;
    const dmg = computeDamage(attacker, defender);
    defender.hp = Math.max(0, defender.hp - dmg);

    log(`CPU: ${attacker.name} atacó a ${defender.name} y causó ${dmg} de daño.`);
    renderHands();

    // comprobar ganador después del ataque
    const winner = checkWin();
    if (winner) {
      finishGame(winner);
      return;
    }

    // volver turno al jugador
    state.turn = 'player';
    updateUI();
    nextTurnBtn.disabled = false;
  }

  /* ====== Comprobación de victoria ====== */
  function checkWin() {
    const somePlayerAlive = state.player.some((c) => c.hp > 0);
    const someCPUAlive = state.cpu.some((c) => c.hp > 0);
    if (!someCPUAlive && !somePlayerAlive) return 'draw';
    if (!someCPUAlive) return 'player';
    if (!somePlayerAlive) return 'cpu';
    return null;
  }

  function finishGame(winner) {
    if (winner === 'player') {
      log('¡Felicidades! Has derrotado al rival. Pulsa "Reiniciar partida" para jugar otra vez.');
    } else if (winner === 'cpu') {
      log('Has perdido. El rival te dejó sin cartas. Pulsa "Reiniciar partida" para intentar de nuevo.');
    } else {
      log('Empate. Pulsa "Reiniciar partida" para jugar otra vez.');
    }
    nextTurnBtn.disabled = true;
    state.selectedPlayer = null;
    state.selectedCPU = null;
    renderHands();
    updateUI();
  }

  /* ====== UI helpers ====== */
  function updateUI() {
    turnIndicatorEl.innerText = state.turn === 'player' ? 'Jugador' : 'CPU';
    selectedPlayerEl.innerText =
      state.selectedPlayer !== null ? state.player[state.selectedPlayer].name : '—';
    selectedCPUEl.innerText =
      state.selectedCPU !== null ? state.cpu[state.selectedCPU].name : '—';
  }

  /* ====== Eventos UI ====== */
  startBtn.addEventListener('click', () => startGame());
  nextTurnBtn.addEventListener('click', () => confirmAttack());

  // Render inicial (interfaz limpia)
  renderHands();
  updateUI();
  log('Pulsa "Iniciar partida" para repartir cartas.');
});
