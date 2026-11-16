(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};
  const API_URL = cfg.API_URL || "/api/chat";
  const TIMEOUT_MS = cfg.TIMEOUT_MS || 60000;

  const WELCOME =
    "Hi, I'm Aaryan's resume assistant. Ask me about his skills, projects, education or internship. I only answer from his resume.";

  const SUGGESTIONS = [
    "What did Aaryan do at IBM?",
    "What are his main skills?",
    "Tell me about his projects",
    "Where did he study?",
    "How accurate was his car price model?"
  ];

  const log = document.getElementById("log");
  const form = document.getElementById("form");
  const input = document.getElementById("question");
  const sendBtn = document.getElementById("send");
  const clearBtn = document.getElementById("clear");
  const chips = document.getElementById("chips");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let busy = false;
  let lastQuestion = "";

  function scrollDown() {
    log.scrollTo({ top: log.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function addMessage(role, content, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "msg msg--" + role + (opts.error ? " msg--error" : "");

    const who = document.createElement("span");
    who.className = "msg__who";
    who.textContent = role === "user" ? "You" : "Resume assistant";

    const body = document.createElement("div");
    body.className = "msg__body";

    if (role === "bot" && !opts.plain) {
      body.classList.add("prose");
      body.innerHTML = window.renderMarkdown(content);
    } else {
      const t = document.createElement("span");
      t.className = "msg__text";
      t.textContent = content;
      body.appendChild(t);
    }

    wrap.append(who, body);
    log.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement("div");
    wrap.className = "msg msg--bot";
    wrap.innerHTML =
      '<span class="msg__who">Resume assistant</span>' +
      '<div class="msg__body"><span class="typing">' +
      '<span class="typing__dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="typing__text">Reading the resume</span></span></div>';
    log.appendChild(wrap);
    scrollDown();
    return wrap;
  }

  function setBusy(value) {
    busy = value;
    input.disabled = value;
    syncSend();
  }

  function syncSend() {
    sendBtn.disabled = busy || !input.value.trim();
  }

  function autosize() {
    input.style.height = "auto";
    const h = Math.max(48, Math.min(input.scrollHeight, 148));
    input.style.height = h + "px";
    input.style.overflowY = input.scrollHeight > 148 ? "auto" : "hidden";
  }

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;

    lastQuestion = q;
    chips.hidden = true;
    addMessage("user", q);
    input.value = "";
    autosize();
    setBusy(true);

    const typing = addTyping();
    const typingText = typing.querySelector(".typing__text");
    const slowTimer = setTimeout(() => {
      typingText.textContent = "Still working. The first reply can take a few seconds";
    }, 8000);

    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error("http-" + res.status);

      const data = await res.json();
      const answer = typeof data.answer === "string" ? data.answer.trim() : "";
      if (!answer) throw new Error("empty");

      typing.remove();
      addMessage("bot", answer);
    } catch (err) {
      typing.remove();
      const timedOut = err && err.name === "AbortError";
      const text = timedOut
        ? "That took too long. The server may be waking up. Try again in a moment."
        : "I couldn't get an answer. Check your connection and try again.";
      const el = addMessage("bot", text, { error: true, plain: true });
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "btn btn--small msg__retry";
      retry.textContent = "Try again";
      retry.addEventListener("click", () => {
        el.remove();
        ask(lastQuestion);
      });
      el.querySelector(".msg__body").appendChild(retry);
      scrollDown();
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(abortTimer);
      setBusy(false);
      input.focus({ preventScroll: true });
    }
  }

  function reset() {
    if (busy) return;
    log.innerHTML = "";
    addMessage("bot", WELCOME, { plain: true });
    chips.hidden = false;
    input.value = "";
    autosize();
    syncSend();
  }

  function buildChips() {
    SUGGESTIONS.forEach((text) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = text;
      b.addEventListener("click", () => ask(text));
      chips.appendChild(b);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
  });

  input.addEventListener("input", () => {
    autosize();
    syncSend();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (!sendBtn.disabled) form.requestSubmit();
    }
  });

  clearBtn.addEventListener("click", reset);

  buildChips();
  addMessage("bot", WELCOME, { plain: true });
  syncSend();
})();
