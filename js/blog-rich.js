// blog-rich.js — Logique des composants enrichis (quiz symptômes)
// À charger en defer après le DOM.

(function () {
  'use strict';

  function initSymptomQuiz(quiz) {
    var options = quiz.querySelectorAll('.symptom-quiz__options input[type="checkbox"]');
    var results = {
      low: quiz.querySelector('.symptom-quiz__result[data-level="low"]'),
      medium: quiz.querySelector('.symptom-quiz__result[data-level="medium"]'),
      high: quiz.querySelector('.symptom-quiz__result[data-level="high"]'),
    };
    var thresholds = {
      // par défaut : >=3 = high, >=1 = medium, sinon low
      high: parseInt(quiz.getAttribute('data-threshold-high'), 10) || 3,
      medium: parseInt(quiz.getAttribute('data-threshold-medium'), 10) || 1,
    };

    function hideAll() {
      ['low', 'medium', 'high'].forEach(function (k) {
        if (results[k]) results[k].classList.remove('is-active');
      });
    }

    function show(level) {
      hideAll();
      if (results[level]) results[level].classList.add('is-active');
    }

    function recompute() {
      var score = 0;
      var anyChecked = false;
      options.forEach(function (cb) {
        if (cb.checked) {
          anyChecked = true;
          var sev = parseInt(cb.getAttribute('data-severity'), 10);
          if (!isNaN(sev)) score += sev;
        }
      });

      if (!anyChecked) {
        hideAll();
        return;
      }

      if (score >= thresholds.high) show('high');
      else if (score >= thresholds.medium) show('medium');
      else show('low');

      // dataLayer event (cf. CLAUDE.md tracking)
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'blog_symptom_quiz_change',
          quiz_id: quiz.getAttribute('data-quiz-id') || 'symptom-quiz',
          score: score,
          checked_count: Array.from(options).filter(function (cb) { return cb.checked; }).length,
        });
      }
    }

    options.forEach(function (cb) {
      cb.addEventListener('change', recompute);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var quizzes = document.querySelectorAll('.symptom-quiz');
    quizzes.forEach(initSymptomQuiz);
  });
})();
