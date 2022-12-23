/**
 * Populate Family Tree (illustrator javascript script)
 * ------------------------------------------------------------------------------
 *
 * Description: Populate the `body` active document layer with the family tree
 * data and template.
 * Author: Rodolphe BARBANNEAU (rodolpher.barbanneau@gmail.com)
 *
 * ------------------------------------------------------------------------------
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Christian Hoffmeister
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Parameters.
 */
const params = {
  // template origin coordinates (mm)
  origin: {
    left: 594.5,
    top: 100,
  },
  // template spacing (mm)
  spacing: {
    h: {
      group: [9.9, Number.MAX_VALUE],
      descendant: [6.1, Number.MAX_VALUE],
      spouse: [0, Number.MAX_VALUE],
    },
    v: {
      before: 9.9,
      after: 16,
    },
  },
  // template size (mm)
  template: {
    width: 25.9,
    height: 16,
  },
};

/**
 * Coalesce value.
 * @param field - The value.
 * @returns The coalesced value.
 */
function coalesce(value, other) {
  return value ? value : other;
}

/**
 * Get a folder path.
 * @returns The selected folder patg.
 */
function getFolder() {
  return Folder.selectDialog('Please select the output folder:', Folder('~'));
}

/**
 * Convert a measure from millimeters to points.
 * @param measure - The measure in millimeters.
 * @returns The measure in points.
 */
function mmToPoints(measure) {
  // mm conversion factor
  const points = 2.83464566929134;
  return measure * points;
}

/**
 * Nullify value.
 * @param value - The value.
 * @returns The nullified value.
 */
function nullify(value) {
  return value === '' ? null : value;
}

/**
 * Initialize data.
 * @returns The data object.
 */
function initializeData() {
  // initialize
  const data = [];

  /**
   * Populate data.
   * @param source - The source input data.
   */
  data.populate = function (source) {
    // root
    const root = {
      anchor: null,
      node: null,
      id: null,
      layout: {
        generation: 0,
        index: 0,
        size: 0,
        left: params.origin.left,
        top: params.origin.top
          - params.spacing.v.before
          - params.spacing.v.after,
      }
    };
    // fill
    this.push(root);
    for (var i = 1; i < source.length; i += 1) {
      // filter void
      if (source[i]) {
        var record = source[i].split(',');
        // filter check
        if (record[9] === '1') {
          this.push({
            anchor: null,
            node: null,
            id: nullify(record[0]),
            type: nullify(record[1]),
            firstName: nullify(record[2]),
            lastName: nullify(record[3]),
            sex: nullify(record[4]),
            birth: nullify(record[5]),
            death: nullify(record[6]),
            wedding: nullify(record[7]),
            parent: nullify(record[8]),
            layout: {
              generation: 0,
              index: 0,
              size: 0,
              left: 0,
              top: 0,
            }
          });
        }
      }
    }
    return this;
  }

  /**
   * Process data.
   */
  data.process = function () {
    // compute anchor and generation
    function recursive(data, index) {
      // compute anchor and generation
      for (var i = 1; i < data.length; i += 1) {
        // check parent
        if (data[i].parent === data[index].id) {
          // update anchor reference
          data[i].anchor = data[index];
          // update generation
          if (data[i].type === 'spouse') {
            data[i].layout.generation = data[index].layout.generation;
          } else {
            data[i].layout.generation = data[index].layout.generation + 1;
          }
          // recurse
          recursive(data, i);
        }
      }
    } recursive(this, 0);
    // compute node
    for (var i = 1; i < this.length; i += 1) {
      var node = this[i].anchor;
      while (node && this[i].layout.generation === node.layout.generation) {
        node = node.anchor;
      }
      this[i].node = node;
    }
    return this;
  }

  return data;
}

/**
 * Initialize tree.
 * @returns The tree object.
 */
function initializeTree() {
  // initialize
  const tree = [];

  /**
   * Populate tree  (split source input data by generations).
   * @param source - The source input data.
   */
  tree.populate = function populate(source) {
    var row = [source[0]], index = 0;
    while (row.length > 0) {
      // push data
      this.push(row);
      row = [];
      index += 1;
      // fetch data
      for (var i = 0; i < source.length; i += 1) {
        if (source[i].layout.generation === index) {
          row.push(source[i]);
        }
      }
    }
    return this;
  }

  /**
   * Organize tree.
   */
  tree.organize = function organize() {
    for (var g = 1; g < this.length; g += 1) {
      // base sort
      this[g].sort(function (a, b) {
        if (a.node.layout.index < b.node.layout.index) return -1;
        if (a.type < b.type) return -1;
        if (a.id < b.id) return -1;
      })
      // spouse sort
      for (var i = 0; i < this[g].length; i += 1) {
        if (this[g][i].type === 'spouse') {
          for (var j = 0; j < this[g].length; j += 1) {
            if (this[g][j].id === this[g][i].parent) {
              this[g].splice(
                j + (this[g][j].sex === 'male' ? 1 : 0),
                0,
                this[g].splice(i, 1)[0],
              );
            }
          }
        }
      }
      // index
      for (var i = 0; i < this[g].length; i += 1) {
        this[g][i].layout.index = i;
      }
    }
    return this;
  }

  /**
   * Process tree.
   */
  tree.process = function process() {
    // compute width
    for (var g = this.length - 1; g > 0; g -= 1) {
      for (var i = 0; i < this[g].length; i += 1) {
        // check width
        if (this[g][i].layout.size === 0) {
          // add template width
          this[g][i].layout.size += params.template.width;
          // add template spacing
          if (i === this[g].length - 1) {
            this[g][i].layout.size += params.spacing.h.group[0];
          } else if (this[g][i].id === this[g][i + 1].parent || this[g][i].parent === this[g][i + 1].id) {
            this[g][i].layout.size += params.spacing.h.spouse[0];
          } else {
            this[g][i].layout.size += params.spacing.h.descendant[0];
          }
        }
        // cumulate size
        this[g][i].node.layout.size += this[g][i].layout.size;
      }
    }
    // compute coordinates
    for (var g = 1; g < this.length; g += 1) {
      var node, shift;
      for (var i = 0; i < this[g].length; i += 1) {
        // initialize node
        if (i === 0 || node !== this[g][i].node) {
          node = this[g][i].node;
          shift = 0;
        }
        // coordinnates
        this[g][i].layout.left = node.layout.left - (node.layout.size / 2) + shift;
        this[g][i].layout.top = node.layout.top
          + params.template.height
          + params.spacing.v.before
          + params.spacing.v.after;
        // shift
        shift += this[g][i].layout.size;
      }
    }
    return this;
  }

  /**
   * Compress tree.
   */
  tree.compress = function compress() {
    return this;
  }

  /**
   * Draw tree.
   */
  tree.draw = function draw(app, root) {
    // progress window
    function progress(steps) {
      // initialize
      const win = new Window('palette', 'Populating family tree...', undefined, {closeButton: false});
      const tab = win.add('statictext');
      tab.preferredSize = [450, -1];
      const bar = win.add('progressbar', undefined, 0, steps);
      bar.preferredSize = [450, -1];
      // methods
      progress.close = function () { win.close(); };
      progress.increment = function () { bar.value += 1; return bar.value; };
      progress.message = function (message) { tab.text = message; win.update(); win.show(); };
      // show
      win.show();
    }
    // initialize document
    const doc = app.activeDocument;
    const body = doc.layers.getByName('body');
    // initialize steps
    var steps = 0;
    for (var g = 1; g < this.length; g += 1) {
      steps += this[g].length;
    }
    // check document and steps
    if (body && steps > 0) {
      // load template
      const template = app.open(new File(root + '/template.ai'));
      // load progress
      progress(steps);
      // draw tree
      var target;
      for (var g = this.length - 1; g > 0; g -= 1) {
        for (var i = this[g].length - 1; i >= 0; i -= 1) {
          // progress increment
          progress.message('Drawing element: ' + progress.increment());
          // import template
          target = template.groupItems[0].duplicate(
            body,
            ElementPlacement.PLACEATBEGINNING,
          );
          // edit template
          target.name = coalesce(this[g][i].id, '<undefined>');
          target.textFrames.getByName('first-name').contents = coalesce(this[g][i].firstName, '<undefined>');
          target.textFrames.getByName('last-name').contents = coalesce(this[g][i].lastName, '<undefined>');
          target.textFrames.getByName('birth').contents = coalesce(this[g][i].birth, '');
          target.textFrames.getByName('death').contents = coalesce(this[g][i].death, '');
          // place template
          target.left = coalesce(mmToPoints(this[g][i].layout.left) - (target.width / 2), 0);
          target.top = coalesce(-mmToPoints(this[g][i].layout.top), 0);
        }
      }
      // unload template
      template.close(SaveOptions.DONOTSAVECHANGES);
      // progress close
      progress.close();
    }
    return this;
  }

  return tree;
}

/**
 * Script entry point.
 */
(function () {
  // initialize
  const script = new File($.fileName);
  const root = script.parent.fsName;
  // load data
  const csv = File(root + '/data.csv');
  csv.open('r');
  const text = csv.read().split(/\r?\n/);
  csv.close();
  // initialize data
  const data = initializeData()
    .populate(text)
    .process();
  // initialize tree
  const tree = initializeTree()
    .populate(data)
    .organize()
    .process()
    .compress()
    .draw(app, root);
  // finalize
  alert('success');
})();
