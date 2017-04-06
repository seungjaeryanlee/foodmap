from django.shortcuts import render
from .models import Location, Offering

# Create your views here.
def index(request):
    '''
    Sample view to demonstrate end-to-end flow of data. Displays the
    Locations and Offerings tables' raw contents.
    '''
    locations = Location.objects.all()
    offerings = Offering.objects.all()
    return render(request, 'foodmap_app/index.html', {'locations': locations, 'offerings': offerings})
