from django.test import TestCase
from django.urls import reverse

# Create your tests here.
class IndexViewTests(TestCase):
    '''
    Tests for the index (landing) page.
    '''

    def test_index_page_loads_hello_world(self):
        '''
        Tests that the index page loads with content 'Hello, world!'
        '''
        response = self.client.get(reverse('foodmap_app:index'))
        self.assertEqual(response.content, 'Hello, world!')
