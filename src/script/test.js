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
  node.index = null;
  node.ancestor = null;
  node.parent = null;
  node.elements = [];
  node.spouses = [];
  node.children = [];

  /** Initialize node layout field. */
  node.layout = {
    size: 0,
    width: 0,
    margins: [0, 0],
    group: params.origin.left - params.size.width,
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
    nodes[0].layout.width = 2 * params.size.width
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

    // process levels nodes layout margins and size
    for (var l = levels.length - 1; l > 0; l -= 1) {
      for (var i = 0; i < levels[l].length; i += 1) {
        // update width
        levels[l][i].layout.width = levels[l][i].elements.length * params.size.width;
        // update margin
        levels[l][i].layout.margins = [
          0.5 * params.spacing.horizontal[
            (i > 0 && levels[l][i].ancestor === levels[l][i - 1].ancestor) ? 0 : 1
          ],
          0.5 * params.spacing.horizontal[
            (i < levels[l].length - 1 && levels[l][i].ancestor === levels[l][i + 1].ancestor) ? 0 : 1
          ],
        ];
        // update size
        for (var k = 0; k < levels[l][i].spouses.length; k += 1) {
          if (levels[l][i].spouses[k].layout.size === 0) {
            levels[l][i].spouses[k].layout.size = params.size.width;
          }
          levels[l][i].layout.size += levels[l][i].spouses[k].layout.size;
        }
        // check size
        levels[l][i].layout.size = Math.max(
          levels[l][i].layout.width,
          levels[l][i].layout.size,
        )
        // cumulate size and margins
        levels[l][i].parent.layout.size += levels[l][i].layout.size
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
            - (0.5 * levels[l][i].ancestor.layout.size)
            + (0.5 * levels[l][i].ancestor.layout.width);
        }
        // initialize padding
        padding = (0.5 * levels[l][i].layout.size)
          - (0.5 * levels[l][i].layout.width);
        // increment start offset
        offset += levels[l][i].layout.margins[0] + padding;
        // process elements
        var group = offset
        for (k = 0; k < levels[l][i].elements.length; k += 1) {
          levels[l][i].elements[k].layout.group = group;
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
    function distance(a, b) {
      if (a.layout.group < b.layout.group) {
        return b.layout.group
          - (a.layout.group + (a.layout.width));
      } else {
        return a.layout.group
          - (b.layout.group + (b.layout.width));
      }
    }

    function distanceFromOrigin(node) {
      if (node.layout.group < params.origin.left) {
        return params.origin.left
          - node.layout.group;
      } else {
        return node.layout.group
          + (node.layout.width)
          - params.origin.left;
      }
    }

    function constraint(node, way) {
      // check ancestor
        // 0 : if first node.layout.group >= ancestor.layout.group
        // 1 : if last node.layout.group <= ancestor.layout.group
                                        // + (ancestor.layout.width)
                                        // - (node.layout.width)
      // check children
        // 0 : node.layout.group >= node.children[0].layout.group
        // 1 : node.layout.group <= node.children[last].layout.group
                                // + (node.children[last].layout.width)
                                // - (node.layout.width)
      var ancestor = null;
      if (
        node === node.ancestor.children[0]
        || node === node.ancestor.children[node.ancestor.children.length - 1]
      ) {
        if (way === 1) {
          ancestor = node.ancestor.layout.group;
        } else {
          ancestor = node.ancestor.layout.group
            + (node.ancestor.layout.width - node.layout.width);
        }
      }
      var ancestors = [null, null];
      if (ancestor) {
        if (ancestor < node.layout.group) {
          ancestors[0] = ancestor;
        } else if (ancestor > node.layout.group) {
          ancestors[1] = ancestor;
        } else {
          if (way === 1) {
            ancestors[1] = ancestor;
          } else {
            ancestors[0] = ancestor;
          }
        }
      }

      var children = [null, null];
      if (node.children.length > 0) {
        children = [
          node.children[0].layout.group,
          node.children[node.children.length - 1].layout.group
            + (node.children[node.children.length - 1].layout.width)
            - (node.layout.width)
        ];
      }

      var result = [null, null];
      if (ancestors[0] !== null && children[0] !== null) {
        result[0] = node.layout.group - Math.max(ancestors[0], children[0]);
      } else if (ancestors[0] !== null) {
        result[0] = node.layout.group - ancestors[0];
      } else if (children[0] !== null) {
        result[0] = node.layout.group - children[0];
      }
      if (ancestors[1] !== null && children[1] !== null) {
        result[1] = Math.min(ancestors[1], children[1]) - node.layout.group;
      } else if (ancestors[1] !== null) {
        result[1] = ancestors[1] - node.layout.group;
      } else if (children[1] !== null) {
        result[1] = children[1] - node.layout.group;
      }


      if (node.id === '03-28') {
        console.log(way);
        console.log(ancestors);
        console.log(children);
        console.log(node.layout.group);
        console.log(result);
        console.log('---------------------------------');
      }
      //if (result[1] < 0) {
      //  console.log(ancestors);
      //  console.log(children);
      //  console.log(node.layout.group);
      //  console.log(result);
      //  console.log('---------------------------------');
      //}

      if (way === 1) {
        return (result[1] !== null ? (Math.round(result[1] * 100) / 100) : null);
      } else {
        return (result[0] !== null ? (Math.round(result[0] * 100) / 100) : null);
      }

    }

    function space(a, b) {

      //if (a.id === '03-28') {
      //  console.log(a.layout.group);
      //  console.log(b.layout.group);
      //  console.log(a.layout.group < b.layout.group);
      //  console.log(distance(a, b));
      //  console.log(distance(a, b) - (a.layout.margins[1] + b.layout.margins[0]));
      //  console.log('---------------------------------');
      //}

      if (a.layout.group < b.layout.group) {
        return distance(a, b) - (a.layout.margins[1] + b.layout.margins[0]);
      } else {
        return distance(a, b) - (a.layout.margins[0] + b.layout.margins[1]);
      }
    }


    function gap(a, b) { // from a to b (a moving)


      //if (a.id === '03-01') {
      //  console.log(spaceA);
      //}

      //if (a.firstName === 'Jehan' && a.lastName === 'Barbaneau') {
      //  alert(constraintA);
      //}

      var way;
      if (a.layout.group < b.layout.group) {
        way = 1;
      } else {
        way = -1;
      }

      const spaceA = space(a, b);
      const constraintA = constraint(a, way);

      var test;
      if (constraintA !== null) {
        test = Math.min(spaceA, constraintA);
      } else {
        test = spaceA;
      }
      return Math.round(test * 100) / 100; //todo Math.abs()



      // if (way === 1) {
      //   if (constraintA[1] !== null) {
      //     test = Math.min(spaceA, constraintA[1]);
      //   } else {
      //     test = spaceA;
      //   }
      // } else if (way === -1) {
      //   if (constraintA[0] !== null) {
      //     test = Math.min(spaceA, constraintA[0]);
      //   } else {
      //     test = spaceA;
      //   }
      // } else {
      //   test = 0;
      // }

      //return (Math.round(test * 100) / 100);
    }

    function size(level) {
      var first = level[0];
      var last = level[level.length - 1];
      return (last.elements[last.elements.length - 1].layout.group
        + last.elements[last.elements.length - 1].layout.width)
        - first.elements[0].layout.group;
    }

    // update node size
    //for (var l = 1; l < tree.levels.length; l += 1) {
    //  for (var i = 0; i < tree.levels[l].length; i += 1) {
    //    tree.levels[l][i].layout.size = tree.levels[l][i].layout.width;
    //  }
    //}

    //var check = 1;
    //if (check === 1) {
    //  alert(improvement)
    //  alert(leftImprovement)
    //  alert(rightImprovement)
    //  check++;
    //}

    var total;
    do {
      total = 0;
      // compute stats
      var stats = [];
      for (var l = 1; l < tree.levels.length; l += 1) {
        stats.push({
          level: tree.levels[l],
          size: size(tree.levels[l]),
        });
      }
      // sort stats
      stats.sort(function (a, b) {
        if (a.size < b.size) return 1;
        return -1;
      });

      //
      for (var l = 0; l < stats.length; l += 1) {
        var level = stats[l].level;
        var leftIndex = 0;
        var rightIndex = level.length - 1;
        var improvement = 0;
        do {
          if (improvement > 0) {
            total += improvement;
            //todo handle increment constraint
            //for (var i = 0; i <= leftIndex; i += 1) {
            //  for (var j = 0; j < level[i].elements.length; j += 1) {
            //    level[i].elements[j].layout.group += improvement;
            //    level[i].elements[j].layout.left += improvement;
            //  }
            //}
            //for (var i = rightIndex; i < level.length; i += 1) {
            //  for (var j = 0; j < level[i].elements.length; j += 1) {
            //    level[i].elements[j].layout.group -= improvement;
            //    level[i].elements[j].layout.left -= improvement;
            //  }
            //}
            for (var j = 0; j < level[leftIndex].elements.length; j += 1) {
              level[leftIndex].elements[j].layout.group += improvement;
              level[leftIndex].elements[j].layout.left += improvement;
            }
            for (var j = 0; j < level[rightIndex].elements.length; j += 1) {
              level[rightIndex].elements[j].layout.group -= improvement;
              level[rightIndex].elements[j].layout.left -= improvement;
            }
            improvement = 0;
          }
          // left improvement
          var leftImprovement = 0
          for (var k = leftIndex; k < rightIndex; k += 1) {
            var test = gap(level[k], level[k + 1]);
            //if (level[k].id === '03-01') {
            //  console.log(test);
            //}
            if (test > 0) {
              leftIndex = k;
              leftImprovement = gap(level[k], level[k + 1]);
              break;
            }
          }
          // right improvement
          var rightImprovement = 0
          for (var k = rightIndex; k > leftIndex; k -= 1) {
            if (gap(level[k], level[k - 1]) > 0) {
              rightIndex = k;
              rightImprovement = gap(level[k], level[k - 1]);
              break;
            }
          }

          //if (level[k].id === '03-26') {
          //  console.log('---------------------------------');
          //}
          improvement = Math.min(leftImprovement, rightImprovement);
          if (leftIndex === rightIndex - 1) {
            improvement = 0.5 * improvement;
          }
          improvement = (Math.round(improvement * 100) / 100);
        } while (improvement > 0)
        // loop from left to origin
        // get first improvement size

        // loop from right to origin
        // get first improvement size

        // left apply min and loop back change to outer left
        // right apply min and loop back change to outer right

        // last improvement split by 2 to align on origin
      }
    } while (total > 0)

    // loop symetrical
    // width
    // margins [,]

    // for (var l = 1; l < tree.levels.length; l += 1) {
    //   for (var i = 0; i < tree.levels[l].length; i += 1) {
    //   }
    // }

    // return
    return this;
  };


  /** Return tree. */
  return tree;
}

/** Script entry point. */
(function () {
  const data =
`check,id,lineage,first_name,last_name,sex,birth,death,wedding,parent_id,relationship
1,01-01,false,François,Baussay,male,,,,01-02,François BAUSSAY -> Agathe BARBANEAU
1,01-02,true,Agathe,Barbaneau,female,,,,,[x] Agathe BARBANEAU -> undefined
1,01-03,true,Valentin,Barbaneau,male,,,,,[x] Valentin BARBANEAU -> undefined
1,01-04,false,Catherine,Lefer,female,,,,01-03,Catherine LEFER -> Valentin BARBANEAU
1,01-05,true,Michel,Barbaneau,male,,,,,[x] Michel BARBANEAU -> undefined
1,02-01,true,Jehan,Barbaneau,male,,,,01-04,[x] Jehan BARBANEAU -> Catherine LEFER
1,02-02,false,Louise,Maujais,female,,,,02-01,Louise MAUJAIS -> Jehan BARBANEAU
1,02-03,false,Pierre,Simonnet,male,,,1596,02-04,Pierre SIMONNET -> Agathe BARBANEAU
1,02-04,true,Agathe,Barbaneau,female,,,,01-04,[x] Agathe BARBANEAU -> Catherine LEFER
1,02-05,true,Michel,Barbaneau,male,,,,01-04,[x] Michel BARBANEAU -> Catherine LEFER
1,02-06,false,Marie,Maugeais,female,,,,02-05,Marie MAUGEAIS -> Michel BARBANEAU
1,02-07,true,Gilles,Barbaneau,male,,,,01-04,[x] Gilles BARBANEAU -> Catherine LEFER
1,02-08,false,Catherine,Maugeay,female,,,,02-07,Catherine MAUGEAY -> Gilles BARBANEAU
1,02-09,true,Guillaume,Barbaneau,male,,,,01-04,[x] Guillaume BARBANEAU -> Catherine LEFER
1,02-10,false,Jehanne,Cuit,female,,,,02-09,Jehanne CUIT -> Guillaume BARBANEAU
1,02-11,true,François,Barbaneau,male,,1659,,01-04,[x] François BARBANEAU -> Catherine LEFER
1,02-12,false,Marie,Ollivier,female,,1668,,02-11,Marie OLLIVIER -> François BARBANEAU
1,02-13,true,Jehan,Barbaneau,male,,,,01-04,[x] Jehan BARBANEAU -> Catherine LEFER
1,02-14,false,Anne,Prieur,female,,,,02-13,Anne PRIEUR -> Jehan BARBANEAU
1,03-01,true,Thomas,Barbaneau,male,1615,1684,,02-02,[x] Thomas BARBANEAU -> Louise MAUJAIS
1,03-02,false,Jehanne,Roy,female,,1664,,03-01,Jehanne ROY -> Thomas BARBANEAU
1,03-03,true,Guillaume,Barbaneau,male,1611,1678,,02-02,[x] Guillaume BARBANEAU -> Louise MAUJAIS
1,03-04,false,Jehanne,Martin,female,,1665,,03-03,Jehanne MARTIN -> Guillaume BARBANEAU
1,03-05,false,Louis,Brunet,male,,,,03-06,Louis BRUNET -> Agathe BARBANEAU
1,03-06,true,Agathe,Barbaneau,female,,,,02-02,[x] Agathe BARBANEAU -> Louise MAUJAIS
1,03-07,false,René,Simonnet,male,1607,1682,1651,03-08,René SIMONNET -> Marie BARBANEAU
1,03-08,true,Marie,Barbaneau,female,1610,,,02-02,[x] Marie BARBANEAU -> Louise MAUJAIS
1,03-09,true,Michel,Barbaneau,male,,1693,,02-02,[x] Michel BARBANEAU -> Louise MAUJAIS
1,03-10,false,Estor,Braseau,female,,1650,,03-09,Estor BRASEAU -> Michel BARBANEAU
1,03-11,false,Perrine,Simonet,female,,1652,1651,03-09,Perrine SIMONET -> Michel BARBANEAU
1,03-12,false,Marie,Sabouraud,female,1632,1687,,03-09,Marie SABOURAUD -> Michel BARBANEAU
1,03-13,true,Pierre,Barbaneau,male,1618,,,02-06,[x] Pierre BARBANEAU -> Marie MAUGEAIS
1,03-14,false,Marie,,female,,,,03-13,Marie  -> Pierre BARBANEAU
1,03-15,true,François,,male,,1652,,02-06,[x] François  -> Marie MAUGEAIS
1,03-16,true,Renée,,female,1612,,,02-08,[x] Renée  -> Catherine MAUGEAY
1,03-17,false,Louis,Roy,male,,,,03-18,Louis ROY -> Catherine BARBANEAU
1,03-18,true,Catherine,Barbaneau,female,1616,1683,,02-08,[x] Catherine BARBANEAU -> Catherine MAUGEAY
1,03-19,false,René,Nau,male,1607,1687,,03-20,René NAU -> Marie BARBANEAU
1,03-20,true,Marie,Barbaneau,female,1613,1693,,02-08,[x] Marie BARBANEAU -> Catherine MAUGEAY
1,03-21,false,Pierre,Nau,male,1615,1685,,03-22,Pierre NAU -> Marguerite BARBANEAU
1,03-22,true,Marguerite,Barbaneau,female,1618,,,02-08,[x] Marguerite BARBANEAU -> Catherine MAUGEAY
1,03-23,true,Michel,,male,1618,1621,,02-08,[x] Michel  -> Catherine MAUGEAY
1,03-24,true,Marie,,female,1622,,,02-10,[x] Marie  -> Jehanne CUIT
1,03-25,true,Michel,,male,1617,,,02-10,[x] Michel  -> Jehanne CUIT
1,03-26,true,Jean,Barbaneau,male,1615,,,02-14,[x] Jean BARBANEAU -> Anne PRIEUR
1,03-27,false,Catherine,Mouneron,female,1616,,1640,03-26,Catherine MOUNERON -> Jean BARBANEAU
1,03-28,true,François,Barbaneau,male,1618,,,02-14,[x] François BARBANEAU -> Anne PRIEUR
`.split(/\r?\n/);

  // tree
  const tree = getTree(data);
  tree.compress();

  // finalize
  //console.log(tree.levels[1][0].layout.left);
  console.log('END');
})();
