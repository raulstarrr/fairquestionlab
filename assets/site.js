// Fair Question Lab home page. Everything here is an enhancement: without it the page is complete (end states, all links).
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce), (max-width: 900px)').matches;  // phones: the static layout, no scroll scenes
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var eps = JSON.parse(($('#eps') || {}).textContent || '[]');
  var now = Date.parse(document.documentElement.dataset.now || '') || Date.now(); // data-now: preview builds only (website.py --now)

  // Shorts go live at their slot; the page may be built before that, so show only what is due (the newest due = "latest").
  var due = eps.filter(function (e) { return Date.parse(e.at) <= now; });
  $$('[data-at]').forEach(function (el) { el.hidden = Date.parse(el.dataset.at) > now; });
  var latest = due[due.length - 1], np = $('.nowplaying');
  if (latest && np && np.dataset.slug !== latest.slug) {
    var yt = $('.yt');
    yt.href = 'https://youtube.com/shorts/' + latest.yt; yt.dataset.yt = latest.yt;
    $('img', yt).src = 's/' + latest.slug + '/cover.jpg';
    $('.num', np).textContent = '#' + latest.num;
    $('h2', np).textContent = latest.title;
    $('.ans', np).textContent = latest.answer;
    $('.src', np).href = 's/' + latest.slug + '/';
    np.dataset.slug = latest.slug;
  }

  // The next Short: countdowns (projector + "Next in the lab") and the chalkboard title.
  var nextEp = eps.filter(function (e) { return Date.parse(e.at) > Date.now(); })[0], cds = $$('.countdown'), nx = $('#next');
  if (nx) {
    nx.hidden = !nextEp;
    if (nextEp) { $('.chalkq', nx).textContent = nextEp.title; $('.nday', nx).textContent = new Date(nextEp.at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' }).replace(',', ''); }
  }
  if (cds.length && nextEp) {
    var target = Date.parse(nextEp.at), last = [];
    var tick = function () {
      var s = Math.max(0, Math.floor((target - Date.now()) / 1000)), d = Math.floor(s / 86400);
      var parts = (d ? [d + ' d'] : []).concat([Math.floor(s / 3600) % 24 + ' h', ('0' + Math.floor(s / 60) % 60).slice(-2) + ' min', ('0' + s % 60).slice(-2) + ' s']);
      cds.forEach(function (cd) {
        if (cd.children.length !== parts.length) cd.innerHTML = parts.map(function () { return '<span></span>'; }).join(' ');
        parts.forEach(function (p, i) { if (p !== last[i]) { var el = cd.children[i]; el.textContent = p; if (!reduce) { el.className = ''; void el.offsetWidth; el.className = 'flip'; } } });
      });
      last = parts;
    };
    tick(); setInterval(tick, 1000);
  } else cds.forEach(function (cd) { cd.parentNode.hidden = true; });

  // Archive: topic chips + search, both client-side; #topic in the URL picks a chip.
  var grid = $('.archive-pins');
  if (grid) {
    var items = $$('li', grid).filter(function (li) { return !li.hidden; }), q = $('.search input'), chips = $$('.chip'), lane = '', count = $('.count'), empty = $('.empty');
    var more = $('.more'), limit = 48;  // shortcut: paging is client-side; fine into the hundreds of Shorts
    chips.forEach(function (c) { var nEl = $('.n', c); if (nEl) nEl.textContent = '(' + items.filter(function (li) { return li.dataset.lane === c.dataset.lane; }).length + ')'; });
    more.addEventListener('click', function () { limit += 48; apply(); });
    var apply = function () {
      var words = (q.value || '').toLowerCase().split(/\s+/).filter(Boolean), n = 0;
      items.forEach(function (li) {
        var ok = (!lane || li.dataset.lane === lane) && words.every(function (w) { return li.dataset.q.indexOf(w) >= 0; });
        if (ok) n++;
        li.hidden = !ok || n > limit;
      });
      more.hidden = n <= limit;
      count.textContent = (lane || words.length ? 'Showing ' : '') + n + (n === 1 ? ' Short' : ' Shorts') + '.';
      empty.hidden = n > 0;
    };
    chips.forEach(function (c) { c.addEventListener('click', function () { lane = c.dataset.lane; chips.forEach(function (x) { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); history.replaceState(null, '', lane ? '#' + lane : location.pathname); apply(); }); });
    q.addEventListener('input', apply);
    var h = location.hash.slice(1), hc = chips.filter(function (c) { return c.dataset.lane === h; })[0];
    if (hc) hc.click(); else apply();
  }

  // The projector: play the Short right on the screen (YouTube loads only on click).
  $$('.yt[data-yt]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!a.dataset.yt) return;
      e.preventDefault();
      a.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + a.dataset.yt + '?autoplay=1&playsinline=1&rel=0" title="Fair Question Lab Short" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    });
  });

  // Ask Whim: his sign shows a random past question (never the same twice in a row) and links to its page.
  var sign = $('.asksign'), askb = $('.askbtn'), pool = due.length ? due : eps;
  if (sign && pool.length) {
    var ask = function () {
      var cur = sign.getAttribute('href'), pick, tries = 0;
      do { pick = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && cur.indexOf(pick.slug) >= 0 && ++tries < 9);
      var st = $('.st', sign); st.textContent = pick.title; sign.href = sign.dataset.root + 's/' + pick.slug + '/';
      if (!reduce) { st.classList.remove('flipin'); void st.offsetWidth; st.classList.add('flipin'); }
    };
    ask(); if (askb) { askb.hidden = false; askb.addEventListener('click', ask); }
  }
  var rnd = $('.askrand');
  if (rnd) rnd.addEventListener('click', function () { var a = $$('.archive-pins li:not([hidden]) a'); if (!a.length) a = $$('.archive-pins a'); if (a.length) location.href = a[Math.floor(Math.random() * a.length)].href; });

  // Pinned Shorts play a short muted preview on hover (not with reduced motion).
  if (!reduce) $$('video[data-src]').forEach(function (v) {
    var host = v.parentNode;
    host.addEventListener('pointerenter', function () { if (!v.src) v.src = v.dataset.src; v.play().then(function () { host.classList.add('playing'); }).catch(function () {}); });
    host.addEventListener('pointerleave', function () { v.pause(); host.classList.remove('playing'); });
  });

  // Meet: the loops play only while on screen, never with reduced motion.
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (list) { list.forEach(function (en) { if (en.isIntersecting) en.target.play().catch(function () {}); else en.target.pause(); }); }, { threshold: .35 });
    $$('video[data-auto]').forEach(function (v) { io.observe(v); });
  }

  // Tap Whim: a random reaction for a moment.
  $$('.tapme').forEach(function (b) {
    var rx = $$('.rx', b), t;
    b.addEventListener('click', function () {
      var pick = rx[Math.floor(Math.random() * rx.length)];
      rx.forEach(function (r) { r.classList.toggle('on', r === pick); });
      b.classList.add('reacting'); b.classList.remove('boing'); void b.offsetWidth; b.classList.add('boing');
      clearTimeout(t); t = setTimeout(function () { b.classList.remove('reacting'); rx.forEach(function (r) { r.classList.remove('on'); }); }, 1500);
    });
  });

  // Hero cork: the hovered (or focused) Short's number, date and title on a paper tag inside the board, above or below it.
  var cork = $('.cork'), tag = cork && $('.corktag', cork);
  if (tag) {
    var show = function (m) {
      if (!m || m.classList.contains('more')) { tag.classList.remove('on'); return; }
      $('small', tag).textContent = m.dataset.tag; $('b', tag).textContent = $('img', m).alt;
      var cw = cork.offsetWidth, ch = cork.offsetHeight, x = m.offsetLeft + m.offsetWidth / 2, below = m.offsetTop + m.offsetHeight / 2 < ch / 2;
      tag.style.setProperty('--tx', '0px'); tag.classList.add('on');
      var tw = tag.offsetWidth, th = tag.offsetHeight;
      tag.style.setProperty('--tx', Math.max(cw * .03, Math.min(cw * .97 - tw, x - tw / 2)) + 'px');
      tag.style.setProperty('--ty', (below ? Math.min(ch * .97 - th, m.offsetTop + m.offsetHeight * 1.04) : Math.max(ch * .03, m.offsetTop - th - m.offsetHeight * .04)) + 'px');
    };
    $$('.mini', cork).forEach(function (m) {
      m.addEventListener('mouseenter', function () { show(m); }); m.addEventListener('focus', function () { show(m); });
      m.addEventListener('mouseleave', function () { show(null); }); m.addEventListener('blur', function () { show(null); });
    });
  }

  // Topic map: pointing at a card lights its red strings and everything they reach.
  var tm = $('.tmap');
  if (tm) {
    var paths = $$('path', tm), cards = $$('[data-n]', tm);
    var light = function (n) {
      tm.classList.toggle('hl', !!n);
      var hit = {}; if (n) hit[n] = 1;
      paths.forEach(function (p) { var on = !!n && (p.dataset.a === n || p.dataset.b === n); p.classList.toggle('on', on); if (on) { hit[p.dataset.a] = 1; hit[p.dataset.b] = 1; } });
      cards.forEach(function (c) { c.classList.toggle('on', !!hit[c.dataset.n]); });
    };
    cards.forEach(function (c) {
      c.addEventListener('mouseenter', function () { light(c.dataset.n); }); c.addEventListener('focus', function () { light(c.dataset.n); });
      c.addEventListener('mouseleave', function () { light(null); }); c.addEventListener('blur', function () { light(null); });
    });
  }
  // Phone menu: close it once a link is picked.
  $$('.menu a').forEach(function (a) { a.addEventListener('click', function () { a.closest('details').open = false; }); });
  // The slim menu appears once you scroll past the hello scene (phones and reduced motion too).
  var hn = $('.homenav');
  if (hn) addEventListener('scroll', function () { hn.classList.toggle('on', scrollY > innerHeight * .9); }, { passive: true });
  if (reduce) return; // below: motion only

  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var range = function (attr, p) { if (!attr) return null; var a = attr.split(',').map(Number); return clamp((p - a[0]) / (a[1] - a[0])); };
  var lab = $('#lab');

  // Short windows: Fava's bubble moves down to clear the cork board (its bottom edge is at 35.2% of the scene).
  function zoomVars() {
    if (!lab) return;
    var sc = $('.scene', lab), h = sc.offsetHeight, top = sc.offsetTop;
    var bub = $('.bubble', lab), cast = $('.cast', lab);  // short windows: Fava's bubble moves down to clear the cork board
    if (bub && cast) { bub.style.translate = ''; var gap = top + .352 * h + 10 - (cast.offsetTop + bub.offsetTop); bub.style.translate = gap > 0 ? '0 ' + Math.round(gap) + 'px' : ''; }
  }

  // --p per scene; --z (lab zoom); --c per step of a sequence (one Short at a time, overlapping a little for the hand-over).
  var scenes = $$('[data-scene]'), buddy = $('.buddy'), stops = $$('[data-buddy]'), bposes = buddy ? $$('.pose', buddy) : [], queued = false;
  function update() {
    queued = false;
    var vh = innerHeight;
    scenes.forEach(function (s) {
      var r = s.getBoundingClientRect(), p;
      if (r.bottom < -vh || r.top > 2 * vh) return;
      p = clamp(s.dataset.scene === 'pin' ? -r.top / (r.height - vh) : (vh - r.top) / (vh * .8));
      s.style.setProperty('--p', p.toFixed(4));
      var z = range(s.dataset.z, p); if (z !== null) s.style.setProperty('--z', z.toFixed(4));
      var k = range(s.dataset.k, p), bd = $('[data-board]', s);
      if (bd && k !== null) {  // the board: hold on a row, then slide to the next; each row's cards flutter in as it arrives
        var rows = $$('.brow', bd), m = rows.length, x = k * m, f = x - Math.floor(x), base = Math.min(m - 1, Math.floor(x));
        var ease = function (t) { return t * t * (3 - 2 * t); };
        var rk = Math.min(m - 1, base + (base < m - 1 ? ease(clamp((f - .55) / .45)) : 0));
        bd.style.setProperty('--rk', rk.toFixed(4));
        bd.classList.toggle('live', z !== null && z > 0);
        rows.forEach(function (row, i) { row.style.setProperty('--c', (i ? clamp((x - i + .45) / .5) : clamp(x / .35)).toFixed(4)); });
      }
      if (k !== null) $$('[data-steps]', s).forEach(function (box) {
        var steps = $$('[data-step]', box), m = steps.length;
        steps.forEach(function (el, i) {
          var c = clamp((k * m - i + .25) / 1.5);
          if (i === 0) c = Math.max(c, .32);
          if (i === m - 1) c = Math.min(c, .6);
          el.style.setProperty('--c', c.toFixed(4));
        });
        var fa = $('.fava-act', s);
        if (fa && box.classList.contains('claims')) {  // Fava acts out each check: walk over, look, stamp, tick
          var i = Math.min(m - 1, Math.max(0, Math.floor(k * m))), c = parseFloat(steps[i].style.getPropertyValue('--c'));
          var act = c < .3 || c > .8 ? 'walk' : c < .34 ? 'mag' : c < .42 ? 'stamp' : 'tick';
          var fx = i % 2 ? '-24vw' : '0px';
          if (fa.style.getPropertyValue('--fx') !== fx) { fa.dataset.dir = i % 2 ? 'left' : 'right'; fa.style.setProperty('--fx', fx); }
          if (fa.dataset.act !== act) fa.dataset.act = act;
        }
      });
    });
    if (buddy) {
      var max = document.documentElement.scrollHeight - vh;
      buddy.style.setProperty('--g', clamp(scrollY / max).toFixed(4));
      var night = $('#night');
      buddy.classList.toggle('on', scrollY > vh * .5 && !(night && night.getBoundingClientRect().top < vh * .6));
      var cur = null;
      stops.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top < vh / 2 && r.bottom > vh / 2) cur = s.dataset.buddy; });
      if (cur) bposes.forEach(function (p) { p.classList.toggle('on', p.dataset.pose === cur); });
    }
  }
  addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', function () { zoomVars(); update(); });
  zoomVars(); update();
  var bdf = lab && $('[data-board]', lab);
  if (bdf) bdf.addEventListener('focusin', function (e) {  // Tab into the board: scroll to the row holding that card
    var row = e.target.closest('.brow'); if (!row) return;
    var rows = $$('.brow', bdf), i = rows.indexOf(row), k = lab.dataset.k.split(',').map(Number), p = k[0] + (k[1] - k[0]) * (i + .3) / rows.length;
    scrollTo(0, lab.offsetTop + p * (lab.offsetHeight - innerHeight));
  });

  // Mouse: eyes follow it, and the lab's paper layers shift a little (diorama parallax).
  var mx = 0, my = 0, eq = false;
  function look() {
    eq = false;
    $$('.eye').forEach(function (eye) {
      var r = eye.getBoundingClientRect();
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
      var x = mx - (r.left + r.width / 2), y = my - (r.top + r.height / 2), a = Math.atan2(y, x), k = Math.min(1, Math.hypot(x, y) / 260);
      eye.style.setProperty('--dx', (Math.cos(a) * k * r.width * .24).toFixed(1) + 'px');
      eye.style.setProperty('--dy', (Math.sin(a) * k * r.height * .24).toFixed(1) + 'px');
    });
    if (lab) { lab.style.setProperty('--mx', (mx / innerWidth * 2 - 1).toFixed(3)); lab.style.setProperty('--my', (my / innerHeight * 2 - 1).toFixed(3)); }
  }
  addEventListener('pointermove', function (e) {
    if (e.target.closest && e.target.closest('.cork')) return;  // over the cork board: hold still so the card under the pointer stays put
    mx = e.clientX; my = e.clientY; if (!eq) { eq = true; requestAnimationFrame(look); }
  }, { passive: true });
})();
