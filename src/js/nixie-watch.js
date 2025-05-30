import { SVGDefinitions } from './svg-definitions.js';
import { AudioManager } from './audio-manager.js';

/**
 * Binary Nixie Watch Main Class
 * Orchestrates the entire watch functionality
 */
export class BinaryNixieWatch {
  constructor() {
    this.isStarting = true;
    this.previousBinaryStates = {
      hours: '',
      minutes: '',
      seconds: ''
    };

    this.svgDefinitions = new SVGDefinitions();
    this.audioManager = new AudioManager();
    this.setupEventListeners();
    this.initializeWatch();
  }

  setupEventListeners() {
    document.addEventListener('mousemove', (e) => {
      if (this.isStarting) return;

      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      const rotateY = x * 8;
      const rotateX = -y * 5;

      d3.select('#watchContainer')
        .style('transform', `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`);

      document.documentElement.style.setProperty('--glow-x', (e.clientX / window.innerWidth * 100) + '%');
      document.documentElement.style.setProperty('--glow-y', (e.clientY / window.innerHeight * 100) + '%');
    });

    d3.select('#soundToggle').on('click', async () => {
      try {
        // The audio manager will handle loading Tone.js if needed
        await this.audioManager.toggleSound();
      } catch (error) {
        console.warn('🔇 Failed to start audio:', error);

        // Update UI to show audio is disabled
        const button = d3.select('#soundToggle');
        const icon = button.select('.sound-icon');
        button.classed('active', false);
        icon.text('🔇');
      }
    });
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
    const tubeWidth = 45;
    const tubeHeight = 70;
    const spacing = 55;
    const startX = (parseInt(svg.attr('width')) - (bitCount * spacing - 10)) / 2;

    const tubeData = Array.from({length: bitCount}, (_, i) => ({
      id: i,
      x: startX + i * spacing,
      y: 15,
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
      .attr('rx', 22)
      .attr('fill', 'url(#tubeGradient)')
      .attr('stroke', 'rgba(255,165,0,0.3)')
      .attr('stroke-width', 1.5);

    // Glass highlight
    tubes.append('ellipse')
      .attr('cx', d => d.x + tubeWidth/2)
      .attr('cy', d => d.y + 15)
      .attr('rx', 12)
      .attr('ry', 8)
      .attr('fill', 'rgba(255,255,255,0.2)');

    // Digit display
    tubes.append('text')
      .attr('class', 'tube-digit')
      .attr('x', d => d.x + tubeWidth/2)
      .attr('y', d => d.y + tubeHeight/2 + 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '28px')
      .attr('font-family', 'Courier New, monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#ff6a00')
      .attr('opacity', 0.3)
      .text('0');

    // Interactive events
    tubes
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (event, d) => this.toggleBit(event, d));

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
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
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
    d3.select(event.currentTarget)
      .select('rect')
      .transition()
      .duration(100)
      .style('filter', 'brightness(1.5)')
      .transition()
      .duration(100)
      .style('filter', null);
  }
}