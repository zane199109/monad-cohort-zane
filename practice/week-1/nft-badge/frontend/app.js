// NFT Badge DApp — frontend logic (ethers.js v5)
// Two-page prototype: badge wall (#/) + badge detail (#/badge/:typeId)
// Hybrid mode: mock metadata from mock-data.js + on-chain hasBadge() for unlock status

// --- ABI surface used by this prototype ---
const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function owner() view returns (address)",
  "function nextBadgeTypeId() view returns (uint256)",
  "function hasBadge(address account, uint256 typeId) view returns (bool)",
  "function mint(address to, uint256 typeId) returns (uint256)",
];

// --- Monad Testnet constants ---
const MONAD_TESTNET = {
  chainId: "0x279f",
  chainName: "Monad Testnet",
  nativeCurrency: { name: "MONAD", symbol: "MONAD", decimals: 18 },
  rpcUrls: ["https://testnet-rpc.monad.xyz/"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
};
const EXPLORER_TX = "https://testnet.monadexplorer.com/tx/";
const EXPLORER_ADDR = "https://testnet.monadexplorer.com/address/";
const DEFAULT_CONTRACT = "0x56c26B4Cb480f606AA030BFF6CA3b3887a5673CC";

// --- Shared state ---
const state = {
  provider: null,
  signer: null,
  contract: null,
  account: null,
  unlockedSet: new Set(),
  filter: { series: 'all', status: 'all', search: '' },
};

const $ = (id) => document.getElementById(id);

// ============== HTML escape helper ==============
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ============== Log system (drawer-style) ==============
const LOG_COLORS = {
  info:    "text-slate-300",
  success: "text-emerald-400",
  error:   "text-rose-400",
  tx:      "text-amber-300",
};
function now() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0")).join(":");
}
function log(msg, opts) {
  opts = opts || {};
  const type = opts.type || "info";
  const container = $("logContainer");
  if (!container) return;
  const entry = document.createElement("div");
  entry.className = "log-entry text-xs font-mono py-0.5 leading-relaxed";

  // Determine link target
  let linkUrl = '';
  if (opts.txHash) linkUrl = EXPLORER_TX + opts.txHash;
  else if (opts.addr) linkUrl = EXPLORER_ADDR + opts.addr;

  const timeSpan = '<span class="text-slate-600">' + now() + '</span>';
  const msgSpan = '<span class="' + (LOG_COLORS[type] || LOG_COLORS.info) + '">' + escapeHtml(msg) + '</span>';

  if (linkUrl) {
    // Entire entry is a clickable link to Monad explorer
    entry.innerHTML = '<a href="' + linkUrl + '" target="_blank" rel="noopener" title="View on Monadscan" class="block hover:bg-slate-700/40 rounded px-1 -mx-1 transition">'
      + timeSpan + ' ' + msgSpan + '</a>';
  } else {
    entry.innerHTML = timeSpan + ' ' + msgSpan;
  }

  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
  updateLogCount();
}
function clearLog() {
  if (!$("logContainer")) return;
  $("logContainer").innerHTML = "";
  updateLogCount();
}
function updateLogCount() {
  const c = $("logCount");
  if (!c) return;
  const count = ($("logContainer")?.children?.length || 0);
  c.textContent = count + " entr" + (count === 1 ? "y" : "ies");
}

// ============== Drawer toggle ==============
function toggleLogDrawer() {
  const drawer = $("logDrawer");
  if (!drawer) return;
  drawer.classList.toggle("open");
}
function closeLogDrawer() {
  const drawer = $("logDrawer");
  if (drawer) drawer.classList.remove("open");
}
function isLogOpen() {
  return $("logDrawer")?.classList.contains("open") || false;
}

// ============== Wallet + network ==============
async function ensureMonadTestnet() {
  const net = await state.provider.getNetwork();
  const current = "0x" + net.chainId.toString(16);
  if (current.toLowerCase() === MONAD_TESTNET.chainId) return true;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: MONAD_TESTNET.chainId }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [MONAD_TESTNET],
      });
    } else { throw e; }
  }
  state.provider = new ethers.providers.Web3Provider(window.ethereum);
  state.signer = state.provider.getSigner();
  const net2 = await state.provider.getNetwork();
  return ("0x" + net2.chainId.toString(16)).toLowerCase() === MONAD_TESTNET.chainId;
}

async function connect() {
  if (!window.ethers) { log("ethers.js not loaded", { type: "error" }); return; }
  if (!window.ethereum) { log("MetaMask not found", { type: "error" }); return; }
  try {
    log("requesting wallet connection...", { type: "info" });
    const perms = await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
    // Try multiple ways to get the account
    let accs = [];
    if (perms && perms[0] && perms[0].caveats) {
      const allowed = perms[0].caveats.find((c) => c.name === "allowedAccounts");
      if (allowed && allowed.value && allowed.value.length > 0) {
        accs = allowed.value;
      }
    }
    if (accs.length === 0) {
      // Fallback: use eth_accounts directly
      accs = await window.ethereum.request({ method: "eth_accounts" });
    }
    if (!accs || accs.length === 0) {
      log("no accounts selected", { type: "error" });
      return;
    }
    state.account = accs[0];
    state.provider = new ethers.providers.Web3Provider(window.ethereum);
    state.signer = state.provider.getSigner();
    updateAccountUI();
    log("wallet connected: " + state.account, { type: "success", addr: state.account });

    log("checking network...", { type: "info" });
    const ok = await ensureMonadTestnet();
    if (!ok) {
      updateNetworkUI(false);
      log("please switch to Monad Testnet", { type: "error" });
      return;
    }
    updateNetworkUI(true);
    await bindContract(DEFAULT_CONTRACT);
    await refreshUnlockStatus();
    log("ready ✓", { type: "success" });
    renderCurrentRoute();
    // Open log drawer automatically on connect
    toggleLogDrawer();
  } catch (e) {
    log("connect error: " + e.message, { type: "error" });
  }
}

function updateAccountUI() {
  const el = $("account");
  if (!el) return;
  if (state.account) {
    const short = state.account.slice(0, 6) + "\u2026" + state.account.slice(-4);
    el.textContent = short;
    el.classList.remove("text-slate-500");
    el.classList.add("text-emerald-400");
  } else {
    el.textContent = "not connected";
    el.classList.add("text-slate-500");
    el.classList.remove("text-emerald-400");
  }
  const btn = $("connectBtn");
  if (btn && state.account) {
    btn.textContent = state.account.slice(0, 6) + "\u2026" + state.account.slice(-4);
    btn.classList.remove("bg-brand-600", "hover:bg-brand-700");
    btn.classList.add("bg-emerald-600", "hover:bg-emerald-700");
  }
}

function updateNetworkUI(ok) {
  const pill = $("netPill");
  const chainEl = $("chainId");
  if (!pill) return;
  if (ok) {
    pill.textContent = "Monad Testnet";
    pill.className = "px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono";
    if (chainEl) chainEl.textContent = "0x279f";
  } else {
    pill.textContent = "wrong network";
    pill.className = "px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono";
  }
}

async function bindContract(addr) {
  if (!ethers.utils.isAddress(addr)) { log("invalid contract address", { type: "error" }); return; }
  state.contract = new ethers.Contract(addr, ABI, state.signer || state.provider);
  const short = addr.slice(0, 6) + "\u2026" + addr.slice(-4);
  const el = $("contractStatus");
  if (el) {
    el.textContent = short;
    el.className = "font-mono text-xs text-emerald-400";
  }
  log("contract bound: " + addr, { type: "success", addr: addr });
}

// Hybrid mode: query hasBadge for every badge typeId, build unlock set
async function refreshUnlockStatus() {
  state.unlockedSet = new Set();
  if (!state.contract || !state.account) return;
  const { BADGES } = window.BADGE_DATA;
  log("querying unlock status for " + BADGES.length + " badges...", { type: "info" });
  let checked = 0;
  await Promise.all(BADGES.map(async (b) => {
    try {
      const ok = await state.contract.hasBadge(state.account, b.typeId);
      if (ok) state.unlockedSet.add(b.typeId);
    } catch (e) { /* ignore individual failures */ }
    checked++;
  }));
  log("loaded: " + state.unlockedSet.size + "/" + BADGES.length + " badges", { type: "success" });
}

// ============== Mint transaction ==============
async function mintBadge(typeId) {
  if (!state.signer) {
    log("connect wallet first", { type: "error" });
    return;
  }
  const badge = window.BADGE_DATA.getBadge(typeId);
  const name = badge ? badge.name : "Badge #" + typeId;
  log('minting "' + name + '"...', { type: "info" });
  try {
    const contract = new ethers.Contract(DEFAULT_CONTRACT, ABI, state.signer);
    // This triggers MetaMask popup for gas confirmation (will pop up here)
    const tx = await contract.mint(state.account, typeId);
    log("tx sent: " + tx.hash, { type: "tx", txHash: tx.hash });
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      log("mint confirmed: #" + receipt.transactionHash.slice(0, 10) + "\u2026", { type: "success", txHash: receipt.transactionHash });
      state.unlockedSet.add(Number(typeId));
      renderCurrentRoute();
    } else {
      log("mint failed on-chain", { type: "error", txHash: receipt.transactionHash });
    }
  } catch (e) {
    // User rejected in MetaMask, or contract reverted
    const msg = e.code === 4001 ? "user rejected the transaction" : e.message;
    log("mint error: " + msg, { type: "error" });
  }
}

// ============== Router ==============
function parseRoute() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);
  if (parts.length === 0) return { page: "wall" };
  if (parts[0] === "badge" && parts[1] != null) return { page: "detail", typeId: parts[1] };
  return { page: "wall" };
}

function renderCurrentRoute() {
  const r = parseRoute();
  if (r.page === "wall") renderWall();
  else if (r.page === "detail") renderDetail(r.typeId);
}

function navigate(hash) {
  location.hash = hash;
}

// ============== Wall page rendering ==============
function renderWall() {
  const app = $("app");
  if (!app) return;
  const { BADGES, RARITY, SERIES, getNextUnlock } = window.BADGE_DATA;
  const unlocked = state.unlockedSet.size;
  const total = BADGES.length;
  const pct = Math.round((unlocked / total) * 100);

  // Apply filters
  let badges = BADGES.slice();
  if (state.filter.series !== 'all') badges = badges.filter((b) => b.series === state.filter.series);
  if (state.filter.status === 'unlocked')   badges = badges.filter((b) => state.unlockedSet.has(b.typeId));
  if (state.filter.status === 'locked')     badges = badges.filter((b) => !state.unlockedSet.has(b.typeId));
  if (state.filter.search) {
    const q = state.filter.search.toLowerCase();
    badges = badges.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      b.unlockRule.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q));
  }

  const next = getNextUnlock(state.unlockedSet);

  app.innerHTML = `
    <!-- Hero -->
    <section class="px-6 py-8 border-b border-slate-800">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <div class="text-xs uppercase tracking-widest text-brand-400 mb-2">Builder Profile</div>
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-3">
            ${state.account ? shortAddr(state.account) : '<span class="text-slate-500">connect wallet</span>'}
          </h1>
          <div class="flex flex-wrap gap-3 text-sm">
            <div class="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span class="text-slate-400">Level</span>
              <span class="ml-2 text-brand-300 font-semibold">${levelByUnlocked(unlocked)}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span class="text-slate-400">Unlocked</span>
              <span class="ml-2 text-emerald-300 font-semibold">${unlocked} / ${total}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span class="text-slate-400">Points</span>
              <span class="ml-2 text-purple-300 font-semibold">${unlocked * 100}</span>
            </div>
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400 mb-2 flex justify-between">
            <span>Total progress</span><span>${pct}%</span>
          </div>
          <div class="h-2.5 rounded-full bg-slate-800 overflow-hidden mb-4">
            <div class="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all" style="width:${pct}%"></div>
          </div>
          <button onclick="shareProfile()" class="w-full px-4 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition">
            Share my achievement page
          </button>
          <p class="text-[11px] text-slate-500 mt-2">All NFT credentials minted on Monad Testnet — verifiable on-chain.</p>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div class="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1 text-xs">
          <span class="text-slate-500 mr-2">Series:</span>
          ${['all','cohort','hackathon','opensource','devrel'].map((s) => `
            <button onclick="setFilter('series','${s}')" class="px-2.5 py-1 rounded-md transition ${state.filter.series===s?'bg-brand-600 text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
              ${s==='all'?'All':SERIES[s].label}
            </button>
          `).join('')}
        </div>
        <div class="flex items-center gap-1 text-xs ml-2">
          <span class="text-slate-500 mr-2">Status:</span>
          ${['all','unlocked','locked'].map((s) => `
            <button onclick="setFilter('status','${s}')" class="px-2.5 py-1 rounded-md transition capitalize ${state.filter.status===s?'bg-brand-600 text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
              ${s}
            </button>
          `).join('')}
        </div>
        <input oninput="setFilter('search', this.value)" placeholder="search badges..."
               class="ml-auto px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-brand-500 outline-none w-48" />
      </div>
    </section>

    <!-- Badge grid -->
    <section class="px-6 py-6">
      <div class="max-w-7xl mx-auto">
        ${!state.account ? `
          <div class="text-center py-16">
            <div class="text-6xl mb-4 opacity-50">\uD83D\uDD12</div>
            <p class="text-slate-400 mb-4">Connect wallet to view your badges</p>
            <button onclick="connect()" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium">Connect MetaMask</button>
          </div>
        ` : badges.length === 0 ? `
          <div class="text-center py-16 text-slate-500">No badges match the current filters.</div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${badges.map(renderBadgeCard).join('')}
          </div>
        `}
      </div>
    </section>

    <!-- Next unlock -->
    ${next ? `
      <section class="px-6 pb-8">
        <div class="max-w-7xl mx-auto">
          <div class="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800/60 to-slate-900/60 p-5 flex flex-wrap items-center gap-4">
            <div class="text-4xl opacity-70">${next.image}</div>
            <div class="flex-1 min-w-[200px]">
              <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Next unlock</div>
              <div class="font-semibold text-white">${next.name}</div>
              <div class="text-xs text-slate-400 mt-1">${next.unlockRule}</div>
              <div class="h-1.5 rounded-full bg-slate-700 overflow-hidden mt-2 max-w-sm">
                <div class="h-full bg-brand-500" style="width:${Math.round(next.progress.current/next.progress.total*100)}%"></div>
              </div>
              <div class="text-[11px] text-slate-500 mt-1">${next.progress.current} / ${next.progress.total}</div>
            </div>
            <a href="#/badge/${next.typeId}" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg transition">View details</a>
          </div>
        </div>
      </section>
    ` : `
      <section class="px-6 pb-8 text-center">
        <div class="text-2xl mb-2">\uD83C\uDF89</div>
        <p class="text-slate-400">All badges unlocked. You're a Monad Master.</p>
      </section>
    `}
  `;
}

function renderBadgeCard(b) {
  const { RARITY, SERIES } = window.BADGE_DATA;
  const r = RARITY[b.rarity];
  const s = SERIES[b.series];
  const unlocked = state.unlockedSet.has(b.typeId);
  const borderColor = unlocked ? r.color : '#334155';
  const glow = unlocked ? r.glow : 'transparent';
  return `
    <a href="#/badge/${b.typeId}"
       class="group rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
       style="border-color:${borderColor}; box-shadow:0 0 24px ${glow}; background:rgba(15,23,42,0.6); backdrop-filter:blur(8px);">
      <div class="aspect-square rounded-lg flex items-center justify-center text-6xl mb-3 ${unlocked ? '' : 'grayscale opacity-40'}"
           style="background:radial-gradient(circle at center, rgba(${hexToRgb(borderColor)},0.15) 0%, transparent 70%);">
        ${unlocked ? b.image : '\uD83D\uDD12'}
      </div>
      <div class="flex items-center justify-between mb-1.5">
        <h3 class="font-semibold text-white text-sm truncate">${b.name}</h3>
        <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" style="color:${r.color}; border:1px solid ${r.color}40;">${r.label}</span>
      </div>
      <div class="text-[11px] text-slate-400 mb-2">${b.description}</div>
      <div class="flex items-center justify-between text-[10px]">
        <span class="px-1.5 py-0.5 rounded" style="color:${s.color}; background:${s.color}20;">${s.label}</span>
        <span class="text-slate-500">${unlocked ? 'unlocked' : 'locked'}</span>
      </div>
    </a>
  `;
}

function setFilter(key, value) {
  state.filter[key] = value;
  renderWall();
}

function shareProfile() {
  const url = location.href;
  if (navigator.share) {
    navigator.share({ title: 'My Monad Builder Badges', url });
  } else {
    navigator.clipboard.writeText(url);
    log("profile link copied to clipboard", { type: "success" });
    alert("Profile link copied:\n" + url);
  }
}

// ============== Detail page rendering ==============
function renderDetail(typeId) {
  const app = $("app");
  if (!app) return;
  const badge = window.BADGE_DATA.getBadge(typeId);
  if (!badge) {
    app.innerHTML = `
      <div class="max-w-3xl mx-auto py-20 text-center">
        <div class="text-5xl mb-4">\uD83E\uDD37</div>
        <p class="text-slate-400 mb-4">Badge not found.</p>
        <a href="#/" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg">Back to wall</a>
      </div>`;
    return;
  }
  const { RARITY, SERIES, getSeriesSiblings } = window.BADGE_DATA;
  const r = RARITY[badge.rarity];
  const s = SERIES[badge.series];
  const unlocked = state.unlockedSet.has(badge.typeId);
  const siblings = getSeriesSiblings(badge.typeId);
  const pct = Math.round(badge.progress.current / badge.progress.total * 100);

  app.innerHTML = `
    <!-- Back bar -->
    <div class="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
      <a href="#/" class="text-sm text-slate-400 hover:text-white transition">&larr; back to wall</a>
      <button onclick="shareBadge(${badge.typeId})" class="text-sm text-brand-400 hover:text-brand-300 transition">share \u2197</button>
    </div>

    <!-- Body: 2-col -->
    <div class="px-6 py-8">
      <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8">

        <!-- Left: image -->
        <div>
          <div class="aspect-square rounded-2xl border-2 flex items-center justify-center text-9xl ${unlocked ? '' : 'grayscale opacity-40'}"
               style="border-color:${r.color}; box-shadow:0 0 60px ${r.glow}; background:radial-gradient(circle at center, rgba(${hexToRgb(r.color)},0.2) 0%, rgba(15,23,42,0.6) 70%);">
            ${unlocked ? badge.image : '\uD83D\uDD12'}
          </div>
          <div class="mt-4 text-xs space-y-1.5">
            <div class="flex justify-between"><span class="text-slate-500">Token ID</span><span class="font-mono text-slate-300">#${badge.typeId}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Contract</span><a href="${EXPLORER_ADDR}${DEFAULT_CONTRACT}" target="_blank" rel="noopener" class="font-mono text-brand-400 hover:underline">${shortAddr(DEFAULT_CONTRACT)}</a></div>
            <div class="flex justify-between"><span class="text-slate-500">Mint Tx</span><a href="${EXPLORER_TX}0x9c2d06f45882a95c2675f18fc4b25aefe77a195ecc95fd783ae5e1ec822c732e" target="_blank" rel="noopener" class="font-mono text-brand-400 hover:underline">0x9c2d\u2026732e \u2197</a></div>
          </div>
          <a href="${EXPLORER_ADDR}${DEFAULT_CONTRACT}" target="_blank" rel="noopener"
             class="block mt-3 text-center px-4 py-2 border border-brand-500 text-brand-300 hover:bg-brand-500/10 rounded-lg text-sm transition">
            View on Monadscan \u2197
          </a>
        </div>

        <!-- Right: info panel -->
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-bold text-white">${badge.name}</h1>
            <span class="text-xs px-2 py-1 rounded font-semibold" style="color:${r.color}; border:1px solid ${r.color}50;">${r.label}</span>
          </div>
          <div class="flex flex-wrap gap-2 text-xs mb-5">
            <span class="px-2 py-1 rounded" style="color:${s.color}; background:${s.color}20;">${s.label}</span>
            <span class="px-2 py-1 rounded bg-slate-800 text-slate-400">Minted: ${unlocked ? '2026-07-08' : '\u2014'}</span>
            <span class="px-2 py-1 rounded bg-slate-800 text-slate-400">Holder: ${state.account ? shortAddr(state.account) : '\u2014'}</span>
          </div>

          <!-- Unlock rule -->
          <div class="rounded-lg border border-slate-700 bg-slate-800/40 p-4 mb-5">
            <div class="text-xs uppercase tracking-widest text-brand-400 mb-1.5">Unlock requirement</div>
            <p class="text-sm text-slate-200 leading-relaxed">${badge.unlockRule}</p>
            ${!unlocked ? `
              <div class="mt-3">
                <div class="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Progress</span><span>${badge.progress.current} / ${badge.progress.total}</span>
                </div>
                <div class="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div class="h-full bg-brand-500" style="width:${pct}%"></div>
                </div>
              </div>
            ` : `<p class="text-emerald-400 text-sm mt-2">\u2713 Unlocked</p>`}
          </div>

          <!-- Traits grid -->
          <div class="grid grid-cols-3 gap-2 mb-5">
            <div class="rounded-lg border border-slate-700 p-3">
              <div class="text-[10px] uppercase text-slate-500 mb-0.5">Track</div>
              <div class="text-sm font-medium text-white">${badge.track}</div>
            </div>
            <div class="rounded-lg border border-slate-700 p-3">
              <div class="text-[10px] uppercase text-slate-500 mb-0.5">Contribution</div>
              <div class="text-sm font-medium text-white">${badge.contribution}</div>
            </div>
            <div class="rounded-lg border border-slate-700 p-3">
              <div class="text-[10px] uppercase text-slate-500 mb-0.5">Level</div>
              <div class="text-sm font-medium text-white">${badge.level}</div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-2">
            ${!unlocked && state.account ? `
              <button onclick="mintBadge(${badge.typeId})" class="px-4 py-2 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition shadow-lg shadow-purple-500/30">
                Mint this Badge
              </button>
            ` : ''}
            <button onclick="exportBadge(${badge.typeId})" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition">Export image</button>
            <button onclick="copyCredentialLink(${badge.typeId})" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition">Copy credential link</button>
          </div>

          <!-- History tab -->
          <div class="mt-6 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <div class="text-xs uppercase tracking-widest text-slate-500 mb-2">On-chain history</div>
            <div class="space-y-1.5 text-xs font-mono">
              <div class="flex justify-between"><span class="text-slate-500">mint tx</span><span class="text-slate-300">0x9c2d\u2026732e</span></div>
              <div class="flex justify-between"><span class="text-slate-500">block</span><span class="text-slate-300">43251319</span></div>
              <div class="flex justify-between"><span class="text-slate-500">gas used</span><span class="text-slate-300">~0.029 MON</span></div>
              <div class="flex justify-between"><span class="text-slate-500">contract</span><span class="text-slate-300">${shortAddr(DEFAULT_CONTRACT)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommended: same series -->
      ${siblings.length ? `
        <div class="max-w-5xl mx-auto mt-10">
          <h2 class="text-sm uppercase tracking-widest text-slate-500 mb-3">More from ${s.label}</h2>
          <div class="flex gap-3 overflow-x-auto pb-2">
            ${siblings.map((sb) => {
              const sr = RARITY[sb.rarity];
              const sun = state.unlockedSet.has(sb.typeId);
              return `
                <a href="#/badge/${sb.typeId}" class="flex-shrink-0 w-40 rounded-lg border p-3 hover:-translate-y-1 transition" style="border-color:${sr.color}50; background:rgba(15,23,42,0.6);">
                  <div class="aspect-square rounded flex items-center justify-center text-4xl mb-2 ${sun?'':'grayscale opacity-40'}">${sun?sb.image:'\uD83D\uDD12'}</div>
                  <div class="text-xs font-medium text-white truncate">${sb.name}</div>
                  <div class="text-[10px]" style="color:${sr.color}">${sr.label}</div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Verification note -->
      <div class="max-w-5xl mx-auto mt-8 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center">
        <p class="text-xs text-amber-300/80">
          \uD83D\uDD12 This SBT is stored on Monad Testnet and is non-transferable. It can be used as proof of Web3 work experience.
        </p>
      </div>
    </div>
  `;
}

function shareBadge(typeId) {
  const url = location.origin + location.pathname + "#/badge/" + typeId;
  if (navigator.share) navigator.share({ title: 'My NFT Badge', url });
  else { navigator.clipboard.writeText(url); alert("Badge link copied:\n" + url); }
}
function copyCredentialLink(typeId) {
  const url = location.origin + location.pathname + "#/badge/" + typeId;
  navigator.clipboard.writeText(url);
  log("credential link copied", { type: "success" });
  alert("Credential link copied:\n" + url);
}
function exportBadge(typeId) {
  log("export image is a prototype action", { type: "info" });
  alert("Export image: this would render a PNG/SVG of the badge for your portfolio. (Prototype)");
}

// ============== Helpers ==============
function shortAddr(addr) { return addr.slice(0,6) + "\u2026" + addr.slice(-4); }
function hexToRgb(hex) {
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `${r},${g},${b}`;
}
function levelByUnlocked(count) {
  if (count >= 10) return 'Master';
  if (count >= 5)  return 'Builder';
  if (count >= 1)  return 'Novice';
  return 'Newcomer';
}

// ============== Boot ==============
window.addEventListener("DOMContentLoaded", () => {
  // Wire up shared controls
  const cb = $("connectBtn");
  if (cb) cb.addEventListener("click", connect);

  // Drawer toggle (header button + close button)
  const tlb = $("toggleLogBtn");
  if (tlb) tlb.addEventListener("click", toggleLogDrawer);
  const clb = $("closeLogBtn");
  if (clb) clb.addEventListener("click", closeLogDrawer);

  // Clear log
  const clr = $("clearLogBtn");
  if (clr) clr.addEventListener("click", clearLog);

  // Initial state
  updateAccountUI();
  updateNetworkUI(false);
  updateLogCount();

  // Router
  window.addEventListener("hashchange", renderCurrentRoute);
  renderCurrentRoute();

  // Auto-reload on account change / chain change
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => location.reload());
    window.ethereum.on("chainChanged", () => location.reload());
  }
});

// Expose for inline onclick handlers
window.connect = connect;
window.setFilter = setFilter;
window.shareProfile = shareProfile;
window.shareBadge = shareBadge;
window.copyCredentialLink = copyCredentialLink;
window.exportBadge = exportBadge;
window.mintBadge = mintBadge;
window.toggleLogDrawer = toggleLogDrawer;
