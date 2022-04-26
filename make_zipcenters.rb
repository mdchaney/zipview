#!/usr/bin/env ruby

require 'shapelib'
require 'json'

spfile = Shapelib::ShapeFile.open('tl_2019_us_zcta510.shp')

outarr = []

# This will only put zips for contiguous 48 states
# northernmost point is angle inlet: 49.384511N
# southernmost point is key west: 24.544046N
# westernmost point is cape alava, wa: -124.772882
# easternmost point is quoddy head, me: -66.942024
while item=spfile.read
  lat = item['INTPTLAT10'].to_f
  lng = item['INTPTLON10'].to_f
  if lat >= 24.544046 && lat <= 49.384511 && lng >= -124.772882 && lng <= -66.942024
    outarr.push([item['GEOID10'], lat, lng])
  end
end

puts "const zip_centers=" + outarr.to_json
