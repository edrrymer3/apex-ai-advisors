// Apex AI Advisors — Unified Nav JS
// Works with .apex-nav + .apex-hamburger + .apex-mobile-menu

(function() {
    const ham = document.querySelector('.apex-hamburger');
    const mobileMenu = document.querySelector('.apex-mobile-menu');
    if (!ham || !mobileMenu) return;

    function openMenu() {
        mobileMenu.classList.add('open');
        ham.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('open');
        ham.classList.remove('open');
        document.body.style.overflow = '';
    }

    ham.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close when a link is tapped
    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMenu);
    });

    // Close on outside tap
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('open') &&
            !mobileMenu.contains(e.target) &&
            !ham.contains(e.target)) {
            closeMenu();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });
})();
