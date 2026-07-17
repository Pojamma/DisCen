// Main JavaScript for personal website
document.addEventListener('DOMContentLoaded', function() {
    console.log('Personal website loaded successfully!');
    
    // Add some basic interactivity
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            console.log('Navigating to:', this.href);
        });
    });
});
