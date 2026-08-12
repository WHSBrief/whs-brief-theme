// WHS Brief public Change Tracker (/tracker/ and /jurisdiction/{slug}/).
// Flattens .wbd-tracker-item entries from recent #tracker posts (see
// tracker.hbs / jurisdiction.hbs) into a single, newest-first list capped to
// the last 12 months. Unlike register.js, no member-gating check is needed
// here — #tracker posts are always public, so {{content}} always renders in
// full. No-ops on every other page.
//
// /tracker/ additionally splits the list into a snapshot (aggregate counts),
// a 5-item preview, and the remainder inside a fade-gated wrapper with a
// subscribe CTA — see tracker.hbs's comment for why. /jurisdiction/{slug}/
// pages don't have a #wbd-tracker-snapshot element, so that branch never
// runs there and they keep rendering the full open list as before.
(function() {
    var source = document.getElementById('wbd-tracker-source');
    var isJurisdictionPage = !!window.location.pathname.match(/^\/jurisdiction\/([a-z]+)\/?/);
    var outputEl = document.getElementById('wbd-tracker-output');
    if (!source || !outputEl) {
        return;
    }

    var labels = {
        national: 'National',
        nsw: 'New South Wales',
        vic: 'Victoria',
        qld: 'Queensland',
        wa: 'Western Australia',
        sa: 'South Australia',
        tas: 'Tasmania',
        act: 'Australian Capital Territory',
        nt: 'Northern Territory',
        nz: 'New Zealand',
        standards: 'New & Updated Standards'
    };
    var statusLabels = {
        force: 'In force',
        upcoming: 'Upcoming',
        proposed: 'Proposed'
    };

    var jurMatch = window.location.pathname.match(/^\/jurisdiction\/([a-z]+)\/?/);
    var pageJur = isJurisdictionPage ? jurMatch[1] : null;

    if (isJurisdictionPage) {
        var heading = document.getElementById('wbd-jur-heading');
        var dek = document.getElementById('wbd-jur-dek');
        var name = labels[pageJur] || pageJur;
        if (heading) {
            heading.textContent = name + ': every WHS/OHS change tracked';
        }
        if (dek) {
            dek.textContent = "Every Act, Regulation, Code of practice and Standard change we've covered in the last 12 months for " + name + '. Headline and date only, for the full story on any item, see the weekly brief.';
        }
        var navLinks = document.querySelectorAll('.wbd-tracker-filter');
        for (var f = 0; f < navLinks.length; f++) {
            if (navLinks[f].getAttribute('href') === window.location.pathname) {
                navLinks[f].classList.add('is-active');
            }
        }
    }

    var items = source.querySelectorAll('.wbd-tracker-item');
    var cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);

    var list = [];
    var i;
    for (i = 0; i < items.length; i++) {
        var el = items[i];
        var jur = el.getAttribute('data-jur') || '';
        var dateStr = el.getAttribute('data-date') || '';
        var status = el.getAttribute('data-status') || '';
        var date = dateStr ? new Date(dateStr) : null;

        if (isJurisdictionPage && jur !== pageJur) {
            continue;
        }
        if (date && date < cutoff) {
            continue;
        }
        list.push({ el: el, jur: jur, date: date, dateStr: dateStr, status: status });
    }

    list.sort(function(a, b) {
        var ta = a.date ? a.date.getTime() : 0;
        var tb = b.date ? b.date.getTime() : 0;
        return tb - ta;
    });

    function buildRow(entry) {
        var row = document.createElement('div');
        row.className = 'wbd-tracker-row';
        row.setAttribute('data-jur', entry.jur);

        var meta = document.createElement('div');
        meta.className = 'wbd-tracker-meta';

        var jurTag = document.createElement('span');
        jurTag.className = 'wbd-tracker-jur';
        jurTag.textContent = labels[entry.jur] || entry.jur;

        var statusTag = document.createElement('span');
        statusTag.className = 'wbd-tag' + (entry.status ? ' wbd-' + entry.status : '');
        statusTag.textContent = statusLabels[entry.status] || entry.status;

        var dateTag = document.createElement('span');
        dateTag.className = 'wbd-tracker-date';
        dateTag.textContent = entry.date
            ? entry.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
            : entry.dateStr;

        meta.appendChild(jurTag);
        meta.appendChild(statusTag);
        meta.appendChild(dateTag);

        // Plain text, not a link to the external source — an outbound link
        // here gives a visitor an easy way to leave the site instead of
        // subscribing, which works against the whole point of the gate.
        var headline = document.createElement('div');
        headline.className = 'wbd-tracker-headline';
        headline.textContent = entry.el.textContent.trim();

        row.appendChild(meta);
        row.appendChild(headline);
        return row;
    }

    if (list.length === 0) {
        var snapshotEl = document.getElementById('wbd-tracker-snapshot');
        if (snapshotEl) {
            snapshotEl.innerHTML = '';
        }
        var previewEl = document.getElementById('wbd-tracker-preview');
        if (previewEl) {
            previewEl.innerHTML = '';
        }
        var gatedEl = document.getElementById('wbd-tracker-gated');
        if (gatedEl) {
            gatedEl.style.display = 'none';
        }
        var ctaEl = document.querySelector('.wbd-tracker-cta');
        if (ctaEl) {
            ctaEl.style.display = 'none';
        }
        outputEl.innerHTML = '<p class="wbd-none">No tracked changes yet' + (isJurisdictionPage ? ' for this jurisdiction' : '') + '. Check back after the next weekly brief.</p>';
        return;
    }

    if (isJurisdictionPage) {
        var frag = document.createDocumentFragment();
        for (i = 0; i < list.length; i++) {
            frag.appendChild(buildRow(list[i]));
        }
        outputEl.innerHTML = '';
        outputEl.appendChild(frag);
        return;
    }

    // /tracker/ only, from here down: snapshot tiles + chips, a 5-item
    // preview, then the remainder inside the fade-gated wrapper.
    var snapshotWrap = document.getElementById('wbd-tracker-snapshot');
    if (snapshotWrap) {
        var counts = { force: 0, upcoming: 0, proposed: 0 };
        var jurCounts = {};
        for (i = 0; i < list.length; i++) {
            var s = list[i].status;
            if (counts[s] !== undefined) {
                counts[s]++;
            }
            var j = list[i].jur;
            jurCounts[j] = (jurCounts[j] || 0) + 1;
        }
        var movingCount = counts.upcoming + counts.proposed;

        var jurOrder = Object.keys(jurCounts).sort(function(a, b) {
            return jurCounts[b] - jurCounts[a];
        });

        var tilesHtml = ''
            + '<div class="wbd-tracker-tile">'
            + '<span class="wbd-tracker-tile-num">' + list.length + '</span>'
            + '<span class="wbd-tracker-tile-label">Changes tracked</span>'
            + '</div>'
            + '<div class="wbd-tracker-tile wbd-tracker-tile-force">'
            + '<span class="wbd-tracker-tile-num">' + counts.force + '</span>'
            + '<span class="wbd-tracker-tile-label">In force</span>'
            + '</div>'
            + '<div class="wbd-tracker-tile wbd-tracker-tile-upcoming">'
            + '<span class="wbd-tracker-tile-num">' + movingCount + '</span>'
            + '<span class="wbd-tracker-tile-label">Upcoming + proposed</span>'
            + '</div>';

        var chipsHtml = jurOrder.map(function(j) {
            return '<span class="wbd-tracker-chip">' + (labels[j] || j) + ' · ' + jurCounts[j] + '</span>';
        }).join('');

        snapshotWrap.innerHTML = ''
            + '<div class="wbd-tracker-tiles">' + tilesHtml + '</div>'
            + '<div class="wbd-tracker-chips">' + chipsHtml + '</div>';
    }

    var PREVIEW_COUNT = 5;
    var previewWrap = document.getElementById('wbd-tracker-preview');
    if (previewWrap) {
        var previewFrag = document.createDocumentFragment();
        for (i = 0; i < Math.min(PREVIEW_COUNT, list.length); i++) {
            previewFrag.appendChild(buildRow(list[i]));
        }
        previewWrap.innerHTML = '';
        previewWrap.appendChild(previewFrag);
    }

    var rest = list.slice(PREVIEW_COUNT);
    var gatedWrap = document.getElementById('wbd-tracker-gated');
    var ctaWrap = document.querySelector('.wbd-tracker-cta');
    var ctaHead = ctaWrap ? ctaWrap.querySelector('.wbd-tracker-cta-head') : null;
    if (rest.length === 0) {
        if (gatedWrap) {
            gatedWrap.style.display = 'none';
        }
        if (ctaWrap) {
            ctaWrap.style.display = 'none';
        }
    } else {
        var restFrag = document.createDocumentFragment();
        for (i = 0; i < rest.length; i++) {
            restFrag.appendChild(buildRow(rest[i]));
        }
        outputEl.innerHTML = '';
        outputEl.appendChild(restFrag);
        if (ctaHead) {
            ctaHead.textContent = 'See all ' + list.length + ' tracked changes';
        }
    }
    // No filter-nav click handler here on purpose — /tracker/ no longer has
    // a .wbd-tracker-filters row (see tracker.hbs's comment for why). This
    // file still handles jurisdiction.hbs's own is-active highlighting
    // above, since that page's nav is real navigation, not this.
})();
