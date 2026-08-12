// WHS Brief public Change Tracker (/tracker/ and /jurisdiction/{slug}/).
// Flattens .wbd-tracker-item entries from recent #tracker posts (see
// tracker.hbs / jurisdiction.hbs) into a single, newest-first list capped to
// the last 12 months. Unlike register.js, no member-gating check is needed
// here — #tracker posts are always public, so {{content}} always renders in
// full. No-ops on every other page.
(function() {
    var source = document.getElementById('wbd-tracker-source');
    var output = document.getElementById('wbd-tracker-output');
    if (!source || !output) {
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
    var isJurisdictionPage = !!jurMatch;
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

    if (list.length === 0) {
        output.innerHTML = '<p class="wbd-none">No tracked changes yet' + (isJurisdictionPage ? ' for this jurisdiction' : '') + '. Check back after the next weekly brief.</p>';
        return;
    }

    var frag = document.createDocumentFragment();
    for (i = 0; i < list.length; i++) {
        var entry = list[i];
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

        var headline = entry.el.cloneNode(true);
        headline.removeAttribute('data-jur');
        headline.removeAttribute('data-date');
        headline.removeAttribute('data-status');
        headline.className = 'wbd-tracker-headline';

        row.appendChild(meta);
        row.appendChild(headline);
        frag.appendChild(row);
    }

    output.innerHTML = '';
    output.appendChild(frag);

    // Only /tracker/ has JS-only filters (All / National / Standards) mixed
    // in among its real links to the 9 jurisdiction pages. /jurisdiction/
    // pages only ever show real links (no data-jur attribute), so they just
    // navigate normally and never reach this listener.
    if (!isJurisdictionPage) {
        var filterNav = document.querySelector('.wbd-tracker-filters');
        if (filterNav) {
            filterNav.addEventListener('click', function(e) {
                var link = e.target.closest('.wbd-tracker-filter');
                if (!link || !filterNav.contains(link)) {
                    return;
                }
                var jur = link.getAttribute('data-jur');
                if (!jur) {
                    return; // real link to its own /jurisdiction/{slug}/ page, let it navigate
                }
                e.preventDefault();

                var allFilters = filterNav.querySelectorAll('.wbd-tracker-filter');
                for (var t = 0; t < allFilters.length; t++) {
                    allFilters[t].classList.remove('is-active');
                }
                link.classList.add('is-active');

                var rows = output.querySelectorAll('.wbd-tracker-row');
                for (var r = 0; r < rows.length; r++) {
                    var rowMatches = (jur === 'all' || rows[r].getAttribute('data-jur') === jur);
                    rows[r].style.display = rowMatches ? '' : 'none';
                }
            });
        }
    }
})();
