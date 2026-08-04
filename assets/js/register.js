// WHS Brief jurisdiction register (/register/). Reorganises the already
// member-gated post content Ghost rendered into #wbd-register-source
// (see register.hbs) by jurisdiction instead of by week, and wires up the
// jurisdiction filter tabs. No-ops on every other page.
(function() {
    var source = document.getElementById('wbd-register-source');
    var output = document.getElementById('wbd-register-output');
    var tabs = document.getElementById('wbd-register-tabs');
    if (!source || !output) {
        return;
    }

    var order = ['national', 'nsw', 'vic', 'qld', 'wa', 'sa', 'tas', 'act', 'nt', 'nz', 'standards', 'courts'];
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
        standards: 'New & Updated Standards',
        courts: 'In the Courts'
    };

    var groups = {};
    var i, j, k;
    for (i = 0; i < order.length; i++) {
        groups[order[i]] = [];
    }

    var postBlocks = source.querySelectorAll('.wbd-register-post');
    var gatedCount = 0;

    for (i = 0; i < postBlocks.length; i++) {
        var block = postBlocks[i];
        var postDate = block.getAttribute('data-date') || '';
        var postUrl = block.getAttribute('data-url') || '#';
        var jurisSections = block.querySelectorAll('.whs-brief-doc .wbd-juris');

        if (jurisSections.length === 0) {
            // No .wbd-juris sections found — this post rendered as Ghost's
            // locked/teaser markup for this visitor (not a paying member),
            // not the full brief. Count it and move on; never try to read
            // gated content another way.
            gatedCount++;
            continue;
        }

        for (j = 0; j < jurisSections.length; j++) {
            var section = jurisSections[j];
            var jid = section.id;
            if (!groups[jid]) {
                continue;
            }
            var items = section.querySelectorAll('.wbd-item');
            for (k = 0; k < items.length; k++) {
                var clone = items[k].cloneNode(true);
                var prov = document.createElement('div');
                prov.className = 'wbd-register-prov';
                prov.innerHTML = postDate + ' &middot; <a href="' + postUrl + '">Full brief ↗</a>';
                clone.appendChild(prov);
                groups[jid].push(clone);
            }
        }
    }

    if (postBlocks.length > 0 && gatedCount === postBlocks.length) {
        output.innerHTML = '<p class="wbd-register-locked">Subscribe to unlock the full jurisdiction register.</p>';
        return;
    }

    var frag = document.createDocumentFragment();
    for (i = 0; i < order.length; i++) {
        var jid2 = order[i];
        var list = groups[jid2];
        var groupEl = document.createElement('section');
        groupEl.className = 'wbd-register-group';
        groupEl.setAttribute('data-jur', jid2);

        var heading = document.createElement('h2');
        heading.textContent = labels[jid2];
        groupEl.appendChild(heading);

        if (list.length === 0) {
            var none = document.createElement('p');
            none.className = 'wbd-none';
            none.textContent = 'No items in the last six months.';
            groupEl.appendChild(none);
        } else {
            for (j = 0; j < list.length; j++) {
                groupEl.appendChild(list[j]);
            }
        }
        frag.appendChild(groupEl);
    }

    output.innerHTML = '';
    output.appendChild(frag);

    if (tabs) {
        tabs.addEventListener('click', function(e) {
            var btn = e.target.closest('.wbd-register-tab');
            if (!btn || !tabs.contains(btn)) {
                return;
            }
            var jur = btn.getAttribute('data-jur');

            var allTabs = tabs.querySelectorAll('.wbd-register-tab');
            for (var t = 0; t < allTabs.length; t++) {
                allTabs[t].classList.remove('is-active');
            }
            btn.classList.add('is-active');

            var allGroups = output.querySelectorAll('.wbd-register-group');
            for (var g = 0; g < allGroups.length; g++) {
                var groupIsMatch = (jur === 'all' || allGroups[g].getAttribute('data-jur') === jur);
                allGroups[g].style.display = groupIsMatch ? '' : 'none';
            }
        });
    }
})();
