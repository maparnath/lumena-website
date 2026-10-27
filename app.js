(function () {
  "use strict";

  // ---- Theme toggle (in-memory only — no storage per sandbox rules) ----
  var root = document.documentElement;
  var toggles = document.querySelectorAll(".theme-toggle");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) root.setAttribute("data-theme", "dark");

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var isDark = root.getAttribute("data-theme") === "dark";
      root.setAttribute("data-theme", isDark ? "light" : "dark");
    });
  });

  // ---- Mobile nav toggle ----
  var navToggle = document.querySelector(".nav-toggle");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      document.body.classList.toggle("menu-open");
    });
    document.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
      });
    });
  }

  // ---- Scroll reveal ----
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---- Footer year ----
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---- FAQ Assistant: fixed Q&A only, zero generative AI, zero hallucination ----
  var FAQ = [
    {
      q: "Do you accept insurance?",
      a: "No \u2014 LUMENA is cash and credit only. We don't bill insurance, which means no networks, no denials, and no care decisions made by anyone other than your physician.",
      k: ["insurance", "bill", "billing", "copay", "coverage", "network"]
    },
    {
      q: "What is the Actionable / Trackable / Exploratory framework?",
      a: "It's how we label every test before you pay for it. Actionable means it changes what we do today. Trackable means it's worth monitoring over time. Exploratory means the science is promising but not yet settled. We'll always tell you which one applies \u2014 see Our Approach for the full explanation.",
      k: ["actionable", "trackable", "exploratory", "evidence", "tier", "framework", "approach"]
    },
    {
      q: "What services does LUMENA offer?",
      a: "Ongoing pulmonary care and second opinions (breathlessness, chronic cough, sleep apnea, COPD and more), metabolic health and weight management (including a physician-supervised GLP-1/GIP program), and functional assessment testing like VO2 max and body composition. See the What We Treat page for details.",
      k: ["services", "offer", "treat", "programs", "what do you do", "pulmonary", "weight", "metabolic", "functional"]
    },
    {
      q: "How much does it cost?",
      a: "Pricing is transparent. Every visit and test is explained and priced before you agree to it \u2014 no surprises and no hidden fees. Contact us and we'll walk you through what applies to you.",
      k: ["cost", "price", "pricing", "how much", "fee", "expensive"]
    },
    {
      q: "Can I get a second opinion if I already have a pulmonary doctor?",
      a: "Yes. LUMENA offers both pulmonary second opinions and ongoing pulmonary care. Reviews are independent of any insurance-based practice.",
      k: ["second opinion", "pulmonary", "copd", "sleep apnea", "osa", "lung"]
    },
    {
      q: "Is LUMENA the same as an insurance-based pulmonary practice?",
      a: "No. LUMENA is a separate, independent cash-pay practice. It does not bill insurance and operates apart from any insurance-based practice.",
      k: ["same as", "insurance-based", "separate", "different practice", "asclepius"]
    },
    {
      q: "How do I book an appointment?",
      a: "Reach out through our Contact page and we'll follow up directly to get you scheduled.",
      k: ["book", "appointment", "schedule", "contact", "call", "email"]
    },
    {
      q: "Do you offer GLP-1 or weight-loss medication?",
      a: "When it is medically appropriate, yes \u2014 FDA-approved medication as part of a physician-supervised metabolic program, decided after an evaluation. See the What We Treat page for details.",
      k: ["glp-1", "glp1", "gip", "tirzepatide", "semaglutide", "weight loss medication", "zepbound", "mounjaro", "sample", "samples"]
    }
  ];

  function faqAnswerFor(text) {
    var words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    var best = null, bestScore = 0;
    FAQ.forEach(function (item) {
      var score = 0;
      item.k.forEach(function (kw) {
        if (text.toLowerCase().indexOf(kw) !== -1) score += kw.split(" ").length;
      });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    return bestScore > 0 ? best : null;
  }

  function buildChatWidget() {
    var launcher = document.createElement("button");
    launcher.className = "chat-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open common questions");
    launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span>Common Questions</span>';

    var panel = document.createElement("div");
    panel.className = "chat-panel";
    panel.innerHTML =
      '<div class="chat-panel-header" style="position:relative;">' +
        '<strong>LUMENA Assistant</strong>' +
        '<p>Answers common questions from a fixed list \u2014 no AI guessing. For anything else, use Contact.</p>' +
        '<button class="chat-panel-close" type="button" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="chat-body"></div>' +
      '<div class="chat-suggestions"></div>' +
      '<div class="chat-input-row">' +
        '<input type="text" class="chat-input" placeholder="Type a question\u2026" aria-label="Ask a question">' +
        '<button type="button" class="chat-send">Ask</button>' +
      '</div>' +
      '<div class="chat-disclaimer">General information only, not individualized medical advice. No physician-patient relationship is formed through this chat.</div>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    var body = panel.querySelector(".chat-body");
    var suggestions = panel.querySelector(".chat-suggestions");
    var input = panel.querySelector(".chat-input");
    var sendBtn = panel.querySelector(".chat-send");
    var closeBtn = panel.querySelector(".chat-panel-close");
    suggestions.remove();

    var intro = document.createElement("p");
    intro.className = "chat-intro";
    intro.textContent = "Tap a question to see the answer, or type your own below.";
    body.appendChild(intro);

    var items = [];
    FAQ.forEach(function (item, i) {
      var wrap = document.createElement("div");
      wrap.className = "chat-qa";
      var q = document.createElement("button");
      q.type = "button"; q.className = "chat-q";
      q.setAttribute("aria-expanded", "false");
      q.id = "chatq" + i; q.setAttribute("aria-controls", "chata" + i);
      q.innerHTML = '<span></span><i aria-hidden="true">+</i>';
      q.querySelector("span").textContent = item.q;
      var a = document.createElement("div");
      a.className = "chat-a"; a.id = "chata" + i; a.hidden = true;
      a.setAttribute("role", "region"); a.setAttribute("aria-labelledby", q.id);
      a.textContent = item.a;
      q.addEventListener("click", function () { toggle(i); });
      wrap.appendChild(q); wrap.appendChild(a); body.appendChild(wrap);
      items.push({ q: q, a: a });
    });

    var none = document.createElement("div");
    none.className = "chat-none"; none.hidden = true;
    none.innerHTML = 'We don\u2019t have a written answer for that yet. <button type="button" class="chat-contact">Contact us</button> and a person will reply.';
    none.querySelector(".chat-contact").addEventListener("click", function () { closePanel(); if (window.lumenaContact) window.lumenaContact(); });
    body.appendChild(none);

    function toggle(i, forceOpen) {
      var it = items[i], open = forceOpen || it.a.hidden;
      items.forEach(function (o) { o.a.hidden = true; o.q.setAttribute("aria-expanded", "false"); o.q.parentNode.classList.remove("is-open"); });
      if (open) {
        it.a.hidden = false; it.q.setAttribute("aria-expanded", "true"); it.q.parentNode.classList.add("is-open");
        none.hidden = true;
        it.q.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    function ask(text) {
      if (!text.trim()) return;
      var match = faqAnswerFor(text);
      if (match) { toggle(FAQ.indexOf(match), true); }
      else {
        items.forEach(function (o) { o.a.hidden = true; o.q.setAttribute("aria-expanded", "false"); o.q.parentNode.classList.remove("is-open"); });
        none.hidden = false; none.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      input.value = "";
    }

    function openPanel() { panel.classList.add("is-open"); }
    function closePanel() { panel.classList.remove("is-open"); }

    launcher.addEventListener("click", function () {
      panel.classList.contains("is-open") ? closePanel() : openPanel();
    });
    closeBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
    sendBtn.addEventListener("click", function () { ask(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") ask(input.value);
    });
  }

  /* floating FAQ widget retired 2026-10-26: answers now shown directly on the page */
})();

/* ---- Contact chooser: works even when no email app is set up ---- */
(function(){
  var TO = 'contact@lumenahealthclinic.com';
  var SUBJECT = '[LUMENA NEW INQUIRY] Request to connect';
  var DEFAULT_BODY = "Hello LUMENA,\nI'm interested in learning more or scheduling a visit.\nPreferred name:\nBest callback number (optional):\nBest time to reach me:\n\nPlease do not include medical records or detailed health information in this email.";

  var modal = document.createElement('div');
  modal.className = 'cc-overlay';
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-labelledby','ccTitle');
  modal.innerHTML =
    '<div class="cc-box">' +
      '<button type="button" class="cc-close" aria-label="Close">&times;</button>' +
      '<h3 id="ccTitle">Contact LUMENA</h3>' +
      '<p class="cc-sub">Choose how you would like to send your message. Your message is already written for you.</p>' +
      '<div class="cc-actions">' +
        '<a class="btn btn-primary btn-block" data-cc="gmail" target="_blank" rel="noopener">Send with Gmail</a>' +
        '<a class="btn btn-secondary btn-block cc-btn" data-cc="outlook" target="_blank" rel="noopener">Send with Outlook / Hotmail</a>' +
        '<a class="btn btn-secondary btn-block cc-btn" data-cc="yahoo" target="_blank" rel="noopener">Send with Yahoo Mail</a>' +
        '<a class="btn btn-secondary btn-block cc-btn" data-cc="app">Use my computer\u2019s email app</a>' +
      '</div>' +
      '<div class="cc-copy"><span>Or email us directly:</span><strong>' + TO + '</strong>' +
        '<button type="button" class="cc-copybtn">Copy address</button></div>' +
      '<p class="cc-note">Please do not include medical details. A member of our team will reply personally.</p>' +
    '</div>';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(modal); });
  if (document.readyState !== 'loading') document.body.appendChild(modal);

  function open(body){
    var s = encodeURIComponent(SUBJECT), b = encodeURIComponent(body || DEFAULT_BODY), t = encodeURIComponent(TO);
    modal.querySelector('[data-cc="gmail"]').href   = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + t + '&su=' + s + '&body=' + b;
    modal.querySelector('[data-cc="outlook"]').href = 'https://outlook.live.com/mail/0/deeplink/compose?to=' + t + '&subject=' + s + '&body=' + b;
    modal.querySelector('[data-cc="yahoo"]').href   = 'https://compose.mail.yahoo.com/?to=' + t + '&subject=' + s + '&body=' + b;
    modal.querySelector('[data-cc="app"]').href     = 'mailto:' + TO + '?subject=' + s + '&body=' + b;
    modal.classList.add('is-open');
    modal.querySelector('[data-cc="gmail"]').focus();
  }
  function close(){ modal.classList.remove('is-open'); }
  window.lumenaContact = open;

  modal.addEventListener('click', function(e){
    if (e.target === modal || e.target.closest('.cc-close')) close();
    if (e.target.closest('.cc-actions a')) setTimeout(close, 300);
    var cb = e.target.closest('.cc-copybtn');
    if (cb){
      var done = function(){ cb.textContent = 'Copied'; setTimeout(function(){ cb.textContent = 'Copy address'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(TO).then(done, function(){ window.prompt('Copy this address:', TO); });
      else window.prompt('Copy this address:', TO);
    }
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });

  // Any contact@ mailto link on the site opens the chooser instead.
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="mailto:contact@"]');
    if (!a || a.closest('.cc-overlay')) return;
    e.preventDefault(); open();
  });
})();

/* ---- Opening-soon interest form ---- */
(function(){
  fetch('./schedule.json', { cache: 'no-store' })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(data){
      if(data && data.booking_url){
        document.querySelectorAll('a[href="#book"], a[href="./index.html#book"], a[href="index.html#book"]').forEach(function(a){
          a.setAttribute('href', data.booking_url); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
        });
      }
    }).catch(function(){});

  var form = document.getElementById('bookingForm');
  if(!form) return;
  var status = document.getElementById('bookingStatus');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    status.className = 'booking-status';
    var nm = form.name.value.trim(), em = form.email.value.trim(), ph = form.phone.value.trim();
    if(!nm){ status.textContent = 'Please add your name.'; status.classList.add('err'); return; }
    if(!em && !ph){ status.textContent = 'Please leave an email or a cell number so we can reach you.'; status.classList.add('err'); return; }
    if(em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){ status.textContent = 'That email address does not look complete. Please check it.'; status.classList.add('err'); return; }
    var lines = [
      'Hello LUMENA,', '',
      'Please contact me when appointments open.', '',
      'Name:  ' + nm,
      'Email: ' + (em || '(not provided)'),
      'Cell:  ' + (ph || '(not provided)'), '',
      'Interested in: ' + (form.reason.value.trim() || '(not provided)'), '',
      '- Sent from lumenahealthclinic.com'
    ].join('\n');
    window.lumenaContact(lines);
    status.textContent = 'Choose how to send it in the window that opened, then press send.';
    status.classList.add('ok');
  });
})();
