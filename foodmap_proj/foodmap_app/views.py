import json
from django.http import HttpResponse
from django.shortcuts import render
from .models import Location, Offering

# Create your views here.

def index(request):
    '''
    Displays the map view.
    '''
    return render(request, 'index.html', {})


def locations(request):
    '''
    Responds with the name and GPS coordinates of every location, formatted
    in JSON:
    [
        {"name": "Frist Campus Center", "lat": "40.345337090919", "lng": "-74.655215048038"},
        {"name": "", "lat": "", "lng": ""},
        ...
    ]
    Note that if there are no locations, this array will be empty.
    '''
    # Get all locations from database
    locations = Location.objects.all()

    # Format data in JSON, return response
    locations_json = []
    for location in locations:
        locations_json.append({
            'name': location.name,
            'lat': str(location.lat),
            'lng': str(location.lng)
        })
    return HttpResponse(json.dumps(locations_json))


def offerings(request, location):
    '''
    Responds with the current offering at the location with name 'location',
    formatted in JSON.
    '''
    pass


def test(request):
    '''
    Sample view to demonstrate end-to-end flow of data. Displays the
    Locations and Offerings tables' raw contents.
    '''
    locations = Location.objects.all()
    offerings = Offering.objects.all()
    return render(request, 'test.html', {'locations': locations, 'offerings': offerings})
