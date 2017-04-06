#-------------------------------------------------------------------------------
# scrape_locations.py
# Author: Michael Friedman
#
# Scrapes the mobile Princeton map website (m.princeton.edu/map) for the GPS
# coordinates of every building on campus. Saves the contents in JSON format
# in the file locations.json. Along the way, it may have to retry some
# locations; these instances are logged in scrape_database_log.txt (mostly)
# for debugging purposes).
#
# NOTE: This requires getting data for about 900 locations on campus. It
# will therefore take a substantial amount of time to run (est. 45-60 mins).
#-------------------------------------------------------------------------------

import json
import os
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from time import sleep

min_location_index = 0
max_location_index = 897
driver = webdriver.PhantomJS()

# Initialize output file locations.json to be empty
open('locations.json', 'w').close()

# Get lat/lng coordinates for each location from m.princeton.edu's map
print 'Getting locations...'
locations = []  # will hold a list of "JSON objects", which hold name and lat/lng coordinates for each location
c = 0           # index of intermediary file
retry = False   # used to determine whether a location failed and must be retried
for i in range (min_location_index, max_location_index+1):
    if retry:
        i -= 1 # try the previous location again

    driver.get('http://m.princeton.edu/map/detail?feed=91eda3cbe8&group=princeton&featureindex=' + str(i) + '&category=91eda3cbe8%3AALL&_b=%5B%7B%22t%22%3A%22Map%22%2C%22lt%22%3A%22Map%22%2C%22p%22%3A%22index%22%2C%22a%22%3A%22%22%7D%5D#')

    try:
        # Extract location name
        location = driver.find_element_by_css_selector('h2.nonfocal').text

        # Go to "Directions" tab
        directions_tab = driver.find_element_by_link_text('Directions')
        directions_tab.click()

        # Extract lat/lng coordinates from "View in Google Maps" button
        # Link is of the form:
        # http://maps.google.com? ... &q=loc:LAT,LNG+ ...
        button = driver.find_element_by_link_text('View in Google Maps')
        link = button.get_attribute('href')
        lat_str = link[link.index('q=loc:')+len('q=loc:'):link.index(',')]
        lng_str = link[link.index(',')+1:link.index('+')]
        lat = float(lat_str)
        lng = float(lng_str)

        # Add entry in dict for this location
        locations.append(
            {'name': location, 'lat': lat_str, 'lng': lng_str}
        )
        print 'Entered: ' + location

        # Output every 10 entries to a file, just in case you have to
        # interrupt in the middle, so you don't lose all the entries without
        # writing any of them
        if len(locations) == 10:
            file = open('locations%d.json' % c, 'w')
            file.write(json.dumps(locations))
            file.close()
            locations = []
            c += 1

        retry = False
    except NoSuchElementException as e:
        # If a location fails to load, it's probably because the server
        # has started rejecting our requests. Note this in a log file, reset
        # the web driver, and try to continue in 30 secs
        log = open('scrape_locations_log.txt', 'a')
        log.write('Failed at index %d: %s' % (i, str(e)))
        log.close()

        driver.quit()
        sleep(30)
        driver = webdriver.PhantomJS()
        retry = True


driver.quit()

# Write any remaining locations to a file
if len(locations) > 0:
    file = open('locations%d.json' % c, 'w')
    file.write(json.dumps(locations))
    file.close()
    c += 1

# Combine intermediary files into locations.json
all_locations = []
for i in range(0, c):
    file = open('locations%d.json' % i, 'r')
    locations = json.loads(file.read())
    for location in locations:
        all_locations.append(location)
    file.close()
file = open('locations.json', 'w')
file.write(json.dumps(all_locations))
file.close()

# Remove intermediary files
for i in range(0, c):
    os.remove('locations%d.json' % i)

print 'Done!'
