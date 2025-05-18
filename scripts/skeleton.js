function loadSkeleton() {
    const isAuthenticated = !!document.cookie.match(/session/);

    const navbarFile = isAuthenticated ? '/text/nav_after_login.html' : '/text/nav_before_login.html';
    const footerFile = '/text/footer.html';

    // Load navbar
    fetch(navbarFile)
        .then(response => response.text())
        .then(data => document.getElementById('navbarPlaceholder').innerHTML = data);

    // Load footer
    fetch(footerFile)
        .then(response => response.text())
        .then(data => document.getElementById('footerPlaceholder').innerHTML = data);
}

loadSkeleton();

