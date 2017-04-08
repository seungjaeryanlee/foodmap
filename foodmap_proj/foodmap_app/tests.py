import datetime
import json
import os
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from foodmap_proj.settings import MEDIA_ROOT
from .models import Location, Offering

# Create your tests here.

# A test image to store in an Offering
TEST_IMAGE = '100x100.png'

def create_location(name, lat=0.0, lng=0.0):
    '''
    Helper method for tests. Returns a valid Location, but does not place it
    in the table.
    '''
    return Location(name=name, lat=lat, lng=lng)

def create_offering(timestamp=timezone.now(), location=0, title='Fresh pizza!',
    description='We have plain and vegetable pizza!', image=0, thread_id='1234567890123456'):
    '''
    Helper method for tests. Returns a valid Offering, but does not place it
    in the table.
    '''
    # Set default values too long to write in the declaration line
    if location == 0:
        location = create_location('Princeton University')
        location.save()
    if image == 0:
        image = SimpleUploadedFile(
            name=TEST_IMAGE,
            content=open(os.path.join(os.path.dirname(__file__), TEST_IMAGE), 'rb').read(),
            content_type='image/png'
        )
    return Offering(timestamp=timestamp, location=location, title=title,
        description=description, image=image, thread_id=thread_id)

#-------------------------------------------------------------------------------

### View tests

class IndexViewTests(TestCase):
    '''
    Tests for the index (landing) page.
    '''

    def test_index_page_loads_database_contents(self):
        '''
        Tests that the index page loads with the map.
        '''
        response = self.client.get(reverse('foodmap_app:index'))
        # TODO: Check that the map loaded properly


class OfferingsViewTests(TestCase):
    '''
    Tests for retrieving all of the most recent offerings in JSON.
    '''

    def test_offerings_valid(self):
        '''
        Requests all of the most recent offerings (from each location with
        an offering), and checks that we get back correctly formatted JSON.
        '''
        # Make two locations
        locations = [
            create_location(name='Frist Campus Center'),
            create_location(name='Computer Science Building')
        ]
        for location in locations:
            location.save()

        # Make two offerings with different timestamps for each location
        offerings_now = [
            create_offering(
                timestamp=timezone.now() - datetime.timedelta(minutes=30),
                location=locations[i],
                thread_id='%16d' % i      # thread_id must be unique
            ) for i in range(0, len(locations))
        ]
        for offering in offerings_now:
            offering.save()

        offerings_before = [
            create_offering(
                timestamp=offering.timestamp - datetime.timedelta(days=1),
                location=offering.location,
                thread_id='%16s' % (100 - int(offering.thread_id))  # thread_id must be unique
            ) for offering in offerings_now
        ]
        for offering in offerings_before:
            offering.save()

        # Make the request
        response = self.client.get(reverse('foodmap_app:offerings'))
        try:
            parsed_response = json.loads(response.content)  # array of JSON objects, as specified in views.py
        except:
            self.fail('JSON response could not be parsed')

        # Verify the response is correct
        test_offerings = parsed_response
        actual_offerings = offerings_now
        self.assertEqual(len(test_offerings), len(actual_offerings))  # has correct number of offerings

        # Sort test and actual offerings so they can be compared side-by-side
        for i in range(0, len(test_offerings)):
            self.assertIn('location', test_offerings[i].keys())
            self.assertIn('name', test_offerings[i]['location'].keys())
        test_offerings = sorted(test_offerings, cmp=lambda x, y: cmp(x['location']['name'], y['location']['name']))
        actual_offerings = sorted(actual_offerings, cmp=lambda x, y: cmp(x.location.name, y.location.name))

        # Compare test offerings vs actual offerings
        for i in range(0, len(actual_offerings)):
            # Has correct attributes
            self.assertEqual(sorted(test_offerings[i].keys()), ['description', 'location', 'minutes', 'title'])

            # Has correct title and description
            self.assertEqual(test_offerings[i]['title'], actual_offerings[i].title)
            self.assertEqual(test_offerings[i]['description'], actual_offerings[i].description)

            # Has correct minutes
            approx_seconds = (timezone.now() - actual_offerings[i].timestamp).seconds
            test_seconds = test_offerings[i]['minutes'] * 60
            self.assertAlmostEqual(test_seconds, approx_seconds, delta=5)  # seconds should be within a small delta

            # Has correct location
            test_location = test_offerings[i]['location']
            actual_location = actual_offerings[i].location
            self.assertEqual(sorted(test_location.keys()), ['lat', 'lng', 'name']) # has correct attributes
            self.assertEqual(test_location['name'], actual_location.name)
            self.assertEqual(float(test_location['lat']), actual_location.lat)
            self.assertEqual(float(test_location['lng']), actual_location.lng)

        # Clean up database
        for offering in offerings_now:
            offering.delete()
        for offering in offerings_before:
            offering.delete()


    def test_offerings_with_empty_database(self):
        '''
        Requests all of the most recent offerings when there are no offerings
        to show. Checks that we get back an empty JSON object.
        '''
        response = self.client.get(reverse('foodmap_app:offerings'))
        try:
            parsed_response = json.loads(response.content)
        except:
            self.fail('JSON response could not be parsed')

        # Verify that response is correct
        self.assertEqual(parsed_response, {})

#-------------------------------------------------------------------------------

### Database tests

class OfferingsTableTests(TestCase):
    '''
    Tests that we can put/get things into/from the Offerings table, and that
    it only accepts valid entries.
    '''

    def test_offerings_table_insert_with_valid_entry(self):
        '''
        Inserts an entry into the table, gets it out, and checks that its
        attributes are correct.
        '''
        offering = create_offering()
        offering.save()

        test_offering = Offering.objects.order_by('-pk')[0]
        self.assertEqual(test_offering, offering)

        # Test that the image is in the right directory
        correct_path = 'offerings/' + TEST_IMAGE
        self.assertEqual(test_offering.image.url, correct_path)
        test_offering.delete()

    def test_offerings_table_insert_with_timestamp_in_the_future(self):
        '''
        Inserts an entry with a timestamp in the future, and checks that it
        fails to insert.
        '''
        offering = create_offering(timestamp=timezone.now() + datetime.timedelta(days=10))
        self.assertRaises(ValueError, offering.save)

    def test_offerings_table_insert_with_nonexistent_location(self):
        '''
        Inserts an entry with a location that does not exist in the Locations
        table, and checks that it fails to insert.
        '''
        offering = create_offering(location=create_location('White House'))
        self.assertRaises(ValueError, offering.save)

    def test_offerings_table_insert_with_thread_id_too_short(self):
        '''
        Inserts an entry with a thread_id of length less than 16 chars, and
        checks that it fails to insert.
        '''
        offering = create_offering(thread_id='123456789012345')
        self.assertRaises(ValueError, offering.save)

    def test_offerings_table_insert_with_no_timestamp(self):
        '''
        Inserts an entry with an empty timestamp into the table, and checks
        that it fails to insert.
        '''
        offering = create_offering(timestamp=None)
        self.assertRaises(IntegrityError, offering.save)

    def test_offerings_table_insert_with_no_location(self):
        '''
        Inserts an entry with an empty location into the table, and checks
        that it fails to insert.
        '''
        offering = create_offering(location=None)
        self.assertRaises(IntegrityError, offering.save)

    def test_offerings_table_insert_with_no_title(self):
        '''
        Inserts an entry with an empty title into the table, and checks
        that it fails to insert.
        '''
        offering = create_offering(title=None)
        self.assertRaises(IntegrityError, offering.save)

    def test_offerings_table_insert_with_no_description(self):
        '''
        Inserts an entry with a description of None into the table, and checks
        that it fails to insert.
        '''
        offering = create_offering(description=None)
        self.assertRaises(IntegrityError, offering.save)

    def test_offerings_table_insert_with_no_image(self):
        '''
        Inserts an entry with a image of None into the table, and checks
        that it SUCCESSFULLY inserts -- images are allowed to be NULL.
        '''
        offering = create_offering(image=None)
        offering.save()

        test_offering = Offering.objects.order_by('-pk')[0]
        self.assertEqual(test_offering, offering)
        test_offering.delete()

    def test_offerings_table_insert_with_no_thread_id(self):
        '''
        Inserts an entry with a thread_id of None into the table, and checks
        that it SUCCESSFULLY inserts -- not every offering will originate from
        and email, so thread IDs are allowed to be NULL.
        '''
        offering = create_offering(thread_id=None)
        offering.save()

        test_offering = Offering.objects.order_by('-pk')[0]
        self.assertEqual(test_offering, offering)
        test_offering.delete()

    def test_offerings_table_delete_image(self):
        '''
        Inserts an entry with an image into the table, manually deletes the
        image, and checks that the image file has actually been deleted
        from MEDIA_ROOT.
        '''
        put_offering = create_offering()
        put_offering.save()
        self.assertEqual(
            put_offering.image.path,
            os.path.join(MEDIA_ROOT, 'offerings', TEST_IMAGE)
        )

        get_offering = Offering.objects.order_by('-pk')[0]
        get_offering.delete()
        self.assertNotIn(
            TEST_IMAGE,
            os.listdir(os.path.join(MEDIA_ROOT, 'offerings'))
        )

    def test_offerings_table_unique_thread_id(self):
        '''
        Inserts two entries with the same thread_id into the table, and
        checks that the second one fails to insert.
        '''
        thread_id = '1234567890123456'

        location1 = create_location('Princeton University')
        location1.save()
        offering1 = create_offering(location=location1, thread_id=thread_id)
        offering1.save()

        location2 = create_location('Harvard University')
        location2.save()
        with transaction.atomic():
            offering2 = create_offering(location=location2, thread_id=thread_id)
            self.assertRaises(IntegrityError, offering2.save)
        offering1.delete()


class LocationsTableTests(TestCase):
    '''
    Tests that we can put/get things into/from the Locations table, and that
    it only accepts valid entries.
    '''

    def test_locations_table_insert_with_valid_entry(self):
        '''
        Inserts an entry into the table, gets it out, and checks that its
        attributes are correct.
        '''
        location = create_location('White House')
        location.save()

        test_location = Location.objects.order_by('-pk')[0]
        self.assertEqual(test_location, location)

    def test_locations_table_insert_with_no_name(self):
        '''
        Inserts an entry with an empty name into the table, and checks that
        it fails to insert.
        '''
        location = create_location(None)
        self.assertRaises(IntegrityError, location.save)

    def test_locations_table_insert_with_no_latitude(self):
        '''
        Inserts an entry with an empty latitude into the table, and checks that
        it fails to insert.
        '''
        location = create_location('White House', lat=None)
        self.assertRaises(IntegrityError, location.save)

    def test_locations_table_insert_with_no_longitude(self):
        '''
        Inserts an entry with an empty longitude into the table, and checks that
        it fails to insert.
        '''
        location = create_location('White House', lng=None)
        self.assertRaises(IntegrityError, location.save)

    def test_locations_table_unique_names(self):
        '''
        Inserts two entries with the same name into the table, and checks that
        the second one fails to insert.
        '''
        location1 = Location(name='White House', lat=0.0, lng=0.0)
        location1.save()

        location2 = Location(name='White House', lat=90.0, lng=180.0)
        self.assertRaises(IntegrityError, location2.save)
