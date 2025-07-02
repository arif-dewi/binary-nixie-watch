import { SVGDefinitions } from './svg-definitions.js';
import { AudioManager } from './audio-manager.js';

const SECTION_KEYS = ['hours', 'minutes', 'seconds'];

export class BinaryNixieWatch {
  constructor() {
    this.isStarting = true;
    this.previousBinaryStates = {
      hours: '',
      minutes: '',
      seconds: ''
    };
    this.isPointerDown = false;
    this.lastPointerPosition = { x: 0, y: 0 };

    this.svgDefinitions = new SVGDefinitions();
    this.audioManager = new AudioManager();

    this.setupEventListeners();
    this.initializeWatch();
  }

  setupEventListeners() {
    this.setupPointerEvents();
    this.setupSoundToggle();
    this.setupOrientationChange();
  }

  setupPointerEvents() {
    const handleMove = (e) => {
      if (this.isStarting) return;

      const isTouch = e.type === 'touchmove';
      const point = isTouch ? e.touches?.[0] : e;
      if (!point) return;

      if (isTouch) e.preventDefault(); // prevent scroll

      const x = (point.clientX / window.innerWidth - 0.5) * 2;
      const y = (point.clientY / window.innerHeight - 0.5) * 2;
      const isMobile = window.innerWidth <= 768;

      d3.select('#watchContainer')
        .style('transform', `rotateY(${x * (isMobile ? 4 : 8)}deg) rotateX(${-y * (isMobile ? 3 : 5)}deg)`);

      document.documentElement.style.setProperty('--glow-x', `${point.clientX / window.innerWidth * 100}%`);
      document.documentElement.style.setProperty('--glow-y', `${point.clientY / window.innerHeight * 100}%`);
    };

    const resetPosition = () => {
      d3.select('#watchContainer').style('transform', 'rotateY(0deg) rotateX(0deg)');
      document.documentElement.style.setProperty('--glow-x', '50%');
      document.documentElement.style.setProperty('--glow-y', '50%');
    };

    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) resetPosition();
    }, { passive: true });
  }

  setupSoundToggle() {
    d3.select('#soundToggle')
      .on('click', async (e) => {
        e.preventDefault();
        try {
          await this.audioManager.toggleSound();
        } catch {
          const btn = d3.select('#soundToggle');
          btn.classed('active', false);
          btn.select('.sound-icon').text('🔇');
        }
      });
  }

  setupOrientationChange() {
    const reset = () => {
      d3.select('#watchContainer').style('transform', 'rotateY(0deg) rotateX(0deg)');
      document.documentElement.style.setProperty('--glow-x', '50%');
      document.documentElement.style.setProperty('--glow-y', '50%');
      this.updateTubeSizes();
    };
    window.addEventListener('orientationchange', () => setTimeout(reset, 100), { passive: true });
    window.addEventListener('resize', reset, { passive: true });
  }

  updateTubeSizes() {
    const [isMobile, isSmall] = [window.innerWidth <= 768, window.innerWidth <= 480];
    const sizes = {
      hours: [300, 100],
      minutes: [360, 100],
      seconds: [360, 100]
    };
    if (isSmall) sizes.hours = [250, 80], sizes.minutes = sizes.seconds = [300, 80];
    else if (isMobile) sizes.hours = [280, 90], sizes.minutes = sizes.seconds = [330, 90];

    for (const key of SECTION_KEYS) {
      d3.select(`#${key}Svg`).attr('width', sizes[key][0]).attr('height', sizes[key][1]);
    }

    if (!this.isStarting) {
      this.createTubes('#hoursSvg', 5);
      this.createTubes('#minutesSvg', 6);
      this.createTubes('#secondsSvg', 6);
    }
  }

  async initializeWatch() {
    await this.startupSequence();
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  async startupSequence() {
    await new Promise(r => setTimeout(r, 2000));
    d3.select('#startup').transition().duration(500).style('opacity', 0).on('end', () => {
      d3.select('#startup').style('display', 'none');
      this.isStarting = false;
      this.updateTubeSizes();
    });
    await this.animateTubesStartup();
  }

  async animateTubesStartup() {
    const svgs = [
      { id: '#hoursSvg', bits: 5 },
      { id: '#minutesSvg', bits: 6 },
      { id: '#secondsSvg', bits: 6 }
    ];

    for (let i = 0; i < svgs.length; i++) {
      this.createTubes(svgs[i].id, svgs[i].bits, true);
      if (this.audioManager.soundEnabled && this.audioManager.isInitialized) {
        this.audioManager.playStartupSequenceSound(i);
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }

  createTubes(svgId, bitCount, animate = false) {
    const svg = d3.select(svgId).selectAll('.tube').remove().data([]);
    const [svgW, svgH] = [+d3.select(svgId).attr('width'), +d3.select(svgId).attr('height')];
    const [isMobile, isSmall] = [window.innerWidth <= 768, window.innerWidth <= 480];

    const [tubeW, tubeH, spacing] = isSmall
      ? [35, 55, 42]
      : isMobile ? [40, 65, 48] : [45, 70, 55];

    const startX = (svgW - (bitCount * spacing - (spacing - tubeW))) / 2;
    const data = Array.from({ length: bitCount }, (_, i) => ({
      id: i,
      x: startX + i * spacing,
      y: (svgH - tubeH) / 2,
      power: Math.pow(2, bitCount - 1 - i)
    }));

    const tubes = d3.select(svgId).selectAll('.tube')
      .data(data)
      .enter().append('g')
      .attr('class', 'tube')
      .style('opacity', animate ? 0 : 1)
      .on('click', (e, d) => this.toggleBit(e, d))
      .on('touchstart', (e, d) => {
        e.preventDefault();
        this.showTooltip(e, d);
        setTimeout(() => this.hideTooltip(), 2000);
      })
      .on('mouseover', (e, d) => {
        if (!('ontouchstart' in window)) {
          this.showTooltip(e, d);
        }
      })
      .on('mouseout', () => this.hideTooltip());

    tubes.append('rect')
      .attr('x', d => d.x).attr('y', d => d.y)
      .attr('width', tubeW).attr('height', tubeH)
      .attr('rx', tubeW / 2)
      .attr('fill', 'url(#tubeGradient)')
      .attr('stroke', 'rgba(255,165,0,0.3)')
      .attr('stroke-width', 1.5);

    tubes.append('ellipse')
      .attr('cx', d => d.x + tubeW / 2)
      .attr('cy', d => d.y + tubeH * 0.2)
      .attr('rx', tubeW * 0.25)
      .attr('ry', tubeH * 0.12)
      .attr('fill', 'rgba(255,255,255,0.2)');

    const fontSize = isSmall ? '20px' : isMobile ? '24px' : '28px';
    tubes.append('text')
      .attr('class', 'tube-digit')
      .attr('x', d => d.x + tubeW / 2)
      .attr('y', d => d.y + tubeH / 2 + (isSmall ? 6 : 8))
      .attr('text-anchor', 'middle')
      .attr('font-size', fontSize)
      .attr('font-family', 'Courier New, monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#ff6a00')
      .attr('opacity', 0.3)
      .text('0');

    tubes
      .on('click', (e, d) => this.toggleBit(e, d))
      .on('touchstart', (e, d) => {
        e.preventDefault();
        this.showTooltip(e, d);
        setTimeout(() => this.hideTooltip(), 2000);
      });

    if (animate) {
      tubes.transition().duration(400).delay((_, i) => i * 100).style('opacity', 1);
    }
  }

  updateTime() {
    const now = new Date();
    const sections = {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds()
    };

    d3.select('#timeDisplay').text(
      `${sections.hours.toString().padStart(2, '0')}:${sections.minutes.toString().padStart(2, '0')}:${sections.seconds.toString().padStart(2, '0')}`
    );

    for (const key of SECTION_KEYS) {
      this.updateBinaryDisplay(`#${key}Svg`, sections[key], key, key === 'hours' ? 5 : 6);
    }
  }

  updateBinaryDisplay(svgId, value, key, bitCount) {
    const binary = value.toString(2).padStart(bitCount, '0');
    if (this.previousBinaryStates[key] && this.previousBinaryStates[key] !== binary) {
      this.audioManager.playTickSound();
    }
    this.previousBinaryStates[key] = binary;

    const bits = binary.split('').map(Number);
    const svg = d3.select(svgId);

    svg.selectAll('.tube-digit')
      .data(bits)
      .transition().duration(300)
      .attr('opacity', d => d ? 1 : 0.2)
      .attr('filter', d => d ? 'url(#glow)' : 'none')
      .text(d => d);

    svg.selectAll('.tube rect')
      .data(bits)
      .transition().duration(300)
      .attr('stroke', d => d ? '#ff6a00' : 'rgba(255,165,0,0.3)')
      .attr('stroke-width', d => d ? 2 : 1.5)
      .style('filter', d => d ? 'url(#glow)' : 'none');
  }

  showTooltip(event, d) {
    const point = event.touches?.[0] || event;
    const x = Math.min(point.pageX + 10, window.innerWidth - 120);
    const y = Math.max(point.pageY - 40, 10);
    d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('left', `${x}px`)
      .style('top', `${y}px`)
      .html(`2<sup>${Math.log2(d.power)}</sup> = ${d.power}`)
      .style('opacity', 0)
      .transition().duration(200)
      .style('opacity', 1);
  }

  hideTooltip() {
    d3.selectAll('.tooltip').transition().duration(200).style('opacity', 0).remove();
  }

  toggleBit(e, d) {
    d3.select(e.currentTarget).select('rect')
      .transition().duration(100).style('filter', 'brightness(1.5)')
      .transition().duration(100).style('filter', null);
    if ('vibrate' in navigator) navigator.vibrate(50);
  }
}