import Logo from './logo';
import { preloadFonts } from '../utils';

// Preload typekit fonts
preloadFonts('dba6omz').then(() => {
    document.body.classList.remove('loading');
});

const logo = new Logo(document.querySelector('.logo'));
