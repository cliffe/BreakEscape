import React from 'react';
/** SVG filter defs: soft pixel-mosaic used by the card reflection (reference: blocky, blurred, mirrored). */
export const MosaicFilter: React.FC<{ id: string; block: number; blur: number }> = ({ id, block, blur }) => {
  const h = block / 2;
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation={blur} result="soft" />
        <feFlood x={h - 1} y={h - 1} width="2" height="2" />
        <feComposite width={block} height={block} />
        <feTile result="grid" />
        <feComposite in="soft" in2="grid" operator="in" />
        <feMorphology operator="dilate" radius={h} />
        <feGaussianBlur stdDeviation={blur * 0.35} />
      </filter>
    </svg>
  );
};
