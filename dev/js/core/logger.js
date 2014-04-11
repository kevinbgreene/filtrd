injekter.define('logger',['eventHub', function(eventHub) {

	'use strict';

    eventHub.on('LOG', function(evt) {

        var msg;

        if (typeof console !== 'undefined') {

            switch(evt.severity) {

                case 'error':
                    msg = 'ERROR: ' + evt.msg;
                    break;

                case 'warn':
                    msg = 'WARN: ' + evt.msg;
                    break;

                default:
                    msg = 'LOG: ' + evt.msg;
                    break;
            }

            console.log(msg, evt.data);
        }
    });
}]);