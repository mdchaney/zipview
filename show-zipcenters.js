// data is in zip_centers array

// Creates an svg element inside a container div
function create_svg_element(container_div, minx, maxx, miny, maxy) {
	const x_five_pct = (maxx-minx)*0.05;
	const y_five_pct = (maxy-miny)*0.05;
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("version", "1.2");
	svg.setAttribute("baseProfile", "tiny");
	svg.setAttribute("width", "100%");
	svg.setAttribute("height", "100%");
	svg.setAttribute("viewBox", "" + (minx-x_five_pct) + " " + (miny-y_five_pct) + " " + (maxx-minx)*1.1 + " " + (maxy-miny)*1.1);
	//svg.setAttribute("viewBox", "50 50 80 80");
	var style = document.createElementNS("http://www.w3.org/2000/svg", "style");
	svg.appendChild(style);
	container_div.appendChild(svg);
	return svg;
}

// Get the svg
function find_svg(div_id) {
	var container_div = document.getElementById(div_id);
	return container_div.querySelector('svg');
}

// Find a reference to the svg's stylesheet
function svg_find_stylesheet(svg) {
	return(svg.getElementsByTagName('style')[0]);
}

// Get the svg's width.  The issue here is that on Firefox the
// svg's offsetWidth is undefined, so I need to instead get the
// parent's offsetWidth.
function svg_width(svg) {
	return svg.offsetWidth || svg.parentNode.offsetWidth;
}

// Get the height of the svg.
function svg_height(svg) {
	return svg.offsetHeight || svg.parentNode.offsetHeight;
}

function get_zip_centers_bounding_box(zip_centers) {
	var latmin=91.0, latmax=-1.0, lngmin=181.0, lngmax=-181.0;
	for (var arr of zip_centers) {
		const lat = arr[1];
		const lng = arr[2];
		latmin = Math.min(latmin, lat);
		latmax = Math.max(latmax, lat);
		lngmin = Math.min(lngmin, lng);
		lngmax = Math.max(lngmax, lng);
	}
	return {latmin: latmin, latmax: latmax, lngmin: lngmin, lngmax: lngmax};
}

function get_zip_range(zip_centers) {
	var zipmin=100000, zipmax=0;
	for (var arr of zip_centers) {
		const zip = parseInt(arr[0]);
		zipmin = Math.min(zipmin, zip);
		zipmax = Math.max(zipmax, zip);
	}
	return {zipmin: zipmin, zipmax: zipmax};
}

// This function will add an onload handler to the body.  It's fine to
// add a bunch of handlers, this keeps track of all of them.
function add_body_onload(func) {
	var old_body_onload=window.onload;
	window.onload=function() {
	if (old_body_onload) { old_body_onload(); }
		func();
	}
}

// Get query parameters from the url.  This returns an object like this:
// ?param            => args['param']=true
// ?param=value      => args['param']=value
// ?param[]=value    => args['param']=[value,...]
function get_args() {
	var args = new Object();

	var query_string=location.search.slice(1);
	if (!query_string) return args;
	var query_pairs = query_string.split('&');

	var pname, pvalue;

	for (var i=0 ; i<query_pairs.length ; i++) {
		var equal_position=query_pairs[i].indexOf('=');
		if (equal_position<0) {
			args[my_uri_decoder(query_pairs[i])]=true;
		} else {
			pname=my_uri_decoder(query_pairs[i].slice(0,equal_position));
			pvalue=my_uri_decoder(query_pairs[i].slice(equal_position+1));
			// If a name is followed by [], then we'll create an array of
			// values.  This is good for a multiple-select box
			if (pname.match(/\[\]$/)) {
				pname=pname.slice(0,-2);
				if (!args[pname]) args[pname]=new Array();
				args[pname].push(pvalue);
			} else {
				args[pname]=pvalue;
			}
		}
	}
	return args;
}

function my_uri_decoder(v) {
	return decodeURIComponent(v.replace(/\+/g,'%20'));
}

function zip_to_color(zip, zip_range) {
	return zip_to_color_hsl(zip, zip_range);
}

function zip_to_color_black(zip, zip_range) {
	return "black";
}

function zip_to_color_intensity(zip, zip_range) {
	var intensity = (zip-zip_range.zipmin) / (zip_range.zipmax-zip_range.zipmin);
	intensity = Math.floor(intensity*255);
	intensity_str = intensity.toString(16);
	if (intensity_str.length==1) intensity_str = '0' + intensity_str;
	return "#" + intensity_str + intensity_str + intensity_str;
}

// hue is first three digits
// saturation is last two digits * 2.55
function zip_to_color_hsl(zip, zip_range) {
	var hue = Math.floor(zip/100.0);
	var sat = Math.floor((zip%100)*2.55);
	return "hsl(" + hue + ", " + sat + "%, 50%)";
}

// hue is first four digits normalized to 0-360
// saturation is based on last digit
function zip_to_color_hsl_2(zip, zip_range) {
	var hue = Math.floor(zip/10.0)*360.0/10000.0;
	var sat = 100 - (zip%10) * 4;
	//var sat = Math.floor((zip%100)*2.55);
	return "hsl(" + hue + ", " + sat + "%, 50%)";
}

// https://gist.github.com/blaurt/b0ca054a7384ebfbea2d5fce69ae9bf4#file-latlontooffsets-js
/**
 * @param {number} latitude in degrees
 * @param {number} longitude in degrees
 * @param {number} mapWidth in pixels
 * @param {number} mapHeight in pixels
 */
function latLonToOffsets(latitude, longitude, mapWidth, mapHeight) {
  const FE = 180; // false easting
  const radius = mapWidth / (2 * Math.PI);

  const latRad = degreesToRadians(latitude);
  const lonRad = degreesToRadians(longitude + FE);

  const x = lonRad * radius;

  const yFromEquator = radius * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = mapHeight / 2 - yFromEquator;

  return { x, y };
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function draw_zip_points(svg, zip_centers, bounding_box, zip_range) {
	for (var arr of zip_centers) {
		const zip = arr[0];
		const lat = arr[1];
		const lng = arr[2];
		const color = zip_to_color(parseInt(zip), zip_range);
		var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		var xy = latLonToOffsets(lat, lng, 100, 100);
		c.setAttribute("cx", xy.x);
		c.setAttribute("cy", xy.y);
		c.setAttribute("r", .01);
		c.setAttribute("stroke", color);
		c.setAttribute("fill", color);
		c.setAttribute("stroke-width", ".01");
		c.setAttribute("class", "point");
		svg.appendChild(c);
	}
}

// us_states is a geojson structure.  States are either "Polygon" or
// "MultiPolygon".
function draw_states(svg, us_states) {
	function draw_state_poly(svg, name, points) {
		name = name.replaceAll(/[^A-Za-z]/g, '_').toLocaleLowerCase();
		var poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
		poly.setAttribute("points", points.map(function(pair) { var xy = latLonToOffsets(pair[1], pair[0], 100, 100); return [xy.x,xy.y].join(','); }).join(' '));
		poly.classList.add('state');
		poly.classList.add(name);
		svg.appendChild(poly);
	}

	for (const state_info of us_states['features']) {
		const properties = state_info['properties'];
		if (properties['NAME'] != 'Alaska' && properties['NAME'] != 'Hawaii') {
			const geometry = state_info['geometry'];
			if (geometry['type'] == 'MultiPolygon') {
				for (const points of geometry['coordinates']) {
					draw_state_poly(svg, properties['NAME'], points[0]);
				}
			} else if (geometry['type'] == 'Polygon') {
				draw_state_poly(svg, properties['NAME'], geometry['coordinates'][0]);
			} else {
				// ack
			}
		}
	}
}

function init() {
	var args=get_args();
	const bounding_box = get_zip_centers_bounding_box(zip_centers);
	const zip_range = get_zip_range(zip_centers);

	const minxy = latLonToOffsets(bounding_box.latmax, bounding_box.lngmin, 100, 100);
	const maxxy = latLonToOffsets(bounding_box.latmin, bounding_box.lngmax, 100, 100);

	console.log(bounding_box);
	console.log(minxy, maxxy);

	const svg_container = document.getElementById('svg-container');
	var svg = create_svg_element(svg_container, minxy.x, maxxy.x, minxy.y, maxxy.y)

	draw_states(svg, us_states);
	draw_zip_points(svg, zip_centers, bounding_box, zip_range);
}

add_body_onload(init);
