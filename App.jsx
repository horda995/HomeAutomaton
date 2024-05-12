/**
 * This React Native phone applications serves as a dashboard to monitor and control my ESP32 project.
 */
import React, { Component, useState, useEffect } from 'react';
import {StyleSheet, View, Image, Text, Button, TouchableHighlight} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Slider } from '@miblanchard/react-native-slider';
import WeatherIcon from './weatherIcon';
import { color } from '@rneui/base';
import mqtt from "precompiled-mqtt"
import { MqttHost, MqttTopic } from './Credentials';

const options = {
  host: MqttHost,
  topic: MqttTopic,
};

const client = mqtt.connect(options.host);

const MCUData = () => {
  const [internalTemperature, setInternalTemperature] = useState();
  const [internalHumidity, setInternalHumidity] = useState();
  const [internalAirQuality, setInternalAirQuality] = useState();
  const [weatherTemperature, setWeatherTemperature] = useState(); //weatherTemperature.toFixed(2)
  const [weatherHumidity, setWeatherHumidity] = useState();
  const [weatherWindSpeed, setWeatherWindSpeed] = useState();
  const [weatherWindDeg, setWeatherWindDeg] = useState();
  const [weatherWarnings, setWeatherWarnings] = useState();

  setMCUDataStates = (jsonObject) => {
    //TODO: Add a loading effect is specific state is undefined
    setInternalTemperature(jsonObject.internal_data.internal_temperature);
    setInternalHumidity(jsonObject.internal_data.internal_humidity);
    setInternalAirQuality(jsonObject.internal_data.internal_airquality);
    setWeatherTemperature(jsonObject.weather_data.weather_temperature);
    setWeatherHumidity(jsonObject.weather_data.weather_humidity);
    setWeatherWindSpeed(jsonObject.weather_data.weather_wind_speed.toFixed(2));
    setWeatherWindDeg(jsonObject.weather_data.weather_wind_deg);
    setWeatherWarnings(jsonObject.weather_data.weather_alert_event);
  }
  
  //Handling the message recieved through the MQTT broker, and putting it through a JSON parser to get the data from the microcontroller.
  useEffect(() => {
    client.on('message', (topic, payload) => {
      console.log('Received message:', payload.toString());
      try {
        const jsonObject = JSON.parse(payload.toString());
        setMCUDataStates(jsonObject);
      }catch(error){
        console.log('JSON parse error', error)
      }
    });
    return () => {
      client.end();
    };

  },[]);
 
  return (
    <>
      <View style={[styles.elements, {flex: 2.5}]}>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <WeatherIcon
              name='wi-thermometer'
              style={styles.icons}
            />
          </View>
          <Text style={styles.font}>
            {internalTemperature} °C
          </Text>
        </View>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <WeatherIcon
              name='wi-humidity'
              style={styles.icons}  
            />
          </View>
          <Text style={styles.font}>
            {internalHumidity} %
          </Text>
        </View>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <MaterialCommunityIcons
              name='molecule-co2' 
              style={styles.icons}  
            />
          </View>
          <Text style={styles.font}>
            {internalAirQuality} PPM
          </Text>
        </View>
      </View>
      <View style={[styles.elements, {flex: 2.5}]}>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <WeatherIcon
              name='wi-day-sunny'
              style={styles.icons}  
            />
          </View>
          <Text style={styles.font}>
            {weatherTemperature} °C
          </Text>
        </View>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <WeatherIcon
              name='wi-humidity'
              style={styles.icons}  
            />
          </View>
          <Text style={styles.font}>
            {weatherHumidity} %
          </Text>
        </View>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <MaterialCommunityIcons
              name='windsock'
              style={styles.icons}  
            />
          </View>
          <Text style={styles.font}>
            {weatherWindSpeed} km/h
          </Text>
        </View>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <FontAwesome
              name='exclamation-triangle'
              style={[styles.icons, {fontSize: 37}]}
            />
          </View>
        </View>
      </View>
    </>
  );
};

const App = () => {
  const [popupWindowVisible, setPopupWindowVisible] = useState(false);
  const [windowDeg, setWindowDeg] = useState(0); //this will be tricky to define, not sure what sort of motor will i be using

  showPopupWindow = () => {
    setPopupWindowVisible(!popupWindowVisible);
  }

  //Handling the connection to the MQTT broker, and subscription to the MQTT topic
  useEffect(() => {
    console.log(options.host)
    client.on('connect', ()=> {
      console.log("Successfully connected to the MQTT broker!");
    });
    client.on('disconnect', () => {
      console.log("Disconnected from MQTT broker!");
    })
    client.on('error', (error) => {
      console.log('MQTT error:', error);
    });
    client.subscribe(options.topic, (error, granted) => {
      if (error) {
        console.log('MQTT subscription error:', error);
      } else {
        console.log('MQTT subscription successful:', granted);
      }
    });
   
    return () => {
      client.end();
    };
    

  },[]);
  
  //Monitoring the value, end publishing the value to the microcontroller, if it has been changed.
  useEffect(() => {
    const jsonObjectWindowDeg = {
      phoneData: {
        "windowDeg" : windowDeg.valueOf(),
      }
    }
    client.publish('/topic/phoneData', JSON.stringify(jsonObjectWindowDeg));
    console.log("jsonObject sent:", JSON.stringify(jsonObjectWindowDeg));
  },[windowDeg]);
  
  
  return (
    <>
      <View style={styles.container}>
        <MCUData />
        <View style={[styles.elements, {flex: 1}]}> 
          <View style={styles.subelements}>
            <TouchableHighlight style={styles.highlight}>
              <MaterialCommunityIcons
                name='thermostat-box'
                style={styles.icons} 
                
              />
            </TouchableHighlight>
            <View>
              <TouchableHighlight style={styles.highlight}>
                <MaterialCommunityIcons name='window-closed-variant' style={styles.icons} onPress={()=>{showPopupWindow()}}/>
              </TouchableHighlight>
            </View>
            
          </View>
        </View>
      </View>
      {popupWindowVisible && <View style={styles.popupWindow}>
      <Slider
          value={windowDeg.valueOf()}
          onSlidingComplete={value => setWindowDeg(value[0])}
      />
      <Text style={{color:'white'}}>Value: {windowDeg.valueOf()}</Text>
      </View>}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    flexDirection: 'column',
  },

  elements: {
    padding: 20,
    paddingLeft: 30,
    borderRadius: 35,
    backgroundColor: '#0f0f0f',
    margin: 5,
    flexDirection: 'column',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },

  subelements: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center'
  },

  icons: {
    fontSize: 45,
    alignSelf: 'center',
    color: 'lightgray',
    verticalAlign: 'middle'
  },

  font: {
    color: 'white',
    fontSize: 35,
    fontFamily: 'Oswald-Medium',
    alignSelf: 'center',
    verticalAlign: 'middle'
  },

  highlight: {
    justifyContent: 'center',
    alignItems: 'center'
    
  },

  data: {
    justifyContent: 'center',
  },
  popupWindow: {
    alignSelf:'center', 
    backgroundColor: '#0f0f0f', 
    top: '40%', 
    height:'20%', 
    width:'98%', 
    position:'absolute',
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'grey',
    justifyContent: 'center',
    padding: '10%'
  },
});



export default App;