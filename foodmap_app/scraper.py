'''
scraper.py
Author: Michael Friedman

This is a Python interface into the NodeJS scraper, for the purpose of using
Python to request that something be scraped.
'''

import os
import sys
from foodmap_proj.settings.common import BASE_DIR
from subprocess import Popen, PIPE

def get_food(text):
    '''
    Get all foods that are in 'text'. Return them in a string as a
    comma-separated list, with the first letter of the each food capitalized.
    '''
    # Start new process for NodeJS scraper. Pipe stdin/stdout between this
    # process and the NodeJS process to send data between them.
    node_program_name = ['node', os.path.join(BASE_DIR, 'scraper/scrapeFood.js')]
    node_process = Popen(node_program_name, stdin=PIPE, stdout=PIPE, stderr=PIPE)
    output, err = node_process.communicate(input=text)
    if err != '':
        print >> sys.stderr, err
        return '' # something went wrong, so bail
    return output
