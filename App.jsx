/**
 * This React Native phone applications serves as a dashboard to monitor and control my ESP32 project.
 */
import React, { Component, useState, useEffect } from 'react';
import {StyleSheet, View, Image, Text, Button, TouchableHighlight, Animated, Easing} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Slider } from '@miblanchard/react-native-slider';
import WeatherIcon from './weatherIcon';
import mqtt from "precompiled-mqtt"
import { MqttHost, MqttTopic } from './Credentials';

const options = {
  host: MqttHost,
  topic: MqttTopic,
};

const client = mqtt.connect(options.host);
var isLoaded = false;
var warningColor = 'lightgray'
var snow = blizzard = fog = wind = rain = hail = storm = highTemp = lowTemp = false;
var sleet = false;

const App = () => {
    //Defining the states where the data is stored
    const [internalTemperature, setInternalTemperature] = useState(0);
    const [internalHumidity, setInternalHumidity] = useState(0);
    const [gasResistance, setInternalGasResistance] = useState(1);
    const [IAQ, setIAQ] = useState(0);
    const [weatherTemperature, setWeatherTemperature] = useState(0);
    const [weatherHumidity, setWeatherHumidity] = useState(0);
    const [weatherWindSpeed, setWeatherWindSpeed] = useState(0);
    const [weatherWindDeg, setWeatherWindDeg] = useState(0);
    const [weatherWarnings, setWeatherWarnings] = useState("default");
    const [weatherWarningsDesc, setWeatherWarningsDesc] = useState("default");
    
    const [rotation] = useState(new Animated.Value(0)); //Starting value of the rotation (the arrow points upwards)
  
    setMCUDataStates = (jsonObject) => {
      //Parsing the data from the JSON object to the states
      if (jsonObject.internal_data && jsonObject.internal_data.internal_temperature) {
        setInternalTemperature(jsonObject.internal_data.internal_temperature);
      }
      if (jsonObject.internal_data && jsonObject.internal_data.internal_humidity) {
        setInternalHumidity(jsonObject.internal_data.internal_humidity);
      }
      if (jsonObject.internal_data && jsonObject.internal_data.gas_resistance) {
        setInternalGasResistance(jsonObject.internal_data.gas_resistance);
        setIAQ(Math.log(gasResistance) + 0.04 * internalHumidity)
      }
      
      if (jsonObject.internal_data && jsonObject.internal_data.desired_temperature) {
        setDesiredTemp(jsonObject.internal_data.desired_temperature);
      }
      if (jsonObject.internal_data && jsonObject.internal_data.window_deg) {
        setWindowDeg(jsonObject.internal_data.window_deg);
      }
      if (jsonObject.internal_data && jsonObject.internal_data.is_auto) {
        setIsAuto(jsonObject.internal_data.is_auto);
      }

      if (jsonObject.weather_data && jsonObject.weather_data.weather_temperature) {
        setWeatherTemperature(jsonObject.weather_data.weather_temperature);
      }
      if (jsonObject.weather_data && jsonObject.weather_data.weather_humidity) {
        setWeatherHumidity(jsonObject.weather_data.weather_humidity);
      }
      if (jsonObject.weather_data && jsonObject.weather_data.weather_wind_speed) {
        setWeatherWindSpeed(jsonObject.weather_data.weather_wind_speed);
      }
      if (jsonObject.weather_data && jsonObject.weather_data.weather_wind_deg) {
        setWeatherWindDeg(jsonObject.weather_data.weather_wind_deg);
      }
      if (jsonObject.weather_data && jsonObject.weather_data.weather_alert_event) {
        setWeatherWarnings(jsonObject.weather_data.weather_alert_event);
      }
      if (jsonObject.weather_data && jsonObject.weather_data.weather_alert_description) {
        setWeatherWarningsDesc(jsonObject.weather_data.weather_alert_description);
      }
      
    }
    

    const findWarningLevel = (word, string) => {
      //Convert everything to lowercase for case-insensitive search
      const lowerCaseWord = word.toLowerCase();
      const lowerCaseString = string.toString().toLowerCase();
      //Check if the string contains the word
      if (lowerCaseString.includes(lowerCaseWord)) {
          return lowerCaseWord;
      } else {
          return '';
      }
    };

    const findWordInString = (word, string) => {
      //Convert everything to lowercase for case-insensitive search
      const lowerCaseWord = word.toLowerCase();
      const lowerCaseString = string.toString().toLowerCase();
      //Check if the string contains the word
      if (lowerCaseString.includes(lowerCaseWord)) {
          return true;
      } else {
          return false;
      }
    };

    useEffect(() => {
      //Determine the level of the weather warning, and assign a color to it
      if(findWarningLevel('yellow', weatherWarnings)!==''){
        warningColor = 'gold';
      }
      if(findWarningLevel('orange', weatherWarnings)!==''){
        warningColor = 'darkorange';
      }
      if(findWarningLevel('red', weatherWarnings)!==''){
        warningColor = 'firebrick';
      }

      //Finding the warning type
      snow = findWordInString('snow', weatherWarningsDesc);
      console.log('Is there a snow warning:', snow.toString());

      blizzard = findWordInString('blizzard', weatherWarningsDesc);
      console.log('Is there a blizzard warning:', blizzard.toString());

      fog = findWordInString('fog', weatherWarningsDesc);
      console.log('Is there a fog warning:', fog.toString());

      wind = findWordInString('wind', weatherWarningsDesc);
      console.log('Is there a wind warning:', wind.toString());

      rain = findWordInString('rain', weatherWarningsDesc);
      console.log('Is there a rain warning:', rain.toString());

      hail = findWordInString('hail', weatherWarningsDesc);
      console.log('Is there a hail warning:', hail.toString());

      storm = findWordInString('thunderstorm', weatherWarningsDesc);
      console.log('Is there a storm warning:', storm.toString());

      highTemp = findWordInString('high temperature', weatherWarnings);
      console.log('Is there a high temperature warning:', highTemp.toString());

      lowTemp = findWordInString('low temperature', weatherWarnings);
      console.log('Is there a low temperature warning:', lowTemp.toString());

      sleet = findWordInString('sleet', weatherWarningsDesc);
      console.log('Is there a sleet warning:', sleet.toString());

    }, [weatherWarnings]);

    //Animating an arrow to show the wind direction on the app
    useEffect(() => {
      //The rotation of  follows the direction of the wind
      Animated.timing(rotation, {
        toValue: weatherWindDeg,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [weatherWindDeg]);
  
    const spin = rotation.interpolate({
      inputRange: [0, 360], //The arrow moves like a compass
      outputRange: ['0deg', '360deg'], //Rotate from 0 to 360 degrees
    });
  
    //Handling the message recieved through the MQTT broker, and putting it through a JSON parser to get the data from the microcontroller.
    useEffect(() => {
      client.on('message', (topic, payload) => {
        console.log('Received message:', payload.toString());
        try {
          const jsonObject = JSON.parse(payload.toString());
          setMCUDataStates(jsonObject);
          isLoaded = true;
        }catch(error){
          console.log('JSON parse error', error)
        }
      });
      return () => {
        client.end();
      };
  
    },[]);


  const [windowDeg, setWindowDeg] = useState(0);
  const [desiredTemp, setDesiredTemp] = useState(20);
  const [isAuto, setIsAuto] = useState(0);

  const [sliderTempDisabled, setSliderTempDisabled] = useState(true);
  const [sliderWindowDisabled, setSliderWindowDisabled] = useState(false);

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

  const MQTTPublish = () => {
    const jsonObjectData = {
      phoneData: {
        "windowDeg" : windowDeg.valueOf(),
        "desiredTemperature" : desiredTemp.valueOf(),
        "isAuto" : isAuto.valueOf()
      }
    }
    client.publish('/topic/phoneData', JSON.stringify(jsonObjectData));
    console.log("jsonObject sent:", JSON.stringify(jsonObjectData));
  }

  
  const enableSliderTemp = () => {
    setSliderTempDisabled(false);
    setSliderWindowDisabled(true);
    setIsAuto(1);
  };

  const enableSliderWindow = () => {
    setSliderTempDisabled(true);
    setSliderWindowDisabled(false);
    setIsAuto(0);
  };

  useEffect(() => {
    // Function to load data from AsyncStorage
    const loadFromAsyncStorage = async () => {
      try {
        const windowDegData = await AsyncStorage.getItem('windowDeg');
        const desiredTempData = await AsyncStorage.getItem('desiredTemp');
        const isAutoData = await AsyncStorage.getItem('isAuto');

        if (windowDegData !== null) {
          setWindowDeg(JSON.parse(windowDegData));
          console.log('Read windowdeg: ', windowDeg);
        }
        if (desiredTempData !== null) {
          setDesiredTemp(JSON.parse(desiredTempData));
          console.log('Read desiredtemp: ', desiredTemp);
        }
        if (isAutoData !== null) {
          setIsAuto(JSON.parse(isAutoData));
          console.log('Read isAuto: ', isAuto);
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
      }
      isLoaded = true;
    };

    // Call the function to load data when the component mounts
    loadFromAsyncStorage();
  }, []); // Empty dependency array to run only once on component mount

  useEffect(() => {
    //Update the storage when any of the state variables change
    const updateAsyncStorage = async () => {
      try {
        await AsyncStorage.setItem('windowDeg', JSON.stringify(windowDeg));
        console.log('Storing windowDeg: ', windowDeg);
        await AsyncStorage.setItem('desiredTemp', JSON.stringify(desiredTemp));
        console.log('Storing desiredTemp: ', desiredTemp);
        await AsyncStorage.setItem('isAuto', JSON.stringify(isAuto));
        console.log('Storing isAuto: ', isAuto);
      } catch (error) {
        console.error('Error saving data to AsyncStorage:', error);
      }
    };

    if(isLoaded){
      updateAsyncStorage();
      MQTTPublish();
    }
    else{
      const jsonObjectData = {
        phoneData: {
        }
      }
      client.publish('/topic/phoneData', JSON.stringify(jsonObjectData));
    }
    
  }, [windowDeg, desiredTemp, isAuto]);


  useEffect(() => {
    if (isAuto === 1){
      enableSliderTemp();
    }
    else if (isAuto === 0){
      enableSliderWindow();
    }
  }, [isAuto]);

  return (
    <>
      <View style={styles.container}>
        <View style={[styles.elements, {flex: 1.1}]}>
          <View style={styles.subelements}>
            <View style={styles.highlight}>
              <MaterialCommunityIcons
                name='home-thermometer-outline'
                style={styles.icons}
              />
            </View>
            <Text style={styles.font}>
              {internalTemperature.toFixed(1)} °C
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
              {internalHumidity.toFixed(0)} %
            </Text>
          </View>
          <View style={styles.subelements}>
            <View style={styles.highlight}>
              <MaterialCommunityIcons
                name='air-filter' 
                style={styles.icons}  
              />
            </View>
            <Text style={styles.font}>
              {(IAQ).toFixed(1)} IAQ
            </Text>
          </View>
        </View>
        <View style={[styles.elements, {flex: 1.3}]}>
          <View style={styles.subelements}>
            <View style={styles.highlight}>
              <WeatherIcon
                name='wi-thermometer'
                style={styles.icons}
              />
            </View>
            <Text style={styles.font}>
              {(weatherTemperature).toFixed(1)} °C
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
          <View style={[styles.highlight, {alignItems: 'flex-end'}, {flexDirection: 'row'}]}>
            <Animated.View style={[styles.highlight, {alignItems: 'flex-end'}, { transform: [{ rotate: spin }] } ]}>
              <MaterialCommunityIcons
                name='arrow-up-thin'
                style={[styles.icons, {paddingRight: 5}]}
              />
            </Animated.View>
            <Text style={styles.font}>
              {(weatherWindSpeed).toFixed(1)} km/h
            </Text>
          </View>
        </View>
        <View style={styles.subelements}>
          <View style={styles.highlight}>
            <FontAwesome
              name='exclamation-triangle'
              style={[styles.icons, {fontSize: 37}, {color: warningColor}]}
            />
          </View>
          <View style={{justifyContent: 'flex-end', flexDirection: 'row'}}>
            <WeatherIcon name='wi-snow' style={[styles.icons, {color:'transparent'}]} />
            {(snow||blizzard) && <WeatherIcon name='wi-snow' style={styles.icons} />}
            {storm && <WeatherIcon name='wi-thunderstorm' style={styles.icons} />}
            {fog && <WeatherIcon name='wi-fog' style={styles.icons} />}
            {wind && <WeatherIcon name='wi-strong-wind' style={styles.icons} />}
            {rain && <WeatherIcon name='wi-rain' style={styles.icons} />}
            {hail && <WeatherIcon name='wi-hail' style={styles.icons} />}
            {sleet && <WeatherIcon name='wi-sleet' style={styles.icons} />}
            {highTemp && <WeatherIcon name='wi-thermometer' style={styles.icons} />}
            {lowTemp && <WeatherIcon name='wi-thermometer-exterior' style={styles.icons} />}
          </View>
        </View>
      </View>
        <View style={[styles.elements, {flex: 1}]}> 
          <View style={{paddingBottom: 10}}>
            <View style={[styles.sliderelement]}>
              <TouchableHighlight style={styles.highlight} onLongPress={enableSliderTemp}>
                <MaterialCommunityIcons
                  name='thermostat'
                  style={styles.icons}
                />
              </TouchableHighlight>
              <Text style={styles.font}>
                {desiredTemp} °C
              </Text>
            </View>
            <Slider
              step={1}
              minimumValue={10}
              maximumValue={30}
              value={desiredTemp.valueOf()}
              onValueChange={value => {
                setDesiredTemp(value[0]);
              }}
              thumbTintColor={sliderTempDisabled ? 'grey' : '#bba96d'}
              minimumTrackTintColor={sliderTempDisabled ? 'grey' : '#bba96d'} 
              disabled = {sliderTempDisabled}
           />
          </View>
          <View >
            <View style={[styles.sliderelement]}>
              <TouchableHighlight style={styles.highlight} onLongPress={enableSliderWindow}>
                <MaterialCommunityIcons
                  name='window-closed-variant'
                  style={styles.icons} 
                />
              </TouchableHighlight>
            </View>
            <Slider
              minimumValue={-90}
              maximumValue={90}
              step={1}
              value={windowDeg.valueOf()}
              onSlidingComplete={value => {
                setWindowDeg(value[0]);
              }}
              thumbTintColor={sliderWindowDisabled ? 'grey' : '#bba96d'}
              minimumTrackTintColor={sliderWindowDisabled ? 'grey' : '#bba96d'} 
              disabled = {sliderWindowDisabled}
           />
          </View>
        </View>
      </View>
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
    paddingRight: 30,
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

  sliderelement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  icons: {
    fontSize: 45,
    alignSelf: 'center',
    color: 'lightgray',
    verticalAlign: 'middle',
  },

  iconsBig: {
    fontSize: 60,
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
    alignItems: 'center',
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