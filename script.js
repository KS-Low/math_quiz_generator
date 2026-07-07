(function () {
  "use strict";

  // ---------- DOM refs ----------
  const settingsToggle = document.getElementById("settingsToggle");
  const closeSettings = document.getElementById("closeSettings");
  const settingsPanel = document.getElementById("settingsPanel");
  const overlay = document.getElementById("overlay");

  const rangeSelect = document.getElementById("rangeSelect");
  const rangeCustom = document.getElementById("rangeCustom");

  const opChecks = Array.from(document.querySelectorAll(".op-check"));
  const opWarn = document.getElementById("opWarn");

  const addOptions = document.getElementById("addOptions");
  const subOptions = document.getElementById("subOptions");
  const mulOptions = document.getElementById("mulOptions");
  const divOptions = document.getElementById("divOptions");

  const addCarry = document.getElementById("addCarry");
  const subBorrow = document.getElementById("subBorrow");
  const subNegative = document.getElementById("subNegative");
  const mulDigits1 = document.getElementById("mulDigits1");
  const mulDigits2 = document.getElementById("mulDigits2");
  const mulCarry = document.getElementById("mulCarry");
  const divRemainder = document.getElementById("divRemainder");

  const questionCount = document.getElementById("questionCount");
  const generateBtn = document.getElementById("generateBtn");

  const questionsGrid = document.getElementById("questionsGrid");
  const emptyState = document.getElementById("emptyState");
  const summaryBanner = document.getElementById("summaryBanner");
  const scoreLine = document.getElementById("scoreLine");

  const actionBar = document.getElementById("actionBar");
  const gradeBtn = document.getElementById("gradeBtn");
  const refreshBtn = document.getElementById("refreshBtn");

  let lastSettings = null;
  let currentQuestions = [];

  // ---------- Utility ----------
  function randInt(min, max) {
    if (max < min) max = min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function digitsOf(n) {
    return String(Math.abs(n)).split("").map(Number);
  }

  function hasCarryAdd(a, b) {
    const da = digitsOf(a).reverse();
    const db = digitsOf(b).reverse();
    const len = Math.max(da.length, db.length);
    while (da.length < len) da.push(0);
    while (db.length < len) db.push(0);
    let carry = 0, flagged = false;
    for (let i = 0; i < len; i++) {
      const sum = da[i] + db[i] + carry;
      if (sum >= 10) { carry = 1; flagged = true; } else { carry = 0; }
    }
    return flagged;
  }

  function hasBorrow(a, b) {
    const da = digitsOf(a).reverse();
    const db = digitsOf(b).reverse();
    const len = Math.max(da.length, db.length);
    while (da.length < len) da.push(0);
    while (db.length < len) db.push(0);
    let borrow = 0, flagged = false;
    for (let i = 0; i < len; i++) {
      const top = da[i] - borrow;
      if (top < db[i]) { borrow = 1; flagged = true; } else { borrow = 0; }
    }
    return flagged;
  }

  function hasCarryMul(a, b) {
    const da = digitsOf(a).reverse();
    const db = digitsOf(b).reverse();
    const resLen = da.length + db.length;
    const result = new Array(resLen).fill(0);
    for (let i = 0; i < da.length; i++) {
      for (let j = 0; j < db.length; j++) {
        result[i + j] += da[i] * db[j];
      }
    }
    let carry = 0, flagged = false;
    for (let k = 0; k < resLen; k++) {
      const total = result[k] + carry;
      if (total >= 10) flagged = true;
      carry = Math.floor(total / 10);
    }
    return flagged;
  }

  function digitRangeFor(d) {
    if (d === 1) return [1, 9];
    if (d === 2) return [10, 99];
    return [100, 999];
  }

  function getRangeLimit() {
    let v;
    if (rangeSelect.value === "custom") {
      v = parseInt(rangeCustom.value, 10);
      if (!v || v < 2) v = 100;
    } else {
      v = parseInt(rangeSelect.value, 10);
    }
    return v;
  }

  // ---------- Question generators ----------
  function generateAddition(rangeLimit, carryMode) {
    const maxVal = Math.max(1, rangeLimit - 1);
    for (let attempt = 0; attempt < 500; attempt++) {
      const a = randInt(1, Math.max(1, maxVal - 1));
      const remMax = maxVal - a;
      if (remMax < 1) continue;
      const b = randInt(1, remMax);
      const carry = hasCarryAdd(a, b);
      if (carryMode === "yes" && !carry) continue;
      if (carryMode === "no" && carry) continue;
      return { a, b, answer: a + b };
    }
    const a = randInt(1, Math.max(1, maxVal - 1));
    const b = randInt(1, Math.max(1, maxVal - a));
    return { a, b, answer: a + b };
  }

  function generateSubtraction(rangeLimit, borrowMode, allowNegative) {
    const maxVal = Math.max(1, rangeLimit - 1);
    for (let attempt = 0; attempt < 500; attempt++) {
      const a = randInt(1, maxVal);
      const b = randInt(1, maxVal);
      if (!allowNegative && b > a) continue;
      const borrow = hasBorrow(a, b);
      if (borrowMode === "yes" && !borrow) continue;
      if (borrowMode === "no" && borrow) continue;
      return { a, b, answer: a - b };
    }
    let a = randInt(1, maxVal), b = randInt(1, maxVal);
    if (!allowNegative && b > a) { const t = a; a = b; b = t; }
    return { a, b, answer: a - b };
  }

  function generateMultiplication(rangeLimit, digits1, digits2, carryMode) {
    const maxVal = Math.max(1, rangeLimit - 1);
    let [min1, max1] = digitRangeFor(digits1);
    let [min2, max2] = digitRangeFor(digits2);
    const cappedMax1 = Math.min(max1, maxVal);
    const cappedMax2 = Math.min(max2, maxVal);
    if (cappedMax1 >= min1) max1 = cappedMax1;
    if (cappedMax2 >= min2) max2 = cappedMax2;

    for (let attempt = 0; attempt < 500; attempt++) {
      const a = randInt(min1, max1);
      const b = randInt(min2, max2);
      const carry = hasCarryMul(a, b);
      if (carryMode === "yes" && !carry) continue;
      if (carryMode === "no" && carry) continue;
      return { a, b, answer: a * b };
    }
    const a = randInt(min1, max1);
    const b = randInt(min2, max2);
    return { a, b, answer: a * b };
  }

  function generateDivision(rangeLimit, remainderMode) {
    const maxVal = Math.max(2, rangeLimit - 1);
    const divisorCap = Math.max(2, Math.min(maxVal, 9));

    for (let attempt = 0; attempt < 500; attempt++) {
      const divisor = randInt(2, divisorCap);
      let remainder;
      if (remainderMode === "none") remainder = 0;
      else if (remainderMode === "yes") remainder = randInt(1, divisor - 1);
      else remainder = randInt(0, divisor - 1);

      const maxQuotient = Math.floor((maxVal - remainder) / divisor);
      if (maxQuotient < 1) continue;
      const quotient = randInt(1, maxQuotient);
      const dividend = divisor * quotient + remainder;
      return { divisor, quotient, remainder, dividend };
    }
    return { divisor: 2, quotient: 1, remainder: 0, dividend: 2 };
  }

  // ---------- Settings collection ----------
  function collectSettings() {
    const ops = opChecks.filter(c => c.checked).map(c => c.value);
    return {
      rangeLimit: getRangeLimit(),
      ops,
      add: { carry: addCarry.value },
      sub: { borrow: subBorrow.value, allowNegative: subNegative.checked },
      mul: { d1: parseInt(mulDigits1.value, 10), d2: parseInt(mulDigits2.value, 10), carry: mulCarry.value },
      div: { remainder: divRemainder.value },
      count: Math.min(100, Math.max(1, parseInt(questionCount.value, 10) || 10))
    };
  }

  function buildQuestions(settings) {
    const list = [];
    for (let i = 0; i < settings.count; i++) {
      const type = settings.ops[randInt(0, settings.ops.length - 1)];
      let q = { id: "q" + i + "_" + Math.random().toString(36).slice(2, 7), type };

      if (type === "add") {
        const r = generateAddition(settings.rangeLimit, settings.add.carry);
        q.a = r.a; q.b = r.b; q.correctAnswer = r.answer; q.opSymbol = "＋";
      } else if (type === "sub") {
        const r = generateSubtraction(settings.rangeLimit, settings.sub.borrow, settings.sub.allowNegative);
        q.a = r.a; q.b = r.b; q.correctAnswer = r.answer; q.opSymbol = "－";
      } else if (type === "mul") {
        const r = generateMultiplication(settings.rangeLimit, settings.mul.d1, settings.mul.d2, settings.mul.carry);
        q.a = r.a; q.b = r.b; q.correctAnswer = r.answer; q.opSymbol = "×";
      } else if (type === "div") {
        const r = generateDivision(settings.rangeLimit, settings.div.remainder);
        q.a = r.dividend; q.b = r.divisor;
        q.opSymbol = "÷";
        q.singleMode = settings.div.remainder === "none";
        q.correctAnswer = { quotient: r.quotient, remainder: r.remainder };
      }
      list.push(q);
    }
    return list;
  }

  // ---------- Rendering ----------
  function renderQuestions(list) {
    questionsGrid.innerHTML = "";
    summaryBanner.hidden = true;
    scoreLine.textContent = "――";
    scoreLine.classList.remove("done");

    list.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.dataset.id = q.id;

      const indexEl = document.createElement("span");
      indexEl.className = "q-index";
      indexEl.textContent = (idx + 1) + ".";
      card.appendChild(indexEl);

      const eq = document.createElement("span");
      eq.className = "q-equation";
      eq.textContent = `${q.a} ${q.opSymbol} ${q.b} =`;
      card.appendChild(eq);

      if (q.type === "div" && !q.singleMode) {
        const qInput = document.createElement("input");
        qInput.type = "number"; qInput.inputMode = "numeric";
        qInput.className = "answer-input"; qInput.dataset.role = "quotient";
        card.appendChild(qInput);

        const rLabel = document.createElement("span");
        rLabel.className = "remainder-label"; rLabel.textContent = "余";
        card.appendChild(rLabel);

        const rInput = document.createElement("input");
        rInput.type = "number"; rInput.inputMode = "numeric";
        rInput.className = "answer-input remainder-input"; rInput.dataset.role = "remainder";
        card.appendChild(rInput);
      } else if (q.type === "div") {
        const qInput = document.createElement("input");
        qInput.type = "number"; qInput.inputMode = "numeric";
        qInput.className = "answer-input"; qInput.dataset.role = "quotient";
        card.appendChild(qInput);
      } else {
        const input = document.createElement("input");
        input.type = "number"; input.inputMode = "numeric";
        input.className = "answer-input"; input.dataset.role = "answer";
        card.appendChild(input);
      }

      const mark = document.createElement("span");
      mark.className = "grade-mark";
      card.appendChild(mark);

      questionsGrid.appendChild(card);
    });
  }

  // ---------- Grading ----------
  function gradeAll() {
    let correctCount = 0;
    const total = currentQuestions.length;

    currentQuestions.forEach(q => {
      const card = questionsGrid.querySelector(`[data-id="${q.id}"]`);
      if (!card) return;
      let isCorrect = false;

      if (q.type === "div" && !q.singleMode) {
        const qVal = card.querySelector('[data-role="quotient"]').value;
        const rVal = card.querySelector('[data-role="remainder"]').value;
        isCorrect = qVal !== "" && rVal !== "" &&
          Number(qVal) === q.correctAnswer.quotient &&
          Number(rVal) === q.correctAnswer.remainder;
      } else if (q.type === "div") {
        const qVal = card.querySelector('[data-role="quotient"]').value;
        isCorrect = qVal !== "" && Number(qVal) === q.correctAnswer.quotient;
      } else {
        const val = card.querySelector('[data-role="answer"]').value;
        isCorrect = val !== "" && Number(val) === q.correctAnswer;
      }

      card.classList.add(isCorrect ? "correct" : "incorrect");
      card.querySelectorAll("input").forEach(inp => inp.disabled = true);

      const mark = card.querySelector(".grade-mark");
      if (isCorrect) {
        correctCount++;
        mark.textContent = "✓";
      } else {
        mark.textContent = "✗";
        const reveal = document.createElement("span");
        reveal.className = "correct-answer-reveal";
        if (q.type === "div") {
          reveal.textContent = q.singleMode
            ? `（正确答案：${q.correctAnswer.quotient}）`
            : `（正确答案：${q.correctAnswer.quotient} 余 ${q.correctAnswer.remainder}）`;
        } else {
          reveal.textContent = `（正确答案：${q.correctAnswer}）`;
        }
        card.appendChild(reveal);
      }
    });

    scoreLine.textContent = `${correctCount} / ${total}`;
    scoreLine.classList.add("done");

    const pct = total > 0 ? correctCount / total : 0;
    summaryBanner.hidden = false;
    summaryBanner.classList.toggle("low", pct < 0.6);
    let msg = `本次得分：${correctCount} / ${total}`;
    if (pct >= 0.9) msg += " · 太棒了，继续保持！";
    else if (pct >= 0.6) msg += " · 不错，再接再厉！";
    else msg += " · 多练习一下，会更好～";
    summaryBanner.textContent = msg;
  }

  // ---------- Panel open/close ----------
  function openPanel() {
    settingsPanel.classList.add("open");
    settingsPanel.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
  }
  function closePanel() {
    settingsPanel.classList.remove("open");
    settingsPanel.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
  }

  settingsToggle.addEventListener("click", openPanel);
  closeSettings.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);

  rangeSelect.addEventListener("change", () => {
    rangeCustom.hidden = rangeSelect.value !== "custom";
  });

  function refreshOpVisibility() {
    const checked = new Set(opChecks.filter(c => c.checked).map(c => c.value));
    addOptions.hidden = !checked.has("add");
    subOptions.hidden = !checked.has("sub");
    mulOptions.hidden = !checked.has("mul");
    divOptions.hidden = !checked.has("div");
    opWarn.hidden = checked.size > 0;
  }
  opChecks.forEach(c => c.addEventListener("change", refreshOpVisibility));
  refreshOpVisibility();

  // ---------- Generate / Grade / Refresh ----------
  function doGenerate() {
    const settings = collectSettings();
    if (settings.ops.length === 0) {
      opWarn.hidden = false;
      return;
    }
    lastSettings = settings;
    currentQuestions = buildQuestions(settings);
    emptyState.hidden = true;
    renderQuestions(currentQuestions);
    actionBar.hidden = false;
    closePanel();
  }

  generateBtn.addEventListener("click", doGenerate);

  gradeBtn.addEventListener("click", () => {
    if (currentQuestions.length === 0) return;
    gradeAll();
  });

  refreshBtn.addEventListener("click", () => {
    if (!lastSettings) return;
    currentQuestions = buildQuestions(lastSettings);
    renderQuestions(currentQuestions);
  });

})();
