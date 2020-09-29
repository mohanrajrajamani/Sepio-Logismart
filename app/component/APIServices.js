import axios from 'axios';
import AsyncStorage from '@react-native-community/async-storage';

export default class APIService {
    // test URL
    static URL = 'https://logi-smart-backend-test.herokuapp.com/v1/'
    // static URL = "https://139a2cae3422.ngrok.io/v1/"
    static lOCK_URL = 'https://logi-smart-lock-test.herokuapp.com/v1/inbound/'

    // live URL
    // static URL='https://logismart.sepioproducts.in/v1/' 
    // static URL='https://cb4ed600.ngrok.io/v1/'            
    // static lOCK_URL='https://logilock.sepioproducts.in/v1/inbound/'  

    // Demo URL
    // static URL='https://theft-tamper-backend.herokuapp.com/v1/'
    // static lOCK_URL='https://theft-and-tamper-lock.herokuapp.com/v1/inbound/' 

    // per page data
    static perPage = 10

    //userDetails
    static userdetails = "users/userdetails"

    //listlocation name
    static listlocationname = "dashboard/listlocationname"

    //listownedloccationdetailsall
    static listownedloccationdetailsall = "dashboard/listownedloccationdetailsall"

    // update token
    static updatefcm = "users/updatefcm"

    //Trip list
    static listtripdetails = "dashboard/listtripdetails"
    static filterInitiateTrip = "dashboard/filterInitiateTrip"
    static searchtrip = "dashboard/searchtrip"
    static listinitiatetrip = "dashboard/listinitiatetrip"
    static listtripeventdetails = "dashboard/listtripeventdetails"
    static listsubtripdetails = "dashboard/listsubtripdetails"
    static listgeofencingdetails = "dashboard/listgeofencingdetails"
    static startTrip = "dashboard/startTrip"
    static listonlinelockdetails = "dashboard/listonlinelockdetails"
    static listVehicle = "dashboard/listVehicle"
    static listcountrydetails = "users/listcountrydetails"
    static addtripdetails = "dashboard/addtripdetails"
    static vehiclehistory = "dashboard/vehiclehistory"
    static assignlock = "dashboard/assignlock"
    static edittripdetails = "dashboard/edittripdetails"

    //End Trip
    static listenroutetripdetails = "dashboard/listenroutetripdetails"
    static searchonlinetrip = "dashboard/searchonlinetrip"
    static startsubtrip = "dashboard/startsubtrip"
    static endtrip = "dashboard/endtrip"
    static checkDelay = "dashboard/checkDelay"
    static endsinglesubtrip = "dashboard/endsinglesubtrip"

    //lock
    static listlockdetails = "dashboard/listlockdetails"
    static lockstatuscount = "dashboard/lockstatuscount"
    static searchLock = "dashboard/searchLock"

    //Track screen
    static listonlinetripdetails = "dashboard/listonlinetripdetails"
    static filterviewtrip = "dashboard/filterviewtrip"

    //Track Edit
    static tripdetailschanged = "dashboard/tripdetailschanged"
    static listalllock = "dashboard/listalllock"

    static async execute(method, url, data) {
        var loginData = await AsyncStorage.getItem('user_token')
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + loginData
        };
        try {
            if (method === "POST") {
                var response = await axios.post(url, data, {
                    headers: headers
                })
            }
            else if (method === "DELETE") {
                response = await axios.delete(url, {
                    headers: headers,
                    data: data
                })
            }
            else {
                response = await axios.get(url, {
                    headers: headers
                })
            }

            if (response.status === 200) {
                return {
                    status: response.status,
                    success: true,
                    data: response.data
                }
            }
            else {
                return response.data.errors;
            }
        }
        catch (error) {
            console.log("error : ", error.response.data)
            return {
                status: error.response.data.status_code,
                success: false,
                errors: error.response.data.message
            }
        }
    }
}