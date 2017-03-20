from django.http import HttpResponse
from django.shortcuts import render

# Create your views here.
def index(request):
    '''
    Simple view for the landing page; returns a "hello world" page.
    '''
    return HttpResponse('Hello, world!')
