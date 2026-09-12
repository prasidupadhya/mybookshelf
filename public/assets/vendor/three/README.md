# Three.js viewer runtime

Three.js 0.186.0, MIT license (see LICENSE). Source: https://www.npmjs.com/package/three/v/0.186.0 and https://github.com/mrdoob/three.js/tree/r186.

`three.module.js` is a minified, tree-shaken ES module built with esbuild 0.25.10. It is served locally and imported only by the lazy-loaded detail viewer. No CDN, package install, or bundler is needed at deployment/runtime.

To reproduce, unpack `npm pack three@0.186.0` into a temporary directory, create `entry.js` alongside `package/` containing:

```js
export { WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, BoxGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, CanvasTexture, SRGBColorSpace, HemisphereLight, DirectionalLight, Quaternion, Vector3, Euler, Matrix4, Color, MathUtils } from './package/build/three.module.js';
```

Then run:

```sh
npx --yes esbuild@0.25.10 entry.js --bundle --minify --format=esm --outfile=three.module.js
```

Copy the output and upstream LICENSE into this directory.
