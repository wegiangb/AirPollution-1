var d3 = require("d3");
var $ = require("jquery");


//console.log("src/js/vis/1_beijing.js");

var beijingVis = function (container_selector, service, d, messages, button) {

    var model = this;
    model.service = service;

    model.button = button;

    var data = d;


    var margin = {top: 20, right: 150, bottom: 200, left: 100};
    var width = 950 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // init svg
    model.svgPad = d3.select(container_selector).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    model.svg = model.svgPad.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var dateRange = d3.extent(data, function (d) {
        return d.time;
    });

    model.dateScale = d3.time.scale()
        .domain([dateRange[0], dateRange[1]])
        .range([0, width]);


    var pmRange = [0, 800];

    var pmScale = d3.scale.linear()
        .domain([pmRange[1] + 100, pmRange[0]])
        .range([0, height]);

    var xAxis = d3.svg.axis()
        .scale(model.dateScale)
        .orient("bottom")
        .tickFormat(d3.time.format("%b"));


    var yAxis = d3.svg.axis()
        .scale(pmScale)
        .orient("left")
        .ticks(6);


    var area = d3.svg.area()
        .x(function (d) {
            return model.dateScale(d.time);
        })
        .y0(height)
        .y1(function (d) {
            return pmScale(d.pm25);
        });

    model.message = model.svg.append("g");


    model.svg.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", "brown");


    model.svg.append("text")
        .attr("x", -90)
        .attr("y", height / 2)
        .html("(PM 2.5)")
        .attr("class", "axis-label y-axis");

    model.svg.append("text")
        .attr("x", width)
        .attr("y", 0)
        .html("(2015)")
        .attr("class", "axis-label x-axis");

    model.rect = model.svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white");


    var axis = model.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0,0)")
        .call(xAxis);

    axis.selectAll("text")
        .attr("transform", function () {
            return "translate(0,-25)";
        });

    axis.selectAll("line")
        .attr("transform", function () {
            return "translate(0,-6)";
        });


    model.svg.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(" + 0 + ",0)")
        .call(yAxis);

    model.front = model.svg.append("g");


    model.vals = [];

    model.update = function () {


        model.vals = [];


        model.cur = 0;
        $("#" + model.button).val("Play");
        $("#" + model.button).removeClass("hidden");
        model.message.selectAll("line").remove();
        model.message.selectAll("foreignObject").remove();

        if (model.selection) {
            model.selection.remove();
        }
        if (model.focus) {
            model.focus.remove();
        }
        model.rect.attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "white");

    };

    model.cur = 0;
    model.messages = messages;

    model.bisectDate = d3.bisector(function (d) {
        return d.time;
    }).left;

    model.mousemove = function () {
        var x0 = model.dateScale.invert(d3.mouse(this)[0]),
            i = model.bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i];

        if (!d0 || !d1) {
            return;
        }

        var d = x0 - d0.time > d1.time - x0 ? d1 : d0;
        model.focus.select("rect.AreaTooltip")
            .attr("transform",
                "translate(" + model.dateScale(d.time) + "," +
                0 + ")");

        model.focus.select("text.AreaTooltipDate")
            .attr("transform",
                "translate(" + (model.dateScale(d.time) + 10) + "," +
                (height / 5 + 15) + ")")
            .html(d3.time.format("%B %d, %Y")(new Date(d.time)));

        model.focus.select("text.AreaTooltipPopulation")
            .attr("transform",
                "translate(" + (model.dateScale(d.time) + 10) + "," +
                height / 5 + ")")
            .html(+Math.round(d.pm25)+" PM 2.5");
    };

    model.next = function () {


        if (model.cur === 0) {

            model.focus = model.front.append("g")
                .style("display", "none");


            model.focus.append("rect")
                .attr("class", "AreaTooltip")
                .attr("width", 1)
                .attr("height", height);

            model.focus.append("text")
                .attr("class", "AreaTooltipDate");

            model.focus.append("text")
                .attr("class", "AreaTooltipPopulation");


            model.selection = model.front.append("rect")
                .attr("width", 0)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .on("mouseover", function () {
                    model.focus.style("display", null);
                })
                .on("mouseout", function () {
                    model.focus.style("display", "none");
                })
                .on("mousemove", model.mousemove);


        }
        else if (model.messages.length === model.cur) {

            $("#" + model.button).addClass("hidden");
            model.rect.transition()
                .duration(500)
                .attr("x", width);

            model.selection.transition()
                .duration(500).attr("width", width);
            return;

        }

        $("#" + model.button).val("Continue");
        //console.log(model.messages[model.cur].date);
        model.rect.transition()
            .duration(500)
            .attr("x", model.dateScale(model.messages[model.cur].date));

        model.vals.push(model.messages[model.cur]);


        model.message.selectAll("line").data(model.vals).enter().append("line")
            .attr("x1", function (d) {
                return model.dateScale(d.date) - 1;
            })
            .attr("y1", height)
            .attr("x2", function (d) {
                return model.dateScale(d.date) - 1;
            })
            .attr("y2", height)
            .style("stroke", "gray")
            .transition()
            .delay(500)
            .duration(200)
            .attr("y2", height + 30)
            .style("stroke-width", 1);

        model.message.selectAll("foreignObject").data(model.vals).enter().append("foreignObject")
            .attr("x", function (d) {
                return model.dateScale(d.date) - 1;
            })
            .attr("y", height + 40)
            .attr("width", 200)
            .attr("height", 200)
            .html(function (d) {

                return d.message;

            });

        model.selection.transition()
            .duration(1000).attr("width", model.dateScale(model.messages[model.cur].date));

        model.cur++;
    };

    // "next button"
    $("#" + model.button).click(model.next);


};

module.exports = beijingVis;
