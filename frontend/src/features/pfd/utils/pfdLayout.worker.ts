// ELK's published worker installs its own protocol dispatcher on self.onmessage.
// Do not instantiate elk.bundled here: its simulated-worker facade conflicts with that dispatcher.
import 'elkjs/lib/elk-worker.min.js';
