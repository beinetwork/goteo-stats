/**
 * Auxiliary functions and methods.
 *
 */

'use strict';

/**
 * Function to add zeros to the left of a number.
 *
 * @param {Number} size maximum number of zeros to display on the left
 * @return {string}
 */
Number.prototype.pad = function(size) {
  var s = String(this);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
};

var outliers = outliers || {'version':0.1, 'controller':{}, 'viz': {} ,'utils': {}};

/**
 * Function to generate the SVG path `d` attribute content to draw a rounded rectangle.
 *
 * @param {Number} x X coordinate
 * @param {Number} y Y coordinate
 * @param {Number} w bar width
 * @param {Number} h bar height
 * @param {Number} r corner radius
 * @param {Boolean} tl top-left corner should be rounded?
 * @param {Boolean} tr top-right corner should be rounded?
 * @param {Boolean} bl bottom-left corner should be rounded?
 * @param {Boolean} br bottom-right corner should be rounded?
 * @return {string} the value to insert in the `d` attribute of the path element
 */
outliers.utils.roundedRect = function (x, y, w, h, r, tl, tr, bl, br) {
    var retval;
    retval  = "M" + (x + r) + "," + y;
    retval += "h" + (w - 2*r);
    if (tr) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + r; }
    else { retval += "h" + r; retval += "v" + r; }
    retval += "v" + (h - 2*r);
    if (br) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + r; }
    else { retval += "v" + r; retval += "h" + -r; }
    retval += "h" + (2*r - w);
    if (bl) { retval += "a" + r + "," + r + " 0 0 1 " + -r + "," + -r; }
    else { retval += "h" + -r; retval += "v" + -r; }
    retval += "v" + (2*r - h);
    if (tl) { retval += "a" + r + "," + r + " 0 0 1 " + r + "," + -r; }
    else { retval += "v" + -r; retval += "h" + r; }
    retval += "z";
    return retval;
};

/**
 * Removes from a string rare symbols.
 *
 * @param {String} _ a string to be cleaned
 * @return {String} the provided string without rare symbols
 */
outliers.utils.stringCleaner = function (_) {
  return _.replace(/[.*+?#^=!:${}()|\[\]\s\/\\]/g, "_");
};

/**
 * Wraps the labels to fit in the provided width.
 *
 * @param {Array} data array of data elements
 * @param {Number} widthField width of the field
 */
outliers.utils.wrap = function (data, widthField) {
  data.each(function() {
    var label = d3.select(this),
        words = label.text()
                     .split(/\s+/)
                     .reverse(),
        word,
        lines = [],
        line = [],
        width = parseFloat(label.attr(widthField)),
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = label.attr("y") || 0,
        dy = parseFloat(label.attr("dy")) || 0.1,
        gauge_tspan = label.text(null)
                           .append("tspan")
                           .style('opacity', 0);
    lines.push(line);
    while (word = words.pop()) {
        line.push(word);
        gauge_tspan.text(line.join(" "));
        var cond = Math.floor(width / 6);
        if ((gauge_tspan.node().getComputedTextLength() > width) && (line.length > 1)) {
          line.pop();
          line = [word];
          lines.push(line);
        } else if (line.length === 1 && line[0].length > cond) {
          var _1 = line[0].slice(0, cond),
              _2 = line[0].slice(cond);
          if (_2.length > 2) {
            line.pop();
            line = [_2];
            lines[lines.length - 1] = [_1 + "-"];
            lines.push(line);
          }
        }
    }
    var tspans = label.text(null)
                      .selectAll('tspan')
                      .data(lines.map(function(d) {
                        return d.join(" ");
                      }));
    tspans.exit()
          .remove();
    tspans.enter()
          .append("tspan")
          .attr("x", 0)
          .attr("y", function (d) {
            return y;
          });
    tspans.text(function(d) {
            return d;
          })
          .attr("dy", function(d, i) {
            return dy + i * lineHeight + "em";
          });
  });
};