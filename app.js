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

    function addMsg(text, who) {
      var msg = document.createElement("div");
      msg.className = "chat-msg " + who;
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    }

    function greet() {
      if (body.children.length) return;
      addMsg("Hi \u2014 ask me about services, pricing, insurance, or the GLP-1/GIP program. Pick a question below or type your own.", "bot");
      FAQ.slice(0, 6).forEach(function (item) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chat-chip";
        chip.textContent = item.q;
        chip.addEventListener("click", function () { ask(item.q); });
        suggestions.appendChild(chip);
      });
    }

    function ask(text) {
      if (!text.trim()) return;
      addMsg(text, "user");
      var match = faqAnswerFor(text);
      if (match) {
        addMsg(match.a, "bot");
      } else {
        addMsg("I don't have a written answer for that yet. Please reach out through our Contact page and we'll get back to you directly.", "bot");
      }
      input.value = "";
    }

    function openPanel() {
      panel.classList.add("is-open");
      greet();
      input.focus();
    }
    function closePanel() { panel.classList.remove("is-open"); }

    launcher.addEventListener("click", function () {
      panel.classList.contains("is-open") ? closePanel() : openPanel();
    });
    closeBtn.addEventListener("click", closePanel);
    sendBtn.addEventListener("click", function () { ask(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") ask(input.value);
    });
  }

  buildChatWidget();
})();

/* ---- Booking: slot selection + honest submit ---- */
(function(){
  var form = document.getElementById('bookingForm');
  if(!form) return;
  var chosen  = document.getElementById('chosenSlot');
  var status  = document.getElementById('bookingStatus');
  var slotBox = document.getElementById('slotContainer');
  var meta    = document.getElementById('slotMeta');
  var cfg     = null;

  function pad(n){ return (n<10?'0':'')+n; }
  function localDate(iso){
    var p = iso.split('-');
    return new Date(+p[0], +p[1]-1, +p[2]);
  }
  function dayName(d){
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
  }
  function monthDay(d){
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return m + ' ' + d.getDate();
  }
  function pretty(t){
    var p = t.split(':'), h = +p[0], m = p[1];
    var ap = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if(h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ap;
  }
  function todayMidnight(){
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function fallback(msg){
    slotBox.innerHTML = '<div class="slot-empty">' +
      '<p>' + msg + '</p>' +
      '<p class="slot-empty-action">Email <a href="mailto:contact@lumenahealthclinic.com?subject=%5BLUMENA%20NEW%20INQUIRY%5D%20Request%20to%20connect">contact@lumenahealthclinic.com</a> ' +
      'with a few times that work for you and we will confirm one.</p>' +
      '</div>';
    if(meta) meta.textContent = '';
    var btn = form.querySelector('button[type="submit"]');
    if(btn) btn.disabled = true;
  }

  function render(data){
    cfg = data;
    var upcoming = (data.days || []).filter(function(d){
      return localDate(d.date) >= todayMidnight();
    }).sort(function(a,b){ return a.date < b.date ? -1 : 1; });

    if(!upcoming.length){
      fallback('We have not posted appointment times yet — we are opening soon.');
      return;
    }

    var html = '';
    upcoming.forEach(function(day){
      var d = localDate(day.date);
      var open = (day.times || []);
      if(!open.length) return;
      html += '<div class="slot-day">' +
        '<div class="slot-day-label"><strong>' + dayName(d) + '</strong><span>' + monthDay(d) + '</span></div>' +
        '<div class="slot-row">';
      open.forEach(function(t){
        var label = pretty(t.time);
        var value = dayName(d) + ' ' + monthDay(d) + ', ' + label;
        if(t.status === 'taken'){
          html += '<label class="slot is-taken"><input type="radio" name="slot" disabled><span>' + label + '</span></label>';
        } else {
          html += '<label class="slot"><input type="radio" name="slot" value="' + value + '"><span>' + label + '</span></label>';
        }
      });
      html += '</div></div>';
    });

    if(!html){
      fallback('We have not posted appointment times yet — we are opening soon.');
      return;
    }
    slotBox.innerHTML = html;

    if(meta){
      meta.textContent = 'All times ' + (data.timezone_label || 'Pacific Time') +
        '. We reply within ' + (data.response_time || 'two business days') + '.';
    }

    slotBox.querySelectorAll('input[name="slot"]').forEach(function(r){
      r.addEventListener('change', function(){
        chosen.textContent = 'Selected: ' + r.value;
        chosen.classList.add('is-set');
        status.textContent = '';
        status.className = 'booking-status';
      });
    });
  }

  fetch('./schedule.json', { cache: 'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function(data){
      // If a real booking page exists, send people straight there.
      if(data.booking_url){
        document.querySelectorAll('a[href="#book"], a[href="./index.html#book"], a[href="index.html#book"]').forEach(function(a){
          a.setAttribute('href', data.booking_url);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
        });
      }
      render(data);
    })
    .catch(function(){
      fallback('We could not load our current appointment times.');
    });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    status.className = 'booking-status';

    var slot = slotBox ? slotBox.querySelector('input[name="slot"]:checked') : null;
    if(!slot){
      status.textContent = 'Please choose a time above first.';
      status.classList.add('err'); return;
    }
    var nm = form.name.value.trim(), em = form.email.value.trim(), ph = form.phone.value.trim();
    if(!nm || !em || !ph){
      status.textContent = 'Name, email, and phone are needed so we can confirm.';
      status.classList.add('err'); return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){
      status.textContent = 'That email address does not look complete — please check it.';
      status.classList.add('err'); return;
    }

    var to = (cfg && cfg.request_email) || 'contact@lumenahealthclinic.com';
    var lines = [
      'Requested time: ' + slot.value + ' (' + ((cfg && cfg.timezone_label) || 'Pacific Time') + ')',
      '',
      'Name:  ' + nm,
      'Email: ' + em,
      'Phone: ' + ph,
      '',
      'What I would like help with:',
      (form.reason.value.trim() || '(not provided)'),
      '',
      '— Sent from the appointment request form at lumenahealthclinic.com'
    ].join('\n');

    var href = 'mailto:' + to +
      '?subject=' + encodeURIComponent('[LUMENA NEW INQUIRY] Request to connect') +
      '&body=' + encodeURIComponent(lines);

    window.location.href = href;

    status.textContent = 'Your email program should now open with this request ready to send. ' +
      'It is not booked until you press send and we reply to confirm. ' +
      'If nothing opened, email ' + to + ' directly.';
    status.classList.add('ok');
  });
})();
