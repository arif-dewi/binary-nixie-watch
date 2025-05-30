/**
 * SVG Definitions and Effects Manager
 * Handles all SVG filters, gradients, and visual effects
 */
export class SVGDefinitions {
  constructor() {
    this.setupDefs();
  }

  setupDefs() {
    // Create hidden SVG for definitions
    const defs = d3.select('body').append('svg')
      .attr('width', 0)
      .attr('height', 0)
      .append('defs');

    this.createGlowFilter(defs);
    this.createTubeGradients(defs);
    this.createGlassReflections(defs);
  }

  createGlowFilter(defs) {
    // Enhanced glow filter for active tubes
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');

    // Create multiple glow layers for depth
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'glow1');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '5')
      .attr('result', 'glow2');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '8')
      .attr('result', 'glow3');

    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'glow3');
    feMerge.append('feMergeNode').attr('in', 'glow2');
    feMerge.append('feMergeNode').attr('in', 'glow1');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  createTubeGradients(defs) {
    // Main tube body gradient
    const tubeGradient = defs.append('linearGradient')
      .attr('id', 'tubeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    tubeGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(255,165,0,0.15)');

    tubeGradient.append('stop')
      .attr('offset', '30%')
      .attr('stop-color', 'rgba(255,106,0,0.1)');

    tubeGradient.append('stop')
      .attr('offset', '70%')
      .attr('stop-color', 'rgba(255,106,0,0.05)');

    tubeGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(0,0,0,0.4)');

    // Active tube gradient (brighter)
    const activeGradient = defs.append('linearGradient')
      .attr('id', 'activeTubeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    activeGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(255,165,0,0.3)');

    activeGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', 'rgba(255,106,0,0.2)');

    activeGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(0,0,0,0.3)');
  }

  createGlassReflections(defs) {
    // Enhanced glass reflection gradient
    const glassGradient = defs.append('radialGradient')
      .attr('id', 'glassReflection')
      .attr('cx', '30%')
      .attr('cy', '20%')
      .attr('r', '40%');

    glassGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(255,255,255,0.6)');

    glassGradient.append('stop')
      .attr('offset', '40%')
      .attr('stop-color', 'rgba(255,255,255,0.2)');

    glassGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(255,255,255,0)');

    // Secondary reflection
    const secondaryReflection = defs.append('linearGradient')
      .attr('id', 'secondaryReflection')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    secondaryReflection.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgba(255,255,255,0)');

    secondaryReflection.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', 'rgba(255,255,255,0.1)');

    secondaryReflection.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgba(255,255,255,0)');
  }
}