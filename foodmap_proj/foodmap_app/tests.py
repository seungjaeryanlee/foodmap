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
        Tests that the index page loads with database contents.
        '''
        response = self.client.get(reverse('foodmap_app:index'))
        locations = Location.objects.all()
        for location in locations:
            self.assertContains(response.content, str(location))
        offerings = Offering.objects.all()
        for offering in offerings:
            self.assertContains(response.content, str(offering))


class LocationsViewTests(TestCase):
    '''
    Tests for retrieving all locations in JSON.
    '''

    def test_locations_valid(self):
        '''
        Requests all locations when there are some locaions in the database,
        and checks that we get back correctly formatted JSON.
        '''
        # Make two locations
        locations = [
            create_location(name='Frist Campus Center'),
            create_location(name='Computer Science Building')
        ]
        for location in locations:
            location.save()

        # Make the request
        response = self.client.get(reverse('foodmap_app:locations'))
        try:
            parsed_response = json.loads(response.content)  # array of JSON objects, as specified in views.py
        except:
            self.fail('JSON response could not be parsed')

        # Verify response is correct
        test_locations = parsed_response
        self.assertEqual(len(test_locations), len(locations))  # has correct number of locations
        for i in range(0, len(locations)):
            self.assertEqual(sorted(test_locations[i].keys()), ['lat', 'lng', 'name'])  # has correct attributes

            # Has correct contents in each attribute
            self.assertEqual(test_locations[i]['name'], locations[i].name)
            self.assertEqual(float(test_locations[i]['lat']), locations[i].lat)
            self.assertEqual(float(test_locations[i]['lng']), locations[i].lng)


    def test_locations_with_empty_database(self):
        '''
        Requets all locations when there are none in the database, and checks
        that we get back an empty array.
        '''
        response = self.client.get(reverse('foodmap_app:locations'))
        try:
            parsed_response = json.loads(response.content)
        except:
            self.fail('JSON response could not be parsed')

        # Verify response is correct
        self.assertEqual(parsed_response, [])


class OfferingsViewTests(TestCase):
    '''
    Tests for retrieving the offering for a particular location in JSON.
    '''

    def test_offerings_for_valid_location(self):
        '''
        Requests the offering for a location that is in the database, and checks
        that we get back correctly formatted JSON. Should only return the
        offering with the most recent timestamp, if there are more than one
        offering.
        '''
        pass

    def test_offerings_for_nonexistent_location(self):
        '''
        Requests the offering for a location that is *not* in the database,
        and checks that we get back an empty JSON object.
        '''
        pass

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
