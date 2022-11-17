// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
firebase.initializeApp({
    apiKey: "AIzaSyCtiM6tgtSXZt4L5X53muekzA8wxj5yY6M",
    authDomain: "particle-assistive-monitor.firebaseapp.com",
    projectId: "particle-assistive-monitor",
    storageBucket: "particle-assistive-monitor.appspot.com",
    messagingSenderId: "875781651531",
    appId: "1:875781651531:web:14c1a63930d05cb4d661ce",
    measurementId: "G-9LPV8ZT23V"
  });

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});