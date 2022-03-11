function Mash() {
    var n = 0xefc8249d;

    var mash = function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    mash.version = 'Mash 0.9';
    return mash;
  }

function Alea() {
    return (function(args) {
      // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
      var s0 = 0;
      var s1 = 0;
      var s2 = 0;
      var c = 1;

      if (args.length == 0) {
        args = [+new Date];
      }
      var mash = Mash();
      s0 = mash(' ');
      s1 = mash(' ');
      s2 = mash(' ');

      for (var i = 0; i < args.length; i++) {
        s0 -= mash(args[i]);
        if (s0 < 0) {
          s0 += 1;
        }
        s1 -= mash(args[i]);
        if (s1 < 0) {
          s1 += 1;
        }
        s2 -= mash(args[i]);
        if (s2 < 0) {
          s2 += 1;
        }
      }
      mash = null;

      var random = function() {
        var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
        s0 = s1;
        s1 = s2;
        return s2 = t - (c = t | 0);
      };
      random.uint32 = function() {
        return random() * 0x100000000; // 2^32
      };
      random.fract53 = function() {
        return random() + 
          (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
      };
      random.version = 'Alea 0.9';
      random.args = args;
      return random;

    } (Array.prototype.slice.call(arguments)));
  };

class WorleyNoise {
    constructor(config) {
        config = config || {};
        if (config.dim !== 2 && config.dim !== 3 && config.dim !== undefined)
            throw '"dim" can be 2 or 3';

        this._dim = config.dim || 2;
        this._rng = new Alea(config.seed || Math.random());
        this._points = [];

        for (let i = 0; i < config.numPoints; i++) {
            this._points.push({
                x: this._rng(),
                y: this._rng(),
                z: this._rng(),
            });
        }
    }

    addPoint(coord) {
        this._points.push(coord);
    }

    getEuclidean(coord, k) {
        return Math.sqrt(this._calculateValue(coord, k, euclidean));
    }

    getManhattan(coord, k) {
        return this._calculateValue(coord, k, manhattan);
    }

    renderImage(resolution, config) {
        config = config || {};
        const step = 1 / (resolution - 1);
        const img = [];
        const callback = config.callback || ((e, m) => e(1));
        let x, y;

        const e = k => Math.sqrt(this._calculateValue({
            x: x * step,
            y: y * step,
            z: config.z || 0,
        }, k, euclidean));

        const m = k => this._calculateValue({
            x: x * step,
            y: y * step,
            z: config.z || 0,
        }, k, manhattan);

        for (y = 0; y < resolution; ++y) {
            for (x = 0; x < resolution; ++x) {
                img[y * resolution + x] = callback(e, m);
            }
        }

        if (!config.normalize)
            return img;

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        img.forEach(v => {
            min = Math.min(min, v);
            max = Math.max(max, v);
        });

        let scale = 1 / (max - min);
        return img.map(v => (v - min) * scale);
    }

    _calculateValue(coord, k, distFn) {
        let minDist;
        this._points.forEach(p => { p.selected = false; });

        for (let j = 0; j < k; ++j) {
            let minIdx;
            minDist = Number.POSITIVE_INFINITY;

            for (let i = 0; i < this._points.length; ++i) {
                const p = this._points[i];
                const dz = this._dim === 2 ? 0 : coord.z - p.z;
                const dist = distFn(coord.x - p.x, coord.y - p.y, dz);

                if (dist < minDist && !p.selected) {
                    minDist = dist;
                    minIdx = i;
                }
            }

            this._points[minIdx].selected = true;
        }

        return minDist;
    }
}

const euclidean = (dx, dy, dz) => dx * dx + dy * dy + dz * dz;
const manhattan = (dx, dy, dz) => Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
