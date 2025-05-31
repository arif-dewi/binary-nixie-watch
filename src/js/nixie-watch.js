import { SVGDefinitions } from './svg-definitions.js';
import { AudioManager } from './audio-manager.js';

/**
 * Binary Nixie Watch Main Class - Mobile Optimized
 * Orchestrates the entire watch functionality with touch support
 */
export class BinaryNixieWatch {
  constructor() {
    this.isStarting = true;
    this.previousBinaryStates = {
      hours: '',
      minutes: '',
      seconds: ''
    };

    // Touch and mouse state
    this.isPointerDown = false;
    this.lastPointerPosition = { x: 0, y: 0 };

    this.svgDefinitions = new SVGDefinitions();
    this.audioManager = new AudioManager();
    this.setupEventListeners();
    this.initializeWatch();
  }

  setupEventListeners() {
    // Combined mouse and touch event handling
    this.setupPointerEvents();
    this.setupSoundToggle();
    this.setupOrientationChange();
  }

  setupPointerEvents() {
    const handlePointerMove = (e) => {
      if (this.isStarting) return;

      let clientX, clientY;

      // Handle both mouse and touch events
      if (e.type === 'touchmove') {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return;
        }
        e.preventDefault(); // Prevent scrolling
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;

      // Reduce rotation intensity for mobile
      const isMobile = window.innerWidth <= 768;
      const rotateIntensityX = isMobile ? 4 : 8;
      const rotateIntensityY = isMobile ? 3 : 5;

      const rotateY = x * rotateIntensityX;
      const rotateX = -y * rotateIntensityY;

      d3.select('#watchContainer')
        .style('transform', `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`);

      document.documentElement.style.setProperty('--glow-x', (clientX / window.innerWidth * 100) + '%');
      document.documentElement.style.setProperty('--glow-y', (clientY / window.innerHeight * 100) + '%');

      this.lastPointerPosition = { x: clientX, y: clientY };
    };

    const handlePointerStart = (e) => {
      this.isPointerDown = true;

      if (e.type === 'touchstart') {
        if (e.touches.length > 0) {
          this.lastPointerPosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
      } else {
        this.lastPointerPosition = {
          x: e.clientX,
          y: e.clientY
        };
      }
    };

    const handlePointerEnd = () => {
      this.isPointerDown = false;
    };

    // Mouse events
    document.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('mousedown', handlePointerStart);
    document.addEventListener('mouseup', handlePointerEnd);

    // Touch events
    document.addEventListener('touchmove', handlePointerMove, { passive: false });
    document.addEventListener('touchstart', handlePointerStart, { passive: true });
    document.addEventListener('touchend', handlePointerEnd, { passive: true });
    document.addEventListener('touchcancel', handlePointerEnd, { passive: true });

    // Handle touch with multiple fingers (reset position)
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        // Multiple fingers - reset to center position
        d3.select('#watchContainer')
          .style('transform', 'rotateY(0deg) rotateX(0deg)');

        document.documentElement.style.setProperty('--glow-x', '50%');
        document.documentElement.style.setProperty('--glow-y', '50%');
      }
    }, { passive: true });
  }

  setupSoundToggle() {
    const soundButton = d3.select('#soundToggle');

    // Handle both click and touch
    const handleSoundToggle = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        await this.audioManager.toggleSound();
      } catch (error) {
        console.warn('🔇 Failed to start audio:', error);

        // Update UI to show audio is disabled
        const button = d3.select('#soundToggle');
        const icon = button.select('.sound-icon');
        button.classed('active', false);
        icon.text('🔇');
      }
    };

    soundButton.on('click', handleSoundToggle);
    soundButton.on('touchend', handleSoundToggle);
  }

  setupOrientationChange() {
    // Handle device orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        // Reset watch position after orientation change
        d3.select('#watchContainer')
          .style('transform', 'rotateY(0deg) rotateX(0deg)');

        document.documentElement.style.setProperty('--glow-x', '50%');
        document.documentElement.style.setProperty('--glow-y', '50%');

        // Recalculate responsive tube sizes
        this.updateTubeSizes();
      }, 100);
    }, { passive: true });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.updateTubeSizes();
    }, { passive: true });
  }

  updateTubeSizes() {
    // Dynamically update SVG sizes based on screen size
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;

    const hoursSvg = d3.select('#hoursSvg');
    const minutesSvg = d3.select('#minutesSvg');
    const secondsSvg = d3.select('#secondsSvg');

    if (isSmallMobile) {
      hoursSvg.attr('width', 250).attr('height', 80);
      minutesSvg.attr('width', 300).attr('height', 80);
      secondsSvg.attr('width', 300).attr('height', 80);
    } else if (isMobile) {
      hoursSvg.attr('width', 280).attr('height', 90);
      minutesSvg.attr('width', 330).attr('height', 90);
      secondsSvg.attr('width', 330).attr('height', 90);
    } else {
      hoursSvg.attr('width', 300).attr('height', 100);
      minutesSvg.attr('width', 360).attr('height', 100);
      secondsSvg.attr('width', 360).attr('height', 100);
    }

    // Recreate tubes with new sizes
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    d3.select('#startup')
      .transition()
      .duration(500)
      .style('opacity', 0)
      .on('end', () => {
        d3.select('#startup').style('display', 'none');
        this.isStarting = false;
        this.updateTubeSizes(); // Set initial sizes after startup
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
      const svg = svgs[i];
      await new Promise(resolve => {
        this.createTubes(svg.id, svg.bits, true);
        if (this.audioManager.soundEnabled && this.audioManager.isInitialized) {
          this.audioManager.playStartupSequenceSound(i);
        }
        setTimeout(resolve, 400);
      });
    }
  }

  createTubes(svgId, bitCount, animate = false) {
    const svg = d3.select(svgId);

    // Clear existing tubes
    svg.selectAll('.tube').remove();

    // Get responsive dimensions
    const svgWidth = parseInt(svg.attr('width'));
    const svgHeight = parseInt(svg.attr('height'));

    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;

    // Responsive tube dimensions
    let tubeWidth, tubeHeight, spacing;
    if (isSmallMobile) {
      tubeWidth = 35;
      tubeHeight = 55;
      spacing = 42;
    } else if (isMobile) {
      tubeWidth = 40;
      tubeHeight = 65;
      spacing = 48;
    } else {
      tubeWidth = 45;
      tubeHeight = 70;
      spacing = 55;
    }

    const startX = (svgWidth - (bitCount * spacing - (spacing - tubeWidth))) / 2;

    const tubeData = Array.from({length: bitCount}, (_, i) => ({
      id: i,
      x: startX + i * spacing,
      y: (svgHeight - tubeHeight) / 2,
      value: 0,
      power: Math.pow(2, bitCount - 1 - i)
    }));

    const tubes = svg.selectAll('.tube')
      .data(tubeData)
      .enter()
      .append('g')
      .attr('class', 'tube')
      .style('opacity', animate ? 0 : 1);

    // Tube body
    tubes.append('rect')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', tubeWidth)
      .attr('height', tubeHeight)
      .attr('rx', tubeWidth / 2)
      .attr('fill', 'url(#tubeGradient)')
      .attr('stroke', 'rgba(255,165,0,0.3)')
      .attr('stroke-width', 1.5);

    // Glass highlight
    tubes.append('ellipse')
      .attr('cx', d => d.x + tubeWidth/2)
      .attr('cy', d => d.y + tubeHeight * 0.2)
      .attr('rx', tubeWidth * 0.25)
      .attr('ry', tubeHeight * 0.12)
      .attr('fill', 'rgba(255,255,255,0.2)');

    // Digit display
    const fontSize = isSmallMobile ? '20px' : isMobile ? '24px' : '28px';

    tubes.append('text')
      .attr('class', 'tube-digit')
      .attr('x', d => d.x + tubeWidth/2)
      .attr('y', d => d.y + tubeHeight/2 + (isSmallMobile ? 6 : 8))
      .attr('text-anchor', 'middle')
      .attr('font-size', fontSize)
      .attr('font-family', 'Courier New, monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#ff6a00')
      .attr('opacity', 0.3)
      .text('0');

    // Interactive events - optimized for touch
    tubes
      .on('mouseover', (event, d) => !('ontouchstart' in window) && this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (event, d) => this.toggleBit(event, d))
      .on('touchstart', (event, d) => {
        event.preventDefault();
        this.showTooltip(event, d);
        setTimeout(() => this.hideTooltip(), 2000); // Auto-hide on mobile
      });

    if (animate) {
      tubes.transition()
        .duration(400)
        .delay((d, i) => i * 100)
        .style('opacity', 1);
    }
  }

  updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    d3.select('#timeDisplay')
      .text(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

    this.updateBinaryDisplay('#hoursSvg', hours, 5);
    this.updateBinaryDisplay('#minutesSvg', minutes, 6);
    this.updateBinaryDisplay('#secondsSvg', seconds, 6);
  }

  updateBinaryDisplay(svgId, value, bitCount) {
    const binary = value.toString(2).padStart(bitCount, '0');
    const svg = d3.select(svgId);

    // Sound on binary change
    const sectionName = svgId.includes('hours') ? 'hours' :
      svgId.includes('minutes') ? 'minutes' : 'seconds';

    if (this.previousBinaryStates[sectionName] !== binary &&
      this.previousBinaryStates[sectionName] !== '') {
      this.audioManager.playTickSound();
    }
    this.previousBinaryStates[sectionName] = binary;

    // Update digits with binary values
    svg.selectAll('.tube-digit')
      .data(binary.split('').map(Number))
      .transition()
      .duration(300)
      .attr('opacity', d => d ? 1 : 0.2)
      .attr('filter', d => d ? 'url(#glow)' : 'none')
      .text(d => d);

    // Update tube appearance
    svg.selectAll('.tube rect')
      .data(binary.split('').map(Number))
      .transition()
      .duration(300)
      .attr('stroke', d => d ? '#ff6a00' : 'rgba(255,165,0,0.3)')
      .attr('stroke-width', d => d ? 2 : 1.5)
      .style('filter', d => d ? 'url(#glow)' : 'none');
  }

  showTooltip(event, d) {
    // Position tooltip more carefully on mobile
    let x, y;
    if (event.type === 'touchstart' && event.touches && event.touches.length > 0) {
      x = event.touches[0].pageX;
      y = event.touches[0].pageY;
    } else {
      x = event.pageX;
      y = event.pageY;
    }

    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('left', Math.min(x + 10, window.innerWidth - 120) + 'px')
      .style('top', Math.max(y - 40, 10) + 'px')
      .html(`2<sup>${Math.log2(d.power)}</sup> = ${d.power}`)
      .style('opacity', 0);

    tooltip.transition()
      .duration(200)
      .style('opacity', 1);
  }

  hideTooltip() {
    d3.selectAll('.tooltip')
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();
  }

  toggleBit(event, d) {
    const currentTarget = d3.select(event.currentTarget);

    currentTarget
      .select('rect')
      .transition()
      .duration(100)
      .style('filter', 'brightness(1.5)')
      .transition()
      .duration(100)
      .style('filter', null);

    // Add haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }
}