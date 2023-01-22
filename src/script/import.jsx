/**
 * Populate Family Tree (illustrator javascript es3 script)
 * ------------------------------------------------------------------------------
 * Description: Render a family tree into the illustrator active document.
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
  // golden ratio
  phi: 1 / 1.61803398874989,
};


/**
 * A tree node.
 * @param {string[]} record The input data record.
 * @returns The created tree node.
 */
function Node(record) {
  /** Initialize node fields. */
  // node group
  this.group = null;
  // parent node
  this.parent = null;
  // children node
  this.children = [];

  /** Initialize node record fields. */
  // node id
  this.id = null;
  // lineage flag
  this.lineage = true;
  // first name
  this.firstName = null;
  // last name
  this.lastName = null;
  // sex
  this.sex = null;
  // birth year
  this.birth = null;
  // death year
  this.death = null;
  // wedding year
  this.wedding = null;
  // node parent id (ancestor if parent is lineage else spouse)
  this.parentId = null;
  // coordinate left
  this.left = null;
  // coordinate top
  this.top = null;

  /** Initialize node layout fields. */
  this.layout = (function (self) {
    return {
      // left coordinate
      left: function () {
        if (params.mode) {
          if (self.group) {
            // compute node index
            var nodeIndex = 0;
            const nodes = self.group.nodes();
            while (
              nodeIndex < nodes.length - 1
              && nodes[nodeIndex] !== self
            ) { nodeIndex += 1 }
            return self.group.layout.left()
              + (nodeIndex * params.template.width);
          }
          return 0;
        }
        return self.left;
      },
      // top coordinate
      top: function () {
        if (params.mode) {
          if (self.group) {
            return self.group.layout.top();
          }
          return 0;
        }
        return self.top;
      },
      // right coordinate
      right: function () {
        return this.left() + params.template.width;
      },
      // bottom coordinate
      bottom: function () {
        return this.top() + params.template.height;
      },
    };
  })(this);

  /** Build tree. */
  this.initialize(record);
}

/**
 * Initialize node.
 * @param {string[]} record The input data record.
 */
Node.prototype.initialize = function (record) {
  /**
   * Nullify a value.
   * @param {*} value The value.
   * @returns The nullified value.
   */
  function nullify(value) {
    return value === '' ? null : value;
  }

  // update record fields
  if (record) {
    this.id = record[1];
    this.lineage = nullify(record[2]) === 'true';
    this.firstName = nullify(record[3]);
    this.lastName = nullify(record[4]);
    this.sex = nullify(record[5]);
    this.birth = nullify(record[6]);
    this.death = nullify(record[7]);
    this.wedding = nullify(record[8]);
    this.parentId = nullify(record[9]);
    this.left = parseFloat(record[10]);
    this.top = parseFloat(record[11]);
  }
};

/**
 * Add a child to the node.
 * @param {Node} child The child.
 */
Node.prototype.addChild = function (child) {
  // update child
  child.parent = this;
  // compute child index
  var nodeIndex = 0;
  // check lineage
  while (
    nodeIndex < this.children.length
    && child.lineage < this.children[nodeIndex].lineage
  ) { nodeIndex += 1 }
  // check id
  while (
    nodeIndex < this.children.length
    && child.lineage === this.children[nodeIndex].lineage
    && child.id > this.children[nodeIndex].id
  ) { nodeIndex += 1 }
  // push child
  this.children.splice(nodeIndex, 0, child);
};


/**
 * A tree node group.
 * @param {Node} node The lineage node.
 */
function NodeGroup(node) {
  /** Initialize node group fields. */
  // parent node group
  this.parent = null;
  // children node group
  this.children = [];
  // lineage node
  this.lineage = null;
  // spouse nodes
  this.spouses = [];
  // nodes (lineage and spouses)
  this.nodes = function () {
    // check sex
    if (this.lineage.sex === 'male') {
      return [this.lineage].concat(this.spouses);
    }
    return this.spouses.concat([this.lineage]);
  };

  /** Initialize node group layout fields. */
  this.layout = (function (self) {
    return {
      // level
      level: 0,
      // index
      index: 0,
      // coordinates
      coordinates: [0, 0],
      // width (lineage and spouses)
      width: 0,
      // margins
      margins: [0, 0],
      // left coordinate
      left: function () {
        if (params.mode) {
          return this.coordinates[0];
        } else {
          return self.lineage.left;
        }
      },
      // top coordinate
      top: function () {
        if (params.mode) {
          return this.coordinates[1];
        } else {
          return self.lineage.top;
        }
      },
      // right coordinate
      right: function () {
        return this.coordinates[0] + this.width;
      },
      // bottom coordinate
      bottom: function () {
        return this.coordinates[1] + params.template.height;
      },
      // size (children)
      size: function () {
        if (self.children.length > 0) {
          return self.children[self.children.length - 1].layout.right()
            - self.children[0].layout.left();
        }
        return 0;
      },
    };
  })(this);

  /** Build node group. */
  this.initialize(node);
}

/**
 * Initialize node group.
 * @param {Node} node The lineage node.
 */
NodeGroup.prototype.initialize = function (node) {
  // check lineage
  if (!node.lineage) throw 'Initializing node must be of lineage type';
  // update node
  node.group = this;
  // update node group
  this.lineage = node;
  // check parent
  if (node.parent) {
    this.parent = node.parent.group;
    // compute node group index
    var groupIndex = 0, nodeIndex = 0;
    const groups = this.parent.children;
    const nodes = this.parent.nodes();
    // check parent lineage node
    while (
      groupIndex < groups.length
      && nodes[nodeIndex] !== node.parent
    ) {
      while (
        nodeIndex < nodes.length
        && nodes[nodeIndex] !== node.parent
        && nodes[nodeIndex] !== groups[groupIndex].lineage.parent
      ) { nodeIndex += 1 }
      // check node
      if (nodes[nodeIndex] !== node.parent) groupIndex += 1;
    }
    // check id
    while (
      groupIndex < groups.length
      && node.parent === groups[groupIndex].lineage.parent
      && node.id > groups[groupIndex].lineage.id
    ) { groupIndex += 1 }
    // push node group
    this.parent.children.splice(groupIndex, 0, this);
  }
};

/**
 * Add a spouse to the node group.
 * @param {Node} spouse The spouse.
 */
NodeGroup.prototype.addSpouse = function (spouse) {
  // update spouse
  spouse.group = this;
  // compute spouse index
  var nodeIndex = 0;
  // check sex
  while (
    nodeIndex < this.spouses.length
    && spouse.sex < this.spouses[nodeIndex].sex
  ) { nodeIndex += 1 }
  // check id
  while (
    nodeIndex < this.spouses.length
    && spouse.sex === this.spouses[nodeIndex].sex
    && spouse.id > this.spouses[nodeIndex].id
  ) { nodeIndex += 1 }
  // push spouse
  this.spouses.splice(nodeIndex, 0, spouse);
};


/**
 * A tree.
 * @param {string[]} data The input data.
 */
function Tree(data) {
  /** Initialize tree. */
  // nodes
  this.nodes = [];
  // node groups
  this.groups = [];
  // levels
  this.levels = [];

  /** Build tree. */
  this.initialize(data);
}

/**
 * Initialize tree.
 * @param {string[]} data The input data.
 */
Tree.prototype.initialize = function (data) {
  /**
   * Populate recursively tree node groups and process node dependencies.
   * @param {Tree} self The tree.
   * @param {number} nodeIndex The node index.
   */
  function populate(self, nodeIndex) {
    for (var i = 1; i < self.nodes.length; i += 1) {
      // check node dependency
      if (self.nodes[i].parentId === self.nodes[nodeIndex].id) {
        // update node
        self.nodes[nodeIndex].addChild(self.nodes[i]);
        // check lineage
        if (self.nodes[i].lineage) {
          // create node group
          self.groups.push(new NodeGroup(self.nodes[i]));
        } else {
          // update node group
          self.nodes[i].parent.group.addSpouse(self.nodes[i]);
        }
        // recurse
        populate(self, i);
      }
    }
  }

  /**
   * Compute the offset between two node groups.
   * @param {NodeGroup[]} groups - The node groups collection.
   * @param {number} i The i-th index.
   * @param {number} j The j-th index.
   * @returns The node group offset.
   */
  function offsetGroup(groups, i, j) {
    // compute offset
    return Math.max(
      0,
      groups[i].layout.right()
        + groups[i].layout.margins[1]
        + groups[j].layout.margins[0]
        - groups[j].layout.left(),
    );
  }

  /**
   * Compute the offset between a node group and its lineage chilren.
   * @param {NodeGroup[]} groups - The node groups collection.
   * @param {*} stats The node group stats collection.
   * @param {number} i The i-th index.
   * @returns The stat offset.
   */
  function offsetLineage(groups, stats, i) {
    // compute left
    var left;
    if (stats) {
      left = stats[i].target;
    } else {
      left = groups[i].children.length > 0
        ? groups[i].children[0].layout.left()
        : groups[i].layout.left();
    }
    // compute size
    var size;
    if (stats) {
      size = stats[i].size;
    } else {
      size = groups[i].layout.size();
    }
    // compute range
    const range = [
      left + Math.min(0, size - groups[i].layout.width),
      left + Math.max(0, size - groups[i].layout.width),
    ];
    // compute offset
    return Math.max(
      range[0] - groups[i].layout.left(),
      Math.min(0, range[1] - groups[i].layout.left()),
    );
  }

  /**
   * Compute the offset between two node group chilren.
   * @param {*} stats The node group stats collection.
   * @param {number} i The i-th index.
   * @param {number} j The j-th index.
   * @returns The children offset.
   */
  function offsetChildren(stats, i, j) {
    // compute offset
    return Math.max(
      0,
      params.spacing.left
        + stats[i].target
        + stats[i].size
        - stats[j].target,
    );
  }

  // create root node and group
  this.nodes.push(new Node());
  this.groups.push(new NodeGroup(this.nodes[0]));

  // create nodes from data records
  for (var i = 1; i < data.length; i += 1) {
    // filter empty record
    if (data[i]) {
      var record = data[i].split(',');
      // filter checked record
      if (record[0] === '1') {
        // push node
        this.nodes.push(new Node(record));
      }
    }
  }

  // sort nodes
  this.nodes.sort(function (a, b) {
    if (a.lineage > b.lineage) return -1;
    if (a.parentId < b.parentId) return -1;
    if (a.id < b.id) return -1;
    return 1;
  });

  // populate node groups
  populate(this, 0);

  // create levels
  var level = [this.groups[0]], levelIndex = 0;
  while (level.length > 0) {
    // push level
    this.levels.push(level);
    // fetch level
    level = [];
    levelIndex += 1;
    // process previous level node groups
    var groups = this.levels[levelIndex - 1];
    var groupIndex = 0;
    for (var i = 0; i < groups.length; i += 1) {
      // process node group children
      for (var k = 0; k < groups[i].children.length; k += 1) {
        // update group
        groups[i].children[k].layout.level = levelIndex;
        groups[i].children[k].layout.index = groupIndex;
        groupIndex += 1;
        // push group
        level.push(groups[i].children[k]);
      }
    }
  }

  // process levels layout
  for (var l = 0; l < this.levels.length - 1; l += 1) {
    // initialize
    if (l === 0) {
      // width
      this.groups[0].layout.width = params.template.width;
      // coordinates
      this.groups[0].layout.coordinates = [
        params.origin.left - (0.5 * params.template.width),
        params.origin.top - params.template.height,
      ];
      // lineage
      this.groups[0].lineage.left = this.groups[0].layout.coordinates[0];
      this.groups[0].lineage.top = this.groups[0].layout.coordinates[1];
    }

    // process node groups children layout
    var groups = this.levels[l];
    var stats = [];
    for (var i = 0; i < groups.length; i += 1) {
      // inititialize stat
      var stat = {
        size: 0,
        range: [0, 0],
        initial: 0,
        target: 0,
      };
      // process children layout
      var children = groups[i].children;
      for (var k = 0; k < children.length; k += 1) {
        var nodes = children[k].nodes();
        // update width
        children[k].layout.width = nodes.length * params.template.width;
        // update margins
        children[k].layout.margins = [
          k === 0
            ? 0.5 * params.spacing.left
            : 0.5 * params.spacing.left * params.phi,
          k === children.length - 1
            ? 0.5 * params.spacing.left
            : 0.5 * params.spacing.left * params.phi,
        ];
        // compute size stat
        stat.size += children[k].layout.width
          + (k > 0 ? children[k].layout.margins[0] : 0)
          + (k < children.length - 1 ? children[k].layout.margins[1] : 0);
      }
      // compute range stat
      stat.range = [
        groups[i].layout.left()
          + Math.min(0, groups[i].layout.width - stat.size),
        groups[i].layout.left()
          + Math.max(0, groups[i].layout.width - stat.size),
      ];
      // compute initial stat
      stat.initial = Math.max(
        stat.range[0],
        Math.min(
          stat.range[1],
          params.origin.left - (0.5 * stat.size),
        ),
      );
      // compute target stat
      stat.target = stat.initial;
      // push stat
      stats.push(stat);
    }

    // update node groups coordinates
    var groupIndex = -1;
    for (var i = 0; i < groups.length; i += 1) {
      // check group index
      if (groupIndex !== -1 && stats[i].size > 0) {
        // compute overlap
        var overlap = offsetChildren(stats, groupIndex, i);
        // process overlap
        if (overlap > 0) {
          var childrenIndex;
          // initialize previous children
          stats[groupIndex].target -= 0.5 * overlap;
          groups[groupIndex].layout.coordinates[0] += offsetLineage(groups, stats, groupIndex);
          // process previous children offset
          childrenIndex = groupIndex;
          for (var j = groupIndex - 1; j >= 0; j -= 1) {
            // add offset
            stats[j].target -= offsetChildren(stats, j, childrenIndex);
            groups[j].layout.coordinates[0] -= offsetGroup(groups, j, j + 1);
            // check children
            if (stats[j].size > 0) {
              // add offset
              // increment
              childrenIndex = j;
            }
          }
          // initialize next children
          stats[i].target += 0.5 * overlap;
          groups[i].layout.coordinates[0] += offsetLineage(groups, stats, i);
          // process next children offset
          childrenIndex = i;
          for (var j = i + 1; j < groups.length; j += 1) {
            // add offset
            var offset = offsetGroup(groups, j - 1, j);
            groups[j].layout.coordinates[0] += offset;
            // check children
            if (stats[j].size > 0) {
              // add offset
              stats[j].target += offset;
              // increment
              childrenIndex = j;
            }
          }
        }
      }
      // check stat size
      if (stats[i].size > 0) {
        // increment
        groupIndex = i;
      }
    }

    // update node groups children coordinates
    for (var i = 0; i < groups.length; i += 1) {
      var target = stats[i].target;
      var children = groups[i].children;
      for (var k = 0; k < children.length; k += 1) {
        // update coordinates
        children[k].layout.coordinates = [
          target,
          groups[i].layout.top()
            + params.template.height
            + params.spacing.top,
        ];
        // increment target coordinate
        if (k < children.length - 1) {
          target += children[k].layout.width
            + children[k].layout.margins[1]
            + children[k + 1].layout.margins[0];
        }
      }
    }

    // update node groups parent coordinates
    for (var p = l - 1; p > 0; p -= 1) {
      // process parents
      var parents = this.levels[p];
      for (var i = 0; i < parents.length; i += 1) {
        // check children
        if (parents[i].children.length > 0) {
          // compute overlap
          var overlap = offsetLineage(parents, null, i);
          parents[i].layout.coordinates[0] += overlap;
          // check overlap
          if (overlap > 0) {
            // update next parents left coordinate
            for (var j = i + 1; j < parents.length; j += 1) {
              var offset = offsetGroup(parents, j - 1, j);
              if (offset > 0) {
                // update next parent left coordinate
                parents[j].layout.coordinates[0] += offset;
              } else {
                break;
              }
            }
          } else if (overlap < 0) {
            // update previous parents left coordinate
            for (var j = i - 1; j >= 0; j -= 1) {
              var offset = offsetGroup(parents, j, j + 1);
              if (offset > 0) {
                // update previous parent left coordinate
                parents[j].layout.coordinates[0] -= offset;
              } else {
                break;
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Render the tree in the active document.
 */
Tree.prototype.render = function () {
  /**
   * Initialize a progress window.
   * @param {number} steps The total number of steps.
   */
  function progress(steps) {
    // initialize
    const win = new Window(
      'palette',
      'Importing family tree...',
      undefined,
      { closeButton: false },
    );
    win.tab = win.add('statictext');
    win.tab.preferredSize = [450, -1];
    win.bar = win.add('progressbar', undefined, 0, steps);
    win.bar.preferredSize = [450, -1];
    // methods
    progress.close = function () { win.close(); };
    progress.increment = function () { win.bar.value += 1; return win.bar.value; };
    progress.message = function (message) { win.tab.text = message; win.update(); win.show(); };
    // show
    win.show();
  }

  /**
   * Process a tree node group import.
   * @param {*} context The context.
   * @param {NodeGroup} group The tree node group to process.
   */
  function process(context, group) {
    // coalesce value
    function coalesce(value, other) {
      return value !== null ? value : other;
    }

    // duplicate template item
    function duplicate(target, item) {
      // duplicate
      const template = item.duplicate(
        target,
        ElementPlacement.PLACEATBEGINNING,
      );
      // scale
      template.resize(100 * params.scale, 100 * params.scale);
      return template;
    }

    // convert measure from millimeters to points
    function mmToPoints(measure) {
      const points = 2.83464566929134;
      return measure * points;
    }

    // initialize nodes
    const nodes = group.nodes();
    // initialize links ratio
    var ratios = [];
    var threshold = 0;
    for (var i = 0; i < nodes.length; i += 1) {
      // push ratio
      if (i === 0) {
        ratios.push(params.phi);
      } else {
        ratios.push(ratios[i - 1]);
      }
      // check children lineage
      for (var k = 0; k < nodes[i].children.length; k += 1) {
        if (nodes[i].children[k].lineage) {
          // increment ratio
          if (threshold >= params.linkThreshold) {
            ratios[i] *= params.phi;
          }
          // increment threshold
          threshold += 1;
          break;
        }
      }
    }

    // process group nodes
    for (var i = nodes.length - 1; i >= 0; i -= 1) {
      var draw = {}, vector, item;
      // initialize output
      draw.output = context.layer.groupItems.add();
      draw.output.name = coalesce(nodes[i].id, 'root');
      draw.links = draw.output.groupItems.add();
      draw.links.name = 'links';
      // draw body
      if (nodes[i].id) {
        // draw node template
        vector = duplicate(draw.output, context.template.groupItems.node);
        vector.textFrames.getByName('first-name').contents = coalesce(nodes[i].firstName, '');
        vector.textFrames.getByName('last-name').contents = coalesce(nodes[i].lastName, '');
        vector.textFrames.getByName('birth').contents = coalesce(nodes[i].birth, '');
        vector.textFrames.getByName('death').contents = coalesce(nodes[i].death, '');
        vector.left = mmToPoints(nodes[i].layout.left());
        vector.top = -mmToPoints(nodes[i].layout.top());
        // draw info template
        vector = duplicate(draw.output, context.template.groupItems.info);
        vector.textFrames.getByName('lineage').contents = coalesce(nodes[i].lineage, '');
        vector.textFrames.getByName('sex').contents = coalesce(nodes[i].sex, '');
        vector.textFrames.getByName('parent').contents = coalesce(nodes[i].parentId, '');
        vector.textFrames.getByName('wedding').contents = coalesce(nodes[i].wedding, '');
        vector.left = mmToPoints(nodes[i].layout.left());
        vector.top = -mmToPoints(nodes[i].layout.top()) + vector.height;
        // check info template wedding
        if (nodes[i].wedding) {
          vector.hidden = false;
        } else {
          vector.hidden = true;
        }
      }
      // draw links
      for (var k = nodes[i].children.length - 1; k >= 0; k -= 1) {
        if (nodes[i].children[k].lineage) {
          // initialize vector
          vector = duplicate(draw.links, context.template.groupItems.link);
          vector.name = coalesce(nodes[i].children[k].id, '<Undefined>');
          // initialize coordinates
          var coords = {
            start: {
              left: mmToPoints(nodes[i].layout.left() + (0.5 * params.template.width)),
              top: -mmToPoints(nodes[i].layout.top() + params.template.height),
            },
            end: {
              left: mmToPoints(nodes[i].children[k].layout.left() + (0.5 * params.template.width)),
              top: -mmToPoints(nodes[i].children[k].layout.top()),
            },
          };
          // edit start item
          item = vector.pathItems.getByName('start');
          item.left = coords.start.left - (0.5 * item.width);
          item.top = coords.start.top;
          // edit line item
          item = vector.pathItems.getByName('line');
          item.setEntirePath([
            [coords.start.left, coords.start.top],
            [coords.start.left, coords.start.top - mmToPoints(params.spacing.top * ratios[i])],
            [coords.end.left, coords.start.top - mmToPoints(params.spacing.top * ratios[i])],
            [coords.end.left, coords.end.top]
          ]);
          // edit end item
          item = vector.pathItems.getByName('end');
          item.left = coords.end.left - (0.5 * item.width);
          item.top = coords.end.top + item.height;
        }
      }
    }
  }

  // initialize context
  const context = {};
  context.doc = params.app.activeDocument;
  context.doc.artboards.setActiveArtboardIndex(0);
  context.layer = context.doc.layers.add();
  context.layer.name = 'tree';
  context.layer.hasSelectedArtwork = false;
  context.file = params.app.open(new File(params.root + '/template.ai'));
  context.template = context.file
    .layers.getByName('main')
    .groupItems.getByName('template')
    .duplicate(context.doc, ElementPlacement.PLACEATBEGINNING);
  context.template.locked = false;
  context.file.close(SaveOptions.DONOTSAVECHANGES);
  delete context.file;

  // initialize progress steps
  var steps = 0;
  for (var l = 1; l < this.levels.length; l += 1) {
    steps += this.levels[l].length;
  }

  // render
  var message;
  try {
    // process tree
    progress(steps);
    for (var l = this.levels.length - 1; l >= 0; l -= 1) {
      for (var i = this.levels[l].length - 1; i >= 0; i -= 1) {
        // process node group
        progress.message('Importing node group element ' + progress.increment() + '/' + steps + '...');
        process(context, this.levels[l][i]);
      }
    }
  } catch (error) {
    message = error;
  }

  // finalize
  context.template.remove();
  progress.close();
  if (message) throw message;
};


/** Script entry point. */
(function () {
  // initialize params application
  params.app = app;
  params.script = new File($.fileName);
  params.root = params.script.parent.fsName;

  // initialize params config
  const json = new File(params.root + '/config.json');
  json.open('r');
  const config = eval('(' + json.read() + ')');
  for (var attribute in config) { params[attribute] = config[attribute]; }
  json.close();

  // initialize params config scale
  params.template.width *= params.scale;
  params.template.height *= params.scale;
  params.spacing.left *= params.scale;
  params.spacing.top *= params.scale;

  // import data
  var csv = File.openDialog('Please select a tree data file:', 'CSV:*.csv', false);
  var data;
  if (csv) {
    csv.open('r');
    data = csv.read().split(/\r?\n/);
    csv.close();
  }

  // confirm mode
  params.mode = confirm(
    'Do you want to rebuild the tree entirely?',
    true,
    'Importing family tree...',
  );

  // render tree
  if (data) {
    const tree = new Tree(data);
    tree.render();
  }
})();
