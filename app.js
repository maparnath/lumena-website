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
      a: "Pulmonary second opinions, metabolic health and weight management (including a physician-supervised GLP-1/GIP program), and functional assessment testing like VO2 max and body composition. See the What We Treat page for details.",
      k: ["services", "offer", "treat", "programs", "what do you do", "pulmonary", "weight", "metabolic", "functional"]
    },
    {
      q: "How much does it cost?",
      a: "Cost depends on which tests and services fit you, confirmed together at your consultation. You'll get a written Good Faith Estimate before anything begins \u2014 see our Care Plans page for what's included in each starting bundle.",
      k: ["cost", "price", "pricing", "how much", "fee", "expensive"]
    },
    {
      q: "Can I get a second opinion if I already have a pulmonary doctor?",
      a: "Yes \u2014 pulmonary second opinions are open to anyone not currently under this physician's insurance-based care, to keep the review independent and free of conflict of interest.",
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
      a: "Yes, through a physician-supervised metabolic program. Eli Lilly\u2013supplied medication samples may be available to qualifying patients at no charge, subject to a medical evaluation and availability. See the What We Treat page for details.",
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
    launcher.setAttribute("aria-label", "Open LUMENA Assistant");
    launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg><span>Ask LUMENA</span>';

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

  // ---- Inquiry / lead form (contact.html) ----
  var API_BASE = (function () {
    var p = "__PORT_8000__";
    return p.indexOf("__") === 0 ? "http://localhost:8000" : p;
  })();

  var leadForm = document.getElementById("lead-form");
  if (leadForm) {
    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("lf-status");
      var submitBtn = document.getElementById("lf-submit");
      var payload = {
        name: document.getElementById("lf-name").value.trim(),
        email: document.getElementById("lf-email").value.trim(),
        phone: document.getElementById("lf-phone").value.trim(),
        interest: document.getElementById("lf-interest").value,
        message: document.getElementById("lf-message").value.trim()
      };
      if (!payload.name || !payload.email) {
        status.textContent = "Please add your name and email.";
        status.className = "err";
        return;
      }
      submitBtn.disabled = true;
      status.textContent = "Sending...";
      status.className = "";
      fetch(API_BASE + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("request failed");
          return res.json();
        })
        .then(function () {
          status.textContent = "Thank you — we've received your request and will reach out directly.";
          status.className = "ok";
          leadForm.reset();
          submitBtn.disabled = false;
        })
        .catch(function () {
          status.textContent = "Something went wrong. Please try again, or reach out directly once contact details are live.";
          status.className = "err";
          submitBtn.disabled = false;
        });
    });
  }
})();
