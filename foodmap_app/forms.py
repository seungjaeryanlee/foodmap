from django import forms
from django.core.exceptions import ValidationError
from foodmap_app import scraper
from foodmap_app.models import Offering, Location

class OfferingForm(forms.Form):
    '''
    Form for entering Offerings
    '''

    timestamp = forms.DateTimeField(widget=forms.DateTimeInput(format='%m/%d/%Y %H:%M'))
    # location = forms.ChoiceField(choices=[('', location) for location in Location.objects.all()])
    location = forms.ModelMultipleChoiceField(queryset=Location.objects.all())
    title = forms.CharField(max_length=Offering.TITLE_MAX_LENGTH, required=False,
        widget=forms.HiddenInput())
    description = forms.CharField(max_length=Offering.DESCRIPTION_MAX_LENGTH,
        widget=forms.Textarea(attrs={'cols': 80, 'rows': 20}))

    def clean_location(self):
        '''
        Cleans 'location' field so that it can be entered into an Offering
        '''
        return self.cleaned_data['location'][0] # extract the item in the QuerySet

    def clean_description(self):
        '''
        Cleans 'description' field. Scrapes it for foods, validates that there
        is at least one food, and populates 'title' with the resulting foods.
        '''
        foods = scraper.get_food(self.cleaned_data['description'])
        if foods == '':
            raise ValidationError(
                _('We did not find any foods in your description.'),
                code='invalid'
            )
        self.cleaned_data['title'] = foods
        return self.cleaned_data['description']

