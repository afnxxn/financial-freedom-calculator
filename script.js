/* ================================================================
   Financial Freedom Calculator Suite — script.js
   All calculations, tools, currency data & offline detection
================================================================ */

'use strict';

// ================================================================
// CURRENCY DATA — 20 World Currencies (Rates vs USD, approx 2025)
// ================================================================
const CURRENCIES = [
  { code:"USD", symbol:"$",   flag:"🇺🇸", name:"US Dollar",         rate:1.0,    region:"Americas" },
  { code:"EUR", symbol:"€",   flag:"🇪🇺", name:"Euro",               rate:0.92,   region:"Europe" },
  { code:"GBP", symbol:"£",   flag:"🇬🇧", name:"British Pound",      rate:0.79,   region:"Europe" },
  { code:"PKR", symbol:"₨",   flag:"🇵🇰", name:"Pakistani Rupee",    rate:278.0,  region:"Asia" },
  { code:"INR", symbol:"₹",   flag:"🇮🇳", name:"Indian Rupee",       rate:84.5,   region:"Asia" },
  { code:"SAR", symbol:"﷼",   flag:"🇸🇦", name:"Saudi Riyal",        rate:3.75,   region:"Middle East" },
  { code:"AED", symbol:"د.إ", flag:"🇦🇪", name:"UAE Dirham",         rate:3.67,   region:"Middle East" },
  { code:"KWD", symbol:"KD",  flag:"🇰🇼", name:"Kuwaiti Dinar",      rate:0.308,  region:"Middle East" },
  { code:"BHD", symbol:"BD",  flag:"🇧🇭", name:"Bahraini Dinar",     rate:0.376,  region:"Middle East" },
  { code:"OMR", symbol:"﷼",   flag:"🇴🇲", name:"Omani Rial",         rate:0.385,  region:"Middle East" },
  { code:"QAR", symbol:"﷼",   flag:"🇶🇦", name:"Qatari Riyal",       rate:3.64,   region:"Middle East" },
  { code:"JPY", symbol:"¥",   flag:"🇯🇵", name:"Japanese Yen",       rate:149.5,  region:"Asia" },
  { code:"CNY", symbol:"¥",   flag:"🇨🇳", name:"Chinese Yuan",       rate:7.24,   region:"Asia" },
  { code:"CAD", symbol:"CA$", flag:"🇨🇦", name:"Canadian Dollar",    rate:1.36,   region:"Americas" },
  { code:"AUD", symbol:"A$",  flag:"🇦🇺", name:"Australian Dollar",  rate:1.54,   region:"Oceania" },
  { code:"CHF", symbol:"Fr",  flag:"🇨🇭", name:"Swiss Franc",        rate:0.89,   region:"Europe" },
  { code:"TRY", symbol:"₺",   flag:"🇹🇷", name:"Turkish Lira",       rate:32.5,   region:"Europe/Asia" },
  { code:"EGP", symbol:"£",   flag:"🇪🇬", name:"Egyptian Pound",     rate:30.9,   region:"Africa" },
  { code:"BDT", symbol:"৳",   flag:"🇧🇩", name:"Bangladeshi Taka",   rate:110.0,  region:"Asia" },
  { code:"MYR", symbol:"RM",  flag:"🇲🇾", name:"Malaysian Ringgit",  rate:4.72,   region:"Asia" },
];

// ================================================================
// APP STATE
// ================================================================
const state = {
  currency:      CURRENCIES[0],
  incomeRate:    0.10,
  monthlyIncome: 1000,
  activeTool:    "freedom",
};

// ================================================================
// UTILITY HELPERS
// ================================================================
function fmtN(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return Math.round(n).toLocaleString();
  return n.toFixed(0);
}

function fmtFull(n) {
  return state.currency.symbol + fmtN(n);
}

function animateVal(el, target, formatter) {
  if (!el) return;
  const start  = parseFloat(el.dataset.raw || 0) || 0;
  el.dataset.raw = target;
  const steps  = 20;
  const delta  = (target - start) / steps;
  let count    = 0;
  const tick   = () => {
    count++;
    const v = count < steps ? start + delta * count : target;
    el.textContent = formatter(v);
    if (count < steps) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function updateCurrencySymbols() {
  document.querySelectorAll(".curr-sym").forEach(el => {
    el.textContent = state.currency.symbol;
  });
}

function $(id) { return document.getElementById(id); }

// ================================================================
// TOOL NAVIGATION
// ================================================================
function switchTool(toolId) {
  document.querySelectorAll(".tool-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tool-tab").forEach(t => t.classList.remove("active"));
  const panel = $("tool-" + toolId);
  const tab   = document.querySelector(`[data-tool="${toolId}"]`);
  if (panel) panel.classList.add("active");
  if (tab)   tab.classList.add("active");
  state.activeTool = toolId;
  runToolCalc(toolId);
}

function runToolCalc(id) {
  const map = {
    freedom:    calculateFreedom,
    compound:   calculateCompound,
    loan:       calculateLoan,
    retirement: calculateRetirement,
    savings:    calculateSavings,
    inflation:  calculateInflation,
    currency:   convertCurrency,
    zakat:      calculateZakat,
  };
  if (map[id]) map[id]();
}

// ================================================================
// CURRENCY SELECTOR UI
// ================================================================
function buildCurrencySelector() {
  const container = $("currency-selector");
  if (!container) return;
  CURRENCIES.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.className = "curr-btn" + (i === 0 ? " active" : "");
    btn.title = c.name;
    btn.innerHTML = `<span class="curr-flag">${c.flag}</span>
                     <span class="curr-code">${c.code}</span>
                     <span class="curr-name">${c.symbol}</span>`;
    btn.onclick = () => selectCurrency(btn, c);
    container.appendChild(btn);
  });
}

function selectCurrency(btn, c) {
  document.querySelectorAll(".curr-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.currency = c;
  $("income-currency-symbol").textContent = c.symbol;
  updateCurrencySymbols();
  runToolCalc(state.activeTool);
}

// ================================================================
// CONVERTER SELECTS
// ================================================================
function buildConverterSelects() {
  const from = $("conv-from"), to = $("conv-to");
  if (!from || !to) return;
  CURRENCIES.forEach(c => {
    from.add(new Option(`${c.flag} ${c.code} — ${c.name}`, c.code));
    to.add(new Option(`${c.flag} ${c.code} — ${c.name}`, c.code));
  });
  from.value = "USD";
  to.value   = "PKR";
}

// ================================================================
// QUICK RATES SIDEBAR
// ================================================================
function buildQuickRates() {
  const container = $("quick-rates");
  if (!container) return;
  ["EUR","GBP","PKR","INR","SAR","AED","KWD","JPY","CAD","AUD"].forEach(code => {
    const c = CURRENCIES.find(x => x.code === code);
    if (!c) return;
    const row = document.createElement("div");
    row.className = "rate-row";
    row.innerHTML = `<span class="rate-row-flag">${c.flag}</span>
                     <span class="rate-row-name">${c.code}</span>
                     <span class="rate-row-val">$1 = ${c.rate < 1 ? c.rate.toFixed(3) : c.rate.toFixed(2)}</span>`;
    container.appendChild(row);
  });
}

// ================================================================
// RATE TABLE
// ================================================================
function buildRateTable() {
  const tbody = $("rate-table-body");
  if (!tbody) return;
  CURRENCIES.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.flag} ${c.name}</td>
                    <td style="color:var(--em2);font-weight:700;">${c.symbol}</td>
                    <td style="color:var(--text);">${c.rate < 1 ? c.rate.toFixed(4) : c.rate.toFixed(2)}</td>
                    <td style="color:var(--dim);">${c.region}</td>`;
    tbody.appendChild(tr);
  });
}

// ================================================================
// SLIDER HANDLER
// ================================================================
function handleIncomeSlider(slider) {
  const min = parseFloat(slider.min) || 100;
  const max = parseFloat(slider.max) || 100000;
  const pct = ((slider.value - min) / (max - min)) * 100;
  slider.style.setProperty("--val", pct.toFixed(2) + "%");
  state.monthlyIncome = parseFloat(slider.value);
  $("income-display").textContent = parseFloat(slider.value).toLocaleString();
}

function setIncomeSlider(val) {
  const slider = $("income-slider");
  slider.value = val;
  handleIncomeSlider(slider);
  calculateFreedom();
}

// ================================================================
// INVESTMENT TYPE SELECTOR
// ================================================================
function selectInvestment(btn) {
  document.querySelectorAll(".inv-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.incomeRate = parseFloat(btn.dataset.rate);
  const rLabel = (state.incomeRate * 100) + "%";
  $("selected-rate-label").textContent = rLabel;
  $("rate-badge").textContent = rLabel;
  calculateFreedom();
}

// ================================================================
// TOOL 1: FINANCIAL FREEDOM CALCULATOR
// ================================================================
function calculateFreedom() {
  const monthly  = state.monthlyIncome;
  const rate     = state.incomeRate;
  const annual   = monthly * 12;
  const nestEgg  = annual / rate;
  const r_d      = rate / 365;
  const n20      = 20 * 365;
  const dailySave= nestEgg * r_d / (Math.pow(1 + r_d, n20) - 1);
  const years    = findYears(nestEgg, dailySave, rate);
  const freeAge  = 25 + Math.round(years);
  const fpct     = Math.min(100, (nestEgg / 1_200_000) * 100);
  const flabel   = nestEgg < 120_000   ? "Starter 🌱"
                 : nestEgg < 360_000   ? "Building 🔨"
                 : nestEgg < 720_000   ? "Comfortable 🏡"
                 : nestEgg < 1_000_000 ? "Freedom 🦅" : "Elite 💎";

  animateVal($("nest-egg"),     nestEgg, fmtN);
  animateVal($("annual-income"),annual,  fmtN);
  $("daily-save").textContent          = state.currency.symbol + dailySave.toFixed(2);
  $("years-to-freedom").textContent    = "~" + Math.round(years);
  $("free-age").textContent            = "~" + freeAge;
  $("freedom-bar").style.width         = Math.max(2, fpct) + "%";
  $("freedom-label").textContent       = flabel;
  renderMilestones(dailySave, rate, nestEgg);
}

function findYears(target, dailyPMT, annualRate) {
  const r = annualRate / 365;
  let lo = 1, hi = 365 * 80, mid = 1;
  for (let i = 0; i < 60; i++) {
    mid = (lo + hi) / 2;
    const fv = dailyPMT * (Math.pow(1 + r, mid) - 1) / r;
    if (fv < target) lo = mid; else hi = mid;
  }
  return mid / 365;
}

function renderMilestones(dailyPMT, annualRate, nestEgg) {
  const r   = annualRate / 365;
  const con = $("milestones-container");
  if (!con) return;
  con.innerHTML = "";
  [5, 10, 15, 20].forEach(yr => {
    const n    = yr * 365;
    const fv   = dailyPMT * (Math.pow(1 + r, n) - 1) / r;
    const pct  = Math.min(100, (fv / nestEgg) * 100);
    const done = pct >= 100;
    const div  = document.createElement("div");
    div.style.marginBottom = "0.625rem";
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:3px;">
        <span style="color:var(--dim);">Year ${yr}</span>
        <div>
          <span style="color:${done?"var(--em2)":"var(--text)"};font-weight:700;">${state.currency.symbol}${fmtN(Math.min(fv,nestEgg))}</span>
          <span style="color:var(--dim);margin-left:5px;">${pct.toFixed(0)}%</span>
        </div>
      </div>
      <div style="height:5px;border-radius:99px;background:var(--border);overflow:hidden;">
        <div style="height:100%;width:${Math.max(1,pct)}%;border-radius:99px;
          background:${done?"linear-gradient(to right,var(--em),var(--em2))":"linear-gradient(to right,#1d4ed8,#3b82f6)"};
          box-shadow:${done?"0 0 7px rgba(16,185,129,0.4)":"none"};transition:width 0.6s ease;"></div>
      </div>`;
    con.appendChild(div);
  });
}

// ================================================================
// TOOL 2: COMPOUND INTEREST
// ================================================================
function calculateCompound() {
  const P = parseFloat($("ci-principal").value) || 0;
  const r = (parseFloat($("ci-rate").value)     || 0) / 100;
  const t = parseFloat($("ci-years").value)     || 1;
  const n = parseInt($("ci-freq").value)        || 12;
  const m = parseFloat($("ci-monthly").value)   || 0;
  const rn = r / n, nt = n * t;
  const factor = Math.pow(1 + rn, nt);
  const futP = P * factor;
  const futC = m > 0 && rn > 0 ? m * (factor - 1) / rn : m * nt;
  const total = futP + futC;
  const interest = total - P - (m * 12 * t);
  const roi = P > 0 ? ((total - P) / P) * 100 : 0;

  animateVal($("ci-final"),    total,    fmtN);
  animateVal($("ci-interest"), Math.max(0, interest), fmtN);
  $("ci-roi").textContent = roi.toFixed(2) + "%";

  const tbody = $("ci-tbody");
  tbody.innerHTML = "";
  for (let y = 1; y <= t; y++) {
    const f2  = Math.pow(1 + rn, n * y);
    const fp2 = P * f2;
    const fc2 = m > 0 && rn > 0 ? m * (f2 - 1) / rn : m * n * y;
    const yr_total = fp2 + fc2;
    const f1  = Math.pow(1 + rn, n * (y - 1));
    const prev = P * f1 + (m > 0 && rn > 0 ? m * (f1-1)/rn : m*n*(y-1));
    const yr_growth   = yr_total - prev;
    const yr_interest = yr_total - P - m * 12 * y;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${y}</td>
                    <td style="color:var(--em2);font-weight:600;">${state.currency.symbol}${fmtN(yr_total)}</td>
                    <td style="color:var(--yellow);">${state.currency.symbol}${fmtN(Math.max(0,yr_interest))}</td>
                    <td style="color:var(--blue);">+${state.currency.symbol}${fmtN(yr_growth)}</td>`;
    tbody.appendChild(tr);
  }
}

// ================================================================
// TOOL 3: LOAN EMI
// ================================================================
function calculateLoan() {
  const P = parseFloat($("loan-amount").value) || 0;
  const r = (parseFloat($("loan-rate").value)  || 0) / 100 / 12;
  const n = (parseFloat($("loan-years").value) || 1) * 12;
  let emi = r === 0 ? P / n : P * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);
  const totalPay  = emi * n;
  const totalInt  = totalPay - P;

  $("loan-emi").textContent           = state.currency.symbol + fmtN(emi);
  $("loan-total-interest").textContent= state.currency.symbol + fmtN(totalInt);
  $("loan-total").textContent         = state.currency.symbol + fmtN(totalPay);

  const tbody = $("loan-tbody");
  tbody.innerHTML = "";
  let balance = P;
  const years = Math.ceil(n / 12);
  for (let y = 1; y <= years; y++) {
    let yEmi = 0, yPrin = 0, yInt = 0;
    const months = y === years ? (n % 12 || 12) : 12;
    for (let mm = 0; mm < months && balance > 0.01; mm++) {
      const ip = balance * r;
      const pp = Math.min(emi - ip, balance);
      yInt  += ip; yPrin += pp; yEmi  += emi; balance -= pp;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${y}</td>
                    <td>${state.currency.symbol}${fmtN(yEmi)}</td>
                    <td style="color:var(--em2);">${state.currency.symbol}${fmtN(yPrin)}</td>
                    <td style="color:var(--red);">${state.currency.symbol}${fmtN(yInt)}</td>
                    <td style="color:var(--yellow);">${state.currency.symbol}${fmtN(Math.max(0,balance))}</td>`;
    tbody.appendChild(tr);
  }
}

// ================================================================
// TOOL 4: RETIREMENT PLANNER
// ================================================================
function calculateRetirement() {
  const age     = parseFloat($("ret-age").value)             || 25;
  const retAge  = parseFloat($("ret-retire-age").value)      || 60;
  const exp     = parseFloat($("ret-expenses").value)        || 3000;
  const ret     = (parseFloat($("ret-return").value)         || 10) / 100;
  const inf     = (parseFloat($("ret-inflation").value)      || 3)  / 100;
  const curSav  = parseFloat($("ret-current-savings").value) || 0;
  const yrsLeft = Math.max(1, retAge - age);
  const futureExp = exp * Math.pow(1 + inf, yrsLeft);
  const corpus    = futureExp * 12 * 25;
  const fvCurrent = curSav * Math.pow(1 + ret, yrsLeft);
  const gap       = Math.max(0, corpus - fvCurrent);
  const r = ret / 12, n = yrsLeft * 12;
  const fvFactor  = (Math.pow(1+r,n) - 1) / r;
  const monthly   = fvFactor > 0 ? gap / fvFactor : gap / n;

  $("ret-corpus").textContent = state.currency.symbol + fmtN(corpus);
  animateVal($("ret-monthly"), monthly, fmtN);
  $("ret-years").textContent  = yrsLeft + " yrs";
}

// ================================================================
// TOOL 5: SAVINGS GOAL
// ================================================================
function calculateSavings() {
  const goal    = parseFloat($("sav-goal").value)    || 0;
  const current = parseFloat($("sav-current").value) || 0;
  const monthly = parseFloat($("sav-monthly").value) || 1;
  const rate    = (parseFloat($("sav-rate").value)   || 0) / 100 / 12;
  let balance = current, months = 0, totalContrib = current;
  const MAX = 1200;
  if (rate === 0) {
    months = Math.ceil((goal - current) / Math.max(monthly, 0.01));
    balance = goal;
    totalContrib = current + monthly * months;
  } else {
    while (balance < goal && months < MAX) {
      balance = balance * (1 + rate) + monthly;
      totalContrib += monthly;
      months++;
    }
  }
  const interest = Math.max(0, balance - totalContrib);
  const yrs = Math.floor(months / 12), mos = months % 12;
  const desc = (yrs > 0 ? yrs + " yr" + (yrs > 1?"s":"") + " " : "") + mos + " mo";

  $("sav-months").textContent        = months.toLocaleString();
  $("sav-time-desc").textContent     = desc;
  animateVal($("sav-total"),          Math.min(balance, goal * 1.01), fmtN);
  animateVal($("sav-interest-earned"),interest, fmtN);
}

// ================================================================
// TOOL 6: INFLATION CALCULATOR
// ================================================================
function calculateInflation() {
  const amount = parseFloat($("inf-amount").value) || 0;
  const rate   = (parseFloat($("inf-rate").value)  || 0) / 100;
  const years  = parseFloat($("inf-years").value)  || 1;
  const future = amount / Math.pow(1 + rate, years);
  const needed = amount * Math.pow(1 + rate, years);
  const lost   = amount - future;

  animateVal($("inf-future"), future, fmtN);
  animateVal($("inf-lost"),   lost,   fmtN);
  animateVal($("inf-needed"), needed, fmtN);

  const timeline = $("inflation-timeline");
  if (!timeline) return;
  timeline.innerHTML = "";
  [1,3,5,10,15,20,25,30].filter(y => y <= years + 1).forEach(y => {
    const fv  = amount / Math.pow(1 + rate, y);
    const pct = Math.max(5, (fv / amount) * 100);
    const row = document.createElement("div");
    row.className = "inf-row";
    row.innerHTML = `<span class="inf-year">Yr ${y}</span>
                     <div class="inf-bar-wrap"><div class="inf-bar-fill" style="width:${pct}%;"></div></div>
                     <span class="inf-val">${state.currency.symbol}${fmtN(fv)}</span>`;
    timeline.appendChild(row);
  });
}

// ================================================================
// TOOL 7: CURRENCY CONVERTER
// ================================================================
function convertCurrency() {
  const amount = parseFloat($("conv-amount").value) || 0;
  const fromC  = CURRENCIES.find(c => c.code === $("conv-from").value);
  const toC    = CURRENCIES.find(c => c.code === $("conv-to").value);
  if (!fromC || !toC) return;
  const inUSD    = amount / fromC.rate;
  const result   = inUSD * toC.rate;
  const unitRate = toC.rate / fromC.rate;
  animateVal($("conv-result"), result, fmtN);
  $("conv-detail").textContent = `1 ${fromC.code} = ${unitRate.toFixed(4)} ${toC.code}  (Reference Rate)`;
}

function swapCurrencies() {
  const f = $("conv-from"), t = $("conv-to"), tmp = f.value;
  f.value = t.value; t.value = tmp;
  convertCurrency();
}

// ================================================================
// TOOL 8: ZAKAT CALCULATOR
// ================================================================
function calculateZakat() {
  const cash     = parseFloat($("zk-cash").value)     || 0;
  const invest   = parseFloat($("zk-invest").value)   || 0;
  const gold     = parseFloat($("zk-gold").value)     || 0;
  const silver   = parseFloat($("zk-silver").value)   || 0;
  const business = parseFloat($("zk-business").value) || 0;
  const owed     = parseFloat($("zk-owed").value)     || 0;
  const debts    = parseFloat($("zk-debts").value)    || 0;
  const total    = cash + invest + gold + silver + business + owed;
  const net      = Math.max(0, total - debts);
  const NISAB    = 5000;
  const due      = net >= NISAB ? net * 0.025 : 0;
  const eligible = net >= NISAB;

  animateVal($("zk-due"), due,  fmtN);
  animateVal($("zk-net"), net,  fmtN);
  $("zk-status").textContent = eligible ? "✅ Eligible" : "❌ Below Nisab";
  $("zk-status").style.color = eligible ? "var(--em2)" : "var(--red)";
}

// ================================================================
// SHARE & COPY
// ================================================================
function getShareText() {
  const nest   = $("nest-egg")?.textContent       || "";
  const income = $("income-display")?.textContent || "";
  const sym    = state.currency.symbol;
  return `🎯 My Financial Freedom Number is ${sym}${nest}! That'll generate ${sym}${income}/month in passive income forever. Calculate yours FREE → ${window.location.href}`;
}

function shareResult(platform) {
  const text = encodeURIComponent(getShareText());
  const urls = {
    twitter:  `https://twitter.com/intent/tweet?text=${text}`,
    whatsapp: `https://wa.me/?text=${text}`,
  };
  window.open(urls[platform], "_blank", "noopener,noreferrer");
}

function copyResult() {
  navigator.clipboard.writeText(getShareText()).then(() => {
    const msg = $("copy-msg");
    msg.style.opacity = "1";
    setTimeout(() => { msg.style.opacity = "0"; }, 2500);
  }).catch(() => { alert(getShareText()); });
}

// ================================================================
// OFFLINE / ONLINE DETECTOR
// ================================================================
function updateConnectionStatus(isOnline) {
  const overlay    = $("offline-overlay");
  const statusDot  = $("status-dot");
  const sideStatus = $("sidebar-status");

  if (isOnline) {
    overlay?.classList.remove("show");
    if (statusDot)  statusDot.innerHTML  = `<span class="pulse-dot green"></span><span style="color:#34d399;font-weight:600;font-size:0.8rem;">● Online — Live Rates Active</span>`;
    if (sideStatus) sideStatus.innerHTML = `<span class="pulse-dot green"></span><span style="font-size:0.72rem;font-weight:700;color:#34d399;">Online</span>`;
  } else {
    overlay?.classList.add("show");
    if (statusDot)  statusDot.innerHTML  = `<span class="pulse-dot red"></span><span style="color:#f87171;font-weight:600;font-size:0.8rem;">● Offline</span>`;
    if (sideStatus) sideStatus.innerHTML = `<span class="pulse-dot red"></span><span style="font-size:0.72rem;font-weight:700;color:#f87171;">Offline</span>`;
  }
}

window.addEventListener("online",  () => updateConnectionStatus(true));
window.addEventListener("offline", () => updateConnectionStatus(false));

// ================================================================
// INIT — Runs on page load
// ================================================================
(function init() {
  buildCurrencySelector();
  buildConverterSelects();
  buildQuickRates();
  buildRateTable();

  // Init slider gradient
  const slider = $("income-slider");
  if (slider) {
    const pct = ((1000 - 100) / (100000 - 100)) * 100;
    slider.style.setProperty("--val", pct.toFixed(2) + "%");
  }

  updateConnectionStatus(navigator.onLine);

  // Run all calculations once
  calculateFreedom();
  calculateCompound();
  calculateLoan();
  calculateRetirement();
  calculateSavings();
  calculateInflation();
  convertCurrency();
  calculateZakat();
})();