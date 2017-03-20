import datetime
import os
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from foodmap_proj.settings import MEDIA_ROOT
from .models import Location, Offering

# Create your tests here.

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

#-------------------------------------------------------------------------------

### Database tests

# A test image to store in an Offering
TEST_IMAGE = '100x100.png'

def create_location(name, lat=0.0, lng=0.0):
    '''
    Helper method for tests. Returns a valid Location, but does not place it
    in the table.
    '''
    return Location(name=name, lat=lat, lng=lng)

def create_offering(timestamp=timezone.now(), location=0, title='Fresh pizza!',
    description='We have plain and vegetable pizza!', image=0):
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
        description=description, image=image)


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
