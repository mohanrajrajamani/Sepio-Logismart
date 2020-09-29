import React, { Component } from "react";
import { Button, Container, Right, Left, Header, Input, Toast } from 'native-base';
import { Text, StatusBar, Image, View, TouchableOpacity, TextInput, ActivityIndicator, Platform, Dimensions, StyleSheet, TouchableHighlight, Keyboard } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import SearchableDropdown from '../trip/SearchableDropdownLockID';
import SearchablebleDropdown from '../trip/searchablebleDropdown';
import SearchablePhoneDropdown from '../trip/SearchablePhoneDropdown';
import { connect } from 'react-redux';
import * as filter from '../actions/filterAction';
import APIService from '../component/APIServices';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import MapView from 'react-native-maps';
import Modal from 'react-native-modalbox';
import Geocoder from 'react-native-geocoding';
const _ = require('lodash');
import AsyncStorage from '@react-native-community/async-storage';
import Header1 from '../component/Header';
import LinearGradient from 'react-native-linear-gradient';
import color from '../styles/StyleConstants';

class TrackEdit extends Component {
    filterOptions = [
        {
            value: 0,
            label: 'Completed'
        },
        {
            value: 1,
            label: 'Enroute'
        }
    ]

    constructor(props) {
        super(props);
        this.state = {
            data: [],
            vehicle: [],
            focus: false,
            search: this.filterOptions[0],
            showVehicleNoDropdown: false,
            DriverName: null,
            invoice: '',
            DriverNo: null,
            Lock_id: '',
            trip_status: '',
            singlePickerVisible: false,
            singlePickerSelectedItem: this.filterOptions[0],
            itemName: '',
            isDateSelected: false,
            isTimeSelected: false,
            newValue: null,
            tripdata: '',
            saveloading: false,
            progressText: 'Loading...',
            latitude: 0,
            longitude: 0,
            locationPredictions: [],
            multiGeofence: null,
            geofenceRange: '',

            showPhonePrefix: false,
            phonePrefix: [],
            phone_code: '',
            userdetails_phone_code: ''
        };
    }
    updateSize = (height) => {
        this.setState({
            height
        });
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

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
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
            this.showMessage("Select location first")
        }
        else {
            var tempArray = [...this.state.multiGeofence];
            console.log("tempArray : ", tempArray);
            var index = _.findIndex(tempArray, { geo_fencing_id: this.state.currentId })
            console.log("index : ", index);

            tempArray[index].geo_fencing_lat = this.state.latitude.toFixed(7);
            tempArray[index].geo_fencing_long = this.state.longitude.toFixed(7);
            console.log("current id : ", this.state.currentId);

            this.setState({
                locationPredictions: [],
                destination: "",

                multiGeofence: tempArray,
                // showMarkers
            }, () => { this.refs.modal1.close() });
        }

    }


    static navigationOptions = { header: null };

    getSelectedSortItem() {
        return _.find(this.filterOptions, { trip_status: this.props.trip_status });
    }

    DriverName(text) { this.setState({ DriverName: text }) }
    DriverNo(text) { this.setState({ DriverNo: text }); this.props.filterDriverNo(text) }
    Lock_id(text) { this.setState({ Lock_id: text }); this.props.filterChange(text) }

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async onFilterSelected() {
        this.setState({ saveloading: true }, async () => {
            var letters = /^[a-zA-Z_ ]*$/;
            if (this.state.DriverName == null || this.state.DriverName.match(letters)) {
                // console.log("Driver NO:", this.state.DriverNo);
                if (this.state.DriverNo == null || this.state.DriverNo == '' || this.state.DriverNo.length == 10 && /^\d+$/.test(this.state.DriverNo.toString())) {
                    var loginData = await AsyncStorage.getItem('user_token');
                    var body = {
                        trip_id: this.state.tripdata.trip_id || null,
                        trip_no: this.state.tripdata.trip_no || null,
                        lock_id: this.state.itemName ? this.state.itemName.id : this.state.tripdata ? this.state.tripdata.lock_id : null,
                        old_lock_id: this.state.itemName ? this.state.tripdata.lock_id : this.state.tripdata.lock_id,
                        f_asset_id: this.state.itemName ? this.state.itemName.itemName : this.state.tripdata ? this.state.tripdata.f_asset_id : null,
                        old_f_asset_id: this.state.itemName ? this.state.tripdata.f_asset_id : this.state.tripdata ? this.state.tripdata.f_asset_id : null,
                        lock_id_status: this.state.itemName.id ? 2 : 1,
                        driver_name: this.state.DriverName ? this.state.DriverName : this.state.DriverName == '' ? this.state.DriverName : this.state.tripdata ? this.state.tripdata.driver_name : null,
                        old_driver_name: this.state.DriverName ? this.state.tripdata.driver_name : this.state.tripdata.driver_name,
                        driver_name_status: this.state.DriverName == this.state.tripdata.driver_name ? 1 : 2,
                        driver_no: this.state.DriverNo ? this.state.DriverNo : this.state.tripdata.driver_no ? this.state.DriverNo == '' ? this.state.DriverNo : this.state.tripdata.driver_no : null,
                        driver_no_code: this.state.DriverNo ? this.state.phone_code : this.state.DriverNo == '' ? null : this.state.tripdata.driver_no_code ? this.state.phone_code : null,
                        old_driver_no: this.state.DriverNo ? this.state.tripdata.driver_no : this.state.DriverNo == '' ? this.state.tripdata.driver_no : null,
                        driver_no_status: this.state.DriverNo == this.state.tripdata.driver_no ? 1 : this.state.DriverNo == '' ? this.state.DriverNo ? 2 : 2 : this.state.DriverNo ? 2 : 1,
                        vehicle_number: this.state.vehicle.itemName ? this.state.vehicle.itemName : this.state.tripdata ? this.state.tripdata.vehicle_number : this.state.tripdata.vehicle_number,
                        old_vehicle_number: this.state.vehicle ? this.state.tripdata.vehicle_number : this.state.tripdata.vehicle_number,
                        vehicle_number_status: this.state.vehicle.itemName ? 2 : 1,
                        from: this.state.tripdata.from_location || null,
                        to: this.state.tripdata.to_location || null,
                        from_id: this.state.tripdata.from_location_id || null,
                        to_id: this.state.tripdata.to_location_id || null,
                        old_lock_vendor: this.state.itemName ? this.state.tripdata.lock_vendor : this.state.tripdata ? this.state.tripdata.lock_vendor : null,
                        new_lock_vendor: this.state.itemName ? this.state.itemName.lock_vendor : this.state.tripdata ? this.state.tripdata.lock_vendor : null,
                    }

                    var res = await APIService.execute('POST', APIService.URL + APIService.tripdetailschanged, body)
                    console.log("response track edit:", res)
                    if (res.status == 200) {
                        this.setState({ saveloading: false });
                        if (this.state.tripdata.geo_fencing_range !== null) {
                            if (this.state.tripdata.geo_fencing_range === null && this.state.geofenceRange !== "") {
                                if (this.state.multiGeofence[0].geo_fencing_lat != null) {
                                    this.editGeofence()
                                }
                                else {
                                    this.showMessage('Must add 1 latitude-longitude.')
                                }

                            }
                            else if (this.state.tripdata.geo_fencing_range !== null && this.state.geofenceRange === "") {
                                this.showMessage('Must add geofence range & 1 latitude-longitude.')
                            }
                            else if (this.state.tripdata.geo_fencing_range !== null && this.state.geofenceRange !== "") {
                                if (this.state.multiGeofence[0].geo_fencing_lat !== null) {
                                    this.editGeofence()
                                }
                                else {
                                    this.showMessage('Must add 1 latitude-longitude.')
                                }
                            }
                            else {
                                this.showMessage('Trip Edit Successfully')
                                // this.props.navigation.navigate('TrackHome', { item: this.state.data });
                                const resetAction = StackActions.reset({
                                    index: 0,
                                    actions: [
                                        NavigationActions.navigate({
                                            routeName: "TrackScreen",
                                            params: { item: this.state.data }
                                        })
                                    ]
                                });
                                this.props.navigation.dispatch(resetAction);
                                // this.props.navigation.navigate('TrackScreen');

                            }
                        }
                        else {
                            this.showMessage('Trip Edit Successfully')
                            // this.props.navigation.navigate('TrackScreen');
                            const resetAction = StackActions.reset({
                                index: 0,
                                actions: [
                                    NavigationActions.navigate({
                                        routeName: "TrackScreen",
                                        params: { item: this.state.data }
                                    })
                                ]
                            });
                            this.props.navigation.dispatch(resetAction);
                            // const resetAction = StackActions.reset({
                            //     index: 0,
                            //     actions: [
                            //         NavigationActions.navigate({
                            //             routeName: "TrackHome",
                            //             params: { item: this.state.data }
                            //         })
                            //     ]
                            // });
                            // this.props.navigation.dispatch(resetAction);
                        }
                    }
                    else {
                        this.showMessage('Something Went Wrong')
                        this.setState({ saveloading: false });

                    }
                }
                else {
                    this.showMessage('Please enter valid Driver number')
                    this.setState({ saveloading: false });
                }
            }
            else {
                this.showMessage('Please enter valid Driver name');
                this.setState({ saveloading: false });
            }

        })
    }

    async editGeofence() {
        if (this.state.multiGeofence[this.state.multiGeofence.length - 1].geo_fencing_lat === null) {
            this.showMessage("Add Geofence which is blank or remove if you not want to fill.")
        }
        else {
            var loginData = await AsyncStorage.getItem('user_token');
            const url = APIService.URL + 'dashboard/editgeofencing';
            var temp = [];
            if (this.state.multiGeofence[0].geo_fencing_lat !== null) {
                for (let i = 0; i < this.state.multiGeofence.length; i++) {
                    var data = {}
                    data.geo_fencing_lat = this.state.multiGeofence[i].geo_fencing_lat;
                    data.geo_fencing_long = this.state.multiGeofence[i].geo_fencing_long;
                    temp.push(data)
                }
            }
            else {
                temp = null;
            }
            var body = {
                geo_fencing_details: temp,
                trip_id: this.state.tripdata.trip_id,
                geo_fencing_range: this.state.geofenceRange === "" ? null : this.state.geofenceRange
            }

            fetch(url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (loginData)
                }
            })
                .then((response) => { return response.json(); })
                .then((res) => {
                    this.setState({ saveloading: false });

                    this.showMessage('Trip Edit Successfully')
                    const resetAction = StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({
                                routeName: "TrackScreen",
                                params: { item: this.state.data }
                            })
                        ]
                    });
                    this.props.navigation.dispatch(resetAction);
                    // this.props.navigation.navigate('TrackHome', { item: this.state.data });
                })
                .catch((error) => {
                    this.showMessage(error.message)
                    this.setState({ saveloading: false });
                })
        }
    }

    async componentDidMount() {
        this.setState({ loading: true })
        var loginData = await AsyncStorage.getItem('user_token');
        const url = APIService.URL + 'users/userdetails';
        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + (loginData)
            }
        })
            .then((response) => {
                return response.json();
            })
            .then(async (res) => {
                try {
                    console.log("user data comp : ", res.data);
                    var code = res.data[0].phone_code ? res.data[0].phone_code : res.data[0].mobile_no_code
                    this.setState({ userdetails_phone_code: code }, async () => {
                        this.setState({ tripdata: this.props.navigation.state.params.item }, () => {
                            this.props.filterVehicle(this.state.tripdata.vehicle_number);
                            this.props.filterDriverName(this.state.tripdata.driver_name);
                            this.setState({ DriverName: this.state.tripdata.driver_name });
                            this.setState({ DriverNo: this.state.tripdata.driver_no });

                            console.log("trip code : ", this.state.tripdata.driver_no_code)
                            if (this.state.tripdata.driver_no_code) {
                                this.setState({ phone_code: this.state.tripdata.driver_no_code })
                            }
                            else {
                                this.setState({ phone_code: this.state.userdetails_phone_code })
                            }

                            console.log("geo : ", this.state.tripdata.geo_fencing_range)
                            this.setState({ geofenceRange: this.state.tripdata.geo_fencing_range ? this.state.tripdata.geo_fencing_range.toString() : '' });

                            this.props.filterDriverNo(this.state.tripdata.driver_no);
                            this.props.filterChange(this.state.tripdata.f_asset_id);
                            this.getGeofenceDetails()
                        });
                    })
                }
                catch (e) {
                    console.log("error:", e)
                }
            })
            .catch((error) => {
                this.showMessage(error)
            })

    }

    async getPhoneCodes() {
        this.setState({ showPhonePrefix: true, loading: true }, () => {
            const url2 = APIService.URL + 'users/listcountrydetails'
            fetch(url2, {
                method: 'GET'
            }).then(response => {
                return response.json()
            })
                .then((responseJson) => {
                    if (responseJson.data.length > 0) {
                        console.log("responseJson : ", responseJson.data)
                        this.setState({ loading: false, phonePrefix: responseJson.data })
                    }
                    else {
                        this.setState({ showPhonePrefix: false })
                        this.showMessage("No phone code selected")
                    }
                })
                .catch(error => {
                    this.setState({ showPhonePrefix: false })
                    this.showMessage(error)
                })
        })

    }

    async getGeofenceDetails() {

        var loginData = await AsyncStorage.getItem('user_token');

        const url = APIService.URL + 'dashboard/listgeofencingdetails';
        console.log("url : ", url, " token : ", loginData);
        fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                company_id: this.state.tripdata.company_id,
                trip_id: this.state.tripdata.trip_id
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (loginData)
            }
        })
            .then((response) => { return response.json(); })
            .then((res) => {
                console.log("geofence : ", res.data)
                this.setState({ multiGeofence: res.data }, () => { console.log("inside : ", this.state.multiGeofence) });
                if (this.state.multiGeofence.length === 0) {
                    this.setState({
                        multiGeofence: [{
                            "geo_fencing_id": Date.now().toString(),
                            "geo_fencing_lat": null,
                            "geo_fencing_long": null
                        }], loading: false
                    });
                }
                else {
                    this.setState({ loading: false })
                }
            })
            .catch((error) => { this.showMessage(error.message) })
    }

    addMultiGeofence() {
        var tempArray = [...this.state.multiGeofence];
        tempArray.push({ geo_fencing_lat: null, geo_fencing_long: null, geo_fencing_id: Date.now().toString() })
        this.setState({ multiGeofence: tempArray })
    }

    deleteGeofence(geo_fencing_id) {
        var tempArray = [...this.state.multiGeofence];
        _.remove(tempArray, { geo_fencing_id })
        this.setState({ multiGeofence: tempArray })
    }

    async openModel(id) {
        this.setState({ currentId: id, latitude: 0, longitude: 0 }, () => {
            this.refs.modal1.open()
        })

    }

    LocktripID() {
        this.setState({ showResortDropdown: true },
            async () => {
                var loginData = await AsyncStorage.getItem('user_token');
                const url = APIService.URL + 'dashboard/listonlinelockdetails';
                fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (loginData)
                    }
                })
                    .then((response) => { return response.json(); })
                    .then((res) => {
                        if (res.data.length > 0) {
                            this.setState({ data: res.data });
                        } else {
                            this.setState({ showResortDropdown: false });
                            this.showMessage("No lock available")
                        }
                    })
                    .catch((error) => {
                        this.setState({ showResortDropdown: false });
                        this.showMessage(error.message)
                    })
            }); this.props.filterChange(this.state.itemName || this.state.tripdata.f_asset_id)
    }

    VehicleTripNumber() {
        this.setState({ showVehicleNoDropdown: true }, async () => {
            var loginData = await AsyncStorage.getItem('user_token');
            const url = APIService.URL + 'dashboard/listVehicle';
            fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (loginData)
                }
            })
                .then((response) => { return response.json(); })
                .then((res) => { this.setState({ vehicle: res.data }); this.arrayholder = res.data })
                .catch((error) => {
                    this.setState({ showVehicleNoDropdown: false })
                    this.showMessage(error.message)
                })
        });
    }

    geofence(text) {


        this.setState({ geofenceRange: text });

    }

    //loader
    renderModalContent = () => {
        if (this.state.showVehicleNoDropdown || this.state.showResortDropdown) {
            return (
                <View style={styles.overlay}>
                    <ActivityIndicator color="#fff" size="large" />
                    <Text style={{ marginTop: 20, fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{this.state.progressText}</Text>
                </View>
            );
        }
        else {
            return null;
        }
    }

    render() {
        console.log("locationPredictions : ", this.state.locationPredictions)

        return (
            <Container style={{ flex: 1, backgroundColor: '#EDEEF2' }}>
                {this.state.data.length > 0 ? (<SearchableDropdown
                    title={'Search By Trip ID'}
                    // this.state.tripdata.f_asset_id
                    selectedLock={this.state.tripdata.f_asset_id}
                    data={this.state.data}
                    onSelect={(selectedItem) => { this.setState({ itemName: selectedItem, showResortDropdown: false }) }}
                    onCancel={() => { this.setState({ showResortDropdown: false }) }}
                    isVisible={this.state.showResortDropdown === true} />) : null}
                {this.state.vehicle.length > 0 ? (<SearchablebleDropdown
                    title={'Search By Trip ID'}
                    data={this.state.vehicle}
                    onSelect={(selectedItem) => { this.setState({ vehicle: selectedItem, showVehicleNoDropdown: false }, () => { this.props.filterVehicle(selectedItem.itemName) }) }} onCancel={() => { this.setState({ showVehicleNoDropdown: false }) }} isVisible={this.state.showVehicleNoDropdown === true} />) : null}
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#FD8000" translucent={true} />

                <Header1 label={"Edit Trip"} expanded={true} onBack={() => { this.props.navigation.goBack() }} />
                {
                    this.state.loading ?
                        (<View style={{ flex: 1, backgroundColor: 'white' }}>
                            <View style={{ marginTop: heightPercentageToDP("3%") }}>
                                <ActivityIndicator size={'large'} color='#263C88' />
                            </View>

                        </View>) :
                        <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#EDEEF2', marginBottom: heightPercentageToDP('8%') }}>
                            <View style={{ flex: 1, margin: 10 }} >
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Vehicle Number:</Text>
                                    <Text style={{ fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>{this.state.vehicle.itemName ? this.state.tripdata.vehicle_number : null}</Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity onPress={() => this.VehicleTripNumber()} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.vehicle.itemName || this.state.tripdata.vehicle_number || 'Select Vehicle No'}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', flex: 1 }}>
                                    <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Driver Name:</Text>
                                </View>
                                <View style={{ flexDirection: 'row', flex: 1 }}>
                                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5, alignItems: 'center' }}>
                                        <Input value={this.state.DriverName} onFocus={() => this.setState({ focus: false })} placeholder={'Enter Driver Name'} clearIcon onChangeText={(text) => this.DriverName(text)} style={{ marginLeft: 5, justifyContent: 'center', alignSelf: 'center' }} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', flex: 1 }}>
                                    <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Driver No:</Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    {/* <View style={{ width: 40, marginLeft: 10, fontSize: 14, justifyContent: 'center', backgroundColor: '#f2f2f2', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                        <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#000' }}>+91</Text>
                                    </View> */}
                                    <TouchableOpacity onPress={() => { this.getPhoneCodes() }} style={{ width: widthPercentageToDP('20%'), backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', textAlign: 'center', color: '#000', marginTop: 9 }}>{this.state.phone_code}</Text>
                                    </TouchableOpacity>
                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity style={{ width: widthPercentageToDP('70%'), backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                            <Input value={this.state.DriverNo} maxLength={10} keyboardType='numeric' onFocus={() => this.setState({ focus: false })} placeholder={'Enter Driver No'} clearIcon onChangeText={(text) => this.DriverNo(text)} style={{ marginLeft: 5, }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', flex: 1 }}>
                                    <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Lock ID:</Text>
                                    <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}></Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity onPress={() => this.LocktripID()} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.itemName ? this.state.itemName.itemName + " " + (this.state.itemName.lock_vendor === 'jt' ? "(SP701)" : "(SP777)") : this.state.tripdata.f_asset_id + " " + (this.state.tripdata.lock_vendor === 'jt' ? "(SP701)" : "(SP777)") || 'Select Lock No'}</Text>
                                    </TouchableOpacity>
                                </View>
                                {
                                    this.state.tripdata.geo_fencing_range !== null ? <View>
                                        <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: widthPercentageToDP('5%') }}>
                                            <Text style={{ fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Geofence Details</Text>
                                        </View>
                                        <View
                                            style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, marginTop: 5, marginBottom: 15 }} />
                                        <View>
                                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 10, color: '#141312', fontWeight: 'bold' }}>Geofence Range(Mtrs)</Text>
                                        </View>
                                        <View style={{ flex: 1, flexDirection: 'row' }}>
                                            <View style={{ flex: 1, flexDirection: 'row'/*,margin:5*/, backgroundColor: '#F5F5F4', height: 40, width: widthPercentageToDP('100%'), marginLeft: 5, marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                <TextInput placeholder='Enter Geofence Range' maxLength={10} keyboardType='numeric' value={this.state.geofenceRange} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.geofence(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                            </View>
                                        </View>
                                        {
                                            this.state.multiGeofence !== null ? this.state.multiGeofence.map((r, i) => {
                                                return (
                                                    <View style={{ marginTop: widthPercentageToDP('3%'), flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            <View style={{ height: heightPercentageToDP('4%'), width: widthPercentageToDP('33%'), marginRight: 5, }}>
                                                                <Text style={{ fontSize: 16, justifyContent: 'center', color: '#000' }}>Latitude</Text>
                                                            </View>

                                                            <View style={{ height: heightPercentageToDP('4%'), width: widthPercentageToDP('33%'), marginRight: 5, }}>
                                                                <Text style={{ fontSize: 16, justifyContent: 'center', color: '#000' }}>Longitude</Text>
                                                            </View>
                                                        </View>
                                                        <View style={{ marginTop: widthPercentageToDP('-1%'), flexDirection: 'row' }}>
                                                            <View style={{ backgroundColor: '#F0F2F4', justifyContent: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('33%'), marginRight: 5, borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                                <Text style={{ fontSize: 16, color: '#000' }}>{r.geo_fencing_lat}</Text>
                                                            </View>

                                                            <View style={{ backgroundColor: '#F0F2F4', justifyContent: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('33%'), marginRight: 5, borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                                <Text style={{ fontSize: 16, color: '#000' }}>{r.geo_fencing_long}</Text>
                                                            </View>
                                                            {
                                                                this.state.geofenceRange !== "" ?
                                                                    <TouchableOpacity onPress={() => { this.openModel(r.geo_fencing_id) }}>
                                                                        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F4', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                                            <Image source={require('../../assets/images/map.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                                        </View>
                                                                    </TouchableOpacity> :
                                                                    <TouchableOpacity onPress={() => { this.showMessage("Enter geofence range") }}>
                                                                        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F4', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), marginRight: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                                                            <Image source={require('../../assets/images/map.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                                        </View>
                                                                    </TouchableOpacity>
                                                            }
                                                            {
                                                                i === 0 ?
                                                                    <TouchableOpacity onPress={() => { this.addMultiGeofence() }}>

                                                                        <View style={{ justifyContent: 'center', alignItems: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), }}>
                                                                            <Image source={require('../../assets/images/add.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                                        </View>
                                                                    </TouchableOpacity> : null
                                                            }
                                                            {
                                                                i != 0 ?
                                                                    <TouchableOpacity onPress={() => { this.deleteGeofence(r.geo_fencing_id) }}>

                                                                        <View style={{ justifyContent: 'center', alignItems: 'center', alignItems: 'center', height: heightPercentageToDP('5%'), width: widthPercentageToDP('10%'), }}>
                                                                            <Image source={require('../../assets/images/minus.png')} style={{ height: heightPercentageToDP('6%'), width: widthPercentageToDP('6%'), resizeMode: 'contain' }} />
                                                                        </View>
                                                                    </TouchableOpacity> : null
                                                            }
                                                        </View>
                                                    </View>
                                                )
                                            }) : null
                                        }
                                    </View> : null
                                }

                            </View>
                        </ScrollView>

                }
                {this.renderModalContent()}

                {/* <TouchableOpacity >
                        <Header style={{ backgroundColor: '#263C88' }}>
                            <Left>
                                <Button onPress={() => this.props.navigation.goBack()}
                                    transparent style={{ height: 57, width: widthPercentageToDP('50%'), marginLeft: -10, marginTop: -20, marginBottom: -20, justifyContent: 'center', backgroundColor: 'white' }}>
                                    <Text style={{ color: '#263C88', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>Cancel</Text>
                                </Button>
                            </Left>
                            <Right>
                                {this.state.saveloading ? <Body style={{ justifyContent: 'center', alignItems: 'center', marginLeft: widthPercentageToDP('20%') }}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                        <View>
                                            <ActivityIndicator size={'small'} color='white' />
                                        </View>
                                        <View>
                                            <Title style={{ fontSize: 16, fontFamily: 'avenir', paddingLeft: 10 }}>PLEASE WAIT...</Title>
                                        </View>
                                    </View>
                                </Body> :
                                    <Button onPress={() => this.onFilterSelected()} transparent style={{ height: 45, width: widthPercentageToDP('50%'), justifyContent: 'center' }}>
                                        <Text style={{ color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>Save</Text>
                                    </Button>}
                            </Right>
                        </Header>
                    </TouchableOpacity> */}
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
                                <Text style={styles.buttonCancel}>Back</Text>
                            </View>

                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.onFilterSelected()}>
                        <LinearGradient
                            colors={[color.gradientStartColor, color.gradientEndColor]}
                            start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                            style={[styles.center, {
                                width: widthPercentageToDP('50%'),
                                height: heightPercentageToDP('8%'),
                                borderWidth: 0.2,
                                borderTopRightRadius: widthPercentageToDP('2.5%'),
                            }]}>

                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={styles.buttonStart}>Save</Text>
                            </View>

                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {this.state.phonePrefix && this.state.phonePrefix.length > 0 ? (
                    <SearchablePhoneDropdown
                        title={'Select Phone Code'}
                        data={this.state.phonePrefix}
                        onSelect={(selectedItem) => { this.setState({ phone_code: selectedItem.phone_code, showPhonePrefix: false }) }}
                        onCancel={() => { this.setState({ showPhonePrefix: false }) }}
                        isVisible={this.state.showPhonePrefix === true} />
                ) : null}

                <Modal style={{ height: heightPercentageToDP('60%') }} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={false}  >

                    <View style={{ flex: 1, flexDirection: 'column' }}>

                        {
                            this.state.latitude !== 0 ?
                                <MapView
                                    // provider={PROVIDER_GOOGLE} // remove if not using Google Maps
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
                        <View>
                            {
                                this.state.locationPredictions.map(
                                    prediction => (
                                        prediction && prediction.id && prediction.description ? (
                                            <TouchableHighlight
                                                key={prediction.id}
                                                onPress={() => this.pressedPrediction(prediction)}>
                                                <Text style={styles.locationSuggestion}>
                                                    {prediction.description}
                                                </Text>
                                            </TouchableHighlight>) : null
                                    )
                                )
                            }
                        </View>


                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', marginTop: heightPercentageToDP('3%') }}>
                            <View>
                                <Button onPress={() => { this.setState({ destination: "" }, () => { this.refs.modal1.close() }) }} style={{ backgroundColor: '#EF534F', height: 45, width: widthPercentageToDP('30%'), justifyContent: 'center' }}>
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
            </Container>
        );
    }
}
function mapStateToProps(state) {
    return {
        search: state.search,
        vehicle: state.vehicle,
        DriverName: state.DriverName,
        DriverNo: state.DriverNo,
    }
}
export default connect(mapStateToProps, filter)(withNavigation(TrackEdit));
const styles = StyleSheet.create({
    overlay: {
        height: Platform.OS === "android" ? Dimensions.get("window").height : null,
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', alignSelf: 'center'
    },
    map: {
        ...StyleSheet.absoluteFillObject,
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
