(() => {
    const params = new URLSearchParams(location.search);
    const DURATION = 59;
    const FPS = Number(params.get('fps')) || 60;
    const TAU = Math.PI * 2;

    const filter = document.querySelector('#goo');
    const el = {
        noise: filter.querySelector('.noise'),
        blurHeavy: filter.querySelector('.blur-heavy'),
        regionDrift: filter.querySelector('.region-drift')
    };

    function renderFrame(i) {
        const t = i / FPS;
        // Motion oscillates much faster for more visible, fluid change
        el.noise.setAttribute('baseFrequency', 0.013 - 0.0015 * Math.cos(TAU * 12 * t / DURATION));
        el.regionDrift.setAttribute('dx', -140 * Math.cos(TAU * 4 * t / DURATION));
        el.regionDrift.setAttribute('dy', -30 * Math.cos(TAU * 6 * t / DURATION));
        // Melt intensity pulses much faster, creating rapid blob-like merging
        const pulse = 0.5 + 0.5 * Math.sin(TAU * 8 * t / DURATION);
        el.blurHeavy.setAttribute('stdDeviation', 14 + 12 * pulse);
    }

    window.LOOP = {duration: DURATION, fps: FPS};
    window.renderFrame = renderFrame;
    window.ready = Promise.resolve().then(() => renderFrame(0));

    // Opening the page in a browser plays the loop in real time for a quick preview
    if (params.has('preview')) {
        document.body.classList.add('preview');
        const t0 = performance.now();
        const tick = (now) => {
            renderFrame(Math.floor((now - t0) / 1000 * FPS));
            requestAnimationFrame(tick);
        };
        window.ready.then(() => requestAnimationFrame(tick));
    }
})();
