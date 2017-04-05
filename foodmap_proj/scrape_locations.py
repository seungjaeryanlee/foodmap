import json
import os
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException

min_location_index = 0
max_location_index = 897
driver = webdriver.PhantomJS()

# Initialize output file locations.json to be empty
open('locations.json', 'w').close()

# Get lat/lng coordinates for each location from m.princeton.edu's map
print 'Getting locations...'
locations = []  # will hold mapping from location to lat/lng coordinates in JSON format
c = 0  # index of intermediary file
for i in range (min_location_index, max_location_index+1):
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

        # Append to locations.json every 10 entries, just in case something gets
        # interrupted in the middle, so you don't lose all the entries without
        # writing any of them
        if len(locations) == 10:
            file = open('locations%d.json' % c, 'w')
            file.write(json.dumps(locations))
            file.close()
            locations = []
            c += 1
    except NoSuchElementException as e:
        # If a location fails to enter, note it in a log file and continue
        log = open('scrape_locations_log.txt', 'w')
        log.write('Failed at index %d: %s' % (i, str(e)))
        log.close()


driver.quit()

# Put remaining locations in
if len(locations) > 0:
    file = open('locations%d.json' % c, 'w')
    file.write(json.dumps(locations))
    file.close()
    c += 1

# Combine intermediary files
all_locations = []
for i in range(0, c):
    file = open('locations%d.json' % i, 'r')
    locations = json.loads(file.read())
    for location in locations:
        all_locations.append(location)
    file.close()
    os.remove('locations%d.json' % i)
file = open('locations.json', 'w')
file.write(json.dumps(all_locations))
file.close()

print 'Done!'
