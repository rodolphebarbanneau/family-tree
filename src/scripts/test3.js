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
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
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
 * Nullify field.
 * @param field - The field.
 * @returns The nullified field.
 */
function nullify(field) {
  return field === '' ? null : field;
}

/**
 * Initialize data.
 * @returns The data object.
 */
function initializeData() {
  /**
   * Populate data.
   * @param source - The source input data.
   */
  function populate(source) {
    try {
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
          top: params.origin.top,
        }
      };
      // fill
      this.push(root);
      for (var i = 1; i < source.length; i += 1) {
        // filter void
        if (source[i]) {
          const record = source[i].split(',');
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
    } catch (err) {
      alert('An error occured with the source data input: ' + err);
    }
    return this;
  }

  /**
   * Process data recursively.
   * @param index - The data index.
   */
  function process() {
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

  // build data object
  const data = [];
  data.populate = populate;
  data.process = process;
  return data;
}

/**
 * Initialize tree.
 * @returns The tree object.
 */
function initializeTree() {
  /**
   * Populate tree  (split source input data by generations).
   * @param source - The source input data.
   */
  function populate(source) {
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
  function organize() {
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
  function process() {
    // compute width
    for (var g = this.length - 1; g > 0; g -= 1) {
      for (var i = 0; i < this[g].length; i += 1) {
        // check width
        if (this[g][i].layout.size === 0) {
          // add template width
          this[g][i].node.layout.size += params.template.width;
          // add template spacing
          if (i === this[g].length - 1) {
            this[g][i].node.layout.size += params.spacing.h.group[0];
          } else if (this[g][i].id === this[g][i + 1].parent || this[g][i].parent === this[g][i + 1].id) {
            this[g][i].node.layout.size += params.spacing.h.spouse[0];
          } else {
            this[g][i].node.layout.size += params.spacing.h.descendant[0];
          }
        } else {
          // cumulate size
          this[g][i].node.layout.size += this[g][i].layout.size;
        }
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
        this[g][i].layout.left = node.layout.left - (node.layout.size / 2)
          + shift
          + (this[g][i].layout.size / 2);
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
  function compress() {
    return this;
  }

  ///**
  // * Draw tree.
  // */
  //function draw(app, root) {
  //  // initialize
  //  const doc = app.activeDocument;
  //  const body = doc.layers.getByName('body');
  //  // check document body
  //  if (body) {
  //    // load template
  //    const template = app.open(new File(root + '/template.ai'));
  //    // draw tree
  //    var target;
  //    for (var g = 0; g < this.length; g += 1) {
  //      for (var i = 0; i < this[g].length; i += 1) {
  //        // import template
  //        target = template.groupItems[0].duplicate(
  //          body,
  //          ElementPlacement.PLACEATBEGINNING,
  //        );
  //        // edit template
  //        target.name = this[g][i].id;
  //        target.textFrames.getByName('first-name').contents = this[g][i].firstName;
  //        target.textFrames.getByName('last-name').contents = this[g][i].lastName;
  //        target.textFrames.getByName('birth').contents = this[g][i].birth;
  //        target.textFrames.getByName('death').contents = this[g][i].death;
  //        // place template
  //        target.left = mmToPoints(this[g][i].left) - (target.width / 2)
  //        target.top = -mmToPoints(this[g][i].top);
  //      }
  //    }
  //    // unload template
  //    template.close(SaveOptions.DONOTSAVECHANGES);
  //  }
  //  return this;
  //}

  // build tree object
  const tree = [];
  tree.populate = populate;
  tree.organize = organize;
  tree.process = process;
  tree.compress = compress;
  //tree.draw = draw;
  return tree;
}

/**
 * Script entry point.
 */
(function () {
  const text =
  `id,type,first_name,last_name,sex,birth,death,wedding,parent,check,relationship
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
  02-07,descendant,Gilles,Barbaneau,male,,,,01-04,1,[descendant] Gilles BARBANEAU -> Catherine LEFER
  02-08,spouse,Catherine,Maugeay,female,,,,02-07,1,[spouse] Catherine MAUGEAY -> Gilles BARBANEAU
  02-09,descendant,Guillaume,Barbaneau,male,,,,01-04,1,[descendant] Guillaume BARBANEAU -> Catherine LEFER
  02-10,spouse,Jehanne,Cuit,female,,,,02-09,1,[spouse] Jehanne CUIT -> Guillaume BARBANEAU
  02-11,descendant,François,Barbaneau,male,,1659,,01-04,1,[descendant] François BARBANEAU -> Catherine LEFER
  02-12,spouse,Marie,Ollivier,female,,1668,,02-11,1,[spouse] Marie OLLIVIER -> François BARBANEAU
  02-13,descendant,Jehan,Barbaneau,male,,,,01-04,1,[descendant] Jehan BARBANEAU -> Catherine LEFER
  02-14,spouse,Anne,Prieur,female,,,,02-13,1,[spouse] Anne PRIEUR -> Jehan BARBANEAU
  `.split(/\r?\n/);
  // initialize
  //const script = new File($.fileName);
  //const root = script.parent.fsName;
  // load data
  //const csv = File(root + '/data.csv');
  //csv.open('r');
  //const text = csv.read().split(/\r?\n/);
  //csv.close();
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
    //.draw(app, root);
  // finalize
  console.log('success');
})();
