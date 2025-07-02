/**
 * SVG Definitions and Effects Manager
 * Handles all SVG filters, gradients, and visual effects
 */
export class SVGDefinitions {
  constructor(config = {}) {
    this.config = {
      color: {
        glow: '#ff6a00',
        base: 'rgba(255,165,0,0.3)',
        active: 'rgba(255,165,0,0.6)',
        ...config.color
      }
    };
    this.createDefs();
  }

  createDefs() {
    this.svg = d3.select('body')
      .append('svg')
      .attr('width', 0)
      .attr('height', 0)
      .style('position', 'absolute')
      .style('z-index', '-1')
      .attr('aria-hidden', 'true');

    this.defs = this.svg.append('defs');

    this.createGlowFilter();
    this.createTubeGradients();
    this.createGlassReflections();
  }

  destroy() {
    this.svg?.remove();
  }

  createGlowFilter() {
    const filter = this.defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');

    [2, 5, 8].forEach((stdDev, i) => {
      filter.append('feGaussianBlur')
        .attr('stdDeviation', stdDev)
        .attr('result', `glow${i + 1}`);
    });

    const merge = filter.append('feMerge');
    [3, 2, 1].forEach(i => merge.append('feMergeNode').attr('in', `glow${i}`));
    merge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  createTubeGradients() {
    this.createLinearGradient('tubeGradient', [
      { offset: '0%', color: 'rgba(255,165,0,0.15)' },
      { offset: '30%', color: 'rgba(255,106,0,0.1)' },
      { offset: '70%', color: 'rgba(255,106,0,0.05)' },
      { offset: '100%', color: 'rgba(0,0,0,0.4)' },
    ]);

    this.createLinearGradient('activeTubeGradient', [
      { offset: '0%', color: 'rgba(255,165,0,0.3)' },
      { offset: '50%', color: 'rgba(255,106,0,0.2)' },
      { offset: '100%', color: 'rgba(0,0,0,0.3)' },
    ]);
  }

  createGlassReflections() {
    this.createRadialGradient('glassReflection', '30%', '20%', '40%', [
      { offset: '0%', color: 'rgba(255,255,255,0.6)' },
      { offset: '40%', color: 'rgba(255,255,255,0.2)' },
      { offset: '100%', color: 'rgba(255,255,255,0)' },
    ]);

    this.createLinearGradient('secondaryReflection', [
      { offset: '0%', color: 'rgba(255,255,255,0)' },
      { offset: '50%', color: 'rgba(255,255,255,0.1)' },
      { offset: '100%', color: 'rgba(255,255,255,0)' },
    ], '0%', '0%', '100%', '100%');
  }

  createLinearGradient(id, stops, x1 = '0%', y1 = '0%', x2 = '0%', y2 = '100%') {
    const grad = this.defs.append('linearGradient')
      .attr('id', id)
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);

    stops.forEach(stop => {
      grad.append('stop')
        .attr('offset', stop.offset)
        .attr('stop-color', stop.color);
    });
  }

  createRadialGradient(id, cx, cy, r, stops) {
    const grad = this.defs.append('radialGradient')
      .attr('id', id)
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', r);

    stops.forEach(stop => {
      grad.append('stop')
        .attr('offset', stop.offset)
        .attr('stop-color', stop.color);
    });
  }
}