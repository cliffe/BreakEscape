import React from 'react';
import { rng } from '../rand';

/**
 * Shared glitch engine (matches the reference trailer's glitch, 0-1 s and 23.4 s):
 *  - the frame is cut into horizontal bands of random height; a share of them is displaced sideways (hard steps, no blur),
 *  - chromatic split (red one way, blue the other): small and global on text edges, large on the displaced bands,
 *  - optional blocky pixelation of some bands (nearest-neighbour look: sample, then dilate to square blocks),
 *  - optional hidden bands (the picture "assembles" as they come back).
 * No noise, no dark bars. Everything is derived from `seed`, so a frame renders the same every time.
 * Built from SVG filter primitives only (feFlood maps -> feDisplacementMap), so it works on video as well as on text.
 */
export type GlitchParams = {
  seed: number;
  /** 0..1: share of bands that move and how far */
  k: number;
  /** largest sideways step in px */
  maxShift: number;
  /** chromatic split in px on moving bands (global split is a third of it) */
  split: number;
  /** 0..1: share of bands hidden (reveal) */
  hide?: number;
  /** 0..1: share of bands pixelated */
  pix?: number;
  /** pixel block size in px */
  block?: number;
  /** thickest band as a fraction of the height */
  thick?: number;
  /** snap band heights and steps to a pixel grid of this many px (pixel-art titles) */
  grid?: number;
  /** displacement-map resolution in px per step (default: smallest that reaches maxShift) */
  unit?: number;
};

type Band = { y: number; h: number; dx: number; moving: boolean; hidden: boolean; pix: boolean };

export function makeBands(p: GlitchParams, w: number, h: number): Band[] {
  const r = rng(p.seed);
  const bands: Band[] = [];
  const pMove = Math.min(0.9, 0.1 + 0.55 * p.k);
  let y = 0;
  const thick = p.thick ?? 0.07;
  while (y < h) {
    let bh = Math.max(3, Math.round(h * (0.004 + Math.pow(r(), 2.2) * thick)));
    if (p.grid) bh = Math.max(p.grid, Math.round(bh / p.grid) * p.grid);
    bh = Math.min(h - y, bh);
    const moving = r() < pMove;
    const mag = Math.pow(r(), 1.4) * p.maxShift;
    let dx = moving ? Math.round((r() < 0.5 ? -1 : 1) * Math.max(mag, p.maxShift * 0.06)) : 0;
    if (p.grid) dx = Math.round(dx / p.grid) * p.grid;
    bands.push({ y, h: bh, dx, moving, hidden: r() < (p.hide ?? 0), pix: r() < (p.pix ?? 0) });
    y += bh;
  }
  return bands;
}

// map value for a displacement of dx px: the map holds integer steps of `unit` px around 127.5 (scale = 255 * unit), so multiples of unit are exact
const enc = (dx: number, unit: number) => Math.max(0, Math.min(255, Math.round(127.5 + dx / unit)));
const rgb = (v: number) => `rgb(${v},128,128)`;

export const GlitchFX: React.FC<{ id: string; w: number; h: number; params: GlitchParams; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, w, h, params, children, style }) => {
  const k = params.k;
  if (k <= 0.001 && !(params.hide && params.hide > 0)) return <div style={{ position: 'absolute', inset: 0, ...style }}>{children}</div>;
  const bands = makeBands(params, w, h);
  const split = Math.max(0, Math.round(params.split));
  const gsplit = Math.round(split / 3);
  const maxShift = Math.max(...bands.map((b) => Math.abs(b.dx)), 1) + split + 2;
  const unit = params.unit ?? Math.max(1, Math.ceil(maxShift / 127));
  const scale = 255 * unit;
  const anyHidden = bands.some((b) => b.hidden);
  const anyPix = bands.some((b) => b.pix);
  const block = params.block ?? Math.max(8, Math.round(w / 120));
  const hb = block / 2;
  const chans: Array<['R' | 'G' | 'B', number]> = [['R', -1], ['G', 0], ['B', 1]];
  const nodes: React.ReactNode[] = [];
  chans.forEach(([c, sgn]) => {
    const g = sgn * gsplit;
    nodes.push(<feFlood key={`${c}0`} x="0" y="0" width={w} height={h} floodColor={rgb(enc(g, unit))} result={`${c}0`} />);
    const names = [`${c}0`];
    bands.forEach((b, i) => {
      if (!b.moving) return;
      const v = enc(b.dx + sgn * (gsplit + split), unit);
      nodes.push(<feFlood key={`${c}b${i}`} x="0" y={b.y} width={w} height={b.h} floodColor={rgb(v)} result={`${c}b${i}`} />);
      names.push(`${c}b${i}`);
    });
    nodes.push(<feMerge key={`${c}m`} result={`map${c}`}>{names.map((n) => <feMergeNode key={n} in={n} />)}</feMerge>);
    nodes.push(<feDisplacementMap key={`${c}d`} in="SourceGraphic" in2={`map${c}`} scale={scale} xChannelSelector="R" yChannelSelector="G" result={`d${c}`} />);
    const m = c === 'R' ? '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0' : c === 'G' ? '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0' : '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';
    nodes.push(<feColorMatrix key={`${c}c`} in={`d${c}`} type="matrix" values={m} result={`c${c}`} />);
  });
  nodes.push(<feBlend key="rg" in="cR" in2="cG" mode="screen" result="rg" />);
  nodes.push(<feBlend key="rgb" in="rg" in2="cB" mode="screen" result="shifted" />);
  let last = 'shifted';
  if (anyPix) {
    nodes.push(<feFlood key="pf" x={hb - 1} y={hb - 1} width="2" height="2" result="pf" />);
    nodes.push(<feComposite key="pc" in="pf" width={block} height={block} result="pcell" />);
    nodes.push(<feTile key="pt" in="pcell" result="pgrid" />);
    nodes.push(<feComposite key="ps" in="shifted" in2="pgrid" operator="in" result="psamp" />);
    nodes.push(<feMorphology key="pm" in="psamp" operator="dilate" radius={hb} result="pblocks" />);
    nodes.push(<feFlood key="pm0" x="0" y="0" width={w} height={h} floodOpacity="0" result="pm0" />);
    const pn = ['pm0'];
    bands.forEach((b, i) => { if (!b.pix) return; nodes.push(<feFlood key={`pmb${i}`} x="0" y={b.y} width={w} height={b.h} floodColor="#fff" result={`pmb${i}`} />); pn.push(`pmb${i}`); });
    nodes.push(<feMerge key="pmm" result="pmask">{pn.map((n) => <feMergeNode key={n} in={n} />)}</feMerge>);
    nodes.push(<feComposite key="pcm" in="pblocks" in2="pmask" operator="in" result="pbl" />);
    nodes.push(<feMerge key="pmerge" result="withpix"><feMergeNode in="shifted" /><feMergeNode in="pbl" /></feMerge>);
    last = 'withpix';
  }
  if (anyHidden) {
    nodes.push(<feFlood key="v0" x="0" y="0" width={w} height={h} floodOpacity="0" result="v0" />);
    const vn = ['v0'];
    bands.forEach((b, i) => { if (b.hidden) return; nodes.push(<feFlood key={`vb${i}`} x="0" y={b.y} width={w} height={b.h} floodColor="#fff" result={`vb${i}`} />); vn.push(`vb${i}`); });
    nodes.push(<feMerge key="vm" result="vmask">{vn.map((n) => <feMergeNode key={n} in={n} />)}</feMerge>);
    nodes.push(<feComposite key="vc" in={last} in2="vmask" operator="in" result="final" />);
  }
  return (
    <div style={{ position: 'absolute', inset: 0, ...style }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id={id} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="0" y="0" width={w} height={h} colorInterpolationFilters="sRGB">{nodes}</filter>
      </svg>
      <div style={{ position: 'absolute', inset: 0, filter: `url(#${id})` }}>{children}</div>
    </div>
  );
};
