// Loads navbar and footer for all pages
function loadSkeleton() {

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {                   
            console.log($('#navbarPlaceholder').load('./nav_after_login.html'));
            console.log($('#footerPlaceholder').load('./footer.html'));
        } else {
            console.log($('#navbarPlaceholder').load('./nav_before_login.html'));
            console.log($('#footerPlaceholder').load('./footer.html'));
        }
    });
}
loadSkeleton(); 