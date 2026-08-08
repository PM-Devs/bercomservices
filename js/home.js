document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.home-menu');
    var links = document.querySelector('.home-links');
    if (!button || !links) return;
    button.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
        button.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
});
