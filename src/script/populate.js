/**
 * Populate Family Tree (illustrator javascript es3 script)
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
  // template origin (millimeters)
  origin: {
    left: 594.50,
    top: 100.00,
  },
  // template size (millimeters)
  size: {
    width: 25.90,
    height: 16.00,
  },
  // template spacing (millimeters)
  spacing: {
    horizontal: [6.10, 9.90],
    vertical: [9.90, 16.00],
  },
};


/**
 * Coalesce a value.
 * @param field - The value.
 * @returns The coalesced value.
 */
function coalesce(value, other) {
  return value ? value : other;
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
 * Nullify a value.
 * @param value - The value.
 * @returns The nullified value.
 */
function nullify(value) {
  return value === '' ? null : value;
}

/**
 * Get a folder path.
 * @returns The selected folder path.
 */
function getFolder() {
  return Folder.selectDialog('Please select the output folder:', Folder('~'));
}

/**
 * Create a node from a data record.
 * @param record - The input data record.
 * @returns The created node.
 */
function getNode(record) {
  /** Initialize node. */
  const node = {};

  /** Initialize node data fields. */
  node.id = record ? nullify(record[1]) : null;
  node.lineage = record ? nullify(record[2]) === 'true' : 'true';
  node.firstName = record ? nullify(record[3]) : null;
  node.lastName = record ? nullify(record[4]) : null;
  node.sex = record ? nullify(record[5]) : null;
  node.birth = record ? nullify(record[6]) : null;
  node.death = record ? nullify(record[7]) : null;
  node.wedding = record ? nullify(record[8]) : null;
  node.parentId = record ? nullify(record[9]) : null;

  /** Initialize node tree fields. */
  node.level = 0;
  node.index = 0;
  node.ancestor = null;
  node.parent = record ? null : node;
  node.spouses = record ? [] : [node];
  node.children = [];
  node.elements = [];

  /** Initialize node layout field. */
  node.layout = {
    width: 0,
    margins: [0, 0],
    left: params.origin.left
      - params.size.width,
    top: params.origin.top
      - params.spacing.vertical[0]
      - params.spacing.vertical[1],
  };

  /** Return node. */
  return node;
}

/**
 * Create a tree from data.
 * @param data - The input data.
 * @returns The created tree.
 */
function getTree(data) {
  /** Initialize tree. */
  const tree = {};

  /** Initialize tree nodes. */
  tree.nodes = (function() {
    // initialize nodes
    const nodes = [];
    // create root node
    nodes.push(getNode());
    // populate nodes from data records
    for (var i = 1; i < data.length; i += 1) {
      // filter void
      if (data[i]) {
        var record = data[i].split(',');
        // filter check
        if (record[0] === '1') {
          nodes.push(getNode(record));
        }
      }
    }

    // process nodes parent dependencies
    function process(index) {
      for (var i = 1; i < nodes.length; i += 1) {
        // check node dependency
        if (nodes[i].parentId === nodes[index].id) {
          // check lineage
          if (nodes[i].lineage) {
            // update child node
            nodes[i].parent = nodes[index];
            nodes[i].level = nodes[index].level + 1;
            // update parent node
            nodes[index].children.push(nodes[i]);
            if (nodes[index].parent !== nodes[index]) {
              nodes[index].parent.children.push(nodes[i]);
            }
          } else {
            // update child node
            nodes[i].parent = nodes[index];
            nodes[i].level = nodes[index].level;
            // update parent node
            nodes[index].spouses.push(nodes[i]);
          }
          // recurse
          process(i);
        }
      }
    } process(0);

    // process nodes ancestor dependencies
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].lineage) {
        nodes[i].ancestor = nodes[i].parent.parent;
      } else {
        nodes[i].ancestor = nodes[i].parent.parent.parent;
      }
    }

    // sort and index nodes dependencies
    for (var i = 0; i < nodes.length; i += 1) {
      // sort spouses
      nodes[i].spouses.sort(function (a, b) {
        if (a.id < b.id) return -1;
        return 1;
      });
      // index spouses
      for (var k = 0; k < nodes[i].spouses.length; k += 1) {
        nodes[i].spouses[k].index = k;
      }
      // sort children
      nodes[i].children.sort(function (a, b) {
        if (a.parent.id < b.parent.id) return -1;
        if (a.id < b.id) return -1;
        return 1;
      });
      // update elements
      if (nodes[i].sex === 'male') {
        nodes[i].elements = [nodes[i]].concat(nodes[i].spouses);
      } else {
        nodes[i].elements = nodes[i].spouses.concat([nodes[i]]);
      }
    }

    // return nodes
    return nodes;
  })();

  /** Initialize tree levels. */
  tree.levels = (function() {
    // initialize levels
    const levels = [];
    // populate levels
    var level = [tree.nodes[0]], index = 0;
    while (level.length > 0) {
      // sort level
      level.sort(function (a, b) {
        if (a.ancestor.index < b.ancestor.index) return -1;
        if (a.parent.index < b.parent.index) return -1;
        if (a.id < b.id) return -1;
        return 1;
      });
      // index level
      for (var i = 0; i < level.length; i += 1) {
        level[i].index = i;
      }
      // push level
      levels.push(level);
      // fetch level
      level = [];
      index += 1;
      for (var i = 0; i < tree.nodes.length; i += 1) {
        if (tree.nodes[i].lineage
          && tree.nodes[i].level === index) {
            level.push(tree.nodes[i]);
        }
      }
    }

    // process levels nodes layout margins and width
    for (var l = levels.length - 1; l > 0; l -= 1) {
      for (var i = 0; i < levels[l].length; i += 1) {
        // update width
        for (var k = 0; k < levels[l][i].spouses.length; k += 1) {
          if (levels[l][i].spouses[k].layout.width === 0) {
            levels[l][i].spouses[k].layout.width = params.size.width;
          }
          levels[l][i].layout.width += levels[l][i].spouses[k].layout.width;
        }
        // check width
        levels[l][i].layout.width = Math.max(
          levels[l][i].layout.width,
          levels[l][i].elements.length * params.size.width,
        )
        // update margin
        levels[l][i].layout.margins = [
          0.5 * params.spacing.horizontal[
            (i > 0 && levels[l][i].ancestor === levels[l][i - 1].ancestor) ? 0 : 1
          ],
          0.5 * params.spacing.horizontal[
            (i < levels[l].length - 1 && levels[l][i].ancestor === levels[l][i + 1].ancestor) ? 0 : 1
          ],
        ];
        // cumulate width and margins
        levels[l][i].parent.layout.width += levels[l][i].layout.width
          + levels[l][i].layout.margins[0]
          + levels[l][i].layout.margins[1];
      }
    }

    // process levels nodes layout coordinates
    for (var l = 1; l < levels.length; l += 1) {
      var padding, offset;
      for (var i = 0; i < levels[l].length; i += 1) {
        // initialize offset
        if (i === 0 || levels[l][i - 1].ancestor !== levels[l][i].ancestor) {
          offset = levels[l][i].ancestor.layout.left
            - (0.5 * levels[l][i].ancestor.layout.width)
            + (0.5 * levels[l][i].ancestor.elements.length * params.size.width);
        }
        // initialize padding
        padding = (0.5 * levels[l][i].layout.width)
          - (0.5 * levels[l][i].elements.length * params.size.width);
        // increment start offset
        offset += levels[l][i].layout.margins[0] + padding;
        // process elements
        for (k = 0; k < levels[l][i].elements.length; k += 1) {
          levels[l][i].elements[k].layout.left = offset;
          levels[l][i].elements[k].layout.top = levels[l][i].ancestor.layout.top
            + params.size.height
            + params.spacing.vertical[0]
            + params.spacing.vertical[1];
          // increment offset
          offset += params.size.width;
        }
        // increment end offset
        offset += levels[l][i].layout.margins[1] + padding;
      }
    }

    // return levels
    return levels;
  })();

  /** Compress tree. */
  tree.compress = function compress() {
    // return
    return this;
  };

  /** Draw tree. */
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

    // draw template
    function drawTemplate(body, template, element) {
      // import template
      const target = template.groupItems[0].duplicate(
        body,
        ElementPlacement.PLACEATBEGINNING,
      );
      // edit template
      target.name = coalesce(element.id, '<undefined>');
      target.textFrames.getByName('first-name').contents = coalesce(element.firstName, '<undefined>');
      target.textFrames.getByName('last-name').contents = coalesce(element.lastName, '<undefined>');
      target.textFrames.getByName('birth').contents = coalesce(element.birth, '');
      target.textFrames.getByName('death').contents = coalesce(element.death, '');
      // place template
      target.left = coalesce(mmToPoints(element.layout.left), 0);
      target.top = coalesce(-mmToPoints(element.layout.top), 0);
    }

    // draw relationship
    function drawRelationship(body, element) {
    }

    // initialize document
    const doc = app.activeDocument;
    const body = doc.layers.getByName('body');
    // initialize steps
    var steps = 0;
    for (var l = 1; l < tree.levels.length; l += 1) {
      for (var i = 1; i < tree.levels[l].length; i += 1) {
        steps += tree.levels[l][i].elements.length + 1;
      }
    }

    // check document and steps
    if (body && steps > 0) {
      // load template
      const template = app.open(new File(root + '/template.ai'));
      // load progress
      progress(steps);
      // draw tree
      for (var l = tree.levels.length - 1; l > 0; l -= 1) {
        for (var i = tree.levels[l].length - 1; i >= 0; i -= 1) {
          // progress increment
          progress.message('Drawing element ' + progress.increment() + '/' + steps + '...');
          // draw elements template
          for (var k = tree.levels[l][i].elements.length - 1; k >= 0; k -= 1) {
            drawTemplate(body, template, tree.levels[l][i].elements[k]);
          }
          // draw elements relationship
        }
      }

      // unload template
      template.close(SaveOptions.DONOTSAVECHANGES);

      // progress close
      progress.close();
    }

    // return
    return this;
  };

  /** Return tree. */
  return tree;
}

/**
 * Script entry point.
 */
(function () {
  // initialize
  const script = new File($.fileName);
  const root = script.parent.fsName;

  // data
  const csv = File(root + '/data.csv');
  csv.open('r');
  const data = csv.read().split(/\r?\n/);
  csv.close();

  // tree
  const tree = getTree(data);
  tree.compress();
  tree.draw(app, root);

  // finalize
  alert('success');
})();
