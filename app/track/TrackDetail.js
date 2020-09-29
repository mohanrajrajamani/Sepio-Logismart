import React, { Component } from "react";
import { Button, Container, Content, Fab, Footer, Toast, Right, Left, Body, Title, Header, Subtitle } from 'native-base';
import { Text, StatusBar, Image, View, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import moment from "moment";
import MapView from 'react-native-maps'; // remove PROVIDER_GOOGLE import if not using Google Maps
import call from 'react-native-phone-call';
import APIService from '../component/APIServices';
import AsyncStorage from '@react-native-community/async-storage';
const _ = require('lodash');
import Modal from 'react-native-modalbox';
import Header1 from '../component/Header';

class TrackDetail extends Component {
    decoded;
    call = () => {
        //handler to make a call
        const args = { number: this.state.data.driver_no, prompt: false };
        call(args).catch(console.error);
    };
    static navigationOptions =
        { header: null };
    constructor(props) {
        super();
        this.state = {
            data: '', lock_data: '', trip_detail_route: '', trip_route: [], maploader: true,
            decoded: '',
            userDetails: [],
            multiGeofence: '',
            geo_fencing_range: null
        }
    }

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async componentDidMount() {
        this.loadmore();
        this.props.navigation.addListener('didFocus', () => { this.loadmore(); });
    }
    async loadmore() {
        this.setState({ data: this.props.navigation.state.params.item }, () => { this.userdetails() })
        var loginData = await AsyncStorage.getItem('user_token');
        var jwtDecode = require('jwt-decode');
        this.setState({ decoded: jwtDecode(loginData) })
        const url = APIService.URL + 'dashboard/listtripeventdetails?trip_id=' + this.state.data.trip_id + '&user_type_id=' + this.state.decoded.user_type_id + '&location_id=' + this.state.decoded.location_id + '&access_right=' + this.state.decoded.access_right;
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
                try {
                    console.log("trip data : ", res.data)
                    this.setState({ lock_data: res.data });
                    this.getSubTrips()
                    this.getGeofenceDetails()
                }
                catch (e) {
                    this.showMessage(e.message)
                }
            })
            .catch((error) => { this.showMessage(error) })
        if (this.state.data.trip_route) {
            this.getJSON(JSON.parse(JSON.stringify(this.state.data.trip_route)));
        }
        else {
            this.setState({ maploader: false });
        }
    }

    async getGeofenceDetails() {

        var loginData = await AsyncStorage.getItem('user_token');
        const url = APIService.URL + 'dashboard/listgeofencingdetails';
        console.log("url : ", url, " token : ", loginData);
        fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                company_id: this.state.data.company_id,
                trip_id: this.state.data.trip_id
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (loginData)
            }
        })
            .then((response) => { return response.json(); })
            .then((res) => {
                if (res.data.length > 0) {
                    this.setState({ multiGeofence: res.data, geo_fencing_range: res.data[0].geo_fencing_range });
                }
                else {
                    this.setState({ multiGeofence: res.data });
                }
            })
            .catch((error) => { this.showMessage(error.message) })
    }

    async userdetails() {

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
                    if (res.data[0].status === 2) {
                        this.refs.modal1.open()
                    }
                    else if (res.data[0].status === 1) {
                        this.setState({ userDetails: res.data[0].logismart_feature_id })
                    }
                }
                catch (e) {
                    console.log("error:", e)
                }
            })
            .catch((error) => {
                this.showMessage(error)
            })
    }

    logout = async () => {
        this.setState({ loading: true });
        try {
            var token = await AsyncStorage.getItem('user_token');
            var url = APIService.URL + APIService.updatefcm;
            let data = {
                fcm: null
            }
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (token)
            }
            try {
                await axios.put(url, data, {
                    headers: headers
                })
                await AsyncStorage.removeItem('user_token', null);
                await AsyncStorage.removeItem('fcm_token', null);
                await AsyncStorage.removeItem('USER_DATA', null);
                const resetAction = StackActions.reset({
                    index: 0,
                    actions: [
                        NavigationActions.navigate({
                            routeName: "LoginScreen"
                        })
                    ]
                });
                this.props.navigation.dispatch(resetAction);
                return true;
            }
            catch (error) {
                this.showMessage("Something went wrong!!");
            }
        }
        catch (exception) {
            this.setState({ loading: false });
            return false;
        }
    }

    getJSON(trip_route) {
        console.log("before trip_route:", trip_route)
        fetch(trip_route)
            .then(async (response) => {
                try {
                    var resp = await response.json();
                    console.log("working")
                    return resp;
                }
                catch (e) {
                    console.log('parse error ', e);
                    return [];
                }
            })
            .then((responseJson) => {
                console.log("res:", responseJson)
                this.setState({ trip_detail_route: responseJson });
                var array = responseJson[responseJson.length - 1]
                this.setState({ trip_route: array, maploader: false });

                // if(responseJson[responseJson.length]!=0){
                // this.setState({ trip_detail_route: responseJson });
                // var array = responseJson[responseJson.length - 1]
                // this.setState({ trip_route: array, maploader:false });
                // }else{
                //     this.setState({ trip_route: null, maploader:false });
                // }
            })
            .catch((error) => {
                this.showMessage(error)
                this.setState({ trip_route: [], maploader: false });

            });

    }

    async conformUnlock() {
        var loginData = await AsyncStorage.getItem('user_token');
        console.log("vendor : ", this.state.data.lock_vendor)

        fetch(APIService.lOCK_URL + 'remoteUnlock', {
            method: 'POST',
            body: JSON.stringify({
                asset_id: this.state.data.f_asset_id,
                trip_id: this.state.data.trip_id,
                user_id: this.state.decoded._id,
                user_name: this.state.decoded.first_name + ' ' + this.state.decoded.last_name,
                user_email: this.state.decoded.email,
                lock_vendor: this.state.data.lock_vendor
            }),
            headers: {
                Accept: 'application/json',
                'Authorization': 'Bearer ' + (loginData),
                'Content-Type': 'application/json'
            }
        }).then(async (response) => { return response.json(); })
            .then((responseJson) => { console.log("response : ", responseJson); this.showMessage(responseJson.message); this.setState({ loading: false }) })
            .catch(error => { this.showMessage(error.message); this.setState({ loading: false }); })
        this.setState({ loading: false })
    }

    async getSubTrips() {
        var loginData = await AsyncStorage.getItem('user_token');

        const url = APIService.URL + 'dashboard/listsubtripdetails?' + 'trip_id=' + this.state.data.trip_id;
        console.log("url : ", url, " token : ", loginData);
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
                console.log("multi trip : ", res.data)
                this.setState({ multiTrip: res.data })
            })
            .catch((error) => { this.showMessage(error.message) })
    }

    async RemoteUnlock() {
        this.setState({ loading: true })
        Alert.alert(
            'Confirmation',
            'Do you want to unlock this vehicle remotely ?',
            [
                { text: 'Yes', onPress: () => this.conformUnlock() },
                { text: 'No', onPress: () => this.setState({ loading: false }) }
            ],
            { cancelable: false }
        );
    }

    openEditScreen() {
        console.log("inside ")
        this.props.navigation.navigate('TrackEdit', { item: this.state.data })
    }

    render() {
        return (
            <Container style={{ backgroundColor: '#EDEEF2' }}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#FD8000" translucent={true} />
                {
                    this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                        <Header1 editURL={() => { this.openEditScreen() }} edit={true} label={"Trip ID: " + this.state.data.trip_id || '---'} expanded={true} onBack={() => { this.props.navigation.goBack() }} /> :
                        this.state.decoded.user_type_id === 2 ?
                            this.state.userDetails === null || this.state.userDetails.indexOf(48) > -1 ? <Header1 editURL={() => { this.openEditScreen() }} edit={true} label={"Trip ID: " + this.state.data.trip_id || '---'} expanded={true} onBack={() => { this.props.navigation.goBack() }} />
                                : <Header1 label={"Trip ID: " + this.state.data.trip_id || '---'} expanded={true} onBack={() => { this.props.navigation.goBack() }} /> : <Header label={"Trip ID: " + this.state.data.trip_id || '---'} expanded={true} onBack={() => { this.props.navigation.goBack() }} />
                }
                <Header transparent style={{ backgroundColor: '#263C88', height: heightPercentageToDP('25%') }}>
                    <Left style={{ justifyContent: 'center', flex: 1, alignItems: 'center', alignSelf: 'center', flexDirection: 'column' }}>
                        <Button transparent>
                            <Image source={require('../../assets/images/green-truck.png')} style={{ height: 70, width: 170, resizeMode: 'contain' }} />
                        </Button>
                        <Button transparent style={{ width: widthPercentageToDP('18%') }} transparent>
                            <Text style={{ fontSize: 14, color: '#fff', marginTop: 10, fontWeight: 'bold' }}>{this.state.data.from_location || '---'}</Text>
                        </Button>
                    </Left>
                    <Body style={{ justifyContent: 'flex-start', alignItems: 'flex-start', alignSelf: 'flex-start' }}>
                        <Image source={require('../../assets/images/arrow-dotted-line.png')} style={{ height: 100, width: 200, resizeMode: 'contain', marginLeft: -25 }} />
                    </Body>
                    <Right style={{ flex: 1, justifyContent: 'flex-start', flexDirection: 'column', marginRight: 10 }}>
                        <Button transparent >
                            <Image source={require('../../assets/images/red-truck.png')} style={{ height: 70, width: 70, resizeMode: 'contain' }} />
                        </Button>
                        <Button transparent style={{ width: widthPercentageToDP('25%') }} >
                            <Text style={{ fontSize: 14, color: '#fff', marginTop: 10, fontWeight: 'bold' }}>{this.state.data.to_location || '---'}</Text>
                        </Button>
                    </Right>
                </Header>
                <ScrollView style={{ flex: 1, backgroundColor: '#EDEEF2' }}>


                    <View style={{ margin: 10 }}>
                        {
                            this.state.data.sub_trip_count > 1 ?
                                <View>
                                    {
                                        this.state.multiTrip ? this.state.multiTrip.map((r, i) => {
                                            return (
                                                <View style={{ backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5, marginTop: i === 0 ? widthPercentageToDP('3%') : widthPercentageToDP('1%'), flex: 1, flexDirection: 'column', margin: 5, marginBottom: 10, marginLeft: 5, justifyContent: 'space-between' }}>
                                                    <View style={{ height: 35, backgroundColor: "#007BFF", width: widthPercentageToDP('50%'), justifyContent: 'center' }}>
                                                        <Text style={{ padding: widthPercentageToDP('2%'), color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>Sub-Trip {i + 1}</Text>
                                                    </View>
                                                    <View style={{ height: 40, marginLeft: 5, flexDirection: 'row' }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            <Image source={require('../../assets/images/flags-green.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                            <Text style={{ fontSize: 16, justifyContent: 'center', alignSelf: 'center', color: '#000', width: widthPercentageToDP('37%') }} numberOfLines={2}>{r.sub_from_location}</Text>
                                                        </View>
                                                        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 16, color: '#000', width: widthPercentageToDP('41%'), marginLeft: widthPercentageToDP('1%') }} numberOfLines={1}>{moment.unix(r.sub_exp_departure_timestamp).format("DD MMM YYYY HH:mm")}</Text>
                                                        </View>

                                                    </View>

                                                    <View style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, margin: 5 }} />
                                                    <View style={{ height: 40, marginLeft: 5, flexDirection: 'row' }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                            <Text style={{ fontSize: 16, justifyContent: 'center', alignSelf: 'center', color: '#000', width: widthPercentageToDP('37%') }} numberOfLines={2}>{r.sub_to_location}</Text>
                                                        </View>
                                                        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 16, color: '#000', width: widthPercentageToDP('41%'), marginLeft: widthPercentageToDP('1%') }} numberOfLines={1}>{moment.unix(r.sub_exp_arrival_timestamp).format("DD MMM YYYY HH:mm")}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            )

                                        }) : null
                                    }
                                </View>
                                :

                                <View style={{ margin: 5 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', }}>
                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Expected Depature</Text>
                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{moment.unix(this.state.data.exp_departure_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                            </View>
                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Actual Depature</Text>
                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{'----'}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Expected Arrival</Text>
                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>
                                                    {moment.unix(this.state.data.exp_arrival_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                            </View>
                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Actual Arrival</Text>
                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{'----'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                        }

                        <View style={{ flex: 1, margin: 5 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', }}>

                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                        <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Trip Status</Text>
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{this.state.data.trip_status === 1 ? 'Enroute' : 'Completed' || '----'}</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>

                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                        <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Lock Id</Text>

                                        {
                                            this.state.data.f_asset_id ? <Text style={{ fontSize: 16, color: '#141312', textAlign: 'center', alignContent: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.f_asset_id} {this.state.data.lock_vendor === 'jt' ? "(SP701)" : "(SP777)"}</Text> : <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{'---'}</Text>
                                        }
                                        {/* <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{this.state.data.f_asset_id || '----'}</Text> */}
                                    </View>
                                </View>
                            </View>






                            <View><Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312' }}>ROUTE INFORMATION</Text></View>
                            <View style={{ padding: 5, backgroundColor: '#fff' }}>
                                <FlatList
                                    data={this.state.lock_data.list_event}
                                    renderItem={({ item }) => (
                                        <View style={{ backgroundColor: '#fff' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <View style={{ padding: 10, height: 20, width: 20, borderRadius: 20 / 2, backgroundColor: '#52D2C2', marginLeft: 5 }} />
                                                <View style={{ flexDirection: 'column', marginBottom: 5, marginLeft: 10 }}>
                                                    <View style={{ flexDirection: 'row', marginBottom: 5, marginLeft: 10, flex: 1 }}>
                                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000', justifyContent: 'flex-start' }}>{item.f_start_date_time ? moment.unix(item.f_start_date_time, 'DD-MM-YYYY').format('DD MMM YYYY') : '----'}</Text>
                                                        <View style={{ marginLeft: 30, height: heightPercentageToDP('4%'), borderRadius: 2, backgroundColor: item.event_text === 'Authorized Open' ? '#06D79C' : item.event_text === 'Lock Closed' ? "#06D79C" : item.event_text === 'Lock Assigned' || item.event_text === 'Trip Started' || item.event_text === 'Idle Time' || item.event_text === 'Trip Ended' || item.event_text === 'Driver No. Changed' ? "#398BF7" : item.event_text === 'Unauthorized Open' || item.event_text === 'Prolonged Open' || item.event_text === 'Low Battery' || item.event_text === 'Suspicious Movement' ? '#EF534F' : '#398BF7', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', padding: 5 }}>
                                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', justifyContent: 'flex-end' }}>{item.event_text}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', marginBottom: 5, marginLeft: 10, flex: 1 }}>
                                                        <Text style={{ fontSize: 14, color: '#000', justifyContent: 'flex-start', alignItems: 'flex-start', alignSelf: 'flex-start' }}>{moment.unix(item.f_start_date_time, 'DD-MM-YYYY').format('hh:mm a') || '----'}</Text>

                                                        <Text style={{ fontSize: 14, color: '#000', justifyContent: 'flex-end', marginLeft: item.event_text === 'Trip Ended' || item.event_text === 'Trip Started' || item.event_text === 'Idle Time' ? 60 : 60 }}>{item.event_city || "---"}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{ flex: 1, borderColor: '#ABB5C4', borderWidth: 0.3, marginLeft: 15 }} />
                                            <View
                                                style={{ height: 50, width: 0.3, backgroundColor: '#ABB5C4', marginLeft: 15, marginTop: -40 }} />
                                        </View>

                                    )} keyExtractor={item => item.trip_event_id} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312' }}>MAPVIEW</Text>
                            </View>
                            <TouchableOpacity style={{ flex: 1, height: 200 }}>
                                {this.state.trip_route && this.state.trip_route.FLatitude && this.state.trip_route.FLongitude ?
                                    <MapView
                                        // provider={PROVIDER_GOOGLE} // remove if not using Google Maps
                                        style={styles.map}
                                        region={{
                                            latitude: this.state.trip_route.FLatitude,
                                            longitude: this.state.trip_route.FLongitude,
                                            latitudeDelta: 0.015,
                                            longitudeDelta: 0.0121,
                                        }}
                                        onPress={() => this.props.navigation.navigate('Mapview', { item: this.state.trip_detail_route, data: this.state.data, list_event: this.state.lock_data.list_event })}>
                                        <MapView.Marker
                                            coordinate={{
                                                latitude: this.state.trip_route.FLatitude,
                                                longitude: this.state.trip_route.FLongitude,
                                            }}>
                                            {/* <Image
                                                source={truckactive}
                                                style={{ height: 35, width: 35 }}
                                                resizeMode="contain" /> */}

                                        </MapView.Marker>
                                    </MapView>
                                    : this.state.trip_route != null && this.state.maploader ? <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'white', justifyContent: 'center' }}>
                                        <ActivityIndicator size={'large'} color='#263C88' />
                                    </View>
                                        : <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'white', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: 'bold' }}>No Map available</Text></View>}
                            </TouchableOpacity>

                            {
                                this.state.geo_fencing_range !== null ?
                                    <View>

                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View style={{ justifyContent: 'center', alignSelf: 'flex-start' }}>
                                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312' }}>GEOFENCE DETAILS</Text>
                                            </View>

                                            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                                <View style={{ borderRadius: 5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#06D79C', height: heightPercentageToDP('4%'), width: widthPercentageToDP('40%'), justifyContent: 'center' }}>
                                                    <Text style={{ color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: widthPercentageToDP('4%') }}>Range : {this.state.geo_fencing_range} m</Text>
                                                </View>
                                            </View>
                                        </View>


                                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>

                                            <View style={{ flex: 1, backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                <Text style={{ fontSize: 14, color: '#000000', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Latitude</Text>
                                            </View>

                                            <View style={{ flex: 1, backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                <Text style={{ fontSize: 14, color: '#000000', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Longitude</Text>
                                            </View>
                                        </View>



                                        <View>
                                            <FlatList
                                                data={this.state.multiGeofence}
                                                renderItem={({ item }) => (
                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>

                                                        <View style={{ flex: 1, backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                            <Text style={{ fontSize: 14, color: '#000000', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>{item.geo_fencing_lat}</Text>
                                                        </View>

                                                        <View style={{ flex: 1, backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                                            <Text style={{ fontSize: 14, color: '#000000', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>{item.geo_fencing_long}</Text>
                                                        </View>
                                                    </View>
                                                )}
                                                keyExtractor={item => item._id} />
                                        </View>
                                    </View> : null
                            }
                            <View>
                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312' }}>TRIP DETAIL</Text>
                            </View>
                            <View style={{ backgroundColor: 'white', flexDirection: 'column', justifyContent: 'flex-start', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>Consignee</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.driver_name || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5, }}></View>
                                <TouchableOpacity style={{ flexDirection: 'row', padding: 10 }} onPress={this.state.data.driver_no ? this.call : null}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>Mobile No</Text>
                                    <Text style={{ fontSize: 16, color: '#263C88', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold', borderBottomColor: this.state.data.driver_no ? '#263C88' : null }}>{this.state.data.driver_no ? this.state.data.driver_no_code + this.state.data.driver_no : "---"}</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5, }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>Vehicle No</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.vehicle_number || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>LR No</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.lr_number || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>Invoice No.</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.invoice_no || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>

                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>Invoice Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.invoice_date ? moment(this.state.data.invoice_date, 'DD-MM-YYYY').format('DD MMM YYYY') : '----'}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>E-way bill Number</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.e_way_bill_no || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>E-way bill Generation Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.e_way_bill_date ? moment(this.state.data.e_way_bill_date, 'DD-MM-YYYY').format('DD MMM YYYY') : '----'}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>E-way bill Expiry Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>
                                        {this.state.data.e_way_bill_expiry ? moment(this.state.data.e_way_bill_expiry, 'DD-MM-YYYY').format('DD MMM YYYY') : "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
                {
                    this.state.data.trip_status === 1 ?
                        this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                            <TouchableOpacity onPress={() => this.RemoteUnlock()} >
                                <Header style={{ backgroundColor: '#263C88' }}>
                                    {this.state.loading ? (
                                        <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                <View>
                                                    <ActivityIndicator size={'small'} color='white' />
                                                </View>
                                                <View>
                                                    <Title style={{ fontSize: 16, fontFamily: 'avenir', paddingLeft: 10 }}>PLEASE WAIT...</Title>
                                                </View>
                                            </View>
                                        </Body>
                                    ) : (<Button style={{ backgroundColor: '#263C88', justifyContent: 'center', alignItems: 'center' }} onPress={() => this.RemoteUnlock()}>
                                        <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: '#fff' }}>Remote Unlock</Title>
                                    </Button>)}
                                </Header>
                            </TouchableOpacity> :
                            this.state.decoded.user_type_id === 2 ?
                                this.state.userDetails === null || this.state.userDetails.indexOf(5) > -1 ?
                                    <TouchableOpacity onPress={() => this.RemoteUnlock()} >
                                        <Header style={{ backgroundColor: '#263C88' }}>
                                            {this.state.loading ? (
                                                <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                        <View>
                                                            <ActivityIndicator size={'small'} color='white' />
                                                        </View>
                                                        <View>
                                                            <Title style={{ fontSize: 16, fontFamily: 'avenir', paddingLeft: 10 }}>PLEASE WAIT...</Title>
                                                        </View>
                                                    </View>
                                                </Body>
                                            ) : (<Button style={{ backgroundColor: '#263C88', justifyContent: 'center', alignItems: 'center' }} onPress={() => this.RemoteUnlock()}>
                                                <Title style={{ fontSize: 16, fontFamily: 'avenir', color: '#fff' }}>{'Remote Unlock'}</Title>
                                            </Button>)}
                                        </Header>
                                    </TouchableOpacity> : null : null : null
                }
                <Modal style={[styles.modal, styles.modal2]} position={"center"} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={false}  >
                    <ScrollView keyboardShouldPersistTaps={false}>
                        <View style={{ flex: 1, width: widthPercentageToDP('85%'), backgroundColor: '#fff', borderRadius: 4, flexDirection: 'column', padding: widthPercentageToDP('5%') }} >
                            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#141312' }}>Unauthorized Access.</Text>
                            <Text style={{ marginTop: widthPercentageToDP('5%'), fontSize: widthPercentageToDP('5%'), color: '#949494' }}>You are deactivated by admin. Try again later.</Text>

                            <TouchableOpacity style={{ width: widthPercentageToDP('25%'), alignSelf: 'center', justifyContent: 'center', padding: 7, marginTop: widthPercentageToDP('5%'), flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }} onPress={this.logout.bind(this)}>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#fff' }}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Modal>
            </Container >
        );
    }
}
export default withNavigation(TrackDetail);
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        // height: 400,
        // width: 400,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    modal: {
        marginTop: widthPercentageToDP('3%'),
        justifyContent: 'center',
        alignItems: 'center',
        position: "absolute",
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    modal2: {
        maxHeight: 500,
        minHeight: 80
    },
});
