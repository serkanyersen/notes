require.config({
    paths: {
        'Firebase': '//cdn.firebase.com/js/client/1.0.17/firebase',
        'FirebaseSimpleLogin': '//cdn.firebase.com/js/simple-login/1.6.1/firebase-simple-login',
        'underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min'
    },
    shim: {
        Firebase: {
            exports: 'Firebase'
        },
        FirebaseSimpleLogin: {
            exports: 'FirebaseSimpleLogin'
        }
    }
});

require(['App'], function(App) {

    window.app = new App();
});
