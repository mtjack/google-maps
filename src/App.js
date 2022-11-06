import React, { useState, useEffect } from "react";
import { GoogleMap, useLoadScript, Marker, Circle } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import './index.css'

export default function App() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyA4Yo0wvOoKMzofaD6jYq0gqnb6REre3M0',
    libraries: ["places"],
  });

  if (!isLoaded) return <div>Loading...</div>;
  return <Map />;
}

var Particle = require('particle-api-js');
var particle = new Particle();


// particle function to update radius on device 
function postRadius(R) {
  particle.callFunction({ deviceId: 'e00fce68f0050383aaaccc4e', name: 'setRadius', argument: R, auth: '00ad60b7d1b3f3613bcfcc53ab48eb1d10ef617d' });
}

// particle function to update home lat on device 
function postlat(lat) {
  particle.callFunction({ deviceId: 'e00fce68f0050383aaaccc4e', name: 'setPosLat', argument: lat.toString(), auth: '00ad60b7d1b3f3613bcfcc53ab48eb1d10ef617d' });
}

// particle function to update home lng on device 
function postLng(lng) {
  particle.callFunction({ deviceId: 'e00fce68f0050383aaaccc4e', name: 'setPosLong', argument: lng.toString(), auth: '00ad60b7d1b3f3613bcfcc53ab48eb1d10ef617d' });
}

function Map() {
  const [selected, setSelected] = useState(null);
  const [radius, setRadius] = useState(30); 
  const [marker, setMarker] = useState({lat: 0, lng: 0})

  useEffect(() => {
    const loop = setInterval(async () => {
        const fetchLat = await fetch('https://api.particle.io/v1/devices/e00fce68f0050383aaaccc4e/lat?access_token=00ad60b7d1b3f3613bcfcc53ab48eb1d10ef617d');
        const latData = await fetchLat.json();
        console.log(latData.result)
        setMarker(marker =>({
          ...marker,
          lat: latData.result
        }))

        const fetchLng = await fetch('https://api.particle.io/v1/devices/e00fce68f0050383aaaccc4e/long?access_token=00ad60b7d1b3f3613bcfcc53ab48eb1d10ef617d');
        const lngData = await fetchLng.json();
        console.log(lngData.result)
        setMarker(marker => ({
          ...marker,
          lng: lngData.result
        }))
    }, 3000);

    return () => clearInterval(loop);
  }, [marker]);

  return (
    <>
      <div className="places-container">
        <PlacesAutocomplete setSelected={setSelected} />
      </div>

      <div>
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

      <GoogleMap
        zoom={10}
        center={selected}
        mapContainerClassName="map-container"
        options={{streetViewControl: false}}
      >
        {selected && <Circle center={selected} radius={radius} /> }
        <Marker position={marker} />
      </GoogleMap>
    </>
  );
}

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