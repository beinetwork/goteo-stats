/**
 * @class outliers.viz.PieChart
 *
 * Outliers' Pie Chart component.
 *
 * Usage:
 *
 * Instance the object:
 *
 *      pc = new outliers.viz.PieChart()
 *                         .container("#miPieChart")
 *                         .side(500)
 *                         .transitionDuration(200);
 *
 * Render the chart:
 *
 *      var chartData = [
 *                      {id: 1, label: "Elem 1", fraction: 0.25},
 *                      {id: 2, label: "Elem 2", fraction: 0.10},
 *                      {id: 3, label: "Elem 3", fraction: 0.15},
 *                      {id: 4, label: "Elem 4", fraction: 0.5}
 *                    ];
 *      pc.render(chartData, "fraction", "id", "label")
 */
'use strict';

var outliers = outliers || {'version':0.1, 'controller':{}, 'viz': {} ,'utils': {}};

/**
 * Pie chart object
 *
 * @return {Object} the pie chart object.
 * @constructor
 */
outliers.viz.PieChart = function() {
  var container = "body",
      side = 500,
      margin = {"top": 10, "left": 10, "bottom": 10, "right": 10},
      radius = (side - margin.top - margin.bottom) / 2,
      outerRadiusProportion = 0.95,
      innerRadiusProportion = 0.75,
      outerRadius = radius * outerRadiusProportion,
      innerRadius = radius * innerRadiusProportion,
      transitionDuration = 750,
      layout = d3.layout.pie(),
      arcGen = d3.svg.arc(),
      mouseOverOuterRadiusProportion = 0.98,
      mouseOverInnerRadiusProportion = 0.72,
      mouseOverOuterRadius = radius * mouseOverOuterRadiusProportion,
      mouseOverInnerRadius = radius * mouseOverInnerRadiusProportion,
      mouseOverArcGen = d3.svg.arc(),
      svgParent = null,
      svg = null,
      r = 25,
      format = d3.format(".1%"),
      data = null,
      maxArc = null,
      maxId = null,
      arcPadding = 0,
      isPercentage = true;

  function piechart() {}

  /**
  * Renders the pie chart with the provided data.
  *
  * @param {Array} newData THE DATA (mandatory)
  * @param {String} valueField name of the field where the value to be displayed is.
  * @param {String} idField name of the field where the ID of every datum is.
  * @param {String} textField name of the field where the text to be displayed on the label is.
  */
  piechart.render = function(newData, valueField, idField, textField) {
    data = newData;
    layout.padAngle(arcPadding);

    function arcTween(a) {
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function(t) {
        return arcGen(i(t));
      };
    }
    svgParent = d3.select(container)
                  .selectAll("svg")
                  .data([data]);
    svgParent.attr("width", side)
             .attr("height", side)
             .attr("viewBox", "0 0 " + side + " " + side);
    var newSvgParent = svgParent.enter()
                                .append("svg")
                                .attr("width", side)
                                .attr("height", side)
                                .attr("viewBox", "0 0 " + side + " " + side)
                                .append("g")
                                .attr("id", "piechart-" + container.replace(".","").replace("#", ""));
    svg = svgParent.select("#piechart-" + container.replace(".","").replace("#", ""))
                   .attr("transform", "translate(" + (side / 2) + "," + (side / 2) + ")");
    var maxValue = Number.MIN_VALUE;
    for (var i = 0; i < data.length; i++) {
      if (maxId === null) {
        maxId = i;
        if (valueField) {
          maxValue = data[i][valueField];
        } else {
          maxValue = data[i];
        }
      }
      else {
        if (valueField) {
          if (maxValue < data[i][valueField]) {
            maxId = i;
            maxValue = data[i][valueField];
          }
        } else {
          if (maxValue < data[i][valueField]) {
            maxId = i;
            maxValue = data[i];
          }
        }
      }
    }
    layout.value(function(d) {
            if (!valueField) {
              return d;
            } else {
              return d[valueField];
            }
          })
          .sort(function(a, b) {
            if (!idField) {
              return a - b;
            } else {
              if (isNaN(a[idField])) { return a[idField].localeCompare(b[idField]); }
              else { return a[idField] - b[idField]; }
            }
          });
    var pieArcs = layout(data),
        arcs = svg.selectAll(".arc")
                  .data(pieArcs, function(d, i) {
                    if (!idField) {
                      return i;
                    } else {
                      return d.data[idField];
                    }
                  });
    for (var a = 0; a < pieArcs.length; a++) {
      if (a == maxId) { maxArc = pieArcs[a]; }
    }
    arcs.exit()
        .remove();
    arcs.transition()
        .duration(transitionDuration)
        .attr("d", function (d, i) {
          if (i == maxId) {
            return mouseOverArcGen(d);
          } else {
            return arcGen(d);
          }
        });
    arcs.enter()
        .insert("path", ".arc")
        .attr("class", function (d, i) {
          return "pie arc" + (i == maxId ? " maximum" : (i % 2 ? " odd" : " even"));
        })
        .attr("d", function (d, i) {
          if (i == maxId) {
            return mouseOverArcGen(d);
          } else {
            return arcGen(d);
          }
        })
        .on("mouseover", function (d, i) {
          svg.selectAll(".arc")
             .filter(function (c, j) {
               return i == j;
             })
             .classed("selected", true);
          svg.selectAll(".sublabel")
             .text(function () {
               if (textField) {
                 return d.data[textField];
               } else {
                 return d.data;
               }
             })
             .call(outliers.utils.wrap, "tspan-width");
          svg.selectAll(".perclabel")
             .text(function () {
               if (textField) {
                 return format(isPercentage ? d.data[valueField] / 100 : d.data[valueField]);
               } else {
                 return format(isPercentage ? d.data / 100 : d.data);
               }
             })
             .call(outliers.utils.wrap, "tspan-width");
          arcs.filter(function(d, i) {
                return i == maxId;
              })
              .transition()
              .duration(transitionDuration)
              .attr("d", arcGen);
          d3.select(this)
            .transition()
            .duration(transitionDuration)
            .attr("d", mouseOverArcGen);
        })
        .on("mouseout", function (d, i) {
          svg.selectAll(".arc")
             .filter(function (c, j) {
               return i == j;
             })
             .classed("selected", false);
          svg.selectAll(".sublabel")
             .text(function () {
               if (textField) {
                 return maxArc.data[textField];
               } else {
                 return maxArc.data;
               }
             })
             .call(outliers.utils.wrap, "tspan-width");
          svg.selectAll(".perclabel")
             .text(function () {
               if (textField) {
                 return format(isPercentage ? maxArc.data[valueField] / 100 : maxArc.data[valueField]);
               } else {
                 return format(isPercentage ? maxArc.data / 100 : maxArc.data);
               }
             })
             .call(outliers.utils.wrap, "tspan-width");
          d3.select(this)
            .transition()
            .duration(transitionDuration)
            .attr("d", arcGen);
          arcs.filter(function(d, i) {
                return i == maxId;
              })
              .transition()
              .duration(transitionDuration)
              .attr("d", mouseOverArcGen);
        })
        .each(function(d) { this._current = d; });
    var selectedText = svg.selectAll(".sublabel")
                          .data([data]);
    selectedText.exit()
                .remove();
    selectedText.enter()
                .append("text")
                .attr("class", "pie sublabel")
                .attr("d", "0.1em")
                .attr("tspan-width", radius * 1.3)
                .style("text-anchor", "middle");

    selectedText.attr("transform", "translate(0," + (radius * 0.25) + ")")
                .text(function () {
                  if (textField) {
                    return maxArc.data[textField];
                  } else {
                    return maxArc.data;
                  }
                })
                .call(outliers.utils.wrap, "tspan-width");
    var selectedPer = svg.selectAll(".perclabel")
                         .data([data]);
    selectedPer.exit()
               .remove();
    selectedPer.enter()
               .append("text")
               .attr("class", "pie perclabel")
               .attr("tspan-width", radius * 1.75)
               .style("text-anchor", "middle");
    selectedPer.text(function () {
      if (valueField) {
        return format(isPercentage ? maxArc.data[valueField] / 100 : maxArc.data[valueField]);
      } else {
        return format(isPercentage ? maxArc.data / 100 : maxArc.data);
      }
    });
  };

  /**
  * Resizes all the chart elements according to the new side provided.
  *
  * @param {Number} newSide new width of the chart.
  * @param {Array} data THE DATA (mandatory)
  * @param {String} valueField name of the field where the value to be displayed is.
  * @param {String} idField name of the field where the ID of every datum is.
  * @param {String} textField name of the field where the text to be displayed on the label is.
  */
  piechart.resize = function(newSide, data, valueField, idField, textField) {
    side = newSide;
    radius = (side - margin.top - margin.bottom) / 2;
    outerRadius = radius * outerRadiusProportion;
    innerRadius = radius * innerRadiusProportion;
    mouseOverOuterRadius = radius * mouseOverOuterRadiusProportion;
    mouseOverInnerRadius = radius * mouseOverInnerRadiusProportion;
    arcGen.outerRadius(outerRadius)
          .innerRadius(innerRadius);
    mouseOverArcGen.outerRadius(mouseOverOuterRadius)
                   .innerRadius(mouseOverInnerRadius);
    piechart.render(data, valueField, idField, textField);
  };

  /**
  * If x is provided, sets the selector of the container where the pie chart will
  * be rendered. If not returns its current value.
  *
  * @param {String} x selector of the container where the chart will be rendered.
   *
   * @return {Object} the modified pie chart
  */
  piechart.container = function(x) {
    if (!arguments.length) return container;
    container = x;
    return piechart;
  };

  /**
  * If x is provided, sets the width and height of the pie chart to it. If not
  * returns its current value.
  *
  * Radius will be calculated taking into consideration both the provided side and the
  * defined margins.
  *
  * @param {Number} _ width of the pie chart.
   *
   * @return {Object} the modified pie chart
  */
  piechart.side = function(x) {
    if (!arguments.length) return side;
    side = x;
    radius = (side - margin.top - margin.bottom) / 2;
    outerRadius = radius * outerRadiusProportion;
    innerRadius = radius * innerRadiusProportion;
    mouseOverOuterRadius = radius * mouseOverOuterRadiusProportion;
    mouseOverInnerRadius = radius * mouseOverInnerRadiusProportion;
    arcGen.outerRadius(outerRadius)
          .innerRadius(innerRadius);
    mouseOverArcGen.outerRadius(mouseOverOuterRadius)
                   .innerRadius(mouseOverInnerRadius);
    return piechart;
  };

  /**
  * If x is provided, sets the margin object of the pie chart to it. If not
  * returns its current value.
  *
  * The expected object must have the following fields: top, bottom, left and right.
  *
  * @param {Object} _ margins of the pie chart.
   *
   * @return {Object} the modified pie chart
  */
  piechart.margin = function(x) {
    if (!arguments.length) return margin;
    margin = x;
    radius = (side - margin.top - margin.bottom) / 2;
    outerRadius = radius * outerRadiusProportion;
    innerRadius = radius * innerRadiusProportion;
    mouseOverOuterRadius = radius * mouseOverOuterRadiusProportion;
    mouseOverInnerRadius = radius * mouseOverInnerRadiusProportion;
    arcGen.outerRadius(outerRadius)
          .innerRadius(innerRadius);
    mouseOverArcGen.outerRadius(mouseOverOuterRadius)
                   .innerRadius(mouseOverInnerRadius);
    return piechart;
  };

  /**
  * If x is provided, sets the outer radius of the pie chart to it. If not
  * returns its current value.
  *
  * @param {Number} _ size of the outer radius of the pie chart.
   *
   * @return {Object} the modified pie chart
  */
  piechart.outerRadius = function(x) {
    if (!arguments.length) return outerRadius;
    outerRadius = x;
    arcGen.outerRadius(outerRadius);
    return piechart;
  };

  /**
  * If x is provided, sets the inner radius of the pie chart to it. If not
  * returns its current value.
  *
  * @param {Number} _ size of the inner radius of the pie chart.
   *
   * @return {Object} the modified pie chart
  */
  piechart.innerRadius = function(x) {
    if (!arguments.length) return innerRadius;
    innerRadius = x;
    arcGen.innerRadius(innerRadius);
    return piechart;
  };

  /**
  * If x is provided, sets the transition duration of the pie chart to it. If not
  * returns its current value.
  *
  * @param {Number} _ number of milliseconds a transition must take.
   *
   * @return {Object} the modified pie chart
  */
  piechart.transitionDuration = function(x) {
    if (!arguments.length) return transitionDuration;
    transitionDuration = x;
    return piechart;
  };

  /**
   * If x is provided, sets the arc padding of the pie chart to it. If not
   * returns its current value.
   *
   * @param {Number} _ padding between arcs.
   *
   * @return {Object} the modified pie chart
   */
  piechart.arcPadding = function(x) {
    if (!arguments.length) return arcPadding;
    arcPadding = x;
    return piechart;
  };

  /**
   * If x is provided, sets the condition to consider data as percentages to it. If not
   * returns its current value.
   *
   * @param {Boolean} _ data should be considered as percentage?
   *
   * @return {Object} the modified pie chart
   */
  piechart.isPercentage = function(x) {
    if (!arguments.length) return isPercentage;
    isPercentage = x;
    return piechart;
  };

  /**
   * If x is provided, sets the function to format numbers to it. If not
   * returns its current value.
   *
   * @param {Function} _ function to format numbers
   *
   * @return {Object} the modified pie chart
   */
  piechart.format = function(x) {
    if (!arguments.length) return format;
    format = x;
    return piechart;
  };

  return piechart;
};