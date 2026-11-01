// Markdown office : compléments au DSFR
(function () {
  // Bouton Copier sur les blocs de code
  document.querySelectorAll('.mo-content pre:not(.mermaid)').forEach(function (pre) {
    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'fr-btn fr-btn--sm fr-btn--tertiary fr-icon-clipboard-line fr-btn--icon-left mo-copy'
    btn.textContent = 'Copier'
    btn.addEventListener('click', function () {
      var text = pre.innerText.replace(/\nCopier$|^Copier\n|Copié$/g, '')
      var code = pre.querySelector('code')
      if (code) text = code.innerText
      var done = function () { btn.textContent = 'Copié'; setTimeout(function () { btn.textContent = 'Copier' }, 1500) }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done)
      else { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done() } catch (e) {} t.remove() }
    })
    pre.classList.add('mo-pre')
    pre.appendChild(btn)
  })

  // Diaporama : une diapositive à la fois, flèches du clavier, plein écran
  document.querySelectorAll('.mo-slides').forEach(function (box) {
    var slides = box.querySelectorAll('.mo-slide')
    var i = 0
    var count = box.querySelector('.mo-slides__count')
    var show = function (n) {
      i = Math.max(0, Math.min(slides.length - 1, n))
      slides.forEach(function (s, k) { s.hidden = k !== i })
      count.textContent = (i + 1) + ' / ' + slides.length
    }
    box.classList.add('mo-slides--js')
    box.querySelector('.mo-slides__prev').addEventListener('click', function () { show(i - 1) })
    box.querySelector('.mo-slides__next').addEventListener('click', function () { show(i + 1) })
    box.querySelector('.mo-slides__full').addEventListener('click', function () { if (box.requestFullscreen) box.requestFullscreen() })
    box.tabIndex = 0
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { show(i + 1); e.preventDefault() }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { show(i - 1); e.preventDefault() }
    })
    show(0)
  })

  // Page de recherche : index chargé par recherche-index.js (window.MO_INDEX)
  var results = document.getElementById('mo-results')
  if (!results || !window.MO_INDEX) return
  var norm = function (s) { return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() }
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
  var q = new URLSearchParams(location.search).get('q') || ''
  var input = document.getElementById('mo-search-input')
  if (input) input.value = q
  var head = document.getElementById('header-search-input')
  if (head) head.value = q
  // Mots cherchés, raccourcis de leur terminaison (« générer » trouve « généré », « générés »…)
  var terms = norm(q).split(/[^a-z0-9]+/).filter(function (t) { return t.length > 1 }).map(function (t) { return t.length > 5 ? t.slice(0, -2) : t.length > 4 ? t.slice(0, -1) : t })
  if (!terms.length) { results.innerHTML = '<p>Saisissez un ou plusieurs mots.</p>'; return }
  var found = []
  window.MO_INDEX.forEach(function (e) {
    var t = norm(e.t), s = norm(e.s), x = norm(e.x), score = 0
    for (var k = 0; k < terms.length; k++) {
      var w = terms[k], hit = 0
      if (t.indexOf(w) >= 0) hit += 10
      if (s.indexOf(w) >= 0) hit += 6
      if (x.indexOf(w) >= 0) hit += 1 + Math.min(4, x.split(w).length - 2)
      if (!hit) return
      score += hit
    }
    found.push({ e: e, score: score })
  })
  found.sort(function (a, b) { return b.score - a.score })
  var extract = function (text) {
    var n = norm(text), at = n.indexOf(terms[0])
    var start = Math.max(0, at - 80), part = text.slice(start, start + 260)
    var html = esc(part.normalize('NFD'))
    terms.forEach(function (w) {
      var re = new RegExp('(' + w.split('').map(function (c) { return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }).join('[\\u0300-\\u036f]*') + '[a-zA-Z0-9\\u00C0-\\u024F\\u0300-\\u036f]*)', 'gi')
      html = html.replace(re, '<mark>$1</mark>')
    })
    return (start > 0 ? '… ' : '') + html + (start + 260 < text.length ? ' …' : '')
  }
  var title = document.getElementById('mo-results-title')
  if (title) title.textContent = found.length ? found.length + ' résultat' + (found.length > 1 ? 's' : '') + ' pour « ' + q + ' »' : 'Aucun résultat pour « ' + q + ' »'
  results.innerHTML = found.slice(0, 60).map(function (r) {
    var e = r.e
    var label = e.s ? esc(e.t) + ' › ' + esc(e.s) : esc(e.t)
    return '<li class="mo-result"><h2 class="fr-h6"><a href="../' + e.u + (e.a ? '#' + e.a : '') + '">' + label + '</a></h2><p class="fr-text--sm">' + extract(e.x || e.t) + '</p></li>'
  }).join('')
})()
