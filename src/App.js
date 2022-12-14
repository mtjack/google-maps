import React, { useState, useEffect, useRef } from "react";
import './index.css'

import { GoogleMap, useLoadScript, Marker, Circle } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng, } from "use-places-autocomplete";

import { Combobox, ComboboxInput, ComboboxPopover, ComboboxList, ComboboxOption, } from "@reach/combobox";
import "@reach/combobox/styles.css";

import firebase from 'firebase/compat/app'; 
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/messaging';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';

import toast, { Toaster } from 'react-hot-toast';

firebase.initializeApp({
  apiKey: "AIzaSyCtiM6tgtSXZt4L5X53muekzA8wxj5yY6M",
  authDomain: "particle-assistive-monitor.firebaseapp.com",
  projectId: "particle-assistive-monitor",
  storageBucket: "particle-assistive-monitor.appspot.com",
  messagingSenderId: "875781651531",
  appId: "1:875781651531:web:14c1a63930d05cb4d661ce",
  measurementId: "G-9LPV8ZT23V"
});

const auth = firebase.auth();
const firestore = firebase.firestore();
const messaging = getMessaging();

const db = getFirestore();


export default function App() {
  const [user] = useAuthState(auth);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });


  if (!isLoaded) return <div>Loading...</div>;
  return (
    <div>
      {user ? <div ><Map /> <Notification /> </div> : <div className="sign-in-body"><SignIn /></div>}
    </div>
  );
}

// Sign in btn
function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <button onClick={signInWithGoogle} className="sign-in">Sign In</button>
  )
}

// Sign out button
function SingOut() {
  return auth.currentUser && (
    <button onClick={() => auth.signOut()}>Sign Out</button>
  )
}

// Get notification permision from user
const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey: process.env.REACT_APP_VAPID_KEY });
    if (currentToken) {
      console.log('current token for client: ', currentToken);
      const { uid } = auth.currentUser
      const target = doc(db, "users", uid)
      const fmc = {fmcToken: currentToken}
      updateDoc(target, fmc)
      .then(docRef => {
        console.log("fmc field added to user");
      })
      .catch(error => {
        console.log(error);
      })
    } else {
      // Show permission request UI
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
};

// Listen for new notifications
const onMessageListener = () =>
  new Promise((resolve) => {    
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// Notification component 
const Notification = () => {
  const [notification, setNotification] = useState({title: '', body: ''});
  const notify = () =>  toast(<ToastDisplay/>); 
  function ToastDisplay() {
    return (
      <div>
        <p><b>{notification?.title}</b></p>
        <p>{notification?.body}</p>
      </div>
    );
  };

  useEffect(() => {
    if (notification?.title ){
     notify()
    }
  }, [notification])

  requestForToken();

  onMessageListener()
    .then((payload) => {
      setNotification({title: payload?.notification?.title, body: payload?.notification?.body});     
    })
    .catch((err) => console.log('failed: ', err));

  return (
     <Toaster/>
  )
}

var Particle = require('particle-api-js');
var particle = new Particle();


// particle function to update radius on device 
function postRadius(R) {
  particle.callFunction({ deviceId: process.env.REACT_APP_PARTICLE_DEVICE_ID, name: 'setRadius', argument: R, auth: process.env.REACT_APP_PARTICLE_ACCESS_TOKEN });
}

// particle function to update home lat on device 
function postlat(lat) {
  particle.callFunction({ deviceId: process.env.REACT_APP_PARTICLE_DEVICE_ID, name: 'setFixedLat', argument: lat.toString(), auth: process.env.REACT_APP_PARTICLE_ACCESS_TOKEN });
}

// particle function to update home lng on device 
function postLng(lng) {
  particle.callFunction({ deviceId: process.env.REACT_APP_PARTICLE_DEVICE_ID, name: 'setFixedLong', argument: lng.toString(), auth: process.env.REACT_APP_PARTICLE_ACCESS_TOKEN });
}

// Google maps component 
function Map() {
  const [selected, setSelected] = useState({lat:55.933042990333966, lng:-3.2136258156244923});
  const [radius, setRadius] = useState(30); 
  const [marker, setMarker] = useState({lat: 0, lng: 0})

  useEffect(() => {
    const loop = setInterval(async () => {
        const fetchLat = await fetch(`https://api.particle.io/v1/devices/${process.env.REACT_APP_PARTICLE_DEVICE_ID}/lat?access_token=${process.env.REACT_APP_PARTICLE_ACCESS_TOKEN}`);
        const latData = await fetchLat.json();
        console.log(latData.result)
        setMarker(marker =>({
          ...marker,
          lat: latData.result
        }))

        const fetchLng = await fetch(`https://api.particle.io/v1/devices/${process.env.REACT_APP_PARTICLE_DEVICE_ID}/long?access_token=${process.env.REACT_APP_PARTICLE_ACCESS_TOKEN}`);
        const lngData = await fetchLng.json();
        console.log(lngData.result)
        setMarker(marker => ({
          ...marker,
          lng: lngData.result
        }))
    }, 1000);

    return () => clearInterval(loop);
  }, [marker]);

  return (
    <>
      <SingOut />
      <div className="places-container">
        <PlacesAutocomplete setSelected={setSelected} />
      </div>

      <GoogleMap
        zoom={18}
        center={selected}
        mapContainerClassName="map-container"
        options={{streetViewControl: false}}
      >
        {selected && <Circle center={selected} radius={radius} /> }
        <Marker position={marker} />
      </GoogleMap>

      <div className="slider">
        <input type="range" min="10" max="100" step={10} value={radius} list="ranges" onChange={(e) => setRadius(Number(e.target.value)) & postRadius(e.target.value)}/>
        <datalist id="ranges">
          <option value={10}></option>
          <option value={20}></option>
          <option value={30}></option>
          <option value={40}></option>
          <option value={50}></option>
          <option value={60}></option>
          <option value={70}></option>
          <option value={80}></option>
          <option value={90}></option>
          <option value={100}></option>
        </datalist>
      </div>
    </>
  );
}

// Google maps search box component 
const PlacesAutocomplete = ({ setSelected }) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setSelected({ lat, lng });
    postlat(lat);
    postLng(lng);
  };

  return (
    <Combobox onSelect={handleSelect}>
      <ComboboxInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        className="combobox-input"
        placeholder="Search an address"
      />
      <ComboboxPopover>
        <ComboboxList>
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption key={place_id} value={description} />
            ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
};