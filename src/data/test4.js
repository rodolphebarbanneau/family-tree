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
 * Copyright (c) 2022 Rodolphe Barbanneau
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
      id: null,
      type: 'descendant',
      node: null,
      anchor: null,
      children: [],
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
            id: nullify(record[0]),
            type: nullify(record[1]),
            firstName: nullify(record[2]),
            lastName: nullify(record[3]),
            sex: nullify(record[4]),
            birth: nullify(record[5]),
            death: nullify(record[6]),
            wedding: nullify(record[7]),
            parent: nullify(record[8]),
            node: null,
            anchor: null,
            children: [],
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
          // update children reference
          data[index].children.push(data[i]);
          // update generation
          if (data[i].type === 'descendant') {
            data[i].layout.generation = data[index].layout.generation + 1;
          } else {
            data[i].layout.generation = data[index].layout.generation;
          }
          // recurse
          recursive(data, i);
        }
      }
    } recursive(this, 0);
    // compute node
    for (var i = 1; i < this.length; i += 1) {
      var node = this[i].anchor;
      while (node && (
        node.type !== 'descendant'
        || this[i].layout.generation === node.layout.generation
      )) {
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
   * Populate tree  (split source descendant by generations).
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
        if (source[i].type === 'descendant'
          && source[i].layout.generation === index) {
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
      // generation sort
      this[g].sort(function (a, b) {
        if (a.node.layout.index < b.node.layout.index) return -1;
        if (a.anchor.layout.index < b.anchor.layout.index) return -1;
        if (a.id < b.id) return -1;
      });
      // spouse sort
      for (var i = 0; i < this[g].length; i += 1) {
        this[g][i].children.sort(function (a, b) {
          if (a.id < b.id) return -1;
        });
        // children sort
        for (var k = 0; k < this[g][i].children.length; k += 1) {
          this[g][i].children[k].children.sort(function (a, b) {
            if (a.id < b.id) return -1;
          });
        }
        // indexing
        this[g][i].layout.index = i;
        for (var k = 0; k < this[g][i].children.length; k += 1) {
          this[g][i].children[k].layout.index = k;
        }
      }
    }
    return this;
  }

  /**
   * Process tree.
   */
  tree.process = function process() {
    // compute size
    for (var g = this.length - 1; g > 0; g -= 1) {
      for (var i = 0; i < this[g].length; i += 1) {
        // add spouse size
        for (var k = 0; k < this[g][i].children.length; k += 1) {
          if (this[g][i].children[k].layout.size === 0) {
            this[g][i].children[k].layout.size = params.template.width
              + params.spacing.h.spouse[0];
          }
          this[g][i].layout.size += this[g][i].children[k].layout.size;
        }
        // check spouse size
        if (this[g][i].layout.size
          < ((1 + this[g][i].children.length) * params.template.width)
            + (this[g][i].children.length * params.spacing.h.spouse[0])
        ) {
          this[g][i].layout.size += params.template.width;
        }
        // add template spacing
        if (i === this[g].length - 1 || this[g][i].node !== this[g][i + 1].node) {
          this[g][i].layout.size += params.spacing.h.group[0];
        } else {
          this[g][i].layout.size += params.spacing.h.descendant[0];
        }
        // cumulate size
        this[g][i].anchor.layout.size += this[g][i].layout.size;
      }
    }
    // compute coordinates
    for (var g = 1; g < this.length; g += 1) {
      var shift;
      for (var i = 0; i < this[g].length; i += 1) {
        // initialize shift
        if (i === 0 || this[g][i - 1].node !== this[g][i].node) {
          shift = 0;
        }
        // coordinnates
        this[g][i].layout.left = this[g][i].node.layout.left - (this[g][i].node.layout.size / 2) + shift;
        this[g][i].layout.top = this[g][i].node.layout.top
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

  return tree;
}

/**
 * Script entry point.
 */
(function () {
  const text =
`id,type,first_name,last_name,sex,birth,death,wedding,parent,check,relationship
02-07,descendant,Gilles,Barbaneau,male,,,,01-04,1,[descendant] Gilles BARBANEAU -> Catherine LEFER
02-08,spouse,Catherine,Maugeay,female,,,,02-07,1,[spouse] Catherine MAUGEAY -> Gilles BARBANEAU
02-09,descendant,Guillaume,Barbaneau,male,,,,01-04,1,[descendant] Guillaume BARBANEAU -> Catherine LEFER
02-10,spouse,Jehanne,Cuit,female,,,,02-09,1,[spouse] Jehanne CUIT -> Guillaume BARBANEAU
02-11,descendant,François,Barbaneau,male,,1659,,01-04,1,[descendant] François BARBANEAU -> Catherine LEFER
02-12,spouse,Marie,Ollivier,female,,1668,,02-11,1,[spouse] Marie OLLIVIER -> François BARBANEAU
02-13,descendant,Jehan,Barbaneau,male,,,,01-04,1,[descendant] Jehan BARBANEAU -> Catherine LEFER
02-14,spouse,Anne,Prieur,female,,,,02-13,1,[spouse] Anne PRIEUR -> Jehan BARBANEAU
01-01,spouse,François,Baussay,male,,,,01-02,1,[spouse] François BAUSSAY -> Agathe BARBANEAU
01-02,descendant,Agathe,Barbaneau,female,,,,,1,[descendant] Agathe BARBANEAU -> undefined
01-03,descendant,Valentin,Barbaneau,male,,,,,1,[descendant] Valentin BARBANEAU -> undefined
01-04,spouse,Catherine,Lefer,female,,,,01-03,1,[spouse] Catherine LEFER -> Valentin BARBANEAU
01-05,descendant,Michel,Barbaneau,male,,,,,1,[descendant] Michel BARBANEAU -> undefined
02-01,descendant,Jehan,Barbaneau,male,,,,01-04,1,[descendant] Jehan BARBANEAU -> Catherine LEFER
02-02,spouse,Louise,Maujais,female,,,,02-01,1,[spouse] Louise MAUJAIS -> Jehan BARBANEAU
02-03,spouse,Pierre,Simonnet,male,,,1596,02-04,1,[spouse] Pierre SIMONNET -> Agathe BARBANEAU
02-04,descendant,Agathe,Barbaneau,female,,,,01-04,1,[descendant] Agathe BARBANEAU -> Catherine LEFER
02-05,descendant,Michel,Barbaneau,male,,,,01-04,1,[descendant] Michel BARBANEAU -> Catherine LEFER
02-06,spouse,Marie,Maugeais,female,,,,02-05,1,[spouse] Marie MAUGEAIS -> Michel BARBANEAU

  `.split(/\r?\n/);

  // initialize data
  const data = initializeData()
    .populate(text)
    .process();
  // initialize tree
  const tree = initializeTree()
    .populate(data)
    .organize()
    .process()
    .compress();
  // finalize
  alert('success');
})();
