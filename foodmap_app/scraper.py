'''
scraper.py
Author: Michael Friedman

This is a Python interface into the NodeJS scraper, for the purpose of using
Python to request that something be scraped.
'''

from subprocess import Popen, PIPE

def get_food(text):
    '''
    Get all foods that are in 'text'. Return them in a string as a
    comma-separated list, with the first letter of the first food capitalized.
    '''
    # Start new process for NodeJS scraper. Pipe stdin/stdout between this
    # process and the NodeJS process to send data between them.
    node_program_name = ['node', 'scrapeFood.js']
    node_process = Popen(node_program_name, shell=True, stdin=PIPE, stdout=PIPE)
    node_process.stdin.write(text)
    node_process.stdin.close()
    node_process.wait()
    return node_process.stdout.read()

