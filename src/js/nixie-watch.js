import { SVGDefinitions } from './svg-definitions';
import { AudioManager } from './audio-manager';
import { SELECTORS } from './constants/selectors';
import * as C from './constants/watch';
import { COLORS } from "./constants/colors";

export class BinaryNixieWatch {
  constructor() {
    this.isStarting = true;
    this.previousBinaryStates = Object.fromEntries(
      C.SECTION_KEYS.map((k) => [k, ''])
    );

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

  _handleMove(event) {
    if (this.isStarting) return;

    const isTouch = event.type === 'touchmove';
    const point = isTouch ? event.touches?.[0] : event;
    if (!point) return;

    if (isTouch) event.preventDefault();

    const x = (point.clientX / window.innerWidth - 0.5) * 2;
    const y = (point.clientY / window.innerHeight - 0.5) * 2;
    const isMobile = window.innerWidth <= C.MEDIA.MOBILE_WIDTH;

    d3.select(SELECTORS.WATCH_CONTAINER).style(
      'transform',
      `rotateY(${x * (isMobile ? 4 : 8)}deg) rotateX(${-y * (isMobile ? 3 : 5)}deg)`
    );

    document.documentElement.style.setProperty(
      '--glow-x',
      `${(point.clientX / window.innerWidth) * 100}%`
    );
    document.documentElement.style.setProperty(
      '--glow-y',
      `${(point.clientY / window.innerHeight) * 100}%`
    );
  };

  _resetPosition = () => {
    d3.select(SELECTORS.WATCH_CONTAINER).style(
      'transform',
      'rotateY(0deg) rotateX(0deg)'
    );
    document.documentElement.style.setProperty(
      '--glow-x',
      C.GLOW_POSITION.DEFAULT_X
    );
    document.documentElement.style.setProperty(
      '--glow-y',
      C.GLOW_POSITION.DEFAULT_Y
    );
  };

  setupPointerEvents() {
    document.addEventListener('mousemove', this._handleMove, { passive: true });
    document.addEventListener('touchmove', this._handleMove, { passive: false });
    document.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 1) this._resetPosition();
      },
      { passive: true }
    );
  }

  setupSoundToggle() {
    d3.select(SELECTORS.SOUND_TOGGLE).on('click', async (e) => {
      e.preventDefault();
      try {
        await this.audioManager.toggleSound();
      } catch {
        const btn = d3.select(SELECTORS.SOUND_TOGGLE);
        btn.classed('active', false);
        btn.select(SELECTORS.SOUND_ICON).text('🔇');
      }
    });
  }

  setupOrientationChange() {
    const reset = () => {
      d3.select(SELECTORS.WATCH_CONTAINER).style(
        'transform',
        'rotateY(0deg) rotateX(0deg)'
      );
      document.documentElement.style.setProperty(
        '--glow-x',
        C.GLOW_POSITION.DEFAULT_X
      );
      document.documentElement.style.setProperty(
        '--glow-y',
        C.GLOW_POSITION.DEFAULT_Y
      );
      this.updateTubeSizes();
    };
    window.addEventListener(
      'orientationchange',
      () => setTimeout(reset, 100),
      { passive: true }
    );
    window.addEventListener('resize', reset, { passive: true });
  }

  updateTubeSizes() {
    const width = window.innerWidth;
    const isSmall = width <= C.MEDIA.SMALL_WIDTH;
    const isMobile = width <= C.MEDIA.MOBILE_WIDTH;

    const sizes = isSmall
      ? C.SVG_SIZE.SMALL
      : isMobile
        ? C.SVG_SIZE.MOBILE
        : C.SVG_SIZE.DESKTOP;

    for (const key of C.SECTION_KEYS) {
      d3.select(`#${key}Svg`)
        .attr('width', sizes[key][0])
        .attr('height', sizes[key][1]);
    }

    if (!this.isStarting) {
      for (const key of C.SECTION_KEYS) {
        this.createTubes(`#${key}Svg`, C.BIT_LENGTH[key]);
      }
    }
  }

  async initializeWatch() {
    await this.startupSequence();
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  async startupSequence() {
    await new Promise((r) => setTimeout(r, C.ANIMATION.STARTUP_DELAY));
    d3.select(SELECTORS.STARTUP_SCREEN)
      .transition()
      .duration(500)
      .style('opacity', 0)
      .on('end', () => {
        d3.select(SELECTORS.STARTUP_SCREEN).style('display', 'none');
        this.isStarting = false;
        this.updateTubeSizes();
      });
    await this.animateTubesStartup();
  }

  async animateTubesStartup() {
    for (const [i, key] of C.SECTION_KEYS.entries()) {
      this.createTubes(`#${key}Svg`, C.BIT_LENGTH[key], true);
      if (
        this.audioManager.soundEnabled &&
        this.audioManager.isInitialized
      ) {
        this.audioManager.playStartupSequenceSound(i);
      }
      await new Promise((r) =>
        setTimeout(r, C.ANIMATION.TUBE_ANIMATION_DURATION)
      );
    }
  }

  createTubes(svgId, bitCount, animate = false) {
    const [svgW, svgH] = [
      +d3.select(svgId).attr('width'),
      +d3.select(svgId).attr('height'),
    ];
    const width = window.innerWidth;
    const isSmall = width <= C.MEDIA.SMALL_WIDTH;
    const isMobile = width <= C.MEDIA.MOBILE_WIDTH;

    const [tubeW, tubeH, spacing] = isSmall
      ? C.TUBE_DIMENSIONS.SMALL
      : isMobile
        ? C.TUBE_DIMENSIONS.MOBILE
        : C.TUBE_DIMENSIONS.DESKTOP;

    const startX = (svgW - (bitCount * spacing - (spacing - tubeW))) / 2;
    const data = Array.from({ length: bitCount }, (_, i) => ({
      id: i,
      x: startX + i * spacing,
      y: (svgH - tubeH) / 2,
      power: Math.pow(2, bitCount - 1 - i),
    }));

    const tubes = d3
      .select(svgId)
      .selectAll('.tube')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'tube')
      .style('opacity', animate ? 0 : 1)
      .on('touchstart', (e, d) => {
        e.preventDefault();
        this.showTooltip(e, d);
        setTimeout(
          () => this.hideTooltip(),
          C.ANIMATION.TOOLTIP_FADE_OUT
        );
      })
      .on('mouseover', (e, d) => {
        if (!('ontouchstart' in window)) {
          this.showTooltip(e, d);
        }
      })
      .on('mouseout', () => this.hideTooltip());

    tubes
      .append('rect')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('width', tubeW)
      .attr('height', tubeH)
      .attr('rx', tubeW / 2)
      .attr('fill', 'url(#tubeGradient)')
      .attr('stroke', COLORS.BASE)
      .attr('stroke-width', 1.5);

    tubes
      .append('ellipse')
      .attr('cx', (d) => d.x + tubeW / 2)
      .attr('cy', (d) => d.y + tubeH * 0.2)
      .attr('rx', tubeW * 0.25)
      .attr('ry', tubeH * 0.12)
      .attr('fill', COLORS.WHITE);

    const fontSize = isSmall
      ? C.FONT_SIZE.SMALL
      : isMobile
        ? C.FONT_SIZE.MOBILE
        : C.FONT_SIZE.DESKTOP;
    const offsetY = isSmall
      ? C.DIGIT_OFFSET_Y.SMALL
      : isMobile
        ? C.DIGIT_OFFSET_Y.MOBILE
        : C.DIGIT_OFFSET_Y.DESKTOP;

    tubes
      .append('text')
      .attr('class', 'tube-digit')
      .attr('x', (d) => d.x + tubeW / 2)
      .attr('y', (d) => d.y + tubeH / 2 + offsetY)
      .attr('text-anchor', 'middle')
      .attr('font-size', fontSize)
      .attr('font-family', 'Courier New, monospace')
      .attr('font-weight', 'bold')
      .attr('fill', COLORS.GLOW)
      .attr('opacity', 0.3)
      .text('0');

    if (animate) {
      tubes
        .transition()
        .duration(C.ANIMATION.TUBE_ANIMATION_DURATION)
        .delay((_, i) => i * C.ANIMATION.TUBE_ANIMATION_STAGGER)
        .style('opacity', 1);
    }
  }

  updateTime() {
    const now = new Date();
    const sections = {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    };

    d3.select(SELECTORS.TIME_DISPLAY).text(
      `${sections.hours.toString().padStart(2, '0')}:${sections.minutes.toString().padStart(2, '0')}:${sections.seconds.toString().padStart(2, '0')}`
    );

    for (const key of C.SECTION_KEYS) {
      this.updateBinaryDisplay(
        `#${key}Svg`,
        sections[key],
        key,
        C.BIT_LENGTH[key]
      );
    }
  }

  updateBinaryDisplay(svgId, value, key, bitCount) {
    const binary = value.toString(2).padStart(bitCount, '0');
    if (
      this.previousBinaryStates[key] &&
      this.previousBinaryStates[key] !== binary
    ) {
      this.audioManager.playTickSound();
    }
    this.previousBinaryStates[key] = binary;

    const bits = binary.split('').map(Number);
    const svg = d3.select(svgId);

    svg.selectAll('.tube-digit')
      .data(bits)
      .transition()
      .duration(C.ANIMATION.UPDATE_TRANSITION)
      .attr('opacity', (d) => (d ? 1 : 0.2))
      .attr('filter', (d) => (d ? 'url(#glow)' : 'none'))
      .text((d) => d);

    svg.selectAll('.tube rect')
      .data(bits)
      .transition()
      .duration(C.ANIMATION.UPDATE_TRANSITION)
      .attr('stroke', (d) => (d ? COLORS.GLOW : COLORS.BASE))
      .attr('stroke-width', (d) => (d ? 2 : 1.5))
      .style('filter', (d) => (d ? 'url(#glow)' : 'none'));
  }

  showTooltip(event, d) {
    const point = event.touches?.[0] || event;
    const x = Math.min(
      point.pageX + C.TOOLTIP.OFFSET_X,
      window.innerWidth - C.TOOLTIP.MAX_WIDTH
    );
    const y = Math.max(point.pageY - C.TOOLTIP.OFFSET_Y, C.TOOLTIP.MIN_Y);
    d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('left', `${x}px`)
      .style('top', `${y}px`)
      .html(`2<sup>${Math.log2(d.power)}</sup> = ${d.power}`)
      .style('opacity', 0)
      .transition()
      .duration(C.ANIMATION.TOOLTIP_FADE_IN)
      .style('opacity', 1);
  }

  hideTooltip() {
    d3.selectAll(SELECTORS.TOOLTIP)
      .transition()
      .duration(C.ANIMATION.TOOLTIP_FADE_OUT)
      .style('opacity', 0)
      .remove();
  }
}