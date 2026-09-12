document.querySelectorAll('.has-submenu > a').forEach(parentLink => {
    parentLink.addEventListener('click', function(e) {
        // Działaj tylko na mobile
        if (window.innerWidth <= 768) {
            e.preventDefault();
            const parentLi = this.parentElement;
            // Przełączanie klasy open na rodzicu (otwórz/zamknij)
            parentLi.classList.toggle('open');
            // Zamknij inne otwarte podmenu, jeśli istnieją
            document.querySelectorAll('.has-submenu').forEach(other => {
                if (other !== parentLi) other.classList.remove('open');
            });
        }
    });
});
// DODATKOWO: Zamknij submenu po kliknięciu w konkretny link wewnątrz niego
document.querySelectorAll('.submenu a').forEach(subLink => {
    subLink.addEventListener('click', () => {
        document.querySelectorAll('.has-submenu').forEach(el => {
            el.classList.remove('open');
        });
    });
});

function changeFB(pageName) {
    const iframe = document.getElementById('fb-iframe');
    const newSrc = `https://www.facebook.com/plugins/page.php?href=https://www.facebook.com/${pageName}/&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=true&show_facepile=true&locale=pl_PL`;
    iframe.src = newSrc;
}
