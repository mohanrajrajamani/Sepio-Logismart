import React from "react";
import { Animated, UIManager, Keyboard, Text, Image, View, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Platform, Dimensions, TouchableHighlight } from 'react-native';
import { Button, Toast, CheckBox } from 'native-base';
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { withNavigation,StackActions,NavigationActions } from 'react-navigation';
import moment from "moment";
import APIService from '../component/APIServices';
var jwtDecode = require('jwt-decode');
import Modal from 'react-native-modalbox';
import Geocoder from 'react-native-geocoding';
const _ = require('lodash');
import MapView from 'react-native-maps';
import color from '../styles/StyleConstants';
import { connect } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-community/async-storage';
import Header from '../component/Header';
import SearchableDropdown from './searchablebleDropdown';
import SearchablePhoneDropdown from './SearchablePhoneDropdown';
import LinearGradient from 'react-native-linear-gradient';
const { State: TextInputState } = TextInput;

class TripAdd extends React.Component {

    fromLocationData = [];
    constructor(props) {
        super(props);
        this.state = {
            expanded: true,
            countMultriTripId: -1,
            isDateTimePickerVisible1: false,
            isDateTimePickerVisible2: false,
            isDateTimePickerVisible3: false,
            isDateTimePickerVisible4: false,
            isDateTimePickerVisible5: false,
            showfrmlocationDropdown: false,
            showtolocationDropdown: false,
            showvehicleDropdown: false,
            Vehicle_Model: [],
            toLocation_Model: [],
            from_model: [],
            addData: '',
            input: '',
            isarrDatePickerVisible: false,
            isTimePickerVisible1: false,
            isTimePickerVisible2: false,
            value: '',
            depdate: moment().format("DD MMM YYYY"),
            arrdate: moment().format("DD MMM YYYY"),
            invoicedate: '',
            billdate: '',
            billexdate: '',
            time1: moment().format('HH:mm'),
            time2: moment().format('HH:mm'),
            isVisible: true,
            isDateSelected: false,
            isTimeSelected: false,
            newValue: null,
            obj: {},
            loading: true,
            addloading: false,
            trip_no: '',
            vehicle_number: '',
            from: '',
            to: '',
            from_id: '',
            to_id: '',
            driver_name: '',
            exp_departure_timestamp: '',
            exp_arrival_timestamp: '',
            selectedItem: '',
            frmLocation: '',
            toLocation: '',
            vehicleData: '',
            itemName: '',
            id: '',
            location_name: '',
            data: [],
            fromLocation: '',
            from_Location: '',
            checked: false,
            dno: '',
            geofenceRange: "",
            to_Location: '',
            Vendor: '',
            from_location_id: '',
            progressText: 'Loading...',
            decode: '',
            isFromLocation: false,
            count: 1,
            showPhonePrefix: false,
            phonePrefix: [],
            phone_code: '',

            latitude: 0,
            longitude: 0,
            locationPredictions: [],
            multiGeofence: [{
                "id": Date.now().toString(),
                "latitude": null,
                "longitude": null
            }],
            showMarkers: [],
            // tempArray.push({ id: tempCount, fromLocationId: this.state.multiTrip[this.state.multiTrip.length - 1].toLocationId, fromLocation: this.state.multiTrip[this.state.multiTrip.length - 1].toLocation, toLocationId: this.state.to_location_id, toLocation: this.state.toLocation.itemName, depDate: depD, arrDate: arrD })
            multiTrip: [],
            shift: new Animated.Value(0),
        };
    }

    componentWillMount() {
        this.keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
        this.keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);
    }

    componentWillUnmount() {
        this.keyboardDidShowSub.remove();
        this.keyboardDidHideSub.remove();
    }

    handleKeyboardDidShow = (event) => {
        const { height: windowHeight } = Dimensions.get('window');
        const keyboardHeight = event.endCoordinates.height;
        const currentlyFocusedField = TextInputState.currentlyFocusedField();
        UIManager.measure(currentlyFocusedField, (originX, originY, width, height, pageX, pageY) => {
            const fieldHeight = height;
            const fieldTop = pageY;
            const gap = (windowHeight - keyboardHeight) - (fieldTop + fieldHeight);
            if (gap >= 0) {
                return;
            }
            Animated.timing(
                this.state.shift,
                {
                    toValue: gap,
                    duration: 1000,
                    useNativeDriver: true,
                }
            ).start();
        });
    }

    handleKeyboardDidHide = () => {
        Animated.timing(
            this.state.shift,
            {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }
        ).start();
    }

    checkInternet() {
        return new Promise((resolve, reject) => {
            NetInfo.fetch().then(state => {

                if (state.isConnected) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        })
    }

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async openModel(id) {
        if (this.state.geofenceRange === "0" || this.state.geofenceRange === "") {
            alert("Geofence cannot be 0")
        }
        else {
            this.setState({ currentId: id, latitude: 0, longitude: 0 }, () => {
                this.refs.modal1.open()
            })
        }


    }


    async onChangeDestination(destination) {
        this.setState({ destination });
        const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=AIzaSyB5yK-omrVdKiuWrb8XVaOXTJpYLpXACB8&input={${destination}}&location=${
            this.state.latitude
            },${this.state.longitude}&radius=2000`;
        const result = await fetch(apiUrl);
        const jsonResult = await result.json();
        this.setState({
            locationPredictions: jsonResult.predictions
        });
        console.log(jsonResult);
    }

    pressedPrediction(prediction) {
        //this.refs.modal1.close()
        console.log("selected : ", prediction);
        Keyboard.dismiss();
        this.setState({ destination: prediction.description });

        Geocoder.init("AIzaSyB5yK-omrVdKiuWrb8XVaOXTJpYLpXACB8", { language: "en" }); // set the language
        var location;
        Geocoder.from(this.state.destination)
            .then(json => {
                location = json.results[0].geometry.location;
                console.log("dest : ", location);

                this.setState({
                    locationPredictions: [],
                    latitude: location.lat, longitude: location.lng,
                    // showMarkers
                });

            })
            .catch(error => console.warn(error));
    }

    onSubmitPlace() {
        if (this.state.latitude === "" || this.state.latitude === 0 || this.state.longitude === "" || this.state.longitude === 0) {
            alert("Select location first")
        }
        else {
            var tempArray = [...this.state.multiGeofence];

            var index = _.findIndex(tempArray, { id: this.state.currentId })

            tempArray[index].latitude = this.state.latitude;
            tempArray[index].longitude = this.state.longitude;

            this.setState({
                locationPredictions: [],
                destination: "",
                multiGeofence: tempArray,
                // showMarkers
            }, () => { this.refs.modal1.close() });
        }

    }


    async componentDidMount() {


        var res = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)

        var code = res.data.data[0].phone_code ? res.data.data[0].phone_code : res.data.data[0].mobile_no_code
        this.setState({ phone_code: code }, async () => {
            this.state.decoded = jwtDecode(await AsyncStorage.getItem('user_token'));
            if (this.state.decoded.location_name != null) {
                this.state.decoded.location_name.forEach((locationName, index_of_locationName) => {
                    this.state.decoded.location_id.forEach((locationId, index_of_locationId) => {
                        if (index_of_locationName == index_of_locationId) {
                            this.fromLocationData.push({ "id": locationId, "itemName": locationName })
                        }
                    })
                });
            }
        })
    }

    getUserType() {
        //as per user type id
        if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
            this.adminDetails();
        }
        else if (this.state.decoded.user_type_id == 2) {
            this.userdetails();
        }
    }

    async userdetails() {

        var res = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)

        console.log("user data : ", res.data.data[0].logismart_dropdown[0]);
        if (res.data.data[0].role_id === null) {
            var data = []
            for (let i = 0; i < res.data.data[0].location_id.length; i++) {
                var details = {}
                details.id = res.data.data[0].location_id[i]
                details.itemName = res.data.data[0].location_name[i]
                data.push(details)
            }
        }
        else {
            if (res.data.data[0].logismart_dropdown[0] === 2 || res.data.data[0].logismart_dropdown[0] === 3) {
                data = []
                for (let i = 0; i < res.data.data[0].location_id.length; i++) {
                    details = {}
                    details.id = res.data.data[0].location_id[i]
                    details.itemName = res.data.data[0].location_name[i]
                    data.push(details)
                }
                if (this.state.isFromLocation) {
                    this.setState({ showfrmlocationDropdown: true, from_model: data });
                }
                else {
                    this.setState({ showtolocationDropdown: true, toLocation_Model: data });
                }
            }
            else if (res.data.data[0].logismart_dropdown[0] === 1) {
                this.ownedData();
            }
        }
    }

    async ownedData() {
        if (this.state.isFromLocation) {
            this.setState({ showfrmlocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                this.setState({ from_model: res.data.location_id })
            });
        }
        else {
            this.setState({ showtolocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                this.setState({ toLocation_Model: res.data.location_id })
            });
        }
    }

    async adminDetails() {
        if (this.state.isFromLocation) {
            this.setState({ showfrmlocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listlocationname, null)
                this.setState({ from_model: res.data.data })
            });
        }
        else {
            this.setState({ showtolocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listlocationname, null)
                this.setState({ toLocation_Model: res.data.data })
            });
        }
    }

    updateSize = (height) => {
        this.setState({
            height
        });
    }
    static navigationOptions =
        {
            header: null
        };
    driverName(text) {
        this.setState({ value: text });
    }
    driverNo(text) {
        this.setState({ dno: text });
    }

    geofence(text) {
        if (text.length === 0) {
            this.setState({
                geofenceRange: text, multiGeofence: [{
                    "id": Date.now().toString(),
                    "latitude": null,
                    "longitude": null
                }]
            });
        }
        else {
            this.setState({ geofenceRange: text.replace(/[- #*;,.<>\{\}\[\]\\\/]/gi, '') });
        }
    }


    invoiceNo(text) {
        this.setState({ inno: text });
    }
    eBillNO(text) {
        this.setState({ no: text });
    }
    lrNo(text) {
        this.setState({ input: text });
    }
    comment(text) {
        this.setState({ newValue: text })
    }

    async addTrip() {
        this.setState({ addloading: true }, async () => {
            var letters = /^[a-zA-Z_ ]*$/;
            if (this.state.multiTrip.length === 0) {

                if (this.state.value ? this.state.value.match(letters) : true) {
                    if (this.state.dno ? this.state.dno.length == 10 && /^\d+$/.test(this.state.dno.toString()) : true) {
                        if (this.state.invoicedate) {
                            var invoice_date = new Date(this.state.invoicedate);
                            var dd = invoice_date.getDate();
                            var mm = invoice_date.getMonth() + 1;
                            var yyyy = invoice_date.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            invoice_date = dd + '-' + mm + '-' + yyyy;
                        }

                        if (this.state.billdate) {
                            var E_way_bill = new Date(this.state.billdate);
                            var dd = E_way_bill.getDate();
                            var mm = E_way_bill.getMonth() + 1;
                            var yyyy = E_way_bill.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            E_way_bill = dd + '-' + mm + '-' + yyyy;
                        }

                        if (this.state.billexdate) {
                            var E_way_bill_exp = new Date(this.state.billexdate);
                            var dd = E_way_bill_exp.getDate();
                            var mm = E_way_bill_exp.getMonth() + 1;
                            var yyyy = E_way_bill_exp.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            E_way_bill_exp = dd + '-' + mm + '-' + yyyy;
                        }



                        if (this.state.depdate) {
                            var exp_departure_time = moment(this.state.depdate + ' ' + this.state.time1, 'DD MMM YYYY HH:mm').utc().unix();
                            // console.log("exp_departure_time", this.state.time1);
                        }

                        if (this.state.arrdate) {
                            var arrdate_time = moment(this.state.arrdate + ' ' + this.state.time2, 'DD MMM YYYY HH:mm').utc().unix();
                        }

                        if (this.state.vehicleData.itemName === undefined || this.state.vehicleData.itemName === null) {
                            alert("Please select Vehicle No");
                            this.setState({ addloading: false })
                        }
                        else if ((this.state.from_Location.from_location === undefined || this.state.from_Location.from_location === null) && (this.state.fromLocation.itemName === null || this.state.fromLocation.itemName === undefined || this.state.fromLocation.itemName === '')) {
                            alert("Please select From Location");
                            this.setState({ addloading: false })
                        }
                        else if ((this.state.to_Location.to_location === undefined || this.state.to_Location.to_location === null) && (this.state.toLocation.itemName === null || this.state.toLocation.itemName === undefined || this.state.toLocation.itemName === '')) {
                            alert("Please select To Location");
                            this.setState({ addloading: false })
                        }
                        else if (this.state.from_location_id ? (this.state.from_location_id == this.state.to_location_id || this.state.from_location_id == this.state.toLocation.id) : (this.state.fromLocation.id == undefined ? true : this.state.fromLocation.id == this.state.toLocation.id)) {
                            alert("From location and To location can not be same");
                            this.setState({ addloading: false })
                        }
                        else if (exp_departure_time >= arrdate_time) {
                            alert("Expected departure date and time must be less than Expected arrival date and time");
                            this.setState({ addloading: false })
                        }
                        else {
                            var temp = [];
                            if (this.state.geofenceRange === "" && this.state.multiGeofence[0].latitude !== null) {
                                alert("Enter Geofence Range.");
                                this.setState({ addloading: false })
                            }
                            else if (this.state.geofenceRange !== "" && this.state.multiGeofence[0].latitude === null) {
                                alert("Add latitude and longitude.");
                                this.setState({ addloading: false })
                            }
                            else {


                                for (let i = 0; i < this.state.multiGeofence.length; i++) {
                                    var data = {}
                                    data.geo_fencing_lat = this.state.multiGeofence[i].latitude;
                                    data.geo_fencing_long = this.state.multiGeofence[i].longitude;
                                    temp.push(data)
                                }

                                if (this.state.geofenceRange === "") {
                                    this.setState({ geofenceRange: null })
                                }
                                if (temp.length === 0) {
                                    temp = null
                                }

                                var body = {
                                    trip_type: "single",
                                    trip_no: "",
                                    vehicle_number: this.state.vehicleData.itemName || null,
                                    from: this.state.fromLocation.itemName || this.state.from_Location.from_location || null,
                                    to: this.state.toLocation.itemName || this.state.to_Location.to_location || null,
                                    from_id: this.state.from_location_id || this.state.fromLocation.id || null,
                                    to_id: this.state.toLocation.id || this.state.to_location_id || null,
                                    driver_name: this.state.value ? this.state.value : null,
                                    driver_no: this.state.dno || null,
                                    driver_no_code: this.state.dno ? this.state.phone_code : null,
                                    invoice_no: this.state.inno !== undefined ? this.state.inno : null,
                                    invoice_date: invoice_date || null,
                                    e_way_bill_no: this.state.no || null,
                                    e_way_bill_date: E_way_bill !== undefined ? E_way_bill : null,
                                    e_way_bill_expiry: E_way_bill_exp !== undefined ? E_way_bill_exp : null,
                                    lr_number: this.state.input || null,
                                    exp_departure_timestamp: exp_departure_time || null,
                                    exp_arrival_timestamp: arrdate_time || null,
                                    trip_comments: this.state.newValue || null,
                                    history: this.state.checked,
                                    event_city: null,
                                    event_lat: null,
                                    event_long: null,
                                    geo_fencing_range: this.state.geofenceRange || null,
                                    geo_fencing_details: temp,
                                    sub_trip_count: 1,
                                    all_trip_details: null
                                }
                                console.log("body:", body)
                                var res = await APIService.execute('POST', APIService.URL + APIService.addtripdetails, body)
                                if (res.data.message === "Error occured.") {
                                    this.showMessage("Trip not created")
                                }
                                else {
                                    this.setState({ addloading: false })
                                    const resetAction = StackActions.reset({
                                        index: 0,
                                        actions: [
                                            NavigationActions.navigate({
                                                routeName: "TripListScreen",
                                                params: { item: this.state.data }
                                            })
                                        ]
                                    });
                                    this.props.navigation.dispatch(resetAction);
                                }
                            }
                        }


                    }
                    else {
                        alert('Please enter valid Driver number')
                        this.setState({ addloading: false })
                    }
                }
                else {
                    alert('Please enter valid Driver name');
                    this.setState({ addloading: false })
                }
            }
            else if (this.state.multiTrip.length === 1) {
                if (this.state.value ? this.state.value.match(letters) : true) {
                    if (this.state.dno ? this.state.dno.length == 10 && /^\d+$/.test(this.state.dno.toString()) : true) {
                        
                        if (this.state.invoicedate) {
                            var invoice_date = new Date(this.state.invoicedate);
                            var dd = invoice_date.getDate();
                            var mm = invoice_date.getMonth() + 1;
                            var yyyy = invoice_date.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            invoice_date = dd + '-' + mm + '-' + yyyy;
                        }

                        if (this.state.billdate) {
                            var E_way_bill = new Date(this.state.billdate);
                            var dd = E_way_bill.getDate();
                            var mm = E_way_bill.getMonth() + 1;
                            var yyyy = E_way_bill.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            E_way_bill = dd + '-' + mm + '-' + yyyy;
                        }

                        if (this.state.billexdate) {
                            var E_way_bill_exp = new Date(this.state.billexdate);
                            var dd = E_way_bill_exp.getDate();
                            var mm = E_way_bill_exp.getMonth() + 1;
                            var yyyy = E_way_bill_exp.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            E_way_bill_exp = dd + '-' + mm + '-' + yyyy;
                        }


                        var temp = [];
                        if (this.state.geofenceRange === "" && this.state.multiGeofence[0].latitude !== null) {
                            alert("Enter Geofence Range.");
                            this.setState({ addloading: false })
                        }
                        else if (this.state.geofenceRange !== "" && this.state.multiGeofence[0].latitude === null) {
                            alert("Add latitude and longitude.");
                            this.setState({ addloading: false })
                        }
                        else {


                            for (let i = 0; i < this.state.multiGeofence.length; i++) {
                                var data = {}
                                data.geo_fencing_lat = this.state.multiGeofence[i].latitude;
                                data.geo_fencing_long = this.state.multiGeofence[i].longitude;
                                temp.push(data)
                            }

                            if (this.state.geofenceRange === "") {
                                this.setState({ geofenceRange: null })
                            }
                            if (temp.length === 0) {
                                temp = null
                            }

                            // sendArrayMultiTripObject['sub_from_location'] = this.state.multiTrip[i].fromLocation
                            //     sendArrayMultiTripObject['sub_to_location'] = this.state.multiTrip[i].toLocation
                            //     sendArrayMultiTripObject['sub_from_location_id'] = this.state.multiTrip[i].fromLocationId
                            //     sendArrayMultiTripObject['sub_to_location_id'] = this.state.multiTrip[i].toLocationId
                            //     sendArrayMultiTripObject['sub_exp_departure_timestamp'] = moment(this.state.multiTrip[i].depDate).utc().unix()
                            //     sendArrayMultiTripObject['sub_exp_arrival_timestamp'] = moment(this.state.multiTrip[i].arrDate).utc().unix()


                            var body = {
                                trip_type: "single",
                                trip_no: "",
                                vehicle_number: this.state.vehicleData.itemName || null,
                                from: this.state.multiTrip[0].fromLocation,
                                to: this.state.multiTrip[0].toLocation,
                                from_id: this.state.multiTrip[0].fromLocationId,
                                to_id: this.state.multiTrip[0].toLocationId,
                                driver_name: this.state.value ? this.state.value : null,
                                driver_no: this.state.dno || null,
                                driver_no_code: this.state.dno ? this.state.phone_code : null,
                                invoice_no: this.state.inno !== undefined ? this.state.inno : null,
                                invoice_date: invoice_date || null,
                                e_way_bill_no: this.state.no || null,
                                e_way_bill_date: E_way_bill !== undefined ? E_way_bill : null,
                                e_way_bill_expiry: E_way_bill_exp !== undefined ? E_way_bill_exp : null,
                                lr_number: this.state.input || null,
                                exp_departure_timestamp: moment(this.state.multiTrip[0].depDate).utc().unix(),
                                exp_arrival_timestamp: moment(this.state.multiTrip[0].arrDate).utc().unix(),
                                trip_comments: this.state.newValue || null,
                                history: this.state.checked,
                                event_city: null,
                                event_lat: null,
                                event_long: null,
                                geo_fencing_range: this.state.geofenceRange || null,
                                geo_fencing_details: temp,
                                sub_trip_count: 1,
                                all_trip_details: null
                            }
                            console.log("body:", body)

                            var res = await APIService.execute('POST', APIService.URL + APIService.addtripdetails, body)
                            if (res.data.message === "Error occured.") {
                                this.showMessage("Trip not created")
                            }
                            else {
                                this.setState({ addloading: false })
                                const resetAction = StackActions.reset({
                                    index: 0,
                                    actions: [
                                        NavigationActions.navigate({
                                            routeName: "TripListScreen",
                                            params: { item: this.state.data }
                                        })
                                    ]
                                });
                                this.props.navigation.dispatch(resetAction);
                            }
                        }
                    }
                    else {
                        alert('Please enter valid Driver number')
                        this.setState({ addloading: false })
                    }
                }
                else {
                    alert('Please enter valid Driver name');
                    this.setState({ addloading: false })
                }
            }

            else {
                if (this.state.value ? this.state.value.match(letters) : true) {
                    if (this.state.dno ? this.state.dno.length == 10 && /^\d+$/.test(this.state.dno.toString()) : true) {
                        
                        if (this.state.invoicedate) {
                            var invoice_date = new Date(this.state.invoicedate);
                            var dd = invoice_date.getDate();
                            var mm = invoice_date.getMonth() + 1;
                            var yyyy = invoice_date.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            invoice_date = dd + '-' + mm + '-' + yyyy;
                        }

                        if (this.state.billdate) {
                            var E_way_bill = new Date(this.state.billdate);
                            var dd = E_way_bill.getDate();
                            var mm = E_way_bill.getMonth() + 1;
                            var yyyy = E_way_bill.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            E_way_bill = dd + '-' + mm + '-' + yyyy;
                        }

                        if (this.state.billexdate) {
                            var E_way_bill_exp = new Date(this.state.billexdate);
                            var dd = E_way_bill_exp.getDate();
                            var mm = E_way_bill_exp.getMonth() + 1;
                            var yyyy = E_way_bill_exp.getFullYear();
                            if (dd < 10) {
                                dd = "0" + dd;
                            }
                            if (mm < 10) {
                                mm = "0" + mm;
                            }
                            E_way_bill_exp = dd + '-' + mm + '-' + yyyy;
                        }



                        var temp = [];
                        if (this.state.geofenceRange === "" && this.state.multiGeofence[0].latitude !== null) {
                            alert("Enter Geofence Range.");
                            this.setState({ addloading: false })
                        }
                        else if (this.state.geofenceRange !== "" && this.state.multiGeofence[0].latitude === null) {
                            alert("Add latitude and longitude.");
                            this.setState({ addloading: false })
                        }
                        else {


                            for (let i = 0; i < this.state.multiGeofence.length; i++) {
                                var data = {}
                                data.geo_fencing_lat = this.state.multiGeofence[i].latitude;
                                data.geo_fencing_long = this.state.multiGeofence[i].longitude;
                                temp.push(data)
                            }

                            if (this.state.geofenceRange === "") {
                                this.setState({ geofenceRange: null })
                            }
                            if (temp.length === 0) {
                                temp = null
                            }

                            var sendArrayMultiTrip = []
                            for (var i = 0; i < this.state.multiTrip.length; i++) {
                                var sendArrayMultiTripObject = {}
                                sendArrayMultiTripObject['sub_from_location'] = this.state.multiTrip[i].fromLocation
                                sendArrayMultiTripObject['sub_to_location'] = this.state.multiTrip[i].toLocation
                                sendArrayMultiTripObject['sub_from_location_id'] = this.state.multiTrip[i].fromLocationId
                                sendArrayMultiTripObject['sub_to_location_id'] = this.state.multiTrip[i].toLocationId
                                sendArrayMultiTripObject['sub_exp_departure_timestamp'] = moment(this.state.multiTrip[i].depDate).utc().unix()
                                sendArrayMultiTripObject['sub_exp_arrival_timestamp'] = moment(this.state.multiTrip[i].arrDate).utc().unix()

                                console.log("object : ", sendArrayMultiTripObject)

                                sendArrayMultiTrip.push(sendArrayMultiTripObject);
                            }
                            console.log("object : ", sendArrayMultiTrip)

                            var body = {
                                trip_no: "",
                                trip_type: "multi",
                                vehicle_number: this.state.vehicleData.itemName || null,
                                from: sendArrayMultiTrip[0].sub_from_location,
                                to: this.state.multiTrip[this.state.multiTrip.length - 1].toLocation,
                                from_id: sendArrayMultiTrip[0].sub_from_location_id,
                                to_id: this.state.multiTrip[this.state.multiTrip.length - 1].toLocationId,
                                driver_name: this.state.value ? this.state.value : null,
                                driver_no: this.state.dno || null,
                                driver_no_code: this.state.dno ? this.state.phone_code : null,
                                invoice_no: this.state.inno !== undefined ? this.state.inno : null,
                                invoice_date: invoice_date || null,
                                e_way_bill_no: this.state.no || null,
                                e_way_bill_date: E_way_bill !== undefined ? E_way_bill : null,
                                e_way_bill_expiry: E_way_bill_exp !== undefined ? E_way_bill_exp : null,
                                lr_number: this.state.input || null,
                                exp_departure_timestamp: sendArrayMultiTrip[0].sub_exp_departure_timestamp,
                                exp_arrival_timestamp: sendArrayMultiTrip[sendArrayMultiTrip.length - 1].sub_exp_arrival_timestamp,
                                trip_comments: this.state.newValue || null,
                                history: this.state.checked,
                                event_city: null,
                                event_lat: null,
                                event_long: null,
                                geo_fencing_range: this.state.geofenceRange,
                                geo_fencing_details: temp,
                                sub_trip_count: sendArrayMultiTrip.length,
                                all_trip_details: sendArrayMultiTrip
                            }
                            console.log("body:", body)

                            var res = await APIService.execute('POST', APIService.URL + APIService.addtripdetails, body)
                            if (res.data.message === "Error occured.") {
                                this.showMessage("Trip not created")
                            }
                            else {
                                this.setState({ addloading: false })
                                const resetAction = StackActions.reset({
                                    index: 0,
                                    actions: [
                                        NavigationActions.navigate({
                                            routeName: "TripListScreen",
                                            params: { item: this.state.data }
                                        })
                                    ]
                                });
                                this.props.navigation.dispatch(resetAction);
                            }
                        }


                    }
                    else {
                        alert('Please enter valid Driver number')
                        this.setState({ addloading: false })
                    }
                }
                else {
                    alert('Please enter valid Driver name');
                    this.setState({ addloading: false })
                }
            }

        })
    }

    searchVehicle() {
        this.setState({ showvehicleDropdown: true }, async () => {
            var res = await APIService.execute('GET', APIService.URL + APIService.listVehicle, null)
            if (res.data.data.length > 0) {
                this.setState({ loading: false, Vehicle_Model: res.data.data })
            }
            else {
                this.setState({ showvehicleDropdown: false })
                this.showMessage("No Vehicle No available")
            }
        })
    }

    async getPhoneCodes() {
        this.setState({ showPhonePrefix: true, loading: true }, async () => {
            var responseJson = await APIService.execute('GET', APIService.URL + APIService.listcountrydetails, null)
            if (responseJson.data.data.length > 0) {
                this.setState({ loading: false, phonePrefix: responseJson.data.data })
            }
            else {
                this.setState({ showPhonePrefix: false })
                this.showMessage("No phone code selected")
            }
        })

    }

    //Departure
    _showDateTimePicker1 = () => this.setState({ isDateTimePickerVisible1: true, });
    _hideDateTimePicker1 = () => this.setState({ isDateTimePickerVisible1: false });
    _showDateTimePicker2 = () => this.setState({ isDateTimePickerVisible2: true });
    _hideDateTimePicker2 = () => this.setState({ isDateTimePickerVisible2: false });
    _showDateTimePicker3 = () => this.setState({ isDateTimePickerVisible3: true });
    _hideDateTimePicker3 = () => this.setState({ isDateTimePickerVisible3: false });
    _showDateTimePicker4 = () => this.setState({ isDateTimePickerVisible4: true });
    _hideDateTimePicker4 = () => this.setState({ isDateTimePickerVisible4: false });
    _showDateTimePicker5 = () => this.setState({ isDateTimePickerVisible5: true });
    _hideDateTimePicker5 = () => this.setState({ isDateTimePickerVisible5: false });

    _handleDatePicked1 = (name, date) => {
        this._hideDateTimePicker1();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };
    _handleDatePicked2 = (name, date) => {
        this._hideDateTimePicker2();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };

    _handleDatePicked3 = (name, date) => {
        this._hideDateTimePicker3();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };

    _handleDatePicked4 = (name, date) => {
        this._hideDateTimePicker4();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };

    _handleDatePicked5 = (name, date) => {
        this._hideDateTimePicker5();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };

    //Time   
    _showTimePicker1 = () => this.setState({ isTimePickerVisible1: true });
    _hideTimePicker1 = () => this.setState({ isTimePickerVisible1: false });

    _handleTimePicked1 = (time) => {
        this._hideTimePicker1();
        const newtime1 = moment(time).format('HH:mm');
        this.setState({ time1: newtime1 })
        this.state.isTimeSelected = true;
    };

    _showTimePicker2 = () => this.setState({ isTimePickerVisible2: true });
    _hideTimePicker2 = () => this.setState({ isTimePickerVisible2: false });

    _handleTimePicked2 = (time) => {
        this._hideTimePicker2();
        const newtime2 = moment(time).format('HH:mm');
        this.setState({ time2: newtime2 })
        this.state.isTimeSelected = true;
    };

    //loader
    renderModalContent = () => {
        if (this.state.showvehicleDropdown || this.state.showfrmlocationDropdown || this.state.showtolocationDropdown) {
            return (
                <View style={styles.overlay}>
                    <ActivityIndicator color="#fff" size="large" />
                    <Text style={{ marginTop: 20, fontSize: widthPercentageToDP('4%'), fontWeight: 'bold', color: '#fff' }}>{this.state.progressText}</Text>
                </View>
            );
        }
        else {
            return null;
        }
    }


    addMultiGeofence() {
        var tempArray = [...this.state.multiGeofence];
        tempArray.push({ latitude: null, longitude: null, id: Date.now().toString() })
        this.setState({ multiGeofence: tempArray })
    }

    deleteGeofence(id) {
        var tempArray = [...this.state.multiGeofence];
        _.remove(tempArray, { id })
        this.setState({ multiGeofence: tempArray })
    }

    addMultiTrip() {

        if (this.state.depdate === "" || this.state.time1 === "") {
            alert("Please select departure date and time");
            this.setState({ addloading: false })
        }
        else if (this.state.arrdate === "" || this.state.time2 === "") {
            alert("Please select arrival date and time");
            this.setState({ addloading: false })
        }

        else if (this.state.vehicleData.itemName === undefined || this.state.vehicleData.itemName === null) {
            alert("Please select Vehicle No");
            this.setState({ addloading: false })
        }
        else if ((this.state.from_Location.from_location === undefined || this.state.from_Location.from_location === null) && (this.state.fromLocation.itemName === null || this.state.fromLocation.itemName === undefined || this.state.fromLocation.itemName === '')) {
            alert("Please select From Location");
            this.setState({ addloading: false })
        }
        else if ((this.state.to_Location.to_location === undefined || this.state.to_Location.to_location === null) && (this.state.toLocation.itemName === null || this.state.toLocation.itemName === undefined || this.state.toLocation.itemName === '')) {
            alert("Please select To Location");
            this.setState({ addloading: false })
        }
        else {
            // moment().format('HH:mm')
            var depD = moment(this.state.depdate).format("DD MMM YYYY") + " " + this.state.time1;
            var arrD = moment(this.state.arrdate).format("DD MMM YYYY") + " " + this.state.time2;

            var tempArray = [...this.state.multiTrip];
            var tempCount = 0;

            var depDate = moment(depD).unix();
            var arrDate = moment(arrD).unix();

            var currentDate = moment().utc().unix();
            if (depDate < currentDate) {
                alert("Departure date-time should be greater than current.")
                this.setState({ addloading: false })
            }
            else if (arrDate < currentDate) {
                alert("Arrival date-time should be greater than current.")
                this.setState({ addloading: false })
            }
            else {
                if (this.state.multiTrip.length === 0) {

                    if ((this.state.from_location_id || this.state.fromLocation.id) == (this.state.toLocation.id || this.state.to_location_id)) {
                        alert("From location and To location can not be same");
                        this.setState({ addloading: false })
                    }
                    else {
                        tempArray.push({ countMultriTripId: this.state.countMultriTripId + 1, id: this.state.countMultriTripId + 1, fromLocationId: this.state.from_location_id || this.state.fromLocation.id, fromLocation: this.state.fromLocation.itemName || this.state.from_Location.from_location, toLocationId: this.state.toLocation.id || this.state.to_location_id, toLocation: this.state.toLocation.itemName || this.state.to_Location.to_location, depDate: depD, arrDate: arrD })
                        this.setState({ toLocation: '' })
                    }
                }
                else {
                    var startDate = moment(this.state.multiTrip[0].depDate).unix();
                    var endDate = moment(this.state.multiTrip[this.state.multiTrip.length - 1].arrDate).unix();

                    if (depDate >= startDate && depDate <= endDate) {
                        alert("Expected departure date-time should be greater than your previous arrival date-time");
                        this.setState({ addloading: false })
                    }
                    else if (arrDate >= startDate && arrDate <= endDate) {
                        alert("Expected arrival date-time should be greater than your previous arrival date-time");
                        this.setState({ addloading: false })
                    }
                    else {
                        if (this.state.multiTrip[this.state.multiTrip.length - 1].toLocationId == this.state.to_location_id) {
                            alert("From location and To location can not be same");
                            this.setState({ addloading: false })
                        }
                        else {
                            tempCount = this.state.countMultriTripId + 1;
                            tempArray.push({ id: tempCount, fromLocationId: this.state.multiTrip[this.state.multiTrip.length - 1].toLocationId, fromLocation: this.state.multiTrip[this.state.multiTrip.length - 1].toLocation, toLocationId: this.state.to_location_id, toLocation: this.state.toLocation.itemName, depDate: depD, arrDate: arrD })
                            this.setState({ toLocation: '' })
                        }
                    }

                }
            }
            this.setState({ countMultriTripId: tempCount, multiTrip: tempArray, time1: '', time2: '' }, () => { console.log("array data : ", this.state.multiTrip) })
        }
    }

    deleteMultitrip(id) {

        var dataArray = [...this.state.multiTrip];
        var fArray = _.findIndex(dataArray, function (o) { return o.id == id; });
        console.log("fArray : ", fArray)
        if (fArray === 0 || fArray === this.state.multiTrip.length - 1) {
            var tempArray = [...this.state.multiTrip];
            _.remove(tempArray, { id })

            for (var i = 1; i < tempArray.length; i++) {
                tempArray[i].fromLocation = tempArray[i - 1].toLocation;
                tempArray[i].fromLocationId = tempArray[i - 1].toLocationId;

            }
            this.setState({ multiTrip: tempArray })
            for (var j = 0; j < tempArray.length; j++) {
                if (tempArray[j].fromLocationId === tempArray[j].toLocationId) {
                    var id = tempArray[j].id;
                    _.remove(tempArray, { id })
                    isThere = false;
                }
            }
            this.setState({ multiTrip: tempArray })
        }
        else {
            var previousData = this.state.multiTrip[fArray - 1];
            var nextData = this.state.multiTrip[fArray + 1]
            console.log("pData : ", previousData)
            console.log("nData : ", nextData)
            if (previousData.toLocationId === nextData.toLocationId) {
                alert("Current sub trip From and next trip To should not be same.")
            }
            else {
                var tempArray = [...this.state.multiTrip];
                _.remove(tempArray, { id })

                for (var i = 1; i < tempArray.length; i++) {
                    tempArray[i].fromLocation = tempArray[i - 1].toLocation;
                    tempArray[i].fromLocationId = tempArray[i - 1].toLocationId;

                }
                this.setState({ multiTrip: tempArray })
                for (var j = 0; j < tempArray.length; j++) {
                    if (tempArray[j].fromLocationId === tempArray[j].toLocationId) {
                        var id = tempArray[j].id;
                        _.remove(tempArray, { id })
                        isThere = false;
                    }
                }
                this.setState({ multiTrip: tempArray })
            }
        }
    }

    render() {
        const { shift } = this.state;
        const { newValue, height } = this.state;
        const locationPredictions = this.state.locationPredictions.map(
            prediction => (
                <TouchableHighlight
                    key={prediction.id}
                    onPress={() => this.pressedPrediction(prediction)}>
                    <Text style={styles.locationSuggestion}>
                        {prediction.description}
                    </Text>
                </TouchableHighlight>
            )
        );
        let newStyle = { height, marginLeft: 5 }
        return (
            <Animated.View style={[styles.container, { transform: [{ translateY: shift }] }]}>
                <Header label={"Add Trip"} expanded={this.state.expanded} onBack={() => { this.props.navigation.goBack() }} />
                <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#EDEEF2', marginBottom: heightPercentageToDP('10%') }}>
                    <View style={{ flex: 1, margin: 10 }} >
                        <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                            <Text style={{ fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Mandatory Information</Text>
                        </View>
                        <View
                            style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, marginTop: 5, marginBottom: 15 }} />
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Vehicle No:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={() => this.searchVehicle()} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.vehicleData.itemName || "Select Vehicle No"}</Text>
                            </TouchableOpacity>
                        </View>

                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Vendor:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: '#949494', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.Vendor.vendor || "---"}</Text>
                            </View>
                        </View>

                        {
                            this.state.multiTrip.map((r, i) => {
                                return (
                                    <View style={{ backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5, marginTop: i === 0 ? widthPercentageToDP('3%') : widthPercentageToDP('1%'), flex: 1, flexDirection: 'column', margin: 5, marginBottom: 10, marginLeft: 5, justifyContent: 'space-between' }}>


                                        <View style={{ height: 35, backgroundColor: "#007BFF", width: widthPercentageToDP('50%'), justifyContent: 'center' }}>
                                            <Text style={{ padding: widthPercentageToDP('2%'), color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>Sub-Trip {i + 1}</Text>
                                        </View>

                                        <View style={{ height: 40, marginLeft: 5, flexDirection: 'row' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Image source={require('../../assets/images/flags-green.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                <Text style={{ fontSize: 16, justifyContent: 'center', alignSelf: 'center', color: '#000', width: widthPercentageToDP('50%') }} numberOfLines={2}>{r.fromLocation}</Text>
                                            </View>
                                            <View style={{ justifyContent: 'center', flex: 1, alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 16, color: '#000', width: widthPercentageToDP('42%'), marginLeft: widthPercentageToDP('1%') }} numberOfLines={1}>{r.depDate}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => { this.deleteMultitrip(r.id) }}>
                                                <View style={{ justifyContent: 'center' }}>
                                                    <Image source={require('../../assets/images/close.png')} style={{ height: 16, width: 16, marginRight: widthPercentageToDP('0.5%'), justifyContent: 'flex-start', alignSelf: 'flex-end', resizeMode: 'contain' }} />
                                                </View>
                                            </TouchableOpacity>

                                        </View>

                                        <View
                                            style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, margin: 5 }} />
                                        <View style={{ height: 40, marginLeft: 5, flexDirection: 'row' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                <Text style={{ fontSize: 16, justifyContent: 'center', alignSelf: 'center', color: '#000', width: widthPercentageToDP('50%') }} numberOfLines={2}>{r.toLocation}</Text>
                                            </View>
                                            <View style={{ justifyContent: 'center', flex: 1, alignItems: 'flex-end' }}>
                                                <Text style={{ fontSize: 16, color: '#000', width: widthPercentageToDP('42%'), marginLeft: widthPercentageToDP('1%') }} numberOfLines={1}>{r.arrDate}</Text>
                                            </View>
                                            <View>
                                                <Image style={{ height: 16, width: 16, marginRight: widthPercentageToDP('0.5%'), justifyContent: 'flex-start', alignSelf: 'flex-end', resizeMode: 'contain' }} />
                                            </View>
                                        </View>


                                    </View>
                                )

                            })
                        }
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>From*:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            {
                                this.state.multiTrip.length === 0 ?
                                    <TouchableOpacity onPress={() => this.setState({ isFromLocation: true }, () => { this.getUserType() })} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9, }}>{this.state.fromLocation.itemName || this.state.from_Location.from_location || "Select From Location"}</Text>
                                    </TouchableOpacity> :
                                    <View onPress={() => this.setState({ isFromLocation: true }, () => { this.getUserType() })} style={{ backgroundColor: '#949494', flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9, }}>{this.state.multiTrip[this.state.multiTrip.length - 1].toLocation}</Text>
                                    </View>
                            }

                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>To*:</Text>
                        </View>
                        <View>

                            {
                                this.state.multiTrip.length === 0 ?
                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity onPress={() => this.setState({ isFromLocation: false }, () => { this.getUserType() })} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                            <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.toLocation.itemName || this.state.to_Location.to_location || "Select To Location"}</Text>
                                        </TouchableOpacity>
                                    </View> : <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity onPress={() => this.setState({ isFromLocation: false }, () => { this.getUserType() })} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                            <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.toLocation.itemName || "Select To Location"}</Text>
                                        </TouchableOpacity>
                                    </View>
                            }
                        </View>



                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Expected Departure Date*:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showDateTimePicker1} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                {/* <Text style={{ fontSize: 14, color: 'black', marginRight: 5, fontFamily: 'avenir', marginLeft: 8 }}>Please Select Date: </Text> */}
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.depdate}</Text>
                            </TouchableOpacity>
                            <DateTimePicker
                                isVisible={this.state.isDateTimePickerVisible1}
                                onConfirm={(value) => this._handleDatePicked1('depdate', moment(value).format("DD MMM YYYY"))}
                                onCancel={this._hideDateTimePicker1} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Expected Arrival Date:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showDateTimePicker2} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.arrdate}</Text>
                            </TouchableOpacity>
                            <DateTimePicker
                                isVisible={this.state.isDateTimePickerVisible2}
                                onConfirm={(value) => this._handleDatePicked2('arrdate', moment(value).format("DD MMM YYYY"))}
                                onCancel={this._hideDateTimePicker2} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Expected Departure Time*:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showTimePicker1} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.time1}</Text>
                            </TouchableOpacity>
                            <DateTimePicker
                                isVisible={this.state.isTimePickerVisible1}
                                onConfirm={this._handleTimePicked1}
                                onCancel={this._hideTimePicker1}
                                mode={'time'}
                                is24Hour={true}
                            />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Expected Arrival Time*:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showTimePicker2} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.time2}</Text>
                            </TouchableOpacity>
                            <DateTimePicker
                                isVisible={this.state.isTimePickerVisible2}
                                onConfirm={this._handleTimePicked2}
                                onCancel={this._hideTimePicker2}
                                mode={'time'}
                                is24Hour={true} />
                        </View>

                        <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', marginTop: widthPercentageToDP('3%') }}>
                            <Button onPress={() => { this.addMultiTrip() }} style={{ height: 45, width: widthPercentageToDP('50%'), justifyContent: 'center' }}>
                                <Text style={{ color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>Add Destination</Text>
                            </Button>
                        </View>

                        <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: widthPercentageToDP('5%') }}>
                            <Text style={{ fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Geofence Details</Text>
                        </View>
                        <View
                            style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, marginTop: 5, marginBottom: 15 }} />
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 10, color: '#141312', fontWeight: 'bold' }}>Geofence Range(Mtrs)</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <View style={{ flex: 1, flexDirection: 'row'/*,margin:5*/, backgroundColor: '#F5F5F4', height: 40, width: widthPercentageToDP('100%'), marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <TextInput placeholder='Enter Geofence Range' maxLength={10} keyboardType='numeric' value={this.state.geofenceRange} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.geofence(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                            </View>
                        </View>

                        {
                            this.state.multiGeofence.map((r, i) => {
                                return (

                                    <View style={{ marginTop: widthPercentageToDP('3%'), flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <View style={{ height: heightPercentageToDP('4%'), width: widthPercentageToDP('33%'), marginRight: 5, }}>
                                                <Text style={{ fontSize: 16, justifyContent: 'center', color: '#000' }}>Latitude</Text>
                                            </View>

                                            <View style={{ height: heightPercentageToDP('4%'), width: widthPercentageToDP('33%'), marginRight: 5, }}>
                                                <Text style={{ fontSize: 16, justifyContent: 'center', color: '#000' }}>Longitude</Text>
                                            </View>
                                        </View>
                                        <View style={{ marginTop: widthPercentageToDP('-1%'), flexDirection: 'row' }}>
                                            <View style={{ backgroundColor: '#949494', justifyContent: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('33%'), marginRight: 5, borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                <Text style={{ fontSize: 16, color: '#000' }}>{r.latitude}</Text>
                                            </View>

                                            <View style={{ backgroundColor: '#949494', justifyContent: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('33%'), marginRight: 5, borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                <Text style={{ fontSize: 16, color: '#000' }}>{r.longitude}</Text>
                                            </View>

                                            {
                                                this.state.geofenceRange !== "" ?
                                                    <TouchableOpacity onPress={() => { this.openModel(r.id) }}>
                                                        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F4', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                            <Image source={require('../../assets/images/map.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                        </View>
                                                    </TouchableOpacity> :
                                                    <TouchableOpacity onPress={() => { alert("Enter geofence range") }}>
                                                        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F4', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                            <Image source={require('../../assets/images/map.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                        </View>
                                                    </TouchableOpacity>
                                            }


                                            {
                                                i === 0 ?
                                                    this.state.multiGeofence[this.state.multiGeofence.length - 1].latitude !== null ?
                                                        <TouchableOpacity onPress={() => { this.addMultiGeofence() }}>

                                                            <View style={{ justifyContent: 'center', alignItems: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), }}>
                                                                <Image source={require('../../assets/images/add.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                            </View>
                                                        </TouchableOpacity> : <TouchableOpacity onPress={() => { alert("Enter geofence details") }}>

                                                            <View style={{ justifyContent: 'center', alignItems: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), }}>
                                                                <Image source={require('../../assets/images/add.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                            </View>
                                                        </TouchableOpacity> : null
                                            }
                                            {
                                                i != 0 ?
                                                    <TouchableOpacity onPress={() => { this.deleteGeofence(r.id) }}>

                                                        <View style={{ justifyContent: 'center', alignItems: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), }}>
                                                            <Image source={require('../../assets/images/minus.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                        </View>
                                                    </TouchableOpacity> : null
                                            }


                                        </View>
                                    </View>

                                )
                            })
                        }




                        <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: widthPercentageToDP('5%') }}>
                            <Text style={{ fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Optional Information</Text>
                        </View>
                        <View
                            style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, marginTop: 5, marginBottom: 15 }} />
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 10, color: '#141312', fontWeight: 'bold' }}>Driver Name:</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <View style={{ flex: 1, flexDirection: 'row'/*,margin:5*/, backgroundColor: '#F5F5F4', height: 40, width: widthPercentageToDP('100%'), marginLeft: 5, marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <TextInput placeholder='Enter Driver Name' pattern={['/^[A-Za-z]+$/']} value={this.state.value} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.driverName(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                            </View>
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 10, marginBottom: 10, color: '#141312', fontWeight: 'bold' }}>Driver No:</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            {/* <View style={{ width: 40, marginLeft: 10, fontSize: 14, justifyContent: 'center', backgroundColor: '#f2f2f2', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#000' }}>+91</Text>
                            </View> */}

                            <TouchableOpacity onPress={() => { this.getPhoneCodes() }} style={{ width: widthPercentageToDP('20%'), backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', textAlign: 'center', color: '#000', marginTop: 9 }}>{this.state.phone_code}</Text>
                            </TouchableOpacity>

                            <View style={{ flex: 1, flexDirection: 'row'/*,margin:5*/, backgroundColor: '#F5F5F4', height: 40, width: widthPercentageToDP('100%'), marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <TextInput placeholder='Enter Driver Number' maxLength={10} keyboardType='numeric' value={this.state.dno} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.driverNo(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                            </View>
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 10, marginBottom: 10, color: '#141312', fontWeight: 'bold' }}>Invoice No:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1, flexDirection: 'row'/*,margin:5*/, backgroundColor: '#F5F5F4', height: 40, width: widthPercentageToDP('100%'), marginLeft: 5, marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <TextInput placeholder='Enter Invoice Number' inno={this.state.inno} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.invoiceNo(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                            </View>
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 10, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Invoice Date:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showDateTimePicker3} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                {/* <Text style={{ fontSize: 14, color: 'black', marginRight: 5, fontFamily: 'avenir', marginLeft: 8 }}>Please Select Date: </Text> */}
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.invoicedate || 'Select Invoice Date'}</Text>
                            </TouchableOpacity>
                            <DateTimePicker
                                isVisible={this.state.isDateTimePickerVisible3}
                                onConfirm={(value) => this._handleDatePicked3('invoicedate', moment(value).format("DD MMM YYYY"))}
                                onCancel={this._hideDateTimePicker3} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 10, color: '#141312', fontWeight: 'bold' }}>E-way Bill No:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1, flexDirection: 'row'/*,margin:5*/, backgroundColor: '#F5F5F4', height: 40, width: widthPercentageToDP('100%'), marginLeft: 5, marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <TextInput placeholder='Enter E-Way Number' no={this.state.no} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.eBillNO(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                            </View>
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 10, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>E-way Bill Date:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showDateTimePicker4} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.billdate || 'Select E-way Bill Date'}</Text>
                            </TouchableOpacity>
                            <DateTimePicker
                                isVisible={this.state.isDateTimePickerVisible4}
                                onConfirm={(value) => this._handleDatePicked4('billdate', moment(value).format("DD MMM YYYY"))}
                                onCancel={this._hideDateTimePicker4} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>E-way Bill Expiry Date:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showDateTimePicker5} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.billexdate || 'Select E-way Bill Expiry Date'}</Text>
                            </TouchableOpacity>
                            <DateTimePicker
                                isVisible={this.state.isDateTimePickerVisible5}
                                onConfirm={(value) => this._handleDatePicked5('billexdate', moment(value).format("DD MMM YYYY"))}
                                onCancel={this._hideDateTimePicker5} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 10, color: '#141312', fontWeight: 'bold' }}>LR No:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1, flexDirection: 'row'/*,margin:5*/, backgroundColor: '#F5F5F4', height: 40, width: widthPercentageToDP('100%'), marginLeft: 5, marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <TextInput placeholder='Enter LR Number' input={this.state.input} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.lrNo(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                            </View>
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 10, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Comments:</Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                            <TextInput editable={true} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'flex-start', height: 80 }}
                                placeholder='Add Comments' placeholderTextColor='#000' style={[newStyle]} multiline={true} value={this.state.newValue}
                                onChangeText={text => this.comment(text)}
                                onContentSizeChange={(e) => this.updateSize(e.nativeEvent.contentSize.height)}
                            />
                        </View>

                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-start' }}>
                            <CheckBox checked={this.state.isVisible} style={{ marginRight: 5, backgroundColor: this.state.checked === true ? "#263C88" : "white", borderColor: this.state.checked === true ? "#263C88" : "#263C88", marginTop: 10, width: 25, height: 24, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 5 }}
                                onPress={() => this.setState({ checked: !this.state.checked })} />
                            {this.state.checked ?
                                <TouchableOpacity onPress={() => this.setState({ checked: !this.state.checked })}>
                                    <Text style={{ marginHorizontal: 20, flex: 1, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 11, fontSize: 16, fontWeight: 'bold' }}>Save Vehicle history for future</Text>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => this.setState({ checked: !this.state.checked })}>
                                    <Text style={{ marginHorizontal: 20, flex: 1, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 11, fontSize: 16 }}>Save Vehicle history for future</Text>
                                </TouchableOpacity>
                            }
                        </View>
                        {/* { this.state.showvehicleDropdown?  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}> <ActivityIndicator /> </View>:null} */}
                    </View>
                </ScrollView>
                

                <View style={{ flex: 1, position: 'absolute', bottom: 0, flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
                        <View
                            style={[styles.center, {
                                width: widthPercentageToDP('50%'),
                                height: heightPercentageToDP('8%'),
                                borderTopLeftRadius: widthPercentageToDP('2.5%'),
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.8,
                                shadowColor: '#CECECE',
                                shadowRadius: 3,
                                elevation: 4,
                                backgroundColor: '#FFFFFF',
                                borderWidth: 0.2
                            }]}>

                            <View style={{ height: heightPercentageToDP('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                <Text style={styles.buttonCancel}>Cancel</Text>
                            </View>

                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.addTrip()}>
                        <LinearGradient
                            colors={[color.gradientStartColor, color.gradientEndColor]}
                            start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                            style={[styles.center, {
                                width: widthPercentageToDP('50%'),
                                height: heightPercentageToDP('8%'),
                                borderWidth: 0.2,
                                borderTopRightRadius: widthPercentageToDP('2.5%'),
                            }]}>
                            {
                                this.state.addloading === true ? (
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <View style={{ paddingRight: 10 }}>
                                            <ActivityIndicator size={'small'} color='#FFFFFF' />
                                        </View>
                                        <View>
                                            <Text style={styles.btntext}>{'Please Wait...'}</Text>
                                        </View>
                                    </View>
                                ) : (
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                            <Text style={styles.buttonStart}>Submit</Text>
                                        </View>
                                    )
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                {this.renderModalContent()}
                {this.state.from_model.length > 0 ? (
                    <SearchableDropdown
                        title={'Select From Location'}
                        data={this.state.from_model}
                        onSelect={(selectedItem) => { this.setState({ fromLocation: selectedItem, from_location_id: selectedItem.id, showfrmlocationDropdown: false, }) }}
                        onCancel={() => { this.setState({ showfrmlocationDropdown: false }) }}
                        isVisible={this.state.showfrmlocationDropdown === true} />)
                    : null}
                {this.state.toLocation_Model.length > 0 ? (
                    <SearchableDropdown
                        title={'Select To Location'}
                        data={this.state.toLocation_Model}
                        onSelect={(selectedItem) => { this.setState({ toLocation: selectedItem, to_location_id: selectedItem.id, showtolocationDropdown: false }) }}
                        onCancel={() => { this.setState({ showtolocationDropdown: false }) }}
                        isVisible={this.state.showtolocationDropdown === true} />
                ) : null}

                {this.state.phonePrefix && this.state.phonePrefix.length > 0 ? (
                    <SearchablePhoneDropdown
                        title={'Select Phone Code'}
                        data={this.state.phonePrefix}
                        onSelect={(selectedItem) => { this.setState({ phone_code: selectedItem.phone_code, showPhonePrefix: false }) }}
                        onCancel={() => { this.setState({ showPhonePrefix: false }) }}
                        isVisible={this.state.showPhonePrefix === true} />
                ) : null}

                {this.state.Vehicle_Model.length > 0 ? (
                    <SearchableDropdown
                        title={'Select Vehicle'}
                        data={this.state.Vehicle_Model}
                        onSelect={async (selectedItem) => {
                            this.setState({ vehicleData: selectedItem, showvehicleDropdown: false });

                            var decoded = jwtDecode(await AsyncStorage.getItem('user_token'));
                            var res = await APIService.execute('GET', APIService.URL + APIService.vehiclehistory + '?vehicle_number=' + this.state.vehicleData.itemName, null)
                            console.log("res:", decoded)
                            if (decoded.location_name != null) {
                                for (i = 0; i < decoded.location_name.length; i++) {
                                    if (decoded.location_name[i] === res.data.data.from_location) {
                                        this.setState({ from_Location: res.data.data, from_location_id: res.data.data.from_location_id });
                                    }
                                }
                                this.setState({
                                    loading: false,
                                    value: res.data.data.driver_name,
                                    dno: res.data.data.driver_no,
                                    to_Location: res.data.data,
                                    Vendor: res.data.data,
                                    driver_name_vehicle: res.data.data,
                                    checked: res.data.data.history,
                                    to_location_id: res.data.data.to_location_id
                                })
                            } else {
                                this.setState({ from_Location: res.data.data, from_location_id: res.data.data.from_location_id });

                                console.log("vehicle:", res.data)
                                this.setState({
                                    loading: false,
                                    value: res.data.data.driver_name,
                                    dno: res.data.data.driver_no,
                                    to_Location: res.data.data,
                                    Vendor: res.data.data,
                                    driver_name_vehicle: res.data.data,
                                    checked: res.data.data.history,
                                    to_location_id: res.data.data.to_location_id
                                })

                            }


                        }}
                        onCancel={() => { this.setState({ showvehicleDropdown: false }) }}
                        isVisible={this.state.showvehicleDropdown === true} />) : null}

                <Modal style={[styles.modal, styles.modal2, { height: heightPercentageToDP('60%') }]} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={false}  >

                    <View style={{ flex: 1, flexDirection: 'column' }}>

                        {
                            this.state.latitude !== 0 ?
                                <MapView

                                    style={{
                                        marginTop: heightPercentageToDP('3%'),
                                        marginLeft: widthPercentageToDP('5%'),
                                        marginRight: widthPercentageToDP('5%'),
                                        marginBottom: widthPercentageToDP('2%'), height: heightPercentageToDP('35%'), marginTop: widthPercentageToDP('1%')
                                    }}
                                    showsUserLocation={true}
                                    zoomEnabled={true}
                                    zoomControlEnabled={true}

                                    scrollEnabled={false}
                                    initialRegion={{
                                        latitude: this.state.latitude,
                                        longitude: this.state.longitude,
                                        latitudeDelta: 0.015,
                                        longitudeDelta: 0.0121
                                    }} >
                                    <MapView.Marker
                                        coordinate={{
                                            latitude: this.state.latitude,
                                            longitude: this.state.longitude,
                                            // latitudeDelta: 0.015,
                                            // longitudeDelta: 0.0121,
                                        }}>

                                    </MapView.Marker>
                                </MapView> : null
                        }


                        <TextInput
                            placeholder="Enter location.."
                            style={styles.destinationInput}
                            onChangeText={destination => {
                                this.setState({ destination });
                                this.onChangeDestination(destination);
                            }}
                            value={this.state.destination}


                        />
                        {locationPredictions}

                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', marginTop: heightPercentageToDP('3%') }}>
                            <View>
                                <Button onPress={() => { this.setState({ destination: "", }), this.refs.modal1.close() }} style={{ backgroundColor: '#EF534F', height: 45, width: widthPercentageToDP('30%'), justifyContent: 'center' }}>
                                    <Text style={{ color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>Cancel</Text>
                                </Button>
                            </View>
                            <View>
                                <Button onPress={() => { this.onSubmitPlace() }} style={{ backgroundColor: '#398BF7', height: 45, width: widthPercentageToDP('30%'), justifyContent: 'center' }}>
                                    <Text style={{ color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>Submit</Text>
                                </Button>
                            </View>
                        </View>
                    </View>

                </Modal>
            </Animated.View>
        );

    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: color.pageBackground,
        flex: 1,
        height: '100%',
        justifyContent: 'space-around',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%'
    },
    overlay: {
        height: Platform.OS === "android" ? Dimensions.get("window").height : null,
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', alignSelf: 'center'
    },
    line: {
        marginTop: widthPercentageToDP('-1%'),
        marginLeft: widthPercentageToDP('2%'),
        marginRight: widthPercentageToDP('2%'),
        marginBottom: widthPercentageToDP('1%'),
        borderBottomColor: '#828EA5',
        borderBottomWidth: 0.5,
    },
    destinationInput: {
        borderWidth: 0.5,
        borderColor: "grey",
        height: 40,
        marginTop: heightPercentageToDP('3%'),
        marginLeft: widthPercentageToDP('5%'),
        marginRight: widthPercentageToDP('5%'),
        marginBottom: widthPercentageToDP('2%'),
        padding: 5,
        backgroundColor: "white",
        borderRadius: 5
    },
    locationSuggestion: {
        backgroundColor: "white",
        padding: 5,
        fontSize: 18,
        borderWidth: 0.5
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    buttonStart: {
        fontSize: widthPercentageToDP('5%'),
        color: '#FFFFFF',
        fontFamily: 'Nunito-Bold',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    buttonCancel: {
        fontSize: widthPercentageToDP('5%'),
        color: '#000000',
        fontFamily: 'Nunito-Bold',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(TripAdd));