document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var situationEl = document.getElementById('gs-situation');
  var emojiEl = document.getElementById('gs-emoji');
  var contextEl = document.getElementById('gs-context');
  var textEl = document.getElementById('gs-text');
  var counterEl = document.getElementById('gs-counter');
  var reactionsEl = document.getElementById('gs-reactions');
  var explainEl = document.getElementById('gs-explain');
  var roundEl = document.getElementById('gs-round');
  var correctEl = document.getElementById('gs-correct');
  var errorsEl = document.getElementById('gs-errors');

  // 1. BYPASS
  if (!state.quiz || state.quiz.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }
  if (state.enigma && state.enigma.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.enigma.completed, state.enigma.score || 0);
    return;
  }
  if (locked) locked.classList.add('hidden');

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '❤️',
    title: 'LES BONS GESTES',
    subtitle: 'ÉPREUVE 3',
    description: 'Face à une situation du quotidien, choisis la meilleure réaction professionnelle.',
    steps: [
      { icon: '📖', text: 'Lis attentivement le scénario avec le patient ou l\'enfant.' },
      { icon: '🤔', text: 'Évalue les options qui s\'offrent à toi (A, B ou C).' },
      { icon: '🤝', text: 'Choisis la réaction la plus <strong>bienveillante et sécurisante</strong>.' },
      { icon: '🎯', text: 'Fais au moins 2 bons choix sur 3 pour valider.' }
    ],
    warning: 'Une erreur peut avoir des conséquences, choisis prudemment !',
    buttonText: 'C\'EST PARTI !',
    theme: 'pink'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. FONCTION GLOBALE DU JEU
  function initGame() {
    function shuffleArray(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    var situations = [
      {
        emoji: '🍼', context: 'CRÈCHE — REPAS',
        text: 'Un bébé de 10 mois refuse de manger sa purée. Il tourne la tête et repousse la cuillère.',
        correct: 'Respecter son refus, ne pas insister, essayer un autre aliment ou reproposer plus tard',
        wrongs: [
          'Forcer la cuillère dans sa bouche, il doit finir son repas',
          'Appeler les parents pour dire que leur enfant a un problème alimentaire'
        ],
        explain: 'Un enfant a le droit de ne pas avoir faim. Forcer peut créer un rejet durable de la nourriture !'
      },
      {
        emoji: '👵', context: 'DOMICILE — MATIN',
        text: 'Mme Martin, 82 ans, que tu aides à domicile, te confie qu\'elle se sent très seule et n\'a plus goût à rien.',
        correct: 'L\'écouter attentivement, montrer de l\'empathie, et en parler à l\'équipe et au médecin traitant',
        wrongs: [
          'Lui dire "Mais non, tout va bien !" pour la rassurer et changer de sujet',
          'Ne rien faire, ce n\'est pas ton rôle de t\'occuper de ses émotions'
        ],
        explain: 'L\'isolement des personnes âgées est un vrai danger. L\'écoute + le signalement à l\'équipe sont essentiels !'
      },
      {
        emoji: '⚡', context: 'EHPAD — SOIR',
        text: 'Tu trouves une résidente de 91 ans allongée par terre dans sa chambre. Elle est consciente mais a mal à la hanche.',
        correct: 'Ne pas la déplacer, la couvrir, la rassurer et appeler immédiatement l\'infirmier(ère)',
        wrongs: [
          'La relever tout de suite et la remettre dans son lit',
          'Lui donner un médicament contre la douleur en attendant'
        ],
        explain: 'Après une chute, NE JAMAIS déplacer la personne (risque de fracture). On sécurise, on rassure, on appelle.'
      }
    ];

    var shuffled = shuffleArray(situations);
    var currentIndex = 0, correctCount = 0, errorCount = 0;
    var total = shuffled.length;
    var isProcessing = false;

    function updateStats() {
      if (roundEl) roundEl.textContent = '💛 ' + Math.min(currentIndex + 1, total) + ' / ' + total;
      if (correctEl) correctEl.textContent = '✅ ' + correctCount;
      if (errorsEl) errorsEl.textContent = '❌ ' + errorCount;
    }

    function showSituation() {
      if (currentIndex >= total) { endGame(); return; }
      var s = shuffled[currentIndex];
      updateStats();
      isProcessing = false;
      if (emojiEl) emojiEl.textContent = s.emoji;
      if (contextEl) contextEl.textContent = s.context;
      if (textEl) textEl.textContent = s.text;
      if (counterEl) counterEl.textContent = 'Situation ' + (currentIndex + 1) + ' / ' + total;
      if (explainEl) { explainEl.textContent = ''; explainEl.className = 'geste-explain'; }
      if (situationEl) { situationEl.classList.remove('geste-slide'); void situationEl.offsetWidth; situationEl.classList.add('geste-slide'); }

      var letters = ['A', 'B', 'C'];
      var options = shuffleArray(
        [{ text: s.correct, isCorrect: true }].concat(
          s.wrongs.map(function(w) { return { text: w, isCorrect: false }; })
        )
      );

      reactionsEl.innerHTML = '';
      options.forEach(function(opt, i) {
        var el = document.createElement('div');
        el.className = 'geste-reaction';
        el.innerHTML = '<span class="geste-reaction-letter">' + letters[i] + '</span><span>' + opt.text + '</span>';
        el.addEventListener('click', function() { handlePick(el, opt.isCorrect, s); });
        reactionsEl.appendChild(el);
      });
    }

    function handlePick(el, isCorrect, s) {
      if (isProcessing) return;
      isProcessing = true;
      var all = reactionsEl.querySelectorAll('.geste-reaction');
      all.forEach(function(r) { r.classList.add('disabled'); });

      if (isCorrect) {
        el.classList.remove('disabled'); el.classList.add('correct-pick');
        correctCount++;
        if (explainEl) { explainEl.textContent = '💡 ' + s.explain; explainEl.className = 'geste-explain good'; }
      } else {
        el.classList.remove('disabled'); el.classList.add('wrong-pick');
        errorCount++;
        var correctText = s.correct;
        all.forEach(function(r) {
          var span = r.querySelector('span:last-child');
          if (span && span.textContent === correctText) { r.classList.remove('disabled'); r.classList.add('reveal'); }
        });
        if (explainEl) { explainEl.textContent = '💡 ' + s.explain; explainEl.className = 'geste-explain bad'; }
      }
      updateStats();
      currentIndex++;
      setTimeout(showSituation, 2500);
    }

    function endGame() {
      var success = correctCount >= 2;
      if (!state.enigma) state.enigma = { completed: null };
      state.enigma.completed = success;
      state.enigma.score = correctCount; // Sauvegarde du score pour le bypass
      saveGameState(state);
      setTimeout(function() { if (gameArea) gameArea.classList.add('hidden'); showResult(success, correctCount); }, 400);
    }

    updateStats();
    showSituation();
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
    if (rs) rs.textContent = score + ' / 3 bons gestes';
    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], disableForReducedMotion: true });
      }
      if (rb) rb.classList.add('success'); if (ri) ri.textContent = '✓';
      if (rt) rt.textContent = 'CŒUR EN OR !';
      if (rx) rx.textContent = 'Tu as les bons réflexes pour prendre soin des autres. Demande à l\'intervenant ce qui l\'a marqué ! Badge débloqué.';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (rb) { rb.classList.remove('fail-effect'); void rb.offsetWidth; rb.classList.add('fail-effect'); }
      if (rb) rb.classList.add('fail'); if (ri) ri.textContent = '✗';
      if (rt) rt.textContent = 'ENCORE DU TRAVAIL';
      if (rx) rx.textContent = 'Tu as fait trop d\'erreurs. L\'échange avec l\'intervenant t\'aidera ! Badge verrouillé.';
    }
  }
});