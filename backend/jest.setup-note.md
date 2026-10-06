Jest runs on native Node ESM here (package.json has "type": "module").
If your Node version needs it, run tests with:
  node --experimental-vm-modules node_modules/.bin/jest
The `test` npm script already assumes a modern Node (>=18.7) where this
is not required for basic cases; add NODE_OPTIONS=--experimental-vm-modules
to the `test` script if your environment requires it.
