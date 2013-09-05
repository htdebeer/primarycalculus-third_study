/*
 * Copyright (C) 2013 Huub de Beer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

var view = require("./view"),
    dom = require("../dom/dom");

var graph = function(config_) {

    var config = Object.create(config_);
    config.type = "graph";
    var _graph = view(config);

    var horizontal = config_.horizontal,
        vertical = config_.vertical;


    var dimensions = {
        width: config.dimensions.width,
        height: config.dimensions.height,
        margins: {
            top: 10,
            right: 20,
            left: 80,
            bottom: 80
        }
    };

    var CONTAINER = {
            width: dimensions.width || 900,
            height: dimensions.height || 600
        };
    var MARGINS = {
            top:dimensions.margins.top || 10,
            right:dimensions.margins.right || 20,
            left:dimensions.margins.left || 60,
            bottom:dimensions.margins.bottom || 60
        };
    var GRAPH = {
            width: CONTAINER.width - MARGINS.left - MARGINS.right,
            height: CONTAINER.height - MARGINS.top - MARGINS.bottom
        };


    _graph.fragment = document
        .createDocumentFragment()
        .appendChild(dom.create({
            name: "figure",
            attributes: {
                "class": "graph"
            }
        }));

    var horizontal_axis, vertical_axis;

    var mouse_actions = [
        {
            name: "tangent_triangle",
            icon: "icon-crop",
            on: show_tangent_triangle,
            off: hide_tangent_triangle
        }, {
            name: "locally_zoom",
            icon: "icon-zoom-in",
            on: show_zoom,
            off: hide_zoom
        }
    ];
            
    var hide_actions = config.hide_actions || [];
    function show_this_action(action) {
        return hide_actions.indexOf(action.name) === -1;
    }

    mouse_actions = mouse_actions.filter(show_this_action);

    var current_action = config.default_action || "measure_point";

    function toggle_action(action) {

        return function() {
            if (!this.hasAttribute("data-toggled")) {
                this.setAttribute("data-toggled", true);
                // enable mouse thingie
                action.on();
            } else {
                this.removeAttribute("data-toggled");
                // diable mouse thingie
                action.off();
            }
        };

    }
             
    function show_tangent_triangle() {
            var tangent_triangle = svg.select("g.tangent_triangle");
            if (tangent_triangle) tangent_triangle.style("visibility", "visible");
    }

    function hide_tangent_triangle() {
            var tangent_triangle = svg.select("g.tangent_triangle");
            if (tangent_triangle) tangent_triangle.style("visibility", "hidden");
    }

    function show_zoom() {
        console.log("start zooming");
    }

    function hide_zoom() {
        console.log("stop zooming");
    }


    function create_caption() {
        var get_name = function(q) {
                return _graph.quantities[q].name;
            },
            quantity_names = Object.keys(_graph.quantities),
            horizontal_selected_index = quantity_names.indexOf(
                    horizontal),
            vertical_selected_index = quantity_names.indexOf(
                    vertical),
            create_option = function(selected_index) {
                return function(quantity_name, index) {
                    var option = {
                        name: "option",
                        value: quantity_name
                    };
                    if (index === selected_index) {
                        option.attributes = {
                            selected: true
                        };
                    }
                    return option;
                };
            },
            horizontal_quantity_list = quantity_names.map(
                    create_option(horizontal_selected_index)),
            vertical_quantity_list = quantity_names.map(
                    create_option(vertical_selected_index));

        var create_action = function(action) {
                var attributes = {
                        "class": "action",
                        "data-action": action.name
                    };

                    if (current_action === action.name) {
                        attributes["data-toggled"] = true;
                    }
                    return {
                        name: "button",
                        attributes: attributes,
                        children: [{
                            name: "i",
                            attributes: {
                               "class": action.icon
                            }
                        }],
                        on: {
                            type: "click",
                            callback: toggle_action(action)
                        }

                    };
        };
        var actions_elts = mouse_actions.map(create_action);

        _graph.fragment.appendChild(dom.create({
                name: "figcaption",
                children: [
                {
                    name: "select",
                    attributes: {

                    },
                    children: vertical_quantity_list,
                    on: {
                        type: "change",
                        callback: function(event) {
                            var quantity = event.target.value;
                            set_axis(quantity, "vertical");
                        }
                    }
                },
                {
                    name: "textNode",
                    value: " - "
                }, 
                {
                    name: "select",
                    children: horizontal_quantity_list,
                    on: {
                        type: "change",
                        callback: function(event) {
                            var quantity = event.target.value;
                            set_axis(quantity, "horizontal");
                        }
                    }
                }, 
                {
                    name: "textNode",
                    value: " grafiek "
                } 
                ].concat(actions_elts)
            }));
    }
    create_caption();

    var svg = d3.select(_graph.fragment).append("svg")
            .attr("width", CONTAINER.width)
            .attr("height", CONTAINER.height)
            .append("g")
                .attr("transform", "translate(" + 
                        MARGINS.left + "," + 
                        MARGINS.right + ")");


    var showline = false,
        showtailpoints = false;

    function draw_tailpoints(model_name) {
        var model = _graph.get_model(model_name).model,
            step = function(value, index) {
                var step_size = model.step_size() || 1;

                return (index % step_size === 0) && (index !== 0);
            },
            data = model.data().filter(step),
            x_scale = horizontal_axis.scale,
            x_quantity = horizontal_axis.quantity,
            y_scale = vertical_axis.scale,
            y_quantity = vertical_axis.quantity;

        var model_tailpoints = _graph.fragment
            .querySelector("svg g.tailpoints g." + model_name);
        if (model_tailpoints) {
            model_tailpoints.parentNode.removeChild(model_tailpoints);
        }


        svg.select("g.tailpoints")
                .append("g")
                .attr("class", model_name)
                .selectAll("line")
                .data(data)
                .enter()
                .append("line")
                .attr("x1", function(d) {
                    return x_scale(d[x_quantity.name]);
                })
                .attr("y1", function(d) {
                    return y_scale(d[y_quantity.name]);
                })
                .attr("x2", function(d) {
                    return x_scale(d[x_quantity.name]);
                })
                .attr("y2", y_scale(0))
                .attr("stroke", model.color || "red")
                .style("stroke-width", 1)
//                .style("stroke-opacity", 0.7)
//                .style("stroke-dasharray", [3,1])
                ;
        svg.select("g.tailpoints g." + model_name)
                .selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", function(d) {
                    return x_scale(d[x_quantity.name]);
                })
                .attr("cy", function(d) {
                    return y_scale(d[y_quantity.name]);
                })
                .attr("r", 2)
                .attr("stroke", "black")
                .attr("fill", "white")
                .style("stroke-width", 1.5)
                .on("mouseover.tooltip", add_tooltip(model_name))
                .on("mouseout.tooltip", remove_tooltip(model_name))
                .on("mouseover.tangent_triangle", add_tangent_triangle(model_name))
                .on("mouseout.tangent_triangle", remove_tangent_triangle(model_name))
                ;

        model_tailpoints = _graph.fragment
            .querySelector("svg g.tailpoints g." + model_name);
        if (!showtailpoints) {
            model_tailpoints.style.visibility = "hidden";
        }            
    }

    function draw_line(model_name) {
        var model = _graph.get_model(model_name).model,
            data = model.data(),
            x_scale = horizontal_axis.scale,
            x_quantity = horizontal_axis.quantity,
            y_scale = vertical_axis.scale,
            y_quantity = vertical_axis.quantity;


        var line = d3.svg.line()
                .x(function(d) {
                    return x_scale(d[x_quantity.name]);
                })
                .y(function(d) {
                    return y_scale(d[y_quantity.name]);
                })
                .interpolate("cardinal")
                .tension(1);
                

        var model_line = _graph.fragment
            .querySelector("svg g.lines g.line." + model_name);
        if (model_line) {
            model_line.parentNode.removeChild(model_line);
        }


        svg.select("g.lines")
                .append("g")
                .attr("class", "line " + model_name)
                .selectAll("path." + model_name)
                .data([data])
                .enter()
                .append("path")
                .attr("d", line)
                .attr("class", "graph")
                .attr("fill", "none")
                .attr("stroke", model.color || "red")
                .style("stroke-width", 3)
                .on("mouseover.tooltip", add_tooltip(model_name))
                .on("mousemove.tooltip", add_tooltip(model_name))
                .on("mouseout.tooltip", remove_tooltip(model_name))
                .on("mouseover.tangent_triangle", add_tangent_triangle(model_name))
                .on("mousemove.tangent_triangle", add_tangent_triangle(model_name))
                .on("mouseout.tangent_triangle", remove_tangent_triangle(model_name))
                ;

        model_line = _graph.fragment
            .querySelector("svg g.lines g.line." + model_name);
        if (!showline) {
            model_line.style.visibility = "hidden";
        }            

    }

    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("opacity", 0.7);

    function add_tooltip(model_name) {
        return function(d, i) {
            var PADDING = 10;
            var line = svg.select("g.lines g.line." + model_name + " path");
            line.style("cursor", "crosshair");

            var container = _graph.fragment.querySelector("svg > g"),
                point = d3.mouse(container),
                x_scale = horizontal_axis.scale,
                x_quantity = horizontal_axis.quantity,
                y_scale = vertical_axis.scale,
                y_quantity = vertical_axis.quantity,
                x = x_scale.invert(point[0]).toFixed(x_quantity.precision || 0),
                y = y_scale.invert(point[1]).toFixed(y_quantity.precision || 0),
                x_unit = x_quantity.unit,
                y_unit = y_quantity.unit;
                            

            tooltip.html( x + " " + x_unit + "; " + y + " " + y_unit);

            tooltip
                .style("left", (d3.event.pageX + PADDING*2) + "px")     
                .style("top", (d3.event.pageY - PADDING) + "px");   

            tooltip.style("visibility", "visible");
        };
    }

    function remove_tooltip(model_name) {
        return function() {
            var line = svg.select("g.lines g.line." + model_name + " path");
            line.style("cursor", "default");
            tooltip.style("visibility", "hidden");
        };
    }



    var tangent_triangle = svg
        .append("g")
        .classed("tangent_triangle", true);
    tangent_triangle.append("line")
        .classed("tangent", true)
        .style({
            "stroke-width": 3,
            "stroke": "crimson"
        });

    function add_tangent_triangle(model_name) {
        return function(d, i) {
            var container = _graph.fragment.querySelector("svg > g"),
                path = d3.event.target || d3.event.srcElement,
                point = d3.mouse(container);


            var length_at_point = 0,
                total_length = path.getTotalLength(),
                INTERVAL = 50;

            while (path.getPointAtLength(length_at_point).x < point[0] && 
                    length_at_point < total_length) {
                        length_at_point += INTERVAL;
                    }

            length_at_point -= INTERVAL;

            while (path.getPointAtLength(length_at_point).x < point[0] && 
                    length_at_point < total_length) {
                        length_at_point++;
                    }


            var x_scale = horizontal_axis.scale,
                x_quantity = horizontal_axis.quantity,
                y_scale = vertical_axis.scale,
                y_quantity = vertical_axis.quantity,
                x_unit = x_quantity.unit,
                y_unit = y_quantity.unit,
                cur = {
                    x: x_scale.invert(point[0]).toFixed(x_quantity.precision || 0),
                    y: y_scale.invert(point[1]).toFixed(y_quantity.precision || 0)
                };

            var prev,
                next,
                delta;

            if (length_at_point > 1 && length_at_point < (total_length - 1)) {
                prev = path.getPointAtLength(length_at_point - 0.1);
                next = path.getPointAtLength(length_at_point + 0.1);
                delta = {
                    x: next.x - prev.x,
                    y: next.y - prev.y
                };
            } else {

                // don't worry about the first
                // and last pixel or so
                return;
            }

        


            var tangent = tangent_triangle.select("g.tangent_triangle line.tangent");

            var LENGTH = 200;

            point = path.getPointAtLength(length_at_point);
            var x1 = point.x - delta.x * LENGTH,
                y1 = point.y - delta.y * LENGTH,
                x2 = point.x + delta.x * LENGTH,
                y2 = point.y + delta.y * LENGTH;

            tangent.attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2);


            svg.select("g.tangent_triangle").style("opacity", 1);
        };
    }

    function remove_tangent_triangle(model_name) {
        return function() {
            var tangent_triangle = svg.select("g.tangent_triangle");
            tangent_triangle.style("opacity", 0);
        };
    }


    function set_axis(quantity_name, orientation) {
        var quantity = _graph.quantities[quantity_name],
            create_scale = function(quantity, orientation) {
                var range;
                if (orientation === "horizontal") {
                    range = [0, GRAPH.width];
                } else {
                    range = [GRAPH.height, 0];
                }
                return d3.scale.linear()
                    .range(range)
                    .domain([quantity.minimum, quantity.maximum]);
            },
            scale = create_scale(quantity, orientation),
            create_axis = function(quantity, orientation) {
                var axis;
                if (orientation === "horizontal") {
                    axis = d3.svg.axis()
                        .scale(scale)
                        .tickSubdivide(3);
                } else {
                    axis = d3.svg.axis()
                        .scale(scale)
                        .orient("left")
                        .tickSubdivide(3);
                }
                return axis;
            },
            axis = create_axis(quantity, orientation);
       
        if (orientation === "horizontal") {
            horizontal = quantity_name;
            //  create axes    
            var xaxisg = _graph.fragment.querySelector("g.x.axis");
            if (xaxisg) {
                xaxisg.parentNode.removeChild(xaxisg);
            }

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + GRAPH.height + ")")
                .call(axis);

            var xgridg = _graph.fragment.querySelector("g.x.grid");
            if (xgridg) {
                xgridg.parentNode.removeChild(xgridg);
            }

            svg.append("g")
                .attr("class", "x grid")
                .attr("transform", "translate(0," + GRAPH.height + ")")
                .call(axis.tickSize(- GRAPH.height, 0, 0).tickFormat(""));

            var xlabel = _graph.fragment.querySelector("text.x.label");
            if (xlabel) {
                xlabel.parentNode.removeChild(xlabel);
            }

            svg.append('text')
                .attr('text-anchor', 'middle')
                .attr("class", "x label")
                .text(quantity.label)
                    .attr('x', GRAPH.width / 2)
                    .attr('y', CONTAINER.height - (MARGINS.bottom / 2));

            horizontal_axis = {
                quantity: quantity,
                scale: scale,
                axis: axis
            };
        } else {
            // vertical axis
            vertical = quantity_name;
            var yaxisg = _graph.fragment.querySelector("g.y.axis");
            if (yaxisg) {
                yaxisg.parentNode.removeChild(yaxisg);
            }

            svg.append("g")
                .attr("class",  "y axis")
                .call(axis);

            var ygridg = _graph.fragment.querySelector("g.y.grid");
            if (ygridg) {
                ygridg.parentNode.removeChild(ygridg);
            }

            svg.append("g")
                .attr("class", "y grid")
                .call(axis.tickSize(- GRAPH.width, 0, 0).tickFormat(""));

            var ylabel = _graph.fragment.querySelector("text.y.label");
            if (ylabel) {
                ylabel.parentNode.removeChild(ylabel);
            }

            svg.append('text')
                .attr('text-anchor', 'middle')
                .attr("class", "y label")
                .text(quantity.label)
                    .attr('transform', 'rotate(-270,0,0)')
                    .attr('x', GRAPH.height / 2)
                    .attr('y', MARGINS.left * (5/6) );

            vertical_axis = {
                quantity: quantity,
                scale: scale,
                axis: axis
            };
        }

        update_lines();
        update_tailpoints();
        
    }

    function update_lines() {
        Object.keys(_graph.models).forEach(draw_line);
    }

    function update_tailpoints() {
        Object.keys(_graph.models).forEach(draw_tailpoints);
    }

    function create_graph() {

        // scales and axes (make all axis pre-made?)
        set_axis(horizontal, "horizontal");
        set_axis(vertical, "vertical");
        svg.append("g")
            .attr("class", "lines");
        svg.append("g")
            .attr("class", "tailpoints");

        tangent_triangle.style("visibility", "hidden");


    }
    create_graph();

    
    _graph.remove = function(model_name) {
        var model_line = _graph.fragment
            .querySelector("svg g.lines g.line." + model_name);
        if (model_line) {
            model_line.parentnode.removechild(model_line);
        }
        var model_tailpoints = _graph.fragment
            .querySelector("svg g.tailpoints g." + model_name);
        if (model_tailpoints) {
            model_tailpoints.parentNode.removeChild(model_tailpoints);
        }
    };

    _graph.update_all = function() {
        _graph.compute_extrema();
        set_axis(horizontal, "horizontal");
        set_axis(vertical, "vertical");
        Object.keys(_graph.models).forEach(_graph.update);
    };


    _graph.update = function(model_name) {
        var model = _graph.get_model(model_name);
        draw_line(model_name);
        draw_tailpoints(model_name);
    };

    _graph.show_tailpoints = function(model_name) {
        var model_tailpoints = _graph.fragment
            .querySelector("svg g.tailpoints g." + model_name);
        if (model_tailpoints) {
            model_tailpoints.style.visibility = "visible";
        }
        showtailpoints = true;
    };

    _graph.hide_tailpoints = function(model_name) {
        var model_tailpoints = _graph.fragment
            .querySelector("svg g.tailpoints g." + model_name);
        if (model_tailpoints) {
            model_tailpoints.style.visibility = "hidden";
        }
        showtailpoints = false;
    };


    _graph.show_line = function(model_name) {
        var model_line = _graph.fragment
            .querySelector("svg g.lines g.line." + model_name);
        if (model_line) {
            model_line.style.visibility = "visible";
        }
        showline = true;
    };

    _graph.hide_line = function(model_name) {
        var model_line = _graph.fragment
            .querySelector("svg g.lines g.line." + model_name);
        if (model_line) {
            model_line.style.visibility = "hidden";
        }
        showline = false;
    };

    return _graph;
};

module.exports = graph;
