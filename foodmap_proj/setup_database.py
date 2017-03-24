#-------------------------------------------------------------------------------
# setup_database.py
# Author: Michael Friedman
# Usage: python setup_database.py [-p sample|real]
#
# Runs the necessary Django commands to intialize/update the project's database.
# You can also rerun it each time the models for the database are updated as a
# shortcut for makemigrations + migrate. Optionally takes the -p argument to
# auto-populate with either sample data or real data.
#
# NOTE: Populating with real data requires scraping GPS coordinates for every
# location at Princeton, so it will take a substantial amount of time.
#-------------------------------------------------------------------------------

# Check usage
import sys
usage = 'usage: python setup_database.py [-p sample|real]'
if len(sys.argv) != 1 and len(sys.argv) != 3:
    print usage
    exit(1)
elif len(sys.argv) == 3 and sys.argv[1] != '-p':
    print usage
    exit(1)
elif len(sys.argv) == 3 and not sys.argv[2] in ['sample', 'real']:
    print usage
    exit(1)

populate = None if len(sys.argv) != 3 else sys.argv[2]

#-------------------------------------------------------------------------------

# Some setup before we can interact with Django
import os
import django
os.environ['DJANGO_SETTINGS_MODULE'] = 'foodmap_proj.settings'
django.setup()

#-------------------------------------------------------------------------------

def populate_locations_table(): # TODO: Update this method according to TODOs after testing
    from selenium import webdriver
    driver = webdriver.PhantomJS()

    # Read in all location names from locations.txt
    locations_file = open('locations.txt', 'r')
    locations = [location.strip() for location in locations_file.readlines()]

    # Get lat/lng coordinates for each location from m.princeton.edu's map
    # for i in range (0, 897 + 1):
    for i in range(0, 5): # TODO: replace this line with the one above it after testing
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
        lat_str = link[link.index('q=loc:')+len('q=loc:'):link.index(',')]
        lng_str = link[link.index(',')+1:link.index('+')]
        lat = float(lat_str[:6])
        lng = float(lng_str[:7])

        # TODO: Insert entry into table
        print >> sys.stderr, '%s\t|\t%s\t|\t%s' % (location, str(lat), str(lng))

    driver.quit()

#-------------------------------------------------------------------------------

def populate_sample_data():
    princeton = Location(name='Princeton University', lat=40.343, lng=-74.653)
    harvard = Location(name='Harvard University', lat=42.377, lng=-71.118)
    yale = Location(name='Yale University', lat=41.316, lng=-72.924)
    for l in [princeton, harvard, yale]:
        l.save()

    offerings = [
        Offering(timestamp=timezone.now(), location=princeton, title='The BEST food',
            description='I mean really, the BEST.'),
        Offering(timestamp=timezone.now(), location=harvard, title='Cold breakfast',
            description='And I mean ONLY cold. No hot food at all. Not even eggs.'),
        Offering(timestamp=timezone.now(), location=yale, title='Decent food',
            description='')
    ]
    for o in offerings:
        o.save()

#-------------------------------------------------------------------------------

### Main script

from django.utils import timezone
from foodmap_app.models import Location, Offering

# Initialize database
print 'Initializing/updating database...'
os.system('python manage.py makemigrations foodmap_app')
os.system('python manage.py migrate')
print 'Done!'

# Handle -p arg
if populate:
    print '\nPopulating database...'
    if populate == 'sample':
        populate_sample_data()
    else:
        populate_locations_table()
    print 'Done!'
