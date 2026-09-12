import * as THREE from '../vendor/three/three.module.js';
import { setViewerLanguage } from './book-viewer-copy.js';

// No camera panning: rotate the object about its center, with a bounded zoom.
// Quaternions allow complete turns on all axes without Euler-angle lockups.
export function createBookViewer(root, book, language) {
  const stage = root.querySelector('[data-viewer-stage]');
  const controls = root.querySelector('[data-viewer-controls]');
  const status = root.querySelector('[data-viewer-status]');
  const fallback = root.querySelector('.bookplate__cover-frame');
  const spinButton = root.querySelector('[data-viewer-action="spin"]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const abort = new AbortController();
  const resources = new Set();
  const track = value => { resources.add(value); return value; };
  let copy = setViewerLanguage(root, book, language);
  let disposed = false;
  let suspended = false;
  let inView = true;
  let frame = 0;
  let lastTime = 0;
  let dirty = true;
  let zoom = 1;
  let autoRotate = !reduced.matches;
  let idleAfter = performance.now() + 1800;
  let velocityX = 0;
  let velocityY = 0;
  let lastMove = 0;
  let pinch = null;
  let renderer = null;
  let scene, camera, model, shadow;
  let fitDistance = 7;
  let slowFrames = 0;
  let contextLost = false;
  let textureFailed = false;
  const coverInk = document.querySelector(`[data-book="${book.id}"]`)?.style.getPropertyValue('--book-ink') || '#fff8e8';
  const pointers = new Map();
  const orientation = new THREE.Quaternion();
  const initial = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.12, -.4, 0));
  orientation.copy(initial);
  const step = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  function canvasTexture(width, height, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    paint(canvas.getContext('2d'), width, height);
    const texture = track(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function addBox(width, height, depth, material, x = 0, z = 0) {
    const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(width, height, depth)), material);
    mesh.position.set(x, 0, z);
    model.add(mesh);
    return mesh;
  }

  function material(options) {
    return track(new THREE.MeshStandardMaterial({ roughness: .88, metalness: 0, ...options }));
  }

  function makeModel() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
    model = new THREE.Group();
    scene.add(model);
    // The cover defines the proportions: equal height, natural image width, no frame.
    const depth = THREE.MathUtils.clamp(.12 + book.pageCount * .00065, .17, .38);
    const cloth = material({ color: book.accentColor });
    const width = 2.4 * (book.coverAspect || .625);
    const paperMap = canvasTexture(128, 256, (ctx, w, h) => {
      ctx.fillStyle = '#eee7d7'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = y % 9 === 0 ? 'rgba(115,96,67,.2)' : 'rgba(115,96,67,.09)';
        ctx.fillRect(0, y, w, 1);
      }
      const crease = ctx.createLinearGradient(0, 0, w, 0);
      crease.addColorStop(0, 'rgba(81,57,30,.14)'); crease.addColorStop(.2, 'rgba(81,57,30,0)');
      crease.addColorStop(1, 'rgba(81,57,30,.08)'); ctx.fillStyle = crease; ctx.fillRect(0, 0, w, h);
    });
    const topMap = track(paperMap.clone()); topMap.rotation = Math.PI / 2; topMap.center.set(.5, .5);
    const paper = material({ map: paperMap });
    const top = material({ map: topMap });
    // Box material order: right, left, top, bottom, front, back.
    addBox(width - .03, 2.36, depth, [paper, cloth, top, top, paper, paper]);
    addBox(width, 2.4, .026, cloth, 0, depth / 2 + .013);
    addBox(width, 2.4, .026, cloth, 0, -depth / 2 - .013);
    addBox(.03, 2.4, depth + .052, cloth, -width / 2 + .015);

    const titleMap = canvasTexture(512, 768, (ctx, w, h) => {
      ctx.fillStyle = book.accentColor; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = coverInk; ctx.font = '36px Georgia'; ctx.textAlign = 'center';
      const words = book.title[language].split(' '); let line = '', y = h * .35;
      for (const word of words) {
        if (ctx.measureText(`${line} ${word}`).width > w - 60) { ctx.fillText(line, w / 2, y); y += 45; line = ''; }
        line += `${line ? ' ' : ''}${word}`;
      }
      ctx.fillText(line, w / 2, y);
    });
    const frontMaterial = material({ map: titleMap, roughness: .76 });
    const front = new THREE.Mesh(track(new THREE.PlaneGeometry(width, 2.4)), frontMaterial);
    front.position.z = depth / 2 + .027;
    model.add(front);

    const spineMap = canvasTexture(128, 1024, (ctx, w, h) => {
      ctx.fillStyle = book.accentColor; ctx.fillRect(0, 0, w, h);
      // Use the existing shelf's contrast-aware ink for the same cover color.
      ctx.fillStyle = coverInk;
      ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.font = '30px sans-serif'; ctx.textAlign = 'right';
      const authorWidth = ctx.measureText(book.author).width;
      ctx.fillText(book.author, h / 2 - 70, 0);
      ctx.font = '600 52px Georgia'; ctx.textAlign = 'left';
      ctx.fillText(book.title[language], -h / 2 + 70, 0, h - 180 - authorWidth);
    });
    const spine = new THREE.Mesh(track(new THREE.PlaneGeometry(depth + .05, 2.38)), material({ map: spineMap }));
    spine.rotation.y = -Math.PI / 2; spine.position.x = -width / 2 - .001; model.add(spine);

    scene.add(new THREE.HemisphereLight('#fff8ec', '#827768', 2));
    const key = new THREE.DirectionalLight('#fff5e6', 2.6); key.position.set(-3, 5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight('#e0eaff', 1.1); fill.position.set(4, 1, -3); scene.add(fill);
    const shadowMap = canvasTexture(128, 128, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      gradient.addColorStop(0, 'rgba(52,38,22,.32)'); gradient.addColorStop(.45, 'rgba(52,38,22,.13)');
      gradient.addColorStop(1, 'rgba(52,38,22,0)'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    });
    shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(4, 3)), track(new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.52; scene.add(shadow);

    // Fetch is abortable; GPU textures are bounded and never allocated after close.
    fetch(book.coverUrl, { signal: abort.signal, mode: 'cors' })
      .then(response => { if (!response.ok) throw new Error('Cover unavailable'); return response.blob(); })
      .then(blob => createImageBitmap(blob))
      .then(bitmap => {
        if (disposed) { bitmap.close(); return; }
        // Fill the entire face; no padding, crop, or colored surround.
        const aspect = bitmap.width / bitmap.height;
        const textureHeight = 768;
        const textureWidth = Math.round(textureHeight * aspect);
        const map = canvasTexture(textureWidth, textureHeight, (ctx, w, h) => {
          ctx.drawImage(bitmap, 0, 0, w, h);
        });
        model.scale.x = aspect / (book.coverAspect || .625);
        bitmap.close();
        frontMaterial.map = map; frontMaterial.needsUpdate = true;
        titleMap.dispose(); resources.delete(titleMap);
        invalidate();
      }).catch(error => {
        if (disposed || error.name === 'AbortError') return;
        textureFailed = true; status.textContent = copy.coverUnavailable;
      });
  }

  function setAutoRotate(value) {
    autoRotate = value;
    spinButton.setAttribute('aria-pressed', String(value));
    spinButton.textContent = copy.spinStart;
  }

  function stopMotion() {
    setAutoRotate(false); velocityX = 0; velocityY = 0;
  }

  function rotate(x, y, z = 0) {
    const angle = Math.hypot(x, y, z);
    if (!angle) return;
    axis.set(x, y, z).normalize(); step.setFromAxisAngle(axis, angle);
    orientation.premultiply(step).normalize(); dirty = true;
  }

  function resize() {
    if (disposed) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    if (renderer) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Fit a bounding sphere, so even the corners stay in view on a full turn.
      const halfFov = Math.min(Math.PI / 10, Math.atan(Math.tan(Math.PI / 10) * camera.aspect));
      fitDistance = 1.48 / Math.sin(halfFov) * 1.08;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }

  function render() {
    if (renderer && !contextLost) {
      model.quaternion.copy(orientation);
      camera.position.set(0, fitDistance * .035 / zoom, fitDistance / zoom);
      camera.lookAt(0, -.05, 0);
      renderer.render(scene, camera);
    } else {
      matrix.makeRotationFromQuaternion(orientation);
      fallback.style.setProperty('--viewer-rotation', `matrix3d(${matrix.elements.join(',')})`);
      const diameter = Math.hypot(fallback.offsetWidth, fallback.offsetHeight, 24);
      const fit = Math.min(stage.clientWidth, stage.clientHeight) * .9 / diameter;
      fallback.style.setProperty('--viewer-scale', String(fit * zoom / 1.3));
    }
    dirty = false;
  }

  function tick(time) {
    frame = 0;
    if (disposed || suspended || document.hidden || !inView) { lastTime = 0; return; }
    const elapsed = lastTime ? time - lastTime : 16.67;
    const dt = Math.min(elapsed / 1000, .05); lastTime = time;
    if (!pointers.size) {
      if (!reduced.matches && Math.hypot(velocityX, velocityY) > .008) {
        rotate(velocityX * dt, velocityY * dt);
        const damping = Math.exp(-5.5 * dt); velocityX *= damping; velocityY *= damping;
      } else { velocityX = 0; velocityY = 0; }
      if (autoRotate && time > idleAfter) rotate(0, dt * .13);
    }
    if (dirty) render();
    // A small canvas and no shadow-map/postprocessing passes keep mobile work low.
    // Reduce pixel fill cost further if sustained rendering misses the frame budget.
    if (renderer && elapsed > 25 && elapsed < 150) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (renderer && slowFrames > 45 && renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(1); resize(); slowFrames = 0;
    }
    if (autoRotate || velocityX || velocityY || dirty) schedule();
    else lastTime = 0;
  }

  function schedule() {
    if (!frame && !disposed && !suspended && !document.hidden && inView) frame = requestAnimationFrame(tick);
  }
  function invalidate() { dirty = true; schedule(); }

  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    stopMotion(); stage.focus({ preventScroll: true });
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    root.classList.add('is-dragging'); pinch = null; lastMove = performance.now();
    event.preventDefault();
  }

  function onPointerMove(event) {
    const previous = pointers.get(event.pointerId); if (!previous) return;
    const now = performance.now();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      if (pinch && pinch.distance > 5) {
        zoom = THREE.MathUtils.clamp(zoom * distance / pinch.distance, .8, 1.3);
        rotate(0, 0, -(angle - pinch.angle));
      }
      pinch = { distance, angle }; velocityX = velocityY = 0;
    } else {
      const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
      const sensitivity = 5 / Math.min(stage.clientWidth, stage.clientHeight);
      rotate(dy * sensitivity, dx * sensitivity);
      const seconds = Math.max((now - lastMove) / 1000, .008);
      velocityX = THREE.MathUtils.clamp(dy * sensitivity / seconds, -5, 5);
      velocityY = THREE.MathUtils.clamp(dx * sensitivity / seconds, -5, 5);
    }
    lastMove = now; invalidate(); event.preventDefault();
  }

  function onPointerUp(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId); pinch = null;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (event.type !== 'pointerup' || performance.now() - lastMove > 90 || reduced.matches) velocityX = velocityY = 0;
    if (!pointers.size) root.classList.remove('is-dragging');
    invalidate();
  }

  function action(name) {
    const wasRotating = autoRotate; stopMotion();
    const angle = Math.PI / 8;
    if (name === 'left') rotate(0, -angle);
    if (name === 'right') rotate(0, angle);
    if (name === 'up') rotate(-angle, 0);
    if (name === 'down') rotate(angle, 0);
    if (name === 'in') zoom = Math.min(1.3, zoom + .1);
    if (name === 'out') zoom = Math.max(.8, zoom - .1);
    if (name === 'reset') { orientation.copy(initial); zoom = 1; }
    if (name === 'spin') { setAutoRotate(!wasRotating); idleAfter = 0; }
    invalidate();
  }

  const listen = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: abort.signal });
  listen(stage, 'pointerdown', onPointerDown);
  listen(stage, 'pointermove', onPointerMove);
  listen(stage, 'pointerup', onPointerUp);
  listen(stage, 'pointercancel', onPointerUp);
  listen(stage, 'lostpointercapture', onPointerUp);
  listen(stage, 'wheel', event => {
    event.preventDefault(); stopMotion();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
    zoom = THREE.MathUtils.clamp(zoom * Math.exp(-THREE.MathUtils.clamp(delta, -150, 150) * .002), .8, 1.3);
    invalidate();
  }, { passive: false });
  listen(stage, 'keydown', event => {
    const key = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out', Home: 'reset', ' ': 'spin' }[event.key];
    if (key) { event.preventDefault(); action(key); }
  });
  listen(controls, 'click', event => { const button = event.target.closest('[data-viewer-action]'); if (button) action(button.dataset.viewerAction); });
  listen(reduced, 'change', () => { if (reduced.matches) stopMotion(); invalidate(); });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    else invalidate();
  });

  function disposeRenderer() {
    if (!renderer) return;
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); renderer = null;
  }

  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse.matches ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    makeModel(); stage.append(renderer.domElement);
    root.classList.add('is-webgl');
    listen(renderer.domElement, 'webglcontextlost', event => {
      event.preventDefault(); contextLost = true; stopMotion();
      root.classList.remove('is-webgl');
      renderer.domElement.hidden = true;
      status.textContent = copy.fallback; invalidate();
    });
    status.textContent = '';
  } catch {
    disposeRenderer();
    root.classList.remove('is-webgl');
    status.textContent = copy.fallback;
  }
  setAutoRotate(autoRotate);
  root.classList.add('is-interactive'); controls.hidden = false;
  const observer = new ResizeObserver(resize); observer.observe(stage);
  const intersection = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) invalidate(); else { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  }); intersection.observe(stage);
  resize(); render(); root.classList.add('is-ready'); schedule();

  return {
    setLanguage(nextLanguage) {
      copy = setViewerLanguage(root, book, nextLanguage);
      status.textContent = !renderer || contextLost ? copy.fallback : textureFailed ? copy.coverUnavailable : '';
    },
    pause() {
      suspended = true; stopMotion();
      for (const id of pointers.keys()) if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
      pointers.clear(); root.classList.remove('is-dragging');
      cancelAnimationFrame(frame); frame = 0;
    },
    dispose() {
      if (disposed) return;
      disposed = true; abort.abort(); cancelAnimationFrame(frame);
      observer.disconnect(); intersection.disconnect();
      for (const id of pointers.keys()) if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
      pointers.clear(); resources.forEach(resource => resource.dispose()); resources.clear();
      disposeRenderer();
      root.classList.remove('is-ready', 'is-webgl', 'is-interactive', 'is-dragging');
      fallback.style.removeProperty('--viewer-rotation'); fallback.style.removeProperty('--viewer-scale');
      controls.hidden = true; status.textContent = ''; spinButton.setAttribute('aria-pressed', 'false');
    }
  };
}
