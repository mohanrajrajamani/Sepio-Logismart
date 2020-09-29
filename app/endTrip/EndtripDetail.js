import React from "react";
import { Button, Container, Right, Left, Body, Title, Header, Subtitle } from 'native-base';
import { Keyboard, Text, StatusBar, Image, View, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, Dimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import moment from "moment";
import MapView from 'react-native-maps';
import Modal from 'react-native-modalbox';
var screen = Dimensions.get('window');
import SearchableDropdown from '../trip/searchablebleDropdown';
import APIService from '../component/APIServices';
import call from 'react-native-phone-call';
var jwtDecode = require('jwt-decode');
const truckactive = require('../../assets/images/active-truck-icon.png');
import { connect } from "react-redux";
import { Toast } from 'native-base';
import Header1 from '../component/Header';
import AsyncStorage from '@react-native-community/async-storage'
import NetInfo from "@react-native-community/netinfo";

class EndtripDetail extends React.Component {
    decoded;
    call = () => {
        const args = {
            number: this.state.data.driver_no,
            prompt: false,
        };
        call(args).catch(console.error);
    };
    static navigationOptions =
        {
            header: null
        };
    constructor(props) {
        super();
        this.state = {
            data: '',
            lock_data: '',
            trip_route: '',
            trip_detail_route: '',
            showDelayReasonDropdown: false,
            tripDelay: '',
            loading: false,
            selectedDelay: '',
            maploader: true,
            decoded: '',
            userDetails: [],
            multiGeofence: '',
            isSingleTripEnd: false,
            endTripDetails: '',
            startTripDetails: '',
            geo_fencing_range: null
        }
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

    async userdetails() {
        var res = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)

        if (res.data.data[0].status === 2) {
            this.refs.modal1.open()
        }
        else if (res.data.data[0].status === 1) {
            this.setState({ userDetails: res.data.data[0].logismart_feature_id })
        }
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


    async componentDidMount() {

        this.setState({ data: this.props.navigation.state.params.item }, () => { this.userdetails() })

        this.setState({ decoded: jwtDecode(await AsyncStorage.getItem('user_token')) })

        var res = await APIService.execute('GET', APIService.URL + APIService.listtripeventdetails + '?trip_id=' + this.state.data.trip_id + '&user_type_id=' + this.state.decoded.user_type_id + '&location_id=' + this.state.decoded.location_id + '&access_right=' + this.state.decoded.access_right, null)
        this.setState({ lock_data: res.data.data });

        if (this.state.data.sub_trip_count > 1) {
            this.getSubTrips()
            this.getGeofenceDetails()
        }
        else {
            this.getGeofenceDetails()
        }


        if (this.state.data.trip_route) {
            this.getJSON(this.state.data.trip_route);
        }
        else {
            this.setState({ maploader: false });
        }
    }

    async getGeofenceDetails() {
        var body = JSON.stringify({
            company_id: this.state.data.company_id,
            trip_id: this.state.data.trip_id
        });
        var res = await APIService.execute('POST', APIService.URL + APIService.listgeofencingdetails, body)
        if (res.data.data.length > 0) {
            this.setState({ multiGeofence: res.data.data, geo_fencing_range: res.data.data[0].geo_fencing_range });
        }
        else {
            this.setState({ multiGeofence: res.data.data });
        }
    }

    getJSON(trip_route) {
        //mapview
        fetch(trip_route)
            .then((response) => response.json())
            .then((responseJson) => {
                this.setState({ trip_detail_route: responseJson });
                var array = responseJson[responseJson.length - 1]
                // console.log("trip_route", array)
                this.setState({ trip_route: array, maploader: false })
            })
            .catch((error) => { this.setState({ maploader: true }, () => { this.showMessage(error) }); });
    }

    async StartTrip() {
        // this.state.decoded.user_type_id === 2 ?
        //                     this.state.userDetails === null || this.state.userDetails.indexOf(3) > -1 ?
        console.log("this.state.decoded.user_type_id : ", this.state.decoded.user_type_id, this.state.userDetails)
        if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
            this.setState({ loading: true })
            Alert.alert(
                'Confirmation',
                'Do you want to start this trip ?',
                [
                    { text: 'Yes', onPress: () => this.startActualTrip() },
                    { text: 'No', onPress: () => { this.setState({ loading: false }) } },
                ],
                { cancelable: false }
            );
        }

        if (this.state.decoded.user_type_id === 2) {
            if (this.state.userDetails === null || this.state.userDetails.indexOf(2) > -1) {
                this.setState({ loading: true })
                Alert.alert(
                    'Confirmation',
                    'Do you want to start this trip ?',
                    [
                        { text: 'Yes', onPress: () => this.startActualTrip() },
                        { text: 'No', onPress: () => { this.setState({ loading: false }) } },
                    ],
                    { cancelable: false }
                );
            }
            else {
                alert("You not have permission to start this trip.")
            }
        }
        // this.startTrip()

    }

    async startActualTrip() {
        this.setState({ loading: true }, async () => {
            var body = JSON.stringify({
                trip_id: this.state.startTripDetails.trip_id,
                trip_no: this.state.startTripDetails.trip_id,
                lock_id: this.state.startTripDetails.sub_lock_id,
                lock_vendor: this.state.startTripDetails.lock_vendor,
                sub_trip_id: this.state.startTripDetails.sub_trip_id,
                f_asset_id: this.state.startTripDetails.sub_f_asset_id,
                event_city: null,
                event_lat: null,
                event_long: null,
                from: this.state.startTripDetails.sub_from_location,
                to: this.state.startTripDetails.sub_to_location,
                from_id: this.state.startTripDetails.sub_from_location_id,
                to_id: this.state.startTripDetails.sub_to_location_id,
            });

            await APIService.execute('POST', APIService.URL + APIService.startsubtrip, body)
            this.setState({ startTripDetails: "", loading: false }, () => {
                // this.props.navigation.navigate('TripHome', { item: res.data });
                this.showMessage("Trip Succesfully started.");
                this.getSubTrips();
            });
        })
    }

    async completetrip(trip_id, timestamp, isSingle) {
        this.setState({ loading: true }, async () => {
            
            var body = JSON.stringify({
                trip_id: trip_id,
                exp_arrival_timestamp: timestamp
            })
            var res = await APIService.execute('POST', APIService.URL + APIService.checkDelay, body)
            this.setState({ tripDelay: res.data.data }, () => {
                if (isSingle === "isSingleTrip") {
                    this.setState({ isSingleTripEnd: true }, () => { this.refs.modal6.open(); })
                }
                else {
                    this.setState({ isSingleTripEnd: false }, () => { this.refs.modal6.open(); })
                }
            });



        });
    }

    async conformation() {
        console.log("trip : ", this.state.isSingleTripEnd)
        if (this.state.isSingleTripEnd) {
            if (this.state.tripDelay.length !== 0 && this.state.selectedDelay.itemName !== null) {
                if (this.state.tripDelay.length !== 0 && this.state.selectedDelay.itemName) {

                    var body = JSON.stringify({
                        trip_id: this.state.endTripDetails.trip_id,
                        trip_no: this.state.endTripDetails.trip_id,
                        sub_trip_id: this.state.endTripDetails.sub_trip_id,
                        lock_id: this.state.endTripDetails.sub_lock_id,
                        lock_vendor: this.state.endTripDetails.lock_vendor,
                        f_asset_id: this.state.endTripDetails.sub_f_asset_id,
                        sub_act_departure_timestamp: this.state.endTripDetails.sub_act_departure_timestamp,
                        sub_exp_arrival_timestamp: this.state.endTripDetails.sub_exp_arrival_timestamp,
                        reason_id: this.state.selectedDelay ? this.state.selectedDelay.id : null,
                        reason: this.state.selectedDelay ? this.state.selectedDelay.itemName : null,
                        from: this.state.endTripDetails.sub_from_location,
                        to: this.state.endTripDetails.sub_to_location,
                        from_id: this.state.endTripDetails.sub_from_location_id,
                        to_id: this.state.endTripDetails.sub_to_location_id,
                    })
                    var res = await APIService.execute('POST', APIService.URL + APIService.endsinglesubtrip, body)
                    console.log("res : ", res)
                    this.showMessage('Trip Succesfully Completed')
                    this.setState({ endTripDetails: "", loading: false }, () => {
                        this.refs.modal6.close();
                        this.getSubTrips();
                    });
                }
                else if (this.state.selectedDelay == '') {
                    this.setState({ loading: false });
                    this.showMessage("Please select reason for trip delay")
                }
            }
            else {
                var body = JSON.stringify({
                    trip_id: this.state.endTripDetails.trip_id,
                    trip_no: this.state.endTripDetails.trip_id,
                    sub_trip_id: this.state.endTripDetails.sub_trip_id,
                    lock_id: this.state.endTripDetails.sub_lock_id,
                    lock_vendor: this.state.endTripDetails.lock_vendor,
                    f_asset_id: this.state.endTripDetails.sub_f_asset_id,
                    sub_act_departure_timestamp: this.state.endTripDetails.sub_act_departure_timestamp,
                    sub_exp_arrival_timestamp: this.state.endTripDetails.sub_exp_arrival_timestamp,
                    reason_id: this.state.selectedDelay ? this.state.selectedDelay.id : null,
                    reason: this.state.selectedDelay ? this.state.selectedDelay.itemName : null,
                    from: this.state.endTripDetails.sub_from_location,
                    to: this.state.endTripDetails.sub_to_location,
                    from_id: this.state.endTripDetails.sub_from_location_id,
                    to_id: this.state.endTripDetails.sub_to_location_id,
                });
                var res = await APIService.execute('POST', APIService.URL + APIService.endsinglesubtrip, body)
                console.log("res : ", res)
                this.showMessage('Trip Succesfully Completed')
                this.setState({ endTripDetails: "", loading: false }, () => {
                    this.refs.modal6.close();
                    this.getSubTrips();
                });
            }
        }
        else {
            if (this.state.tripDelay.length !== 0 && this.state.selectedDelay.itemName !== null) {
                if (this.state.tripDelay.length !== 0 && this.state.selectedDelay.itemName) {

                    var body = JSON.stringify({
                        trip_id: this.state.data.trip_id,
                        trip_no: this.state.data.trip_no,
                        lock_id: this.state.data.lock_id,
                        lock_vendor: this.state.data.lock_vendor,
                        vehicle_number: this.state.data.vehicle_number,
                        f_asset_id: this.state.data.f_asset_id,
                        act_departure_timestamp: this.state.data.act_departure_timestamp,
                        exp_arrival_timestamp: this.state.data.exp_arrival_timestamp,
                        reason_id: this.state.selectedDelay ? this.state.selectedDelay.id : null,
                        reason: this.state.selectedDelay ? this.state.selectedDelay.itemName : null,
                        from: this.state.data.from_location,
                        to: this.state.data.to_location,
                        from_id: this.state.data.from_location_id,
                        to_id: this.state.data.to_location_id,
                        exp_delay: this.state.data.exp_delay
                    })
                    await APIService.execute('POST', APIService.URL + APIService.endtrip, body)
                    this.showMessage("Trip Succesfully Completed.")
                    this.refs.modal6.close();
                    this.setState({ loading: false }, () => {
                        const resetAction = StackActions.reset({
                            index: 0,
                            actions: [
                                NavigationActions.navigate({
                                    routeName: "EndTripListScreen"
                                })
                            ]
                        });
                        this.props.navigation.dispatch(resetAction);
                    });
                } else if (this.state.selectedDelay == '') {
                    this.setState({ loading: false });
                    this.showMessage("Please select reason for trip delay.")
                }
            } else {

                var body = JSON.stringify({
                    trip_id: this.state.data.trip_id,
                    trip_no: this.state.data.trip_no,
                    lock_id: this.state.data.lock_id,
                    lock_vendor: this.state.data.lock_vendor,
                    vehicle_number: this.state.data.vehicle_number,
                    f_asset_id: this.state.data.f_asset_id,
                    act_departure_timestamp: this.state.data.act_departure_timestamp,
                    exp_arrival_timestamp: this.state.data.exp_arrival_timestamp,
                    reason_id: this.state.selectedDelay ? this.state.selectedDelay.id : null,
                    reason: this.state.selectedDelay ? this.state.selectedDelay.itemName : null,
                    from: this.state.data.from_location,
                    to: this.state.data.to_location,
                    from_id: this.state.data.from_location_id,
                    to_id: this.state.data.to_location_id,
                    exp_delay: this.state.data.exp_delay
                })

                var res = await APIService.execute('POST', APIService.URL + APIService.endtrip, body)
                this.showMessage(res.data.message)
                this.refs.modal6.close();
                this.setState({ loading: false }, () => {
                    const resetAction = StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({
                                routeName: "EndTripListScreen"
                            })
                        ]
                    });
                    this.props.navigation.dispatch(resetAction);
                });
            }
        }

    }

    async getSubTrips() {
        var res = await APIService.execute('GET', APIService.URL + APIService.listsubtripdetails + '?' + 'trip_id=' + this.state.data.trip_id, null)
        this.setState({ multiTrip: res.data.data })
    }

    conformationNo() {
        this.setState({ loading: false });
        this.refs.modal6.close();
    }

    hideModal() { this.setState({ loading: false }); }

    render() {
        return (
            <Container style={{ backgroundColor: '#EDEEF2' }}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#FD8000" translucent={true} />

                <Header1 label={"Trip ID: " + this.state.data.trip_id || '---'} expanded={true} onBack={() => { this.props.navigation.goBack() }} />
                <ScrollView style={{ flex: 1, backgroundColor: '#EDEEF2' }}>
                    <Header transparent style={{ backgroundColor: '#263C88', height: heightPercentageToDP('25%') }}>
                        <Left style={{ justifyContent: 'center', flex: 1, alignItems: 'center', alignSelf: 'center', flexDirection: 'column' }}>
                            <Button transparent >
                                <Image source={require('../../assets/images/green-truck.png')} style={{ height: 70, width: 170, resizeMode: 'contain' }} />
                            </Button>
                            <Button transparent >
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
                            <Button transparent style={{ width: 130, marginRight: widthPercentageToDP('-5%') }}>
                                <Text style={{ fontSize: 14, color: '#fff', marginTop: 10, flex: 1, marginRight: -5, fontWeight: 'bold', padding: 10 }}>{this.state.data.to_location || '---'}</Text>
                            </Button>
                        </Right>


                    </Header>
                    <View style={{ backgroundColor: '#263C88', height: heightPercentageToDP('10%') }}>
                        {
                            this.state.data.sub_trip_count > 1 ?
                                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                                    <View style={{ paddingLeft: widthPercentageToDP('2%'), paddingRight: widthPercentageToDP('2%'), flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                                        {
                                            this.state.multiTrip ? this.state.multiTrip.map((r, i) => {
                                                return (
                                                    r.sub_trip_status === 1 ?
                                                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginLeft: widthPercentageToDP('-2%') }}>
                                                            <View style={[styles.betweenRange, { backgroundColor: '#FFB22B', }]} >
                                                                <View style={[styles.outerCircle]}>
                                                                    <View style={[styles.innerCircle, { backgroundColor: 'white', }]} >
                                                                        <Text style={{ justifyContent: 'center', alignSelf: 'center', color: 'black' }}>{i + 1}</Text>
                                                                    </View>

                                                                </View>

                                                                <TouchableOpacity onPress={() => {
                                                                    if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
                                                                        if (i + 1 === this.state.multiTrip.length) {
                                                                            this.setState({ endTripDetails: r }, () => { this.completetrip(this.state.data.trip_no, this.state.data.exp_arrival_timestamp, "isNotSingleTrip") })
                                                                        }
                                                                        else {
                                                                            this.setState({ endTripDetails: r }, () => { this.completetrip(r.sub_trip_id, r.sub_exp_arrival_timestamp, "isSingleTrip") })
                                                                        }
                                                                    }

                                                                    if (this.state.decoded.user_type_id === 2) {
                                                                        if (this.state.userDetails === null || this.state.userDetails.indexOf(3) > -1) {
                                                                            if (i + 1 === this.state.multiTrip.length) {
                                                                                this.setState({ endTripDetails: r }, () => { this.completetrip(this.state.data.trip_no, this.state.data.exp_arrival_timestamp, "isNotSingleTrip") })
                                                                            }
                                                                            else {
                                                                                this.setState({ endTripDetails: r }, () => { this.completetrip(r.sub_trip_id, r.sub_exp_arrival_timestamp, "isSingleTrip") })
                                                                            }
                                                                        }
                                                                        else {
                                                                            alert("You not have permission to end this trip.")
                                                                        }
                                                                    }
                                                                }}
                                                                    style={{ width: widthPercentageToDP('20%'), height: widthPercentageToDP('7%'), position: 'absolute' }}>
                                                                    <Image source={require('../../assets/images/truck-white.png')} style={{ justifyContent: 'center', marginLeft: widthPercentageToDP('4%'), marginTop: widthPercentageToDP('1%'), width: widthPercentageToDP('20%'), height: widthPercentageToDP('5%'), resizeMode: 'contain' }} />
                                                                </TouchableOpacity>


                                                            </View>
                                                        </View> : r.sub_trip_status === 2 ? <View style={{ marginLeft: widthPercentageToDP('-4%'), justifyContent: 'center', flexDirection: 'row' }}>
                                                            <View style={styles.outerCircle}>
                                                                <View style={[styles.innerCircle, { backgroundColor: 'white', }]} >
                                                                    <Text style={{ justifyContent: 'center', alignSelf: 'center', color: 'black' }}>{i + 1}</Text>
                                                                </View>
                                                            </View>
                                                            <View style={{ width: widthPercentageToDP('20%'), height: widthPercentageToDP('7%') }}>
                                                                <Image source={require('../../assets/images/arrow-dotted-line.png')} style={{ width: widthPercentageToDP('20%'), height: widthPercentageToDP('7%'), resizeMode: 'contain' }} />
                                                            </View>
                                                            {
                                                                r.cur_sub_trip === 1 && r.sub_trip_status === 2 ?
                                                                    <TouchableOpacity onPress={() => { this.setState({ startTripDetails: r }), this.StartTrip() }} style={{ width: widthPercentageToDP('20%'), height: widthPercentageToDP('7%'), position: 'absolute' }}>
                                                                        <Image source={require('../../assets/images/truck_green.png')} style={{ justifyContent: 'center', marginLeft: widthPercentageToDP('2%'), marginTop: widthPercentageToDP('1%'), width: widthPercentageToDP('20%'), height: widthPercentageToDP('5%'), resizeMode: 'contain' }} />
                                                                    </TouchableOpacity> : null
                                                            }


                                                        </View> : r.sub_trip_status === 3 ? <View style={{ marginRight: widthPercentageToDP('-2%'), marginLeft: widthPercentageToDP('-2%'), flexDirection: 'row', justifyContent: 'center' }}>
                                                            <View style={[styles.betweenRange, { backgroundColor: '#07D79D' }]} >
                                                                <View style={[styles.outerCircle]}>
                                                                    <View style={[styles.innerCircle, { backgroundColor: '#07D79D', }]} >
                                                                        <Text style={{ justifyContent: 'center', alignSelf: 'center', color: 'white' }}>{i + 1}</Text>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        </View> : null

                                                )

                                            }) : null

                                        }
                                        <View style={[styles.outerCircle, { marginLeft: widthPercentageToDP('-4%') }]}>
                                            <View style={[styles.innerCircle, { backgroundColor: 'red', }]} >
                                                <Text style={{ justifyContent: 'center', alignSelf: 'center', color: 'black' }}>E</Text>
                                            </View>
                                        </View>
                                    </View>
                                </ScrollView>


                                : null

                        }
                    </View>
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
                                                            <Text style={{ fontSize: 16, justifyContent: 'center', alignSelf: 'center', color: '#000', width: widthPercentageToDP('40%') }} numberOfLines={2}>{r.sub_from_location}</Text>
                                                        </View>
                                                        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 16, color: '#000', width: widthPercentageToDP('37%'), marginLeft: widthPercentageToDP('1%') }} numberOfLines={1}>{moment.unix(r.sub_exp_departure_timestamp).format("DD MMM YYYY HH:mm")}</Text>
                                                        </View>

                                                    </View>

                                                    <View
                                                        style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, margin: 5 }} />
                                                    <View style={{ height: 40, marginLeft: 5, flexDirection: 'row' }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                            <Text style={{ fontSize: 16, justifyContent: 'center', alignSelf: 'center', color: '#000', width: widthPercentageToDP('40%') }} numberOfLines={2}>{r.sub_to_location}</Text>
                                                        </View>
                                                        <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                                            <Text style={{ fontSize: 16, color: '#000', width: widthPercentageToDP('37%'), marginLeft: widthPercentageToDP('1%') }} numberOfLines={1}>{moment.unix(r.sub_exp_arrival_timestamp).format("DD MMM YYYY HH:mm")}</Text>
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
                                    {/* <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                    <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Expected Depature</Text>
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{moment.unix(this.state.data.exp_departure_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                    <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Actual Depature</Text>
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{moment.unix(this.state.data.act_departure_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                </View> */}
                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                        <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Trip Status</Text>
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{this.state.data.trip_status === 1 ? 'Enroute' : 'Completed' || '----'}</Text>
                                    </View>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                                    {/* <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                    <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Expected Arrival</Text>
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{moment.unix(this.state.data.exp_arrival_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                    <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Actual Arrival</Text>
                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{this.state.data.trip_status === 3 ? this.state.data.act_arrival_timestamp : '----'}</Text>
                                </View> */}
                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: '#fff', margin: 0.5, padding: 10 }}>
                                        <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center', marginTop: 5 }}>Lock Id</Text>
                                        {/* <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 5, marginTop: 5 }}>{this.state.data.f_asset_id || '----'}</Text> */}
                                        {
                                            this.state.data.f_asset_id ? <Text style={{ fontSize: 16, color: '#141312', textAlign: 'center', alignContent: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.f_asset_id} {this.state.data.lock_vendor === 'jt' ? "(SP701)" : "(SP777)"}</Text> : <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{'---'}</Text>
                                        }
                                    </View>
                                </View>
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312' }}>ROUTE INFORMATION</Text>
                            </View>
                            <View style={{ padding: 5, backgroundColor: '#fff' }}>
                                <FlatList
                                    data={this.state.lock_data.list_event}
                                    renderItem={({ item }) => (
                                        <View style={{ backgroundColor: '#fff' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <View style={{ padding: 10, height: 20, width: 20, borderRadius: 20 / 2, backgroundColor: '#52D2C2', marginLeft: 5 }} />
                                                <View style={{ flexDirection: 'column', marginBottom: 5, marginLeft: 10 }}>
                                                    <View style={{ flexDirection: 'row', marginBottom: 5, marginLeft: 10, flex: 1 }}>
                                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000', justifyContent: 'flex-start' }}>{moment.unix(item.f_start_date_time).format('DD MMM YYYY') || '----'}</Text>
                                                        <View style={{ marginLeft: 30, height: 20, borderRadius: 2, backgroundColor: item.event_text === 'Authorized Open' ? '#06D79C' : item.event_text === 'Lock Closed' ? "#06D79C" : item.event_text === 'Lock Assigned' || item.event_text === 'Trip Started' || item.event_text === 'Idle Time' || item.event_text === 'Trip Ended' || item.event_text === 'Driver No. Changed' ? "#398BF7" : item.event_text === 'Unauthorized Open' || item.event_text === 'Prolonged Open' || item.event_text === 'Low Battery' || item.event_text === 'Suspicious Movement' ? '#EF534F' : '#398BF7', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', padding: 5 }}>
                                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', justifyContent: 'flex-end' }}>{item.event_text}</Text>
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', marginBottom: 5, marginLeft: 10, flex: 1 }}>
                                                        <Text style={{ fontSize: 14, color: '#000', justifyContent: 'flex-start', flex: 1, alignItems: 'flex-start', alignSelf: 'flex-start' }}>{moment.unix(item.f_start_date_time, 'DD-MM-YYYY').format('hh:mm a') || '----'}</Text>
                                                        <Text style={{ fontSize: 14, color: '#000', justifyContent: 'flex-end', flex: 1, alignItems: 'flex-end', alignSelf: 'flex-end', marginLeft: item.event_text === 'Idle Time' || item.event_text === 'Trip Ended' || item.event_text === 'Trip Started' ? 40 : 20 }}>{item.event_city || "---"}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={{ flex: 1, borderColor: '#ABB5C4', borderWidth: 0.3, marginLeft: 15 }} />
                                            <View
                                                style={{ height: 50, width: 0.3, backgroundColor: '#ABB5C4', marginLeft: 15, marginTop: -40 }} />
                                        </View>
                                    )} />
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312' }}>MAPVIEW</Text>
                            </View>
                            <TouchableOpacity style={{ flex: 1, height: 200 }}>
                                {this.state.trip_route.FLatitude && this.state.trip_route.FLongitude ?
                                    <MapView
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
                                                // latitudeDelta: 0.015,
                                                // longitudeDelta: 0.0121,
                                            }}>
                                            <Image
                                                source={truckactive}
                                                style={{ height: 35, width: 35 }}
                                                resizeMode="contain" />
                                        </MapView.Marker>
                                    </MapView> : this.state.trip_route != null && this.state.maploader ? <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'white', justifyContent: 'center' }}>
                                        <ActivityIndicator size={'large'} color='#263C88' />
                                    </View>
                                        : <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'white', justifyContent: 'center' }}><Text style={{ fontSize: 16, fontWeight: 'bold' }}>No Map available</Text></View>
                                }
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

                            <View><Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312' }}>TRIP DETAIL</Text></View>
                            <View style={{ backgroundColor: 'white', flexDirection: 'column', justifyContent: 'flex-start', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, }}>Consignee</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, fontWeight: 'bold' }}>{this.state.data.driver_name || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5, }}></View>
                                <TouchableOpacity style={{ flexDirection: 'row', padding: 10 }} onPress={this.state.data.driver_no ? this.call : null}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, }}>Mobile No</Text>
                                    <Text style={{ fontSize: 16, color: '#263C88', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, fontWeight: 'bold', borderBottomColor: this.state.data.driver_no ? '#263C88' : null }}>{this.state.data.driver_no ? this.state.data.driver_no_code + this.state.data.driver_no : "---"}</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5, }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, }}>Vehicle No</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, fontWeight: 'bold' }}>{this.state.data.vehicle_number || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5 }}>LR No</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, fontWeight: 'bold' }}>{this.state.data.lr_number || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5 }}>Invoice No.</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, fontWeight: 'bold' }}>{this.state.data.invoice_no || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>Invoice Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.invoice_date || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>E-way bill Number</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.e_way_bill_no || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>E-way bill Generation Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.e_way_bill_date || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'avenir', margin: 5, justifyContent: 'center' }}>E-way bill Expiry Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'avenir', margin: 5, justifyContent: 'center', fontWeight: 'bold' }}>{this.state.data.e_way_bill_expiry || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                            </View>
                        </View>
                    </View>

                </ScrollView>


                <Modal style={[styles.modal, styles.modal1]} position={"center"} ref={"modal6"} swipeArea={20}
                    onClosed={() => { this.setState({ loading: false }) }}  >
                    <ScrollView>
                        <View style={{ flex: 1, width: screen.width, justifyContent: 'flex-end', backgroundColor: '#fff', borderRadius: 10 }} >
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginLeft: widthPercentageToDP('10%'), marginTop: widthPercentageToDP('7%') }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#000000' }}>Confirmation</Text>
                            </View>
                            <View style={{ flex: 1, borderColor: '#ABB5C4', borderWidth: 0.3, justifyContent: 'center' }} />
                            <View style={{ justifyContent: 'flex-start', padding: 10, marginLeft: widthPercentageToDP('10%') }}>
                                <Text>Are you sure you want to end a trip ?</Text>
                            </View>
                            {this.state.tripDelay.length !== 0 ? <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => this.setState({ showDelayReasonDropdown: true })} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                    <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.selectedDelay.itemName || "Select Delay Reason"}</Text>
                                </TouchableOpacity>
                            </View> : null}
                            <View style={{ justifyContent: 'flex-end', alignSelf: 'flex-end', flex: 1, flexDirection: 'row' }}>
                                <TouchableOpacity onPress={() => this.conformationNo()}>
                                    <Text style={{ padding: 20, fontWeight: 'bold', color: 'green' }}>NO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.conformation()}>
                                    <Text style={{ padding: 20, fontWeight: 'bold', color: 'green' }}>YES</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </Modal>
                <Modal style={[styles.modal, styles.modal2]} position={"center"} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={false}  >
                    <ScrollView keyboardShouldPersistTaps={false}>
                        <View style={{ marginTop: widthPercentageToDP('10%'), flex: 1, width: widthPercentageToDP('85%'), backgroundColor: '#fff', borderRadius: 4, flexDirection: 'column', padding: widthPercentageToDP('5%') }} >
                            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#141312' }}>Unauthorized Access.</Text>
                            <Text style={{ marginTop: widthPercentageToDP('5%'), fontSize: widthPercentageToDP('5%'), color: '#949494' }}>You are deactivated by admin. Try again later.</Text>

                            <TouchableOpacity style={{ width: widthPercentageToDP('25%'), alignSelf: 'center', justifyContent: 'center', padding: 7, marginTop: widthPercentageToDP('5%'), flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }} onPress={this.logout.bind(this)}>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#fff' }}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Modal>
                {
                    this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                        <TouchableOpacity onPress={() => this.completetrip(this.state.data.trip_no, this.state.data.exp_arrival_timestamp, "isNotSingleTrip")}>
                            <Header style={{ backgroundColor: '#263C88' }}>
                                {this.state.loading == true ? (
                                    <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                            <View>
                                                <ActivityIndicator size={'small'} color='white' />
                                            </View>
                                            <View>
                                                <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: 'white', paddingLeft: 10 }}>PLEASE WAIT...</Title>
                                            </View>
                                        </View>
                                    </Body>
                                ) : (

                                        <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                            <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: 'white' }}>{'Complete Full Trip'}</Title>
                                        </Body>
                                    )}
                            </Header>
                        </TouchableOpacity> : this.state.decoded.user_type_id === 2 ?
                            this.state.userDetails === null || this.state.userDetails.indexOf(3) > -1 ?
                                <TouchableOpacity onPress={() => this.completetrip(this.state.data.trip_no, this.state.data.exp_arrival_timestamp, "isNotSingleTrip")}>
                                    <Header style={{ backgroundColor: '#263C88' }}>
                                        {this.state.loading == true ? (
                                            <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                    <View>
                                                        <ActivityIndicator size={'small'} color='white' />
                                                    </View>
                                                    <View>
                                                        <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: 'white', paddingLeft: 10 }}>PLEASE WAIT...</Title>
                                                    </View>
                                                </View>
                                            </Body>
                                        ) : (

                                                <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                    <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: 'white' }}>{'Complete Full Trip'}</Title>
                                                </Body>
                                            )}
                                    </Header>
                                </TouchableOpacity> : null : null

                }
                {this.state.tripDelay.length > 0 ? (
                    <SearchableDropdown
                        title={'Select To Location'}
                        data={this.state.tripDelay}
                        onSelect={(selectedItem) => { this.setState({ selectedDelay: selectedItem, showDelayReasonDropdown: false }) }}
                        onCancel={() => { this.setState({ showDelayReasonDropdown: false }) }}
                        isVisible={this.state.showDelayReasonDropdown === true} />
                ) : null}
            </Container>
        );
    }
}
const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(EndtripDetail));

const styles = StyleSheet.create({
    outerCircle: {
        backgroundColor: 'black',
        borderRadius: 40,
        width: widthPercentageToDP('7%'),
        height: widthPercentageToDP('7%'),
    },
    betweenRange: {
        borderRadius: 40,
        width: widthPercentageToDP('25%'),
        height: widthPercentageToDP('7%'),
    },
    innerCircle: {
        borderRadius: 40,
        width: widthPercentageToDP('6%'),
        height: widthPercentageToDP('6%'),
        margin: widthPercentageToDP('0.5%')
    },
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

    modal4: {
        maxHeight: 300,
        minHeight: 80
    },
    modal1: {
        maxHeight: 260,
        minHeight: 80
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
