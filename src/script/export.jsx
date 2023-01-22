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
 * Fetch the tree data and export.
 */
function initialize() {
  /**
   * Initialize a progress window.
   * @param {number} steps The total number of steps.
   */
  function progress(steps) {
    // initialize
    const win = new Window(
      'palette',
      'Exporting family tree...',
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
   * Process an item export.
   * @param {GroupItem} item The group item.
   */
  function process(item) {
    // convert measure from points to millimeters
    function pointsToMm(measure) {
      const points = 1 / 2.83464566929134;
      return measure * points;
    }

    // initialize data
    const data = { id: item.name };
    // retreive data
    for (var i = 0; i < item.groupItems.length; i += 1) {
      switch (item.groupItems[i].name) {
        case 'info':
          data.lineage = item.groupItems[i].textFrames.getByName('lineage').contents;
          data.sex = item.groupItems[i].textFrames.getByName('sex').contents;
          data.parentId = item.groupItems[i].textFrames.getByName('parent').contents;
          data.wedding = item.groupItems[i].textFrames.getByName('wedding').contents;
          break;
        case 'node':
          data.firstName = item.groupItems[i].textFrames.getByName('first-name').contents;
          data.lastName = item.groupItems[i].textFrames.getByName('last-name').contents;
          data.birth = item.groupItems[i].textFrames.getByName('birth').contents;
          data.death = item.groupItems[i].textFrames.getByName('death').contents;
          data.coordinateLeft = pointsToMm(item.groupItems[i].left);
          data.coordinateTop = -pointsToMm(item.groupItems[i].top);
          break;
        default:
          break;
      }
    }
    // export data
    return data;
  }

  // initialize context
  const context = {};
  context.doc = app.activeDocument;
  context.doc.artboards.setActiveArtboardIndex(0);
  for (var i = 0; i < context.doc.layers.length; i += 1) {
    if (context.doc.layers[i].name === 'tree') {
      context.layer = context.doc.layers[i];
      context.items = context.doc.layers[i].groupItems;
      break;
    }
  }

  // initialize progress steps
  var steps = 0;
  if (context.items) {
    for (var i = 1; i < context.items.length; i += 1) {
      if (context.items[i].name !== 'root') {
        steps += 1;
      }
    }
  } else {
    alert(
      'No tree layer found.',
      'Exporting family tree...',
      true,
    );
    return;
  }

  // retrieve data
  const data = {};
  var message;
  try {
    // process tree
    progress(steps);
    for (var i = 1; i < context.items.length; i += 1) {
      // process node
      if (context.items[i].name !== 'root') {
        progress.message('Exporting node element ' + progress.increment() + '/' + steps + '...');
        data[context.items[i].name] = process(context.items[i]);
      }
    }
  } catch (error) {
    message = error;
  }

  // finalize
  progress.close();
  if (message) throw message;
  return data;
};


/** Script entry point. */
(function () {
  // initialize
  var data = initialize(app);

  // export data
  var csv = File.saveDialog('Please select a tree data file:', 'CSV:*.csv');
  if (csv) {
    csv.encoding = 'UTF-8';
    csv.open('w');
    csv.writeln([
      'check',
      'id',
      'lineage',
      'first_name',
      'last_name',
      'sex',
      'birth',
      'death',
      'wedding',
      'parent_id',
      'coordinate_left',
      'coordinate_top',
    ].join(','));
    for (record in data) {
      csv.writeln([
        '1',
        data[record].id,
        data[record].lineage,
        data[record].firstName,
        data[record].lastName,
        data[record].sex,
        data[record].birth,
        data[record].death,
        data[record].wedding,
        data[record].parentId,
        data[record].coordinateLeft,
        data[record].coordinateTop,
      ].join(','));
    }
    csv.close();
  }
})();
