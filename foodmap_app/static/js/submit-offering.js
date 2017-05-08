/*
 * submit-offering.js
 *
 * This script sets up UI elements for the form (widgets, etc.) not handled
 * by Django.
 */

$(document).ready(function() {

    // Timestamp date/time picker widget
    $('#id_timestamp').datetimepicker({
        controlType: 'select',
        stepMinute: 5
    });

    // Recur end date date/time picker widget
    $('#id_recur_end_datetime').datetimepicker({
        controlType: 'select',
        stepMinute: 5
    });
});
