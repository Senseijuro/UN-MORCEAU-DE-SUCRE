document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var grid = document.getElementById('al-grid');
  var sceneEl = document.getElementById('al-scene');
  var foundEl = document.getElementById('al-found');
  var errorsEl = document.getElementById('al-errors');
  var ctxEmoji = document.getElementById('al-ctx-emoji');
  var ctxText = document.getElementById('al-ctx-text');
  var explainEl = document.getElementById('al-explain');

  // 1. BYPASS
  if (!state.enigme1 || state.enigme1.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }
  if (state.quiz && state.quiz.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.quiz.completed, state.quiz.score || 0);
    return;
  }
  if (locked) locked.classList.add('hidden');

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '🚨',
    title: 'CHASSE AUX DANGERS',
    subtitle: 'ÉPREUVE 2',
    description: 'Inspecte la salle de jeux et sécurise l\'environnement pour les enfants.',
    steps: [
      { icon: '👀', text: 'Observe attentivement tous les objets présents dans la pièce.' },
      { icon: '🚫', text: 'Clique <strong>uniquement</strong> sur les éléments dangereux pour un bébé.' },
      { icon: '🧸', text: 'Ne touche pas aux objets sains.' },
      { icon: '🎯', text: 'Trouve les 5 dangers cachés dans la scène !' }
    ],
    warning: 'Attention : 3 fausses alertes (clic sur un objet sain) et c\'est perdu !',
    buttonText: 'C\'EST PARTI !',
    theme: 'cyan'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. FONCTION GLOBALE DU JEU
  function initGame() {
    var scenes = [
      {
        emoji: '👶', title: 'CRÈCHE — Salle de jeux',
        text: 'Tu inspectes la salle de jeux de la crèche. Repère les 5 dangers pour les bébés !',
        items: [
          { emoji: '🔌', text: 'Prise sans cache', danger: true, why: 'Un bébé peut mettre ses doigts dedans !' },
          { emoji: '💊', text: 'Médicament au sol', danger: true, why: 'Un enfant peut l\'avaler — danger mortel !' },
          { emoji: '🪙', text: 'Pièce de monnaie', danger: true, why: 'Risque d\'étouffement — petit objet !' },
          { emoji: '🧴', text: 'Produit ménager ouvert', danger: true, why: 'Produit toxique accessible aux enfants !' },
          { emoji: '✂️', text: 'Ciseaux ouverts', danger: true, why: 'Objet tranchant à portée des enfants !' },
          { emoji: '🧸', text: 'Peluche en bon état', danger: false },
          { emoji: '📚', text: 'Livre cartonné', danger: false },
          { emoji: '🖍️', text: 'Gros crayons de cire', danger: false },
          { emoji: '🧩', text: 'Puzzle adapté 2+ ans', danger: false },
          { emoji: '🪑', text: 'Chaise sécurisée', danger: false }
        ]
      }
    ];

    var currentScene = 0, totalFound = 0, totalErrors = 0, maxErrors = 3;

    function shuffleArray(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function updateStats() {
      if (sceneEl) sceneEl.textContent = '🏠 Lieu ' + (currentScene + 1) + ' / ' + scenes.length;
      if (foundEl) foundEl.textContent = '🚨 ' + totalFound + ' dangers';
      if (errorsEl) errorsEl.textContent = '❌ ' + totalErrors + ' / ' + maxErrors;
    }

    function startScene() {
      if (currentScene >= scenes.length) { endGame(); return; }
      var scene = scenes[currentScene];
      updateStats();
      if (ctxEmoji) ctxEmoji.textContent = scene.emoji;
      if (ctxText) ctxText.textContent = scene.text;
      if (explainEl) explainEl.textContent = '';
      grid.innerHTML = '';

      var shuffledItems = shuffleArray(scene.items);
      var foundThisScene = 0;
      var dangersInScene = scene.items.filter(function(it) { return it.danger; }).length;

      shuffledItems.forEach(function(item) {
        var el = document.createElement('div');
        el.className = 'alert-item';
        el.innerHTML = '<span class="alert-item-emoji">' + item.emoji + '</span><span class="alert-item-text">' + item.text + '</span>';
        el.addEventListener('click', function() {
          if (el.classList.contains('danger-found') || el.classList.contains('safe-item')) return;
          if (item.danger) {
            el.classList.add('danger-found');
            foundThisScene++; totalFound++;
            if (explainEl) explainEl.textContent = '⚠️ ' + item.why;
            updateStats();
            if (foundThisScene >= dangersInScene) {
              setTimeout(function() { currentScene++; startScene(); }, 1000);
            }
          } else {
            el.classList.add('safe-item');
            totalErrors++;
            if (explainEl) explainEl.textContent = '✅ Cet objet est sûr !';
            updateStats();
            if (totalErrors >= maxErrors) setTimeout(endGame, 600);
          }
        });
        grid.appendChild(el);
      });
    }

    function endGame() {
      var success = totalFound >= 5 && totalErrors < maxErrors;
      if (!state.quiz) state.quiz = { completed: null, score: 0 };
      state.quiz.completed = success;
      state.quiz.score = totalFound;
      saveGameState(state);
      setTimeout(function() { if (gameArea) gameArea.classList.add('hidden'); showResult(success, totalFound); }, 400);
    }

    updateStats();
    startScene();
  }

  // 5. FONCTION SHOWRESULT HORS DE INITGAME
  function showResult(success, score) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var rb = document.getElementById('result-box'), ri = document.getElementById('result-icon');
    var rt = document.getElementById('result-title'), rx = document.getElementById('result-text');
    var rs = document.getElementById('result-score');
    if (rs) rs.textContent = score + ' / 5 dangers repérés';
    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], disableForReducedMotion: true });
      }
      if (rb) rb.classList.add('success'); if (ri) ri.textContent = '✓';
      if (rt) rt.textContent = 'INSPECTION RÉUSSIE !';
      if (rx) rx.textContent = 'Tu sais protéger les personnes fragiles. Badge débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (rb) { rb.classList.remove('fail-effect'); void rb.offsetWidth; rb.classList.add('fail-effect'); }
      if (rb) rb.classList.add('fail'); if (ri) ri.textContent = '✗';
      if (rt) rt.textContent = 'DANGERS NON DÉTECTÉS';
      // J'ai dû récupérer maxErrors depuis le code, s'il a perdu c'est qu'il a soit trop d'erreurs, soit pas fini
      if (rx) rx.textContent = score < 5 ? 'Il fallait trouver les 5 dangers. Badge verrouillé.' : 'Trop de fausses alertes ! Badge verrouillé.'; 
    }
  }
});