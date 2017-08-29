var d3 = require('d3');
var topojson = require('topojson');
var social = require("./lib/social");

// initialize colors
var lightest_gray = "#D8D8D8";

// helpful functions:
var formatthousands = d3.format("0,000");

// function for shading colors
function shadeColor2(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

// we are not using a projection for the map
var path = d3.geo.path()
  .projection(null);

// show tooltip
var tooltip = d3.select("#county-map")
  .append("div")
  .attr("class","tooltip")
  // .attr("id","fed-tooltip")
  .style("position", "absolute")
  .style("z-index", "100")
  .style("visibility", "hidden");

// var mapname = "./assets/maps/ca_county_insets.json";
var mapname = "./assets/maps/ca_county_insets.json";

// defining the svg that we are using for the map
var svg = d3.select("#county-map")
  .append("div")
  .classed("svg-container", true) //container class to make it responsive
  .attr("id","county-map")
  .append("svg")
  //responsive SVG needs these 2 attributes and no width and height attr
  .attr("preserveAspectRatio", "xMinYMin slice")
  .attr("viewBox", "0 0 960 600")
  //class to make it responsive
  .classed("svg-content-responsive", true)

// initialize the map
// updateInfo("2015");
drawmap_initial(mapname,"percentChange","Total homeless");

// initialize the years
// var years = ["2015percapita","2017percapita"];
// var i = 0;

document.getElementById('all').addEventListener("click",function(){
  console.log("clicked on all");
  drawmap(mapname,"percentChange","Total homeless");
  document.getElementById('all').classList.add("active");
  document.getElementById('chronic').classList.remove("active");
},false);

document.getElementById('chronic').addEventListener("click",function(){
  console.log("clicked on chronic");
  drawmap(mapname,"percentChangeChronic","Chronic homeless");
  document.getElementById('all').classList.remove("active");
  document.getElementById('chronic').classList.add("active");
},false);

// update map with new data
function drawmap(active_map,year,tag) {

    d3.json(active_map, function(error, us) {
      if (error) throw error;

      var nodes = svg.selectAll(".states")
        .data(topojson.feature(us, us.objects.features).features);
      nodes
        .style("fill", function(d) {
          var location = d.id;
          if (homelessCounts[Number(location)]) {
            var mig = 1-Math.abs(homelessCounts[Number(location)][year]);
            console.log(mig);
            if (mig == 1) {
              return lightest_gray;
            } else if(homelessCounts[Number(location)][year] >= 0) {
              // console.log(mig);
              return shadeColor2("#BC1826", mig)
            } else if (homelessCounts[Number(location)][year] < 0) {
              return shadeColor2("#265B9B", mig)
              // return lightest_gray;
            } else {
              return lightest_gray;
            }
          }
        })
        .attr("d", path)
        .on('mouseover', function(d,index) {
          var location = d.id;
          if (homelessCounts[Number(location)]) {
            var temp = homelessCounts[Number(location)];
            console.log(temp["percentChange"]*100);
            if (temp["multiple"]){
              var html_str = "<div class='name'>"+temp.id+" County</div><div class='note'>Note: Results are combined for "+temp.county+" counties.</div><div>"+tag+" in 2015: "+formatthousands(Math.round(temp["2015"]*temp["multiple"]))+"</div><div>"+tag+" in 2017: "+formatthousands(Math.round(temp["2017"]*temp["multiple"]))+"</div><div>Percent change: "+Math.round(temp[year]*100)+"%</div>";
            } else if (temp["2015"]!= "NA") {
              // if (temp["Source"].substring(0,4) == "http"){
              //   var html_str = "<div class='name'>"+temp.id+" County</div><div>Total homeless in 2015: "+formatthousands(temp["2015"])+"</div><div>Total homeless in 2017: "+formatthousands(temp["2017"])+"</div><div>Percent change: "+Math.round(temp["percentChange"]*100)+"%</div><div class='source'><a href='"+temp["Source"]+"'>Source <i class='fa fa-external-link' aria-hidden='true'></i></a></div>";
              // } else {
                var html_str = "<div class='name'>"+temp.id+" County</div><div>"+tag+" in 2015: "+formatthousands(temp["2015"])+"</div><div>"+tag+" in 2017: "+formatthousands(temp["2017"])+"</div><div>Percent change: "+Math.round(temp[year]*100)+"%</div>";//"<div class='source'>Source: "+temp["Source"]+"</div>";
              // }
            } else {
              console.log("We have no data");
              var html_str = "<div class='name'>"+temp.id+" County</div><div>No homeless count available.</div>";
            }
            tooltip.html(html_str);
            tooltip.style("visibility", "visible");
          }
        })
        .on("mousemove", function() {
          if (screen.width <= 480) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/3+40)+"px");
          } else if (screen.width <= 670) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/2+50)+"px");
          } else {
            return tooltip
              .style("top", (d3.event.pageY+20)+"px")
              .style("left",(d3.event.pageX-80)+"px");
          }
        })
        .on("mouseout", function(){
          return tooltip.style("visibility", "hidden");
        });
  });

};

// initialize map
function drawmap_initial(active_map,year,tag) {

    d3.json(active_map, function(error, us) {
      if (error) throw error;

      var features = topojson.feature(us,us.objects.features).features;
      var nodes = svg.selectAll(".states")
        .data(topojson.feature(us, us.objects.features).features);
      nodes.enter()
        .append("path")
        .attr("class", "states")
        .attr("d",path)
        .style("fill", function(d) {
          var location = d.id;
          if (homelessCounts[Number(location)]) {
            var mig = 1-Math.abs(homelessCounts[Number(location)][year]);
            console.log(mig);
            if (mig == 1) {
              return lightest_gray;
            } else if(homelessCounts[Number(location)][year] >= 0) {
              // console.log(mig);
              return shadeColor2("#BC1826", mig)
            } else if (homelessCounts[Number(location)][year] < 0) {
              return shadeColor2("#265B9B", mig)
              // return lightest_gray;
            } else {
              return lightest_gray;
            }
          }
        })
        .attr("d", path)
        .on('mouseover', function(d,index) {
          var location = d.id;
          if (homelessCounts[Number(location)]) {
            var temp = homelessCounts[Number(location)];
            console.log(temp["percentChange"]*100);
            if (temp["multiple"]){
              var html_str = "<div class='name'>"+temp.id+" County</div><div class='note'>Note: Results are combined for "+temp.county+" counties.</div><div>"+tag+" in 2015: "+formatthousands(Math.round(temp["2015"]*temp["multiple"]))+"</div><div>"+tag+" in 2017: "+formatthousands(Math.round(temp["2017"]*temp["multiple"]))+"</div><div>Percent change: "+Math.round(temp["percentChange"]*100)+"%</div>";
            } else if (temp["2015"]!= "NA") {
              // if (temp["Source"].substring(0,4) == "http"){
              //   var html_str = "<div class='name'>"+temp.id+" County</div><div>Total homeless in 2015: "+formatthousands(temp["2015"])+"</div><div>Total homeless in 2017: "+formatthousands(temp["2017"])+"</div><div>Percent change: "+Math.round(temp["percentChange"]*100)+"%</div><div class='source'><a href='"+temp["Source"]+"'>Source <i class='fa fa-external-link' aria-hidden='true'></i></a></div>";
              // } else {
                var html_str = "<div class='name'>"+temp.id+" County</div><div>"+tag+" in 2015: "+formatthousands(temp["2015"])+"</div><div>"+tag+" in 2017: "+formatthousands(temp["2017"])+"</div><div>Percent change: "+Math.round(temp["percentChange"]*100)+"%</div>";//"<div class='source'>Source: "+temp["Source"]+"</div>";
              // }
            } else {
              console.log("We have no data");
              var html_str = "<div class='name'>"+temp.id+" County</div><div>No homeless count available.</div>";
            }
            tooltip.html(html_str);
            tooltip.style("visibility", "visible");
          }
        })
        .on("mousemove", function() {
          if (screen.width <= 480) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/3+40)+"px");
          } else if (screen.width <= 670) {
            return tooltip
              .style("top",(d3.event.pageY+10)+"px")//(d3.event.pageY+40)+"px")
              .style("left",((d3.event.pageX)/2+50)+"px");
          } else {
            return tooltip
              .style("top", (d3.event.pageY+20)+"px")
              .style("left",(d3.event.pageX-80)+"px");
          }
        })
        .on("mouseout", function(){
          return tooltip.style("visibility", "hidden");
        });

  });

};
