import datetime
import json
import os
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from foodmap_proj.settings.common import MEDIA_ROOT
from foodmap_app import scraper
from foodmap_app.forms import OfferingForm
from foodmap_app.models import Location, Offering, OfferingTag
from unittest import skipIf

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

def create_offering_tag(offering=0, tag='kosher'):
    '''
    Helper method for tests. Returns a valid OfferingTag, but does not place it
    in the table.
    '''
    # Set default values
    if offering == 0:
        offering = create_offering()
        offering.save()
    return OfferingTag(offering=offering, tag=tag)

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

    def setUp(self):
        '''
        Create two sample locations and two sample offerings for use during
        each test.
        '''
        # Make two locations
        self.locationA = create_location(name='Frist Campus Center')
        self.locationB = create_location(name='Computer Science Building')
        locations = [self.locationA, self.locationB]
        for location in locations:
            location.save()

        # Make two offerings per location with different timestamps. (Any of the
        # attributes can be changed for the specific purposes of the tests, but
        # remember to call save() after changing any attributes.)
        now = timezone.now()
        self.offering1A, self.offering1B = [
            create_offering(
                timestamp=now,
                location=location,
                thread_id='%16d' % locations.index(location)  # thread_id must be unique
            ) for location in locations
        ]

        before = now - datetime.timedelta(minutes=30)
        self.offering2A, self.offering2B = [
            create_offering(
                timestamp=before,
                location=location,
                thread_id='x%15d' % locations.index(location)  # thread_id must be unique
            ) for location in locations
        ]

        offerings = [self.offering1A, self.offering1B, self.offering2A, self.offering2B]
        for offering in offerings:
            offering.save()

    def tearDown(self):
        '''
        Delete the entries made during set-up.
        '''
        offerings = [self.offering1A, self.offering1B, self.offering2A, self.offering2B]
        for offering in offerings:
            offering.delete()

        locations = [self.locationA, self.locationB]
        for location in locations:
            location.delete()


    def test_offerings_valid(self):
        '''
        Requests all of the most recent offerings (from each location with
        an offering), and checks that we get back correctly formatted JSON.
        '''
        # Make the request
        response = self.client.get(reverse('foodmap_app:offerings'))
        try:
            parsed_response = json.loads(response.content)  # array of JSON objects, as specified in views.py
        except:
            self.fail('JSON response could not be parsed')

        # Verify the response is correct
        test_offerings = parsed_response
        actual_offerings = [self.offering1A, self.offering1B]  # only most recent offerings should be returned
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
            self.assertEqual(sorted(test_offerings[i].keys()), ['description', 'location', 'minutes', 'tags', 'title'])

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

            # Has correct tags (none)
            self.assertEqual(test_offerings[i]['tags'], '')


    def test_offerings_with_tags(self):
        '''
        Requests the most recent offerings, where the offerings have tags,
        and checks that the response has all of those tags in a comma-separated
        list. (Assumes the rest of the response is correct, as this is
        validated by another test.)
        '''
        # Add tags to each offering
        actual_tags = ['kosher', 'gluten-free', 'peanut-free']
        actual_offerings = [self.offering1A, self.offering1B]
        for offering in actual_offerings:
            for tag in actual_tags:
                create_offering_tag(offering=offering, tag=tag).save()

        # Make request
        response = self.client.get(reverse('foodmap_app:offerings'))
        try:
            parsed_response = json.loads(response.content)  # array of JSON objects, as specified in views.py
        except:
            self.fail('JSON response could not be parsed')

        # Verify that response has exactly the same tags
        test_offerings = parsed_response
        test_offerings = sorted(test_offerings, cmp=lambda x, y: cmp(x['location']['name'], y['location']['name']))
        actual_offerings = sorted(actual_offerings, cmp=lambda x, y: cmp(x.location.name, y.location.name))
        for i in range(0, len(actual_offerings)):
            test_tags = sorted(test_offerings[i]['tags'].split(','))
            actual_tags = sorted(actual_tags)
            self.assertEqual(test_tags, actual_tags)


    def test_offerings_timestamp_constraints(self):
        '''
        Requests the most recent offerings and checks that they meet the
        time constraints we impose: (1) no offering is older than 2 hours;
        (2) no more than 1 offering per location.
        '''
        # Set timestamps of the offerings to just before and just after
        # 2-hour mark
        offerings_good = [self.offering1A, self.offering1B]
        offerings_bad  = [self.offering2A, self.offering2B]

        now = timezone.now()
        for offering in offerings_good:
            offering.timestamp = now - datetime.timedelta(minutes=118) # under 2 hours
            offering.save()
        for offering in offerings_bad:
            offering.timestamp = now - datetime.timedelta(minutes=121) # over 2 hours
            offering.save()

        # Make the request
        response = self.client.get(reverse('foodmap_app:offerings'))
        test_offerings = json.loads(response.content)  # array of JSON objects, as specified in views.py

        # Check that no offering is older than 2 hours (approximately)
        epsilon = 2  # some leeway in the timestamp to account for delay between request and response
        for offering in test_offerings:
            self.assertTrue(offering['minutes'] < 120 + epsilon)

        # Check that no location has more than 1 offering
        locations_with_offerings = []
        for offering in test_offerings:
            self.assertNotIn(offering['location'], locations_with_offerings)
            locations_with_offerings.append(offering['location'])


    def test_offerings_with_empty_database(self):
        '''
        Requests all of the most recent offerings when there are no offerings
        to show. Checks that we get back an empty JSON object.
        '''
        # Clear entries from database
        self.tearDown()

        # Make request
        response = self.client.get(reverse('foodmap_app:offerings'))
        try:
            parsed_response = json.loads(response.content)
        except:
            self.fail('JSON response could not be parsed')

        # Verify that response is correct
        self.assertEqual(parsed_response, [])

        # Restore setup so that when tearDown() is called, we don't get errors
        self.setUp()

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


class OfferingTagsTableTests(TestCase):
    '''
    Tests that we can put/get things into/from the Offering Tags table, and that
    it only accepts valid entries.
    '''

    @classmethod
    def setUpClass(self):
        '''
        Create an offering to use during tests
        '''
        self.location = create_location(name='White House')
        self.location.save()
        self.offering = create_offering(location=self.location)
        self.offering.save()

    @classmethod
    def tearDownClass(self):
        '''
        Delete the set-up entries
        '''
        self.offering.delete()
        self.location.delete()

    def test_offering_tags_table_insert_with_valid_entry(self):
        '''
        Inserts a valid entry and checks that its contents are correct.
        '''
        # Insert a test offering tag
        offering_tag = create_offering_tag(offering=self.offering)
        offering_tag.save()

        # Get entry back and check its content
        test_offering_tag = OfferingTag.objects.order_by('-id')[0]
        self.assertEqual(test_offering_tag.offering, offering_tag.offering)
        self.assertEqual(test_offering_tag.tag, offering_tag.tag)

    def test_offering_tags_table_insert_with_nonexistent_offering(self):
        '''
        Inserts an entry with an offering id value that does not exist in the
        Offerings table. Checks that it fails to insert.
        '''
        offering = create_offering(location=self.location, image=None, thread_id='abcdefghijklmnopq')
        offering_tag = create_offering_tag(offering=offering) # offering not saved
        self.assertRaises(ValueError, offering_tag.save)

    def test_offering_tags_table_insert_with_nonaccepted_tag(self):
        '''
        Inserts an entry with a tag value that is not one of the accepted
        values. Checks that it fails to insert.
        '''
        offering_tag = create_offering_tag(offering=self.offering, tag='THIS IS NOT ACCEPTED')
        self.assertRaises(ValueError, offering_tag.save)

    def test_offering_tags_table_insert_with_no_offering(self):
        '''
        Inserts an entry with an empty offering value. Checks that it fails to
        insert.
        '''
        offering_tag = create_offering_tag(offering=None)
        self.assertRaises(IntegrityError, offering_tag.save)

    def test_offering_tags_table_insert_with_no_tag(self):
        '''
        Inserts an entry with an empty tag value. Checks that it fails to
        insert.
        '''
        offering_tag = create_offering_tag(offering=self.offering, tag=None)
        self.assertRaises(IntegrityError, offering_tag.save)


#-------------------------------------------------------------------------------

### Scraper interface tests

class ScraperInterfaceTests(TestCase):
    '''
    Tests to make sure the scraper interface module works properly.
    '''

    @skipIf(True, 'Scraper interface module not yet implemented')
    def test_scraper_interface_get_food_from_text(self):
        '''
        Test that the get_food() method of the scraper interface gets all foods
        in a given text and returns them in comma-separated format.
        '''
        text1 = 'Eat bagels here.'
        foods1 = 'Bagels'
        test_foods1 = scraper.get_food(text1)
        self.assertEqual(test_foods1, text1)

        text2 = 'Come get some pizza and pasta at Frist!'
        foods2 = 'Pizza, pasta'
        test_foods2 = scraper.get_food(text2)
        self.assertEqual(test_foods2, foods2)

        text3 = 'Pizza and pasta at Frist! Also we have bagels, cream cheese, and butter with orange juice. Don\'t miss out!'
        foods3 = 'Pizza, pasta, bagels, cream cheese, butter, orange juice'
        test_foods3 = scraper.get_food(text3)
        self.assertEqual(test_foods3, foods3)

#-------------------------------------------------------------------------------

### Form tests

class OfferingFormTests(TestCase):
    '''
    Tests for the form for entering Offerings
    '''

    def tearDown(self):
        '''
        Clean out the database after each test.
        '''
        for offering in Offering.objects.all():
            offering.delete()
        for location in Location.objects.all():
            location.delete()

    def test_offering_form_create_form_with_valid_entry(self):
        '''
        Create a form with valid entries and check that the form is in fact
        determined valid.
        '''
        now = timezone.now()
        location = create_location(name='Frist Campus Center')
        location.save()
        description = 'Come get some pizza and pasta at Frist!'
        data = {'timestamp': now, 'location': [location], 'description': description}
        form = OfferingForm(data)

        self.assertTrue(form.is_valid(), 'Invalid form: ' + str(form.errors.as_json))

    def test_offering_form_submit_valid_entry(self):
        '''
        Create a form with a valid entry and attempt to save its info to the
        database. Check that the database contains the correct info.
        '''
        # Create form
        now = timezone.now()
        location = create_location(name='Frist Campus Center')
        location.save()
        description = 'Come get some pizza and pasta at Frist!'
        title = scraper.get_food(description)
        data = {'timestamp': now, 'location': [location], 'description': description}
        form = OfferingForm(data)
        self.assertTrue(form.is_valid(), 'Invalid form: ' + str(form.errors.as_json))

        # Save data
        Offering(
            timestamp=form.cleaned_data['timestamp'],
            location=form.cleaned_data['location'],
            title=form.cleaned_data['title'],
            description=form.cleaned_data['description']
        ).save()

        # Retrieve offering from database
        test_offering = Offering.objects.order_by('-timestamp')[0]
        self.assertEqual(test_offering.timestamp, now)
        self.assertEqual(test_offering.location, location)
        self.assertEqual(test_offering.title, title)
        self.assertEqual(test_offering.description, description)

    @skipIf(True, 'Have not yet implemented scraper interface, so we cannot determine that a description is invalid because there is no food in it')
    def test_offering_form_submit_description_without_food(self):
        '''
        Attempt to submit a form with an invalid description, namely one
        without any food in it. Check that it comes back invalid.
        '''
        # Create form
        now = timezone.now()
        location = create_location(name='Frist Campus Center')
        location.save()
        description = 'We have nothing here.'
        data = {'timestamp': now, 'location': [location], 'description': description}
        form = OfferingForm(data)

        self.assertFalse(form.is_valid())

    @skipIf(True, 'Test not yet implemented')
    def test_offering_form_redirects_to_submitted_page(self):
        '''
        Fill out a form in the browser and check that submitting it sends you
        to the /submitted/ page.
        '''
        pass

    def test_offering_form_cannot_reach_submitted_page_without_submitting_a_form(self):
        '''
        Attempts to load the /submitted/ page without submitting a form. Checks
        that the page is not found.
        '''
        response = self.client.get(reverse('foodmap_app:submitted'))
        self.assertEqual(response.status_code, 404)
