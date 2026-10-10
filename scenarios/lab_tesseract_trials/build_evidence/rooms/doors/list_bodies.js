(box) => {
  const any = Object.values(window.rooms).flatMap(r => Object.values(r.objects || {}))[0];
  const w = any.scene.physics.world, out = [];
  const add = (b, kind) => { if (!b || !b.enable) return;
    if (b.right < box[0] || b.left > box[2] || b.bottom < box[1] || b.top > box[3]) return;
    const go = b.gameObject || {};
    out.push([kind, Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom), go.name || (go.texture && go.texture.key) || go.type || ''].join(' ')); };
  w.staticBodies.iterate(b => add(b, 'static'));
  w.bodies.iterate(b => { if (b.immovable) add(b, 'immovable'); });
  return out.sort();
}
