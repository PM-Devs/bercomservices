(function () {
    "use strict";

    // Generic repeater: any [data-repeater] container holds .repeater-item rows;
    // [data-repeater-add] clones the last row (or an embedded <template>) and, when the
    // container declares a bracket-index prefix (data-repeater="fieldName"), renumbers
    // every row's bracket-indexed input names so they stay a dense 0..n-1 array — this is
    // what lets Express's bracket-notation body parsing work reliably. Repeaters whose
    // fields are parsed server-side as parallel same-name arrays (no brackets) simply have
    // no data-repeater prefix to match, so this is a no-op for them — DOM order is enough.
    function renumber(container) {
        var prefix = container.getAttribute('data-repeater');
        if (!prefix) return;
        var items = container.querySelectorAll(':scope > .repeater-item');
        items.forEach(function (item, index) {
            item.querySelectorAll('[name]').forEach(function (input) {
                input.name = input.name.replace(
                    new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\[\\d+\\]'),
                    prefix + '[' + index + ']'
                );
            });
        });
    }

    document.querySelectorAll('[data-repeater-add]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var containerId = btn.getAttribute('data-repeater-add');
            var container = document.getElementById(containerId);
            if (!container) return;

            var template = container.querySelector('template');
            var newItem;
            if (template) {
                newItem = template.content.firstElementChild.cloneNode(true);
            } else {
                var items = container.querySelectorAll(':scope > .repeater-item');
                if (!items.length) return;
                newItem = items[items.length - 1].cloneNode(true);
                newItem.querySelectorAll('input, textarea, select').forEach(function (el) {
                    if (el.type === 'checkbox' || el.type === 'radio') { el.checked = false; }
                    else { el.value = ''; }
                });
            }
            container.appendChild(newItem);
            renumber(container);
        });
    });

    document.addEventListener('click', function (e) {
        var removeBtn = e.target.closest('.repeater-remove');
        if (!removeBtn) return;
        e.preventDefault();
        var item = removeBtn.closest('.repeater-item');
        var container = item ? item.closest('[data-repeater]') : null;
        if (item) item.remove();
        if (container) renumber(container);
    });

    // Confirm destructive actions (delete buttons carry data-confirm="message").
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (form.hasAttribute('data-confirm') && !window.confirm(form.getAttribute('data-confirm'))) {
            e.preventDefault();
        }
    });

    // Mobile sidebar toggle
    var sidebarToggle = document.getElementById('adminSidebarToggle');
    var sidebar = document.querySelector('.admin-sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });
    }

    // Auto-dismiss flash alerts
    document.querySelectorAll('.admin-flash').forEach(function (el) {
        setTimeout(function () { el.style.display = 'none'; }, 6000);
    });
})();
