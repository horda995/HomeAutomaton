import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
const icoMoonConfig = require('./selection.json');
const WeatherIcon = createIconSetFromIcoMoon(icoMoonConfig);
WeatherIcon.loadFont();
export default WeatherIcon;

export const Button = WeatherIcon.Button;
export const TabBarItem = WeatherIcon.TabBarItem;
export const TabBarItemIOS = WeatherIcon.TabBarItemIOS;
export const ToolbarAndroid = WeatherIcon.ToolbarAndroid;
export const getImageSource = WeatherIcon.getImageSource;

