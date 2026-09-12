const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');
const themeToggle = document.getElementById('themeToggle');
let isPlaying = false;
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});
closeSidebar.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

function closeMenu() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light');
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
}
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    if (document.body.classList.contains('light')) {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
});
const links = document.querySelectorAll('.nav-menu a');
links.forEach(link => {
    link.addEventListener('click', () => {
        links.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
        if (window.innerWidth < 900) {
            closeMenu();
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('radioPlayer');
    const playBtn = document.getElementById('playBtn');
    let isPlaying = false;
    playBtn.addEventListener('click', () => {
        if (!isPlaying) {
            player.play();
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            isPlaying = true;
        } else {
            player.pause();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            isPlaying = false;
        }
    });
});
