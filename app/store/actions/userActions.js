import AsyncStorage from '@react-native-community/async-storage';
import { GET_USER_DATA, SAVE_USER_DATA } from "./types";

const getData = data => ({
  type: GET_USER_DATA,
  payload: data
});
const saveData = data => ({
  type: SAVE_USER_DATA,
  payload: data
});

export const getUserData = () => async dispatch => {
  const data = await AsyncStorage.getItem("USER_DATA");
  var parsedData = data ? JSON.parse(data) : null;
  dispatch(getData(parsedData));
};
export const saveUserData = data => async dispatch => {
  var stringifiedData = data ? JSON.stringify(data) : null;
  await AsyncStorage.setItem("USER_DATA", stringifiedData);
  dispatch(saveData(data));
};
