import { gsap } from 'gsap';

export default class Logo {
    constructor(el) {
        this.DOM = {el: el};
        const filter = this.DOM.el.querySelector('svg filter');
        this.DOM.feTurbulence = filter.querySelector('feTurbulence');
        this.DOM.feDisplacement = filter.querySelector('feDisplacementMap');
        this.DOM.feBlurHeavy = filter.querySelector('.blur-heavy');
        this.DOM.feRegionDrift = filter.querySelector('.region-drift');
        this.DOM.feRegionContrast = filter.querySelector('.region-contrast');
        this.primitiveValues = {
            baseFrequency: 0.012,
            scale: 3,
            heavyBlur: 11,
            driftX: -80,
            driftY: -10,
            // lower value = the melting patches cover more of the word
            regionThreshold: -3.3
        };

        this.createTimelines();
        this.initEvents();
    }
    render() {
        const v = this.primitiveValues;
        this.DOM.feTurbulence.setAttribute('baseFrequency', v.baseFrequency);
        this.DOM.feDisplacement.setAttribute('scale', v.scale);
        this.DOM.feBlurHeavy.setAttribute('stdDeviation', v.heavyBlur);
        this.DOM.feRegionDrift.setAttribute('dx', v.driftX);
        this.DOM.feRegionDrift.setAttribute('dy', v.driftY);
        this.DOM.feRegionContrast.setAttribute('values', `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  7 0 0 0 ${v.regionThreshold}`);
    }
    initEvents() {
        // A real hover takes over from the automatic pulse until the mouse leaves
        this.DOM.el.addEventListener('mouseenter', () => {
            this.autoTl.pause();
            this.hoverTl.play();
        });
        this.DOM.el.addEventListener('mouseleave', () => {
            this.hoverTl.reverse();
            this.autoTl.play();
        });
    }
    createTimelines() {
        const render = () => this.render();

        // Different durations keep the idle motion from looking like an obvious loop
        gsap.to(this.primitiveValues, {
            duration: 4,
            ease: 'sine.inOut',
            baseFrequency: 0.014,
            yoyo: true,
            repeat: -1,
            onUpdate: render
        });
        gsap.to(this.primitiveValues, {
            duration: 14,
            ease: 'sine.inOut',
            driftX: 80,
            yoyo: true,
            repeat: -1,
            onUpdate: render
        });
        gsap.to(this.primitiveValues, {
            duration: 9,
            ease: 'sine.inOut',
            driftY: 10,
            yoyo: true,
            repeat: -1,
            onUpdate: render
        });

        this.hoverTl = gsap.timeline({
            paused: true,
            onUpdate: render
        })
        .to(this.primitiveValues, {
            duration: 0.6,
            ease: 'power2.inOut',
            scale: 30,
            heavyBlur: 15,
            regionThreshold: -2.2
        });

        // Fake a hover every 3 seconds: melt, hold briefly, settle back
        this.autoTl = gsap.timeline({repeat: -1, repeatDelay: 2.1, delay: 1})
        .add(() => this.hoverTl.play(), 0)
        .add(() => this.hoverTl.reverse(), 0.9);
    }
}
