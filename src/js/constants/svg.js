export const SVG_CONSTANTS = {
  FILTERS: {
    GLOW_STD_DEVIATIONS: [2, 5, 8],
    GLOW_MERGE_ORDER: [3, 2, 1],
  },

  GRADIENTS: [
    {
      id: 'tubeGradient',
      type: 'linear',
      stops: [
        { offset: '0%', color: 'rgba(255,165,0,0.15)' },
        { offset: '30%', color: 'rgba(255,106,0,0.1)' },
        { offset: '70%', color: 'rgba(255,106,0,0.05)' },
        { offset: '100%', color: 'rgba(0,0,0,0.4)' },
      ],
    },
    {
      id: 'activeTubeGradient',
      type: 'linear',
      stops: [
        { offset: '0%', color: 'rgba(255,165,0,0.3)' },
        { offset: '50%', color: 'rgba(255,106,0,0.2)' },
        { offset: '100%', color: 'rgba(0,0,0,0.3)' },
      ],
    },
    {
      id: 'glassReflection',
      type: 'radial',
      cx: '30%',
      cy: '20%',
      r: '40%',
      stops: [
        { offset: '0%', color: 'rgba(255,255,255,0.6)' },
        { offset: '40%', color: 'rgba(255,255,255,0.2)' },
        { offset: '100%', color: 'rgba(255,255,255,0)' },
      ],
    },
    {
      id: 'secondaryReflection',
      type: 'linear',
      x1: '0%',
      y1: '0%',
      x2: '100%',
      y2: '100%',
      stops: [
        { offset: '0%', color: 'rgba(255,255,255,0)' },
        { offset: '50%', color: 'rgba(255,255,255,0.1)' },
        { offset: '100%', color: 'rgba(255,255,255,0)' },
      ],
    },
  ],
};
