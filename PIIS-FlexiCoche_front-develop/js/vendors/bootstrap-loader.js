const linkBootstrap = document.createElement('link');
linkBootstrap.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
linkBootstrap.rel = 'stylesheet';
document.head.appendChild(linkBootstrap);

const scriptBootstrap = document.createElement('script');
scriptBootstrap.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
document.body.appendChild(scriptBootstrap);