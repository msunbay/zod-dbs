#!/usr/bin/env node
import('./dist/cli.js').then((mod) => {
  void mod.main();
});
