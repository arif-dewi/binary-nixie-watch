/**
 * SVG Definitions and Effects Manager
 * Handles all SVG filters, gradients, and visual effects
 */
import { SVG_CONSTANTS as C } from './constants/svg';

export class SVGDefinitions {
  constructor(config = {}) {
    this.config = {
      color: {
        glow: C.COLORS.GLOW,
        base: C.COLORS.BASE,
        active: C.COLORS.ACTIVE,
        ...config.color,
      },
    };
    this.createDefs();
  }

  createDefs() {
    this.svg = d3
      .select('body')
      .append('svg')
      .attr('width', 0)
      .attr('height', 0)
      .style('position', 'absolute')
      .style('z-index', '-1')
      .attr('aria-hidden', 'true');

    this.defs = this.svg.append('defs');

    this.createGlowFilter();
    this.createGradients();
  }

  destroy() {
    this.svg?.remove();
  }

  createGlowFilter() {
    const filter = this.defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');

    C.FILTERS.GLOW_STD_DEVIATIONS.forEach((stdDev, i) => {
      filter
        .append('feGaussianBlur')
        .attr('stdDeviation', stdDev)
        .attr('result', `glow${i}`);
    });

    const merge = filter.append('feMerge');
    [...C.FILTERS.GLOW_STD_DEVIATIONS.keys()].reverse().forEach((i) => {
      merge.append('feMergeNode').attr('in', `glow${i}`);
    });
    merge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  createGradients() {
    C.GRADIENTS.forEach((g) => {
      if (g.type === 'linear') {
        this.createLinearGradient(
          g.id,
          g.stops,
          g.x1,
          g.y1,
          g.x2,
          g.y2
        );
      } else if (g.type === 'radial') {
        this.createRadialGradient(g.id, g.cx, g.cy, g.r, g.stops);
      }
    });
  }

  createLinearGradient(
    id,
    stops,
    x1 = '0%',
    y1 = '0%',
    x2 = '0%',
    y2 = '100%'
  ) {
    const grad = this.defs
      .append('linearGradient')
      .attr('id', id)
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2);

    stops.forEach((stop) => {
      grad.append('stop')
        .attr('offset', stop.offset)
        .attr('stop-color', stop.color);
    });
  }

  createRadialGradient(id, cx, cy, r, stops) {
    const grad = this.defs
      .append('radialGradient')
      .attr('id', id)
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', r);

    stops.forEach((stop) => {
      grad.append('stop')
        .attr('offset', stop.offset)
        .attr('stop-color', stop.color);
    });
  }
}
