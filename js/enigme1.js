document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var cluesEl = document.getElementById('qsj-clues');
  var answersEl = document.getElementById('qsj-answers');
  var explainEl = document.getElementById('qsj-explain');
  var waitingEl = document.getElementById('qsj-waiting');
  var roundEl = document.getElementById('qsj-round');
  var correctEl = document.getElementById('qsj-correct');
  var errorsEl = document.getElementById('qsj-errors');

  // 1. BYPASS : Si déjà terminé
  if (state.enigme1 && state.enigme1.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    showResult(state.enigme1.completed, state.enigme1.score || 0);
    return;
  }

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '🧑‍⚕️',
    title: 'QUI SUIS-JE ?',
    subtitle: 'ÉPREUVE 1',
    description: 'Devine les métiers de la santé et du social qui se cachent derrière les indices.',
    steps: [
      { icon: '🔎', text: 'Lis les indices qui s\'affichent à l\'écran un par un.' },
      { icon: '🤔', text: 'Réfléchis au <strong>métier</strong> décrit.' },
      { icon: '👆', text: 'Clique sur la bonne réponse parmi les choix proposés.' },
      { icon: '🎯', text: 'Obtiens au moins 2 bonnes réponses sur 3 !' }
    ],
    warning: 'Concentre-toi, le temps tourne !',
    buttonText: 'C\'EST PARTI !',
    theme: 'purple'
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

    var mysteries = [
      {
        clues: [
          "Je travaille auprès de bébés et de très jeunes enfants",
          "Je donne les biberons, change les couches et organise des activités d'éveil",
          "Je travaille en crèche, en maternité ou en PMI"
        ],
        correct: "Auxiliaire de puériculture",
        wrongs: ["Sage-femme", "Pédiatre", "Professeur des écoles"],
        explain: "L'auxiliaire de puériculture s'occupe du quotidien des tout-petits : soins, repas, jeux et câlins !"
      },
      {
        clues: [
          "Je me rends chez des personnes qui ne peuvent plus tout faire seules",
          "Je les aide à se lever, à faire leur toilette, leurs courses et le ménage",
          "Grâce à moi, les personnes âgées peuvent rester chez elles"
        ],
        correct: "Aide à domicile",
        wrongs: ["Infirmier(ère)", "Kinésithérapeute", "Auxiliaire de puériculture"],
        explain: "L'aide à domicile permet le maintien à domicile — un métier de lien social essentiel !"
      },
      {
        clues: [
          "Je travaille à l'hôpital ou en maison de retraite (EHPAD)",
          "J'aide les patients à se laver, à manger et à se déplacer",
          "Je suis aux côtés de l'infirmier(ère) mais je ne fais pas de piqûres"
        ],
        correct: "Aide-soignant(e)",
        wrongs: ["Médecin", "Aide à domicile", "Brancardier"],
        explain: "L'aide-soignant(e) est au plus près du patient — toilette, confort, écoute et surveillance !"
      }
    ];

    var shuffled = shuffleArray(mysteries);
    var currentIndex = 0, correctCount = 0, errorCount = 0;
    var total = shuffled.length;
    var clueTimers = [];
    var isProcessing = false;

    function updateStats() {
      if (roundEl) roundEl.textContent = '❓ Métier ' + Math.min(currentIndex + 1, total) + ' / ' + total;
      if (correctEl) correctEl.textContent = '✅ ' + correctCount;
      if (errorsEl) errorsEl.textContent = '❌ ' + errorCount;
    }

    function clearClueTimers() {
      clueTimers.forEach(function(t) { clearTimeout(t); });
      clueTimers = [];
    }

    function startMystery() {
      if (currentIndex >= total) { endGame(); return; }
      updateStats();
      isProcessing = false;
      var m = shuffled[currentIndex];
      cluesEl.innerHTML = '';
      answersEl.innerHTML = '';
      if (explainEl) { explainEl.textContent = ''; explainEl.className = 'qsj-explain'; }
      if (waitingEl) waitingEl.style.display = '';

      m.clues.forEach(function(clue, i) {
        var el = document.createElement('div');
        el.className = 'qsj-clue';
        el.innerHTML = '<span class="qsj-clue-num">INDICE ' + (i + 1) + ' :</span> ' + clue;
        cluesEl.appendChild(el);
      });

      var clueEls = cluesEl.querySelectorAll('.qsj-clue');
      clueEls.forEach(function(el, i) {
        var t = setTimeout(function() {
          el.classList.add('visible');
          if (i === 0 && waitingEl) waitingEl.style.display = 'none';
          if (i === clueEls.length - 1) {
            var t2 = setTimeout(function() { showAnswers(m); }, 800);
            clueTimers.push(t2);
          }
        }, (i + 1) * 1500);
        clueTimers.push(t);
      });
    }

    function showAnswers(m) {
      var options = shuffleArray(
        [{ text: m.correct, isCorrect: true }].concat(
          m.wrongs.map(function(w) { return { text: w, isCorrect: false }; })
        )
      );
      answersEl.innerHTML = '';
      options.forEach(function(opt) {
        var el = document.createElement('div');
        el.className = 'qsj-answer';
        el.textContent = opt.text;
        el.addEventListener('click', function() { handlePick(el, opt.isCorrect, m); });
        answersEl.appendChild(el);
      });
    }

    function handlePick(el, isCorrect, m) {
      if (isProcessing) return;
      isProcessing = true;
      clearClueTimers();
      var allAnswers = answersEl.querySelectorAll('.qsj-answer');
      allAnswers.forEach(function(a) { a.classList.add('disabled'); });

      if (isCorrect) {
        el.classList.remove('disabled'); el.classList.add('correct-pick');
        correctCount++;
        if (explainEl) { explainEl.textContent = '💡 ' + m.explain; explainEl.className = 'qsj-explain good'; }
      } else {
        el.classList.remove('disabled'); el.classList.add('wrong-pick');
        errorCount++;
        allAnswers.forEach(function(a) {
          if (a.textContent === m.correct) { a.classList.remove('disabled'); a.classList.add('reveal'); }
        });
        if (explainEl) { explainEl.textContent = '💡 ' + m.explain; explainEl.className = 'qsj-explain bad'; }
      }
      updateStats();
      currentIndex++;
      setTimeout(startMystery, 2500);
    }

    function endGame() {
      var success = correctCount >= 2;
      if (!state.enigme1) state.enigme1 = { completed: null };
      state.enigme1.completed = success;
      state.enigme1.score = correctCount; // Sauvegarde du score pour le bypass
      saveGameState(state);
      setTimeout(function() { if (gameArea) gameArea.classList.add('hidden'); showResult(success, correctCount); }, 400);
    }

    updateStats();
    setTimeout(startMystery, 500);
  }

  // 5. FONCTION SHOWRESULT HORS DE INITGAME
  function showResult(success, score) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var rb = document.getElementById('result-box'), ri = document.getElementById('result-icon');
    var rt = document.getElementById('result-title'), rx = document.getElementById('result-text');
    var rs = document.getElementById('result-score');
    if (rs) rs.textContent = score + ' / 3 métiers trouvés';
    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], disableForReducedMotion: true });
      }
      if (rb) rb.classList.add('success'); if (ri) ri.textContent = '✓';
      if (rt) rt.textContent = 'SUPER DEVIN !';
      if (rx) rx.textContent = 'Tu reconnais les métiers de l\'aide à la personne ! Demande à l\'intervenant lequel l\'intéresse. Badge débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (rb) { rb.classList.remove('fail-effect'); void rb.offsetWidth; rb.classList.add('fail-effect'); }
      if (rb) rb.classList.add('fail'); if (ri) ri.textContent = '✗';
      if (rt) rt.textContent = 'PAS ASSEZ RAPIDE';
      if (rx) rx.textContent = 'Tu as fait trop d\'erreurs. Profite de l\'échange pour découvrir ces métiers ! Badge verrouillé.';
    }
  }
});