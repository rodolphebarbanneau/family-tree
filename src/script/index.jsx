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
 * Get a folder path.
 * @returns The selected folder path.
 */
function getFolder() {
  return Folder.selectDialog('Please select the output folder:', Folder('~'));
}


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

  /** Initialize node layout fields. */
  this.layout = (function (self) {
    return {
      // left coordinates
      left: function () {
        if (self.group) {
          // compute node index
          var nodeIndex = 0;
          const nodes = self.group.nodes();
          while (
            nodeIndex < nodes.length - 1
            && nodes[nodeIndex] !== self
          ) { nodeIndex += 1 }
          return self.group.layout.left
            + (nodeIndex * params.template.width);
        }
        return 0;
      },
      // top coordinates
      top: function () {
        if (self.group) {
          return self.group.layout.top;
        }
        return 0;
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
  this.layout = {
    // size (children)
    size: 0,
    // width
    width: 0,
    // margins
    margins: [0, 0],
    // left coordinates
    left: 0,
    // top coordinates
    top: 0,
  };

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
  } else {
    // root
    this.layout.left = params.origin.left
      - (0.5 * params.template.width);
    this.layout.top = params.origin.top
      - params.template.height;
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

  // create node groups and process dependencies
  function process(self, nodeIndex) {
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
        process(self, i);
      }
    }
  } process(this, 0);

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
    for (var i = 0; i < groups.length; i += 1) {
      // process node group children
      for (var k = 0; k < groups[i].children.length; k += 1) {
        level.push(groups[i].children[k]);
      }
    }
  }

  // process levels layout size and margins
  for (var l = this.levels.length - 1; l >= 0; l -= 1) {
    var groups = this.levels[l];
    for (var i = 0; i < groups.length; i += 1) {
      var nodes = groups[i].nodes();
      // update width
      groups[i].layout.width = nodes.length * params.template.width;
      // update size
      for (var k = 0; k < groups[i].children.length; k += 1) {
        // size and width
        groups[i].layout.size += Math.max(
          groups[i].children[k].layout.size,
          groups[i].children[k].layout.width,
        );
        // margins
        groups[i].layout.size += groups[i].children[k].layout.margins[0]
          + groups[i].children[k].layout.margins[1];
      }
      // update margins
      groups[i].layout.margins = [
        i > 0 && groups[i].parent === groups[i - 1].parent
          ? 0.5 * params.spacing.left * params.phi
          : 0.5 * params.spacing.left,
        i < groups.length - 1 && groups[i].parent === groups[i + 1].parent
          ? 0.5 * params.spacing.left * params.phi
          : 0.5 * params.spacing.left,
      ];
    }
  }

  // process levels layout coordinates
  for (var l = 1; l < this.levels.length; l += 1) {
    var groups = this.levels[l];
    var offset, padding;
    for (var i = 0; i < groups.length; i += 1) {
      // initialize offset
      if (i === 0 || groups[i - 1].parent !== groups[i].parent) {
        offset = groups[i].parent.layout.left
          - (0.5 * groups[i].parent.layout.size)
          + (0.5 * groups[i].parent.layout.width);
      }
      // initialize padding
      padding = Math.max(0, 0.5 * (groups[i].layout.size - groups[i].layout.width));
      // increment start offset
      offset += groups[i].layout.margins[0] + padding;
      // update coordinates
      groups[i].layout.left = offset;
      groups[i].layout.top = groups[i].parent.layout.top
        + params.template.height
        + params.spacing.top;
      // increment offset
      offset += groups[i].layout.width;
      // increment end offset
      offset += groups[i].layout.margins[1] + padding;
    }
  }
};

/**
 * Compress tree.
 */
Tree.prototype.compress = function () {
  /**
   * Compute the objective function between two node groups (a to b).
   * @param {NodeGroup} a The anchor node group.
   * @param {NodeGroup} b The target node group.
   * @returns
   */
  function objective(a, b) {
    // initialize
    const way = a.layout.left < b.layout.left ? 1 : 0;
    // compute constraint
    var constraint = Number.MAX_VALUE;


    //todo: freedom parameter
    const parentFreedom = Math.max(
      params.template.width,
      a.parent.layout.width
        - a.parent.layout.size
        + a.parent.children[0].layout.margins[0]
        + a.parent.children[a.parent.children.length - 1].layout.margins[0],
    );
    const childrenFreedom = a.children.length === 0 ? 0 : Math.max(
      params.template.width,
      -a.layout.width
        - a.layout.size
        + a.children[0].layout.margins[0]
        + a.children[a.children.length - 1].layout.margins[0],
    );


    // parent
    if (way && a === a.parent.children[0]) {
      constraint = Math.min(
        constraint,
        a.parent.layout.left
          - a.layout.left
          + parentFreedom,
      );
    } else if (!way && a === a.parent.children[a.parent.children.length - 1]) {
      constraint = Math.min(
        constraint,
        a.layout.left
          + a.layout.width
          - a.parent.layout.left
          - a.parent.layout.width
          + parentFreedom,
      );
    }
    // children
    if (a.children.length > 0) {
      if (way) {
        constraint = Math.min(
          constraint,
          a.children[a.children.length - 1].layout.left
            + a.children[a.children.length - 1].layout.width
            - a.layout.left
            - a.layout.width
            + childrenFreedom,
        );
      } else {
        constraint = Math.min(
          constraint,
          a.layout.left
            - a.children[0].layout.left
            + childrenFreedom,
        );
      }
    }
    // compute distance
    var distance = 0;
    if (way) {
      distance = Math.max(
        distance,
        b.layout.left
          - b.layout.margins[0]
          - a.layout.left
          - a.layout.width
          - a.layout.margins[1],
      );
    } else {
      distance = Math.max(
        distance,
        a.layout.left
          - a.layout.margins[0]
          - b.layout.left
          - b.layout.width
          - b.layout.margins[1],
      );
    }
    // return round
    return 0.01 * Math.round(
      100 * Math.max(0, Math.min(constraint, distance)),
    );
  }

  // compress
  var gain = {};
  do {
    // initialize
    gain.total = 0;
    // compute stats
    var stats = [];
    for (var l = 1; l < this.levels.length; l += 1) {
      var level = this.levels[l];
      stats.push({
        level: level,
        size: level[level.length - 1].layout.left
          + level[level.length - 1].layout.width
          - level[0].layout.left,
      });
    }
    // sort stats
    stats.sort(function (a, b) {
      if (a.size > b.size) return -1;
      return 1;
    });
    // process stats
    for (var s = 0; s < stats.length; s += 1) {
      // initialize
      gain.level = 0;
      var level = stats[s].level;
      var leftIndex = 0;
      var rightIndex = level.length - 1;
      // compress
      do {
        // check level gain
        if (gain.level > 0) {
          gain.total += gain.level;
          level[leftIndex].layout.left += gain.level;
          level[rightIndex].layout.left -= gain.level;
          gain.level = 0;
        }
        // compute left gain
        gain.left = 0;
        for (var l = leftIndex; l < rightIndex; l += 1) {
          //todo: find first gap
          //todo: find last/first constraint
          //todo: return min constraint
          gain.left = objective(level[l], level[l + 1]);
          if (gain.left > 0) {
            leftIndex = l;
            break;
          }
        }
        // compute right gain
        gain.right = 0
        for (var l = rightIndex; l > leftIndex; l -= 1) {
          //todo: find first gap
          //todo: find last/first constraint
          //todo: return min constraint
          gain.right = objective(level[l], level[l - 1]);
          if (gain.right > 0) {
            rightIndex = l;
            break;
          }
        }
        // compute level gain
        gain.level = Math.min(gain.left, gain.right);
        if (leftIndex === rightIndex - 1) gain.level *= 0.5
        gain.level = 0.01 * Math.round(100 * gain.level);
      } while (gain.level > 0)
    }
  } while (gain.total > 0)
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
      'Populating family tree...',
      undefined,
      { closeButton: false },
    );
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
   * Process a tree node group drawing.
   * @param {*} context The context.
   * @param {NodeGroup} group The tree node group to process.
   */
  function process(context, group) {
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

    // initialize nodes
    const nodes = group.nodes();
    // initialize links ratio
    var ratios = [];
    for (var i = 0; i < nodes.length; i += 1) {
      // push ratio
      if (i === 0) {
        ratios.push(1);
      } else {
        ratios.push(ratios[i - 1]);
      }
      // check children lineage
      for (var k = 0; k < nodes[i].children.length; k += 1) {
        if (nodes[i].children[k].lineage) {
          ratios[i] *= params.phi;
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
        if (nodes[i].wedding) {
          vector = duplicate(draw.output, context.template.groupItems.info);
          vector.textFrames.getByName('wedding').contents = coalesce(nodes[i].wedding, '');
          vector.left = mmToPoints(nodes[i].layout.left());
          vector.top = -mmToPoints(nodes[i].layout.top() - (params.spacing.top * Math.pow(params.phi, 2)));
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
        // process node
        progress.message('Drawing element ' + progress.increment() + '/' + steps + '...');
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

  // fetch data
  const csv = new File(params.root + '/data/tree.csv');
  csv.open('r');
  const data = csv.read().split(/\r?\n/);
  csv.close();

  // render tree
  const tree = new Tree(data);
  tree.compress();
  tree.render();
})();
