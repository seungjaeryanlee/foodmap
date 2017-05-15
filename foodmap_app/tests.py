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
    description='We have plain and vegetable pizza!', image=0, thread_id='1234567890123456', recur=None, recur_end_datetime=None):
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
        description=description, image=image, thread_id=thread_id,
        recur=recur, recur_end_datetime=recur_end_datetime)

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
        Requests all of the recent offerings (from each location with an
        offering), and checks that we get back correctly formatted JSON.
        '''
        # Make the request
        response = self.client.get(reverse('foodmap_app:offerings'))
        try:
            parsed_response = json.loads(response.content)  # array of JSON objects, as specified in views.py
        except:
            self.fail('JSON response could not be parsed')

        # Verify the response is correct -- only most recent offerings should be returned
        test_response = parsed_response
        actual_response = [
            {
                'location': {'name': self.locationA.name, 'lat': str(self.locationA.lat), 'lng': str(self.locationA.lng)},
                'offerings': [
                    {'title': offering.title, 'description': offering.description, 'minutes': (timezone.now() - offering.timestamp).seconds/60, 'tags': ''}
                    for offering in [self.offering1A, self.offering2A]
                ]
            },
            {
                'location': {'name': self.locationB.name, 'lat': str(self.locationB.lat), 'lng': str(self.locationB.lng)},
                'offerings': [
                    {'title': offering.title, 'description': offering.description, 'minutes': (timezone.now() - offering.timestamp).seconds/60, 'tags': ''}
                    for offering in [self.offering1B, self.offering2B]
                ]
            }
        ]

        self.assertEqual(len(test_response), len(actual_response))  # has correct number of locations

        # Sort test and actual response by location, and by title within each
        # location so they can be compared side-by-side
        for entry in test_response:
            self.assertIn('location', entry.keys())
            self.assertIn('name', entry['location'].keys())

            self.assertIn('offerings', entry.keys())
            for offering in entry['offerings']:
                self.assertIn('title', offering)
        test_response = sorted(test_response, cmp=lambda x, y: cmp(x['location']['name'], y['location']['name']))
        actual_response = sorted(actual_response, cmp=lambda x, y: cmp(x['location']['name'], y['location']['name']))

        for i in range(0, len(test_response)):
            test_response[i]['offerings'] = sorted(test_response[i]['offerings'], cmp=lambda x, y: cmp(x['title'], y['title']))
            actual_response[i]['offerings'] = sorted(actual_response[i]['offerings'], cmp=lambda x, y: cmp(x['title'], y['title']))

        # Compare test_response vs actual_response
        for i in range(0, len(test_response)):
            # Has correct attributes
            self.assertEqual(sorted(test_response[i].keys()), sorted(actual_response[i].keys()))

            # location: has correct name, lat, lng
            test_location = test_response[i]['location']
            actual_location = actual_response[i]['location']
            self.assertEqual(sorted(test_location.keys()), sorted(actual_location.keys()))
            self.assertEqual(test_location['name'], actual_location['name'])
            self.assertEqual(float(test_location['lat']), float(actual_location['lat']))
            self.assertEqual(float(test_location['lng']), float(actual_location['lng']))

            # offerings
            self.assertEqual(len(test_response[i]['offerings']), len(actual_response[i]['offerings']))
            for j in range(0, len(test_response[i]['offerings'])):
                test_offering = test_response[i]['offerings'][j]
                actual_offering = actual_response[i]['offerings'][j]

                # Has correct attributes
                self.assertEqual(sorted(test_offering.keys()), sorted(actual_offering.keys()))

                # Has correct title and description
                self.assertEqual(test_offering['title'], actual_offering['title'])
                self.assertEqual(test_offering['description'], actual_offering['description'])

                # Has correct minutes
                self.assertAlmostEqual(test_offering['minutes'], actual_offering['minutes'], delta=1)  # should be within a small delta

                # Has correct tags
                self.assertEqual(test_offering['tags'], actual_offering['tags'])


    def test_offerings_with_tags(self):
        '''
        Requests the most recent offerings, where the offerings have tags,
        and checks that the response has all of those tags in a comma-separated
        list. (Assumes the rest of the response is correct, as this is
        validated by another test.)
        '''
        # Add tags to each offering
        actual_tags = ['kosher', 'gluten-free', 'peanut-free']
        for offering in [self.offering1A, self.offering1B, self.offering2A, self.offering2B]:
            for tag in actual_tags:
                create_offering_tag(offering=offering, tag=tag).save()

        # Make request
        response = self.client.get(reverse('foodmap_app:offerings'))
        try:
            parsed_response = json.loads(response.content)  # array of JSON objects, as specified in views.py
        except:
            self.fail('JSON response could not be parsed')

        # Verify that response has exactly the same tags
        test_response = parsed_response
        actual_response = [
            {
                'location': {'name': self.locationA.name, 'lat': str(self.locationA.lat), 'lng': str(self.locationA.lng)},
                'offerings': [
                    {'title': offering.title, 'description': offering.description, 'minutes': (timezone.now() - offering.timestamp).seconds/60, 'tags': 'kosher,gluten-free,peanut-free'}
                    for offering in [self.offering1A, self.offering2A]
                ]
            },
            {
                'location': {'name': self.locationB.name, 'lat': str(self.locationB.lat), 'lng': str(self.locationB.lng)},
                'offerings': [
                    {'title': offering.title, 'description': offering.description, 'minutes': (timezone.now() - offering.timestamp).seconds/60, 'tags': 'kosher,gluten-free,peanut-free'}
                    for offering in [self.offering1B, self.offering2B]
                ]
            }
        ]

        # Sort test and actual response by location, and by title within each
        # location so they can be compared side-by-side
        for entry in test_response:
            self.assertIn('location', entry.keys())
            self.assertIn('name', entry['location'].keys())

            self.assertIn('offerings', entry.keys())
            for offering in entry['offerings']:
                self.assertIn('title', offering)
        test_response = sorted(test_response, cmp=lambda x, y: cmp(x['location']['name'], y['location']['name']))
        actual_response = sorted(actual_response, cmp=lambda x, y: cmp(x['location']['name'], y['location']['name']))

        for i in range(0, len(test_response)):
            test_response[i]['offerings'] = sorted(test_response[i]['offerings'], cmp=lambda x, y: cmp(x['title'], y['title']))
            actual_response[i]['offerings'] = sorted(actual_response[i]['offerings'], cmp=lambda x, y: cmp(x['title'], y['title']))

        # Compare tags between test_response and actual_response
        for i in range(0, len(actual_response)):
            for j in range(0, len(actual_response[i]['offerings'])):
                test_offering = test_response[i]['offerings'][j]
                actual_offering = actual_response[i]['offerings'][j]

                test_tags = sorted(test_offering['tags'].split(','))
                actual_tags = sorted(actual_offering['tags'].split(','))
                self.assertEqual(test_tags, actual_tags)

    def test_offerings_timestamp_constraints(self):
        '''
        Requests the recent offerings and checks that they meet the time
        constraint we impose: all offerings are from 2 hours ago to now
        '''
        # Set timestamps of the offerings to just before, just after 2-hours
        # mark, and in future
        offerings_good = [self.offering1A, self.offering1B]
        offerings_bad  = [self.offering2A, self.offering2B]

        now = timezone.now()
        for offering in offerings_good:
            offering.timestamp = now - datetime.timedelta(minutes=118) # under 2 hours
            offering.save()
        offerings_bad[0].timestamp = now - datetime.timedelta(minutes=121) # over 2 hours
        offerings_bad[0].save()
        offerings_bad[1].timestamp = now + datetime.timedelta(days=1) # future
        offerings_bad[1].save()

        # Make the request
        response = self.client.get(reverse('foodmap_app:offerings'))
        test_response = json.loads(response.content)  # array of JSON objects, as specified in views.py

        # Check that no offering is outside time range (approximately)
        epsilon = 2  # some leeway in the timestamp to account for delay between request and response
        for entry in test_response:
            for offering in entry['offerings']:
                self.assertTrue(offering['minutes'] < 120 + epsilon)
                self.assertTrue(offering['minutes'] >= 0)

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

    NOTE: You must manually delete any offerings saved to the table in these
    tests. If you don't, the images corresponding to those offerings will be
    left behind even after the offering is automatically deleted, later tests
    will not be able to overwrite that image, and they will fail.
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
        succeeds. (Timestamps are allowed to be in the future, so users can
        enter future offerings. )
        '''
        offering = create_offering(timestamp=timezone.now() + datetime.timedelta(days=10))
        offering.save()

        test_offering = Offering.objects.order_by('-pk')[0]
        self.assertEqual(test_offering, offering)
        test_offering.delete()

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

    def test_offerings_table_insert_valid_recurring_offering(self):
        '''
        Inserts a recurring entry to the table. Checks that its attributes
        are correct.
        '''
        now = timezone.now()
        end_datetime = now + datetime.timedelta(weeks=10)
        offering = create_offering(recur='D', recur_end_datetime=end_datetime)
        offering.save()
        test_offering = Offering.objects.order_by('-id')[0]
        self.assertEqual(test_offering, offering)
        test_offering.delete()

    def test_offerings_table_insert_inconsistent_recurring_offering(self):
        '''
        Attempts to insert recurring entries into the table with inconsistent
        values 'recur', 'recur_end_datetime', and 'timestamp' attributes. Checks
        that they fail to insert.
        '''
        now = timezone.now()
        end_datetime = now + datetime.timedelta(weeks=10)

        # Not recurring but has an end datetime
        location1 = create_location(name='Princeton University')
        location1.save()
        offering1 = create_offering(location=location1, recur=None, recur_end_datetime=end_datetime)
        self.assertRaises(IntegrityError, offering1.save)

        # Recurring with an end datetime earlier than the timestamp
        location2 = create_location(name='Yale University')
        location2.save()
        offering2 = create_offering(timestamp=now, location=location2, recur='D',
            recur_end_datetime=now-datetime.timedelta(days=1))
        self.assertRaises(IntegrityError, offering2.save)

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

    def test_scraper_interface_get_food_with_valid_text(self):
        '''
        Test that the get_food() method of the scraper interface gets all foods
        in a given text and returns them in comma-separated format.
        '''
        text = 'Eat bagels here.'
        foods = 'Bagels'
        test_foods = scraper.get_food(text)
        self.assertEqual(test_foods, foods)

        text = 'Come get some pizza and pasta at Frist!'
        foods = 'Pizza, Pasta'
        test_foods = scraper.get_food(text)
        self.assertEqual(test_foods, foods)

        text = 'Pizza and pasta at Frist! Also we have bagels, cream cheese, and butter with orange juice. Don\'t miss out!'
        foods = 'Pizza, Pasta, Bagels, Cream cheese, Butter, Orange juice'
        test_foods = scraper.get_food(text)
        self.assertEqual(test_foods, foods)

    def test_scraper_interface_get_food_with_empty_text(self):
        '''
        Boundary test for get_food(). Check that it returns empty string on
        empty text.
        '''
        self.assertEqual(scraper.get_food(''), '')

    def test_scraper_interface_get_food_with_no_foods(self):
        '''
        Boundary test for get_food(). Check that it returns empty string on a
        string with no food.
        '''
        self.assertEqual(scraper.get_food('We have nothing here.'), '')

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

    def test_offering_form_create_form_with_valid_nonrecurring_entry(self):
        '''
        Create a form with valid entries and check that the form is in fact
        determined valid.
        '''
        now = timezone.now()
        location = create_location(name='Frist Campus Center')
        location.save()
        description = 'Come get some pizza and pasta at Frist!'
        data = {'timestamp': now, 'location': location.id, 'description': description}
        form = OfferingForm(data)

        self.assertTrue(form.is_valid(), 'Invalid form: ' + str(form.errors.as_json))

    def test_offering_form_create_form_with_valid_recurring_entry(self):
        '''
        Create a form with valid entries, including making the offering recur,
        and check that the form is determined valid.
        '''
        now = timezone.now()
        location = create_location(name='Wilcox Hall')
        location.save()
        description = 'Coffee in the commons!'
        recur = 'D'
        recur_end_datetime = None
        data = {'timestamp': now, 'location': location.id, 'description': description, 'recur': recur, 'recur_end_datetime': recur_end_datetime}
        form = OfferingForm(data)

        self.assertTrue(form.is_valid(), 'Invalid form: ' + str(form.errors.as_json))


    def test_offering_form_submit_valid_nonrecurring_entry(self):
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
        data = {'timestamp': now, 'location': location.id, 'description': description}
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


    def test_offering_form_submit_valid_recurring_entry(self):
        '''
        Create a form with a valid recurring entry and attempt to save its
        info to the database. Check that the database contains the correct info.
        '''
        # Create form
        now = timezone.now()
        location = create_location(name='Wilcox Hall')
        location.save()
        description = 'Coffee in the commons!'
        title = scraper.get_food(description)
        recur = 'D'
        recur_end_datetime = now + datetime.timedelta(weeks=10)
        data = {'timestamp': now, 'location': location.id, 'description': description, 'recur': recur, 'recur_end_datetime': recur_end_datetime}
        form = OfferingForm(data)

        self.assertTrue(form.is_valid(), 'Invalid form: ' + str(form.errors.as_json))

        # Save data
        Offering(
            timestamp=form.cleaned_data['timestamp'],
            location=form.cleaned_data['location'],
            title=form.cleaned_data['title'],
            description=form.cleaned_data['description'],
            recur=form.cleaned_data['recur'],
            recur_end_datetime=form.cleaned_data['recur_end_datetime']
        ).save()

        # Retrieve offering from database
        test_offering = Offering.objects.order_by('-timestamp')[0]
        self.assertEqual(test_offering.timestamp, now)
        self.assertEqual(test_offering.location, location)
        self.assertEqual(test_offering.title, title)
        self.assertEqual(test_offering.description, description)
        self.assertEqual(test_offering.recur, recur)
        self.assertEqual(test_offering.recur_end_datetime, recur_end_datetime)


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
        data = {'timestamp': now, 'location': location.id, 'description': description}
        form = OfferingForm(data)

        self.assertFalse(form.is_valid())

    def test_offering_form_cannot_reach_submitted_page_without_submitting_a_form(self):
        '''
        Attempts to load the /submitted/ page without submitting a form. Checks
        that the page is not found.
        '''
        response = self.client.get(reverse('foodmap_app:submitted'))
        self.assertEqual(response.status_code, 404)
