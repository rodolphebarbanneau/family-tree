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
    top: 90.00,
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
  node.lineage = record ? nullify(record[2]) === 'true' : null;
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
  node.parent = null;
  node.spouses = [];
  node.children = [];
  node.elements = [];

  /** Initialize node layout field. */
  node.layout = {
    width: 0,
    margins: [0, 0],
    left: params.origin.left - params.size.width,
    top: params.origin.top - params.size.height,
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
    nodes[0].parent = nodes[0];
    nodes[0].spouses = [nodes[0]];
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

  /**
   * Render the tree in the active document.
   * @param app - The application.
   * @returns The tree.
   */
  tree.render = function render(app) {
    /**
     * Initialize a progress window.
     * @param steps - The total number of steps.
     */
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

    /**
     * Process a tree node drawing.
     * @param layer - The output layer.
     * @param template - The template.
     * @param node - The tree node to process.
     */
    function process(layer, template, node) {
      // coalesce value
      function coalesce(value, other) {
        return value ? value : other;
      }

      // duplicate template item
      function duplicate(target, item) {
        return item.duplicate(target, ElementPlacement.PLACEATBEGINNING);
      }

      // convert measure from millimeters to points
      function mmToPoints(measure) {
        const points = 2.83464566929134;
        return measure * points;
      }

      // process node elements
      for (var i = node.elements.length - 1; i >= 0; i -= 1) {
        var output, vector;
        // initialize output
        if (node.elements[i].id || i === 0) {
          output = layer.groupItems.add();
          output.name = coalesce(node.elements[i].id, 'root');
        }
        // draw body
        if (output && node.elements[i].id) {
          // draw info template
          if (node.elements[i].wedding) {
            vector = duplicate(output, template.info);
            vector.textFrames.getByName('wedding').contents = coalesce(node.elements[i].wedding, '');
            vector.left = coalesce(mmToPoints(node.elements[i].layout.left), 0);
            vector.top = coalesce(-mmToPoints(node.elements[i].layout.top - params.spacing.vertical[0]), 0);
          }
          // draw node template
          vector = duplicate(output, template.node);
          vector.textFrames.getByName('first-name').contents = coalesce(node.elements[i].firstName, '');
          vector.textFrames.getByName('last-name').contents = coalesce(node.elements[i].lastName, '');
          vector.textFrames.getByName('birth').contents = coalesce(node.elements[i].birth, '');
          vector.textFrames.getByName('death').contents = coalesce(node.elements[i].death, '');
          vector.left = coalesce(mmToPoints(node.elements[i].layout.left), 0);
          vector.top = coalesce(-mmToPoints(node.elements[i].layout.top), 0);
        }
        // draw links
        if (output && !node.elements[i].lineage) {
          // initialize output
          output.groupItems.add();
          output.groupItems[0].name = 'links';
          // draw link template
          for (var j = node.elements[i].children.length - 1; j >= 0; j -= 1) {
            // initialize draw
            vector = duplicate(output.groupItems.getByName('links'), template.link);
            vector.name = coalesce(node.elements[i].children[j].id, '<Undefined>');
            // initialize coordinates
            var coords = {};
            coords.start = {
              left: coalesce(mmToPoints(node.elements[i].layout.left + (params.size.width * (node.elements[i].id ? 0.5 : 1))), 0),
              top: coalesce(-mmToPoints(node.elements[i].layout.top + params.size.height), 0),
            };
            coords.break = {
              top: coalesce(-mmToPoints(node.elements[i].layout.top + params.size.height + params.spacing.vertical[1]), 0),
            };
            coords.end = {
              left: coalesce(mmToPoints(node.elements[i].children[j].layout.left + (0.5 * params.size.width)), 0),
              top: coalesce(-mmToPoints(node.elements[i].layout.top + params.size.height + params.spacing.vertical[0] + params.spacing.vertical[1]), 0),
            };
            // initialize item
            var item;
            // edit start item
            item = vector.pathItems.getByName('start');
            if (item) {
              item.left = coords.start.left - (0.5 * item.width);
              item.top = coords.start.top;
            }
            // edit line item
            item = vector.pathItems.getByName('line');
            if (item) {
              if (item.pathPoints.length === 4) {
                item.pathPoints[0].anchor = [coords.start.left, coords.start.top];
                item.pathPoints[0].leftDirection = [coords.start.left, coords.start.top];
                item.pathPoints[0].rightDirection = [coords.start.left, coords.start.top];

                item.pathPoints[1].anchor = [coords.start.left, coords.break.top];
                item.pathPoints[1].leftDirection = [coords.start.left, coords.break.top];
                item.pathPoints[1].rightDirection = [coords.start.left, coords.break.top];

                item.pathPoints[2].anchor = [coords.end.left, coords.break.top];
                item.pathPoints[2].leftDirection = [coords.end.left, coords.break.top];
                item.pathPoints[2].rightDirection = [coords.end.left, coords.break.top];

                item.pathPoints[3].anchor = [coords.end.left, coords.end.top];
                item.pathPoints[3].leftDirection = [coords.end.left, coords.end.top];
                item.pathPoints[3].rightDirection = [coords.end.left, coords.end.top];
              } else {
                item.remove();
              }
            }
            // edit end item
            item = vector.pathItems.getByName('end');
            if (item) {
              item.left = coords.end.left - (0.5 * item.width);
              item.top = coords.end.top + item.height;
            }
          }
        }
      }
    }

    /** Render. */

    // initialize application context
    const doc = app.activeDocument;
    doc.artboards.setActiveArtboardIndex(0);
    const layer = doc.layers.add();
    layer.name = 'tree';
    const template = doc
      .layers.getByName('template')
      .layers.getByName('items')
      .groupItems;

    // initialize progress steps
    var steps = 0;
    for (var l = 1; l < tree.levels.length; l += 1) {
      steps += tree.levels[l].length;
    }

    // process tree
    progress(steps);
    for (var l = tree.levels.length - 1; l >= 0; l -= 1) {
      for (var i = tree.levels[l].length - 1; i >= 0; i -= 1) {
        // process node
        progress.message('Drawing element ' + progress.increment() + '/' + steps + '...');
        process(layer, template, tree.levels[l][i]);
      }
    }
    progress.close();

    // return
    layer.hasSelectedArtwork = false;
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
  const csv = File(root + '/data/tree.csv');
  csv.open('r');
  const data = csv.read().split(/\r?\n/);
  csv.close();

  // tree
  const tree = getTree(data);
  tree.compress();
  tree.render(app);

  // finalize
  alert('success');
})();
