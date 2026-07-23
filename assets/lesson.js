(function () {
  "use strict";

  var lessonId = document.body.getAttribute("data-lesson");
  if (!lessonId) return;

  var checks = Array.prototype.slice.call(
    document.querySelectorAll("input[type='checkbox'][data-progress]")
  );
  var progressLabel = document.querySelector("[data-progress-label]");
  var progressFill = document.querySelector("[data-progress-fill]");
  var storageKey = "build-x-lesson-progress:" + lessonId;
  var saved = {};

  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch (error) {
    saved = {};
  }

  function update() {
    var done = checks.filter(function (item) { return item.checked; }).length;
    if (progressLabel) progressLabel.textContent = done + " / " + checks.length;
    if (progressFill) {
      progressFill.style.width = (checks.length ? done / checks.length * 100 : 0) + "%";
    }
  }

  checks.forEach(function (item) {
    var key = item.getAttribute("data-progress");
    item.checked = Boolean(saved[key]);
    item.addEventListener("change", function () {
      saved[key] = item.checked;
      try {
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch (error) {
        // Local files may disable storage; the checklist still works for this session.
      }
      update();
    });
  });

  update();
}());
