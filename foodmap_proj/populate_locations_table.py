#-------------------------------------------------------------------------------
# populate_locations_table.py
# Author: Michael Friedman
#
# Inserts all locations in the locations.txt file into the Locations table of
# the database, with their latitude/longitude coordinates.
#
# See Selenium documentation for details on usage:
# http://selenium-python.readthedocs.io/
#-------------------------------------------------------------------------------

# Some setup before we can interact with Django
import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'foodmap_proj.settings'
django.setup()

#-------------------------------------------------------------------------------

# Script
from foodmap_app.models import Location
from selenium import webdriver

driver = webdriver.Chrome() # TODO: Chrome web driver must be in PATH for this to work

# Read in all location names from locations.txt
locations_file = open('locations.txt', 'r')
locations = [location.strip() for location in locations_file.readlines()]

# Get lat/lng coordinates for each location from m.princeton.edu's map
# for i in range (0, 897 + 1):
for i in range(0, 20): # TODO: replace this line with the one above it after testing
    driver.get('http://m.princeton.edu/map/detail?feed=91eda3cbe8&group=princeton&featureindex=' + str(i) + '&category=91eda3cbe8%3AALL&_b=%5B%7B%22t%22%3A%22Map%22%2C%22lt%22%3A%22Map%22%2C%22p%22%3A%22index%22%2C%22a%22%3A%22%22%7D%5D#')

    # Skip this page if the location is not one that we want
    location = driver.find_element_by_css_selector('h2.nonfocal').text.lower()
    # if not location in locations: # TODO: uncomment this after testing
    #     continue

    # Go to "Directions" tab
    directions_tab = driver.find_element_by_link_text('Directions')
    directions_tab.click()

    # Extract lat/lng coordinates from "View in Google Maps" button
    # Link is of the form:
    # http://maps.google.com? ... &q=loc:LAT,LNG+ ...
    button = driver.find_element_by_link_text('View in Google Maps')
    link = button.get_attribute('href')
    end = link.split('q=loc:')[1]
    lat_str = end.split(',')[0]
    lng_str = end.split(',')[1].split('+')[0]

    # Format lat/lng coordinates
    lat = float(lat_str[:6])
    lng = float(lng_str[:7])

    # TODO: Insert entry into table
    print '%s\t|\t%s\t|\t%s' % (location, str(lat), str(lng))

driver.quit()
