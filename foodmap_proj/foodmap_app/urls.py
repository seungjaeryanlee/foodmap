from django.conf.urls import url
from . import views

app_name = 'foodmap_app'
urlpatterns = [
    url(r'^$', views.index, name='index')
]
