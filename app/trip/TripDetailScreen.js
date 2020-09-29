import React, { Component } from "react";
import { Button, Container, Content, Fab, Footer, Header, Right, Left, Body, Title, Toast } from 'native-base';
import { Keyboard, Text, StatusBar, Image, View, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import moment from "moment";
import call from 'react-native-phone-call';
import APIService from '../component/APIServices';
import Modal from 'react-native-modalbox';
import { connect } from "react-redux";
import Header1 from '../component/Header';
import AsyncStorage from '@react-native-community/async-storage'
var jwtDecode = require('jwt-decode');
import NetInfo from "@react-native-community/netinfo";

class TripDetailScreen extends React.Component {
    call = () => {
        //handler to make a call
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
            loading: false,
            decoded: '',
            userDetails: [],
            multiGeofence: '',
            geo_fencing_range: null,
            multiTrip: ''
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

    componentWillReceiveProps(item) {
        this.componentDidMount();
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
    }

    async getSubTrips() {

        var res = await APIService.execute('GET', APIService.URL + APIService.listsubtripdetails + '?' + 'trip_id=' + this.state.data.trip_id, null)
        this.setState({ multiTrip: res.data.data })
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


    async userdetails() {
        var res = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)

        if (res.data.data[0].status === 2) {
            this.refs.modal1.open()
        }
        else if (res.data.data[0].status === 1) {
            this.setState({ userDetails: res.data.data[0].logismart_feature_id })
        }
    }
    async StartTrip() {
        this.setState({ loading: true })
        Alert.alert(
            'Confirmation',
            'Do you want to start this trip ?',
            [
                { text: 'Yes', onPress: () => this.startTrip() },
                { text: 'No', onPress: () => { this.setState({ loading: false }) } },
            ],
            { cancelable: false }
        );
    }

    async startTrip() {
        this.setState({ loading: true })

        var sendBody = JSON.stringify({
            sub_trip_count: this.state.data.sub_trip_count,
            trip_type: this.state.multiTrip.length > 0 ? "multi" : "single",
            trip_id: this.state.data.trip_id,
            trip_no: this.state.data.trip_no,
            lock_id: this.state.data.lock_id,
            f_asset_id: this.state.data.f_asset_id,
            exp_departure_timestamp: this.state.data.exp_departure_timestamp,
            exp_arrival_timestamp: this.state.data.exp_arrival_timestamp,
            exp_delay: this.state.data.exp_delay,
            exp_idle_time: this.state.data.exp_idle,
            exp_auth_open: this.state.data.exp_auth_open,
            event_city: null,
            event_lat: null,
            event_long: null,
            from: this.state.data.from_location,
            to: this.state.data.to_location,
            from_id: this.state.data.from_location_id,
            to_id: this.state.data.to_location_id,
            exp_prolonged_open: this.state.data.exp_prolonged_open,
            geo_fencing_range: this.state.geo_fencing_range,
            lock_vendor: this.state.data.lock_vendor
        });
        var res = await APIService.execute('POST', APIService.URL + APIService.startTrip, sendBody)
        this.setState({ loading: false }, () => {
            // this.props.navigation.navigate('TripHome', { item: res.data });
            const resetAction = StackActions.reset({
                index: 0,
                actions: [
                    NavigationActions.navigate({
                        routeName: "TripListScreen",
                        params: { item: res.data.data }
                    })
                ]
            });
            this.props.navigation.dispatch(resetAction);
        });

    }

    openEditScreen(){
        console.log("inside ")
        this.props.navigation.navigate('EditTripScreen', { item: this.state.data })
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
                <ScrollView style={{ flex: 1, backgroundColor: '#EDEEF2' }}>
                    <Header transparent style={{ backgroundColor: '#263C88', height: heightPercentageToDP('25%') }}>
                        <Left style={{ justifyContent: 'center', flex: 1, alignItems: 'center', alignSelf: 'center', flexDirection: 'column' }}>
                            <Button transparent>
                                <Image source={require('../../assets/images/green-truck.png')} style={{ height: 70, width: 170, resizeMode: 'contain' }} />
                            </Button>
                            <Button transparent>
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
                            <Button transparent style={{ width: 130, marginRight: widthPercentageToDP('-5%') }} >
                                <Text style={{ fontSize: 14, color: '#fff', marginTop: 10, flex: 1, marginRight: -5, fontWeight: 'bold', padding: 10 }}>{this.state.data.to_location || '---'}</Text>
                            </Button>
                        </Right>
                    </Header>
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
                            <View>
                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'Nunito-Bold', marginTop: 5, marginBottom: 5, color: '#141312' }}>ROUTE INFORMATION</Text>
                            </View>
                            <View style={{ padding: 10, backgroundColor: '#fff', flex: 1 }}>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold' }}>Waiting to start the trip</Text>
                            </View>

                            {
                                this.state.geo_fencing_range !== null ?
                                    <View>

                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View style={{ justifyContent: 'center', alignSelf: 'flex-start' }}>
                                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'Nunito-Bold', marginTop: 5, marginBottom: 5, color: '#141312' }}>GEOFENCE DETAILS</Text>
                                            </View>

                                            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                                                <View style={{ borderRadius: 5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#06D79C', height: heightPercentageToDP('4%'), width: widthPercentageToDP('40%') }}>
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
                                <Text style={{ fontSize: 14, marginLeft: 10, fontFamily: 'Nunito-Bold', marginTop: 5, marginBottom: 5, color: '#141312' }}>TRIP DETAIL</Text>
                            </View>
                            <View style={{ backgroundColor: 'white', flexDirection: 'column', justifyContent: 'flex-start', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>Consignee</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.driver_name || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5, }}></View>
                                <TouchableOpacity style={{ flexDirection: 'row', padding: 10 }} onPress={this.state.data.driver_no ? this.call : null}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>Mobile No</Text>
                                    <Text style={{ fontSize: 16, color: '#263C88', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold', borderBottomColor: this.state.data.driver_no ? '#263C88' : null }}>{this.state.data.driver_no ? this.state.data.driver_no_code + this.state.data.driver_no : "---"}</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5, }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>Vehicle No</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.vehicle_number || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>LR No</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.lr_number || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>Invoice No.</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.invoice_no || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>Invoice Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.invoice_date ? moment(this.state.data.invoice_date, 'DD-MM-YYYY').format('DD MMM YYYY') : '---'}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>E-way bill Number</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.e_way_bill_no || "---"}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>E-way bill Generation Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.e_way_bill_date ? moment(this.state.data.e_way_bill_date, 'DD-MM-YYYY').format('DD MMM YYYY') : '---'}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>E-way bill Expiry Date</Text>
                                    <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.e_way_bill_expiry ? moment(this.state.data.e_way_bill_expiry, 'DD-MM-YYYY').format('DD MMM YYYY') : '---'}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                {this.state.data.f_asset_id ? <View style={{ flexDirection: 'row', padding: 10 }}>
                                    <Text style={{ flex: 1, fontSize: 16, color: '#949494', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', margin: 5 }}>Lock Id</Text>
                                    {
                                        this.state.data.f_asset_id ? <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{this.state.data.f_asset_id} {this.state.data.lock_vendor === 'jt' ? "(SP701)" : "(SP777)"}</Text> : <Text style={{ fontSize: 16, color: '#141312', justifyContent: 'flex-end', alignItems: 'flex-end', alignSelf: 'flex-end', fontFamily: 'Nunito-Bold', margin: 5, fontWeight: 'bold' }}>{'---'}</Text>
                                    }


                                    {
                                        this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                                            <TouchableOpacity onPress={() => this.props.navigation.navigate('TripAssignScreen', { item: this.state.data })} style={{ justifyContent: 'center', alignSelf: 'center' }}>
                                                <Image source={require('../../assets/images/pencil-edit-button.png')} style={{ height: 20, width: 20, resizeMode: 'contain', tintColor: '#141312', justifyContent: 'center', alignSelf: 'center' }} />
                                            </TouchableOpacity> :
                                            this.state.decoded.user_type_id === 2 ?
                                                this.state.userDetails === null || (this.state.userDetails && this.state.userDetails.indexOf(48) > -1) ? <TouchableOpacity onPress={() => this.props.navigation.navigate('TripAssignScreen', { item: this.state.data })} style={{ justifyContent: 'center', alignSelf: 'center' }}>
                                                    <Image source={require('../../assets/images/pencil-edit-button.png')} style={{ height: 20, width: 20, resizeMode: 'contain', tintColor: '#141312', justifyContent: 'center', alignSelf: 'center' }} />
                                                </TouchableOpacity> : null : null
                                    }

                                </View> : null}
                                <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                            </View>
                        </View>
                    </View>


                </ScrollView>
                {this.state.data.lock_id === null ?
                    <TouchableOpacity onPress={() => this.props.navigation.navigate('TripAssignScreen', { item: this.state.data })}>
                        <Header style={{ backgroundColor: '#263C88' }}>
                            {
                                this.state.loading ? (
                                    <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                            <View>
                                                <ActivityIndicator size={'small'} color='white' />
                                            </View>
                                            <View>
                                                <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', paddingLeft: 10 }}>PLEASE WAIT...</Title>
                                            </View>
                                        </View>
                                    </Body>
                                ) : (
                                        <Button style={{ backgroundColor: "transparent", justifyContent: 'center', alignItems: 'center' }} onPress={() => this.props.navigation.navigate('TripAssignScreen', { item: this.state.data })}>
                                            <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: 'white' }}>Assign Lock To This Trip</Title>
                                        </Button>
                                    )
                            }
                        </Header>

                    </TouchableOpacity>

                    : this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                        <TouchableOpacity onPress={() => this.StartTrip()}>
                            <Header style={{ backgroundColor: '#263C88' }}>
                                {this.state.loading ? (
                                    <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                            <View>
                                                <ActivityIndicator size={'small'} color='white' />
                                            </View>
                                            <View>
                                                <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', paddingLeft: 10, color: 'white' }}>PLEASE WAIT...</Title>
                                            </View>
                                        </View>
                                    </Body>
                                ) : (
                                        <Button style={{ backgroundColor: '#263C88', justifyContent: 'center', alignItems: 'center' }} onPress={() => this.StartTrip()}>
                                            <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', color: 'white' }}>Start the Trip</Title>
                                        </Button>
                                    )
                                }
                            </Header>
                        </TouchableOpacity>
                        : this.state.decoded.user_type_id === 2 ?
                            this.state.userDetails === null || (this.state.userDetails && this.state.userDetails.indexOf(2) > -1) ?
                                <TouchableOpacity onPress={() => this.StartTrip()}>
                                    <Header style={{ backgroundColor: '#263C88' }}>
                                        {this.state.loading ? (
                                            <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                                    <View>
                                                        <ActivityIndicator size={'small'} color='white' />
                                                    </View>
                                                    <View>
                                                        <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold', paddingLeft: 10, color: 'white' }}>PLEASE WAIT...</Title>
                                                    </View>
                                                </View>
                                            </Body>
                                        ) : (
                                                <Button style={{ backgroundColor: '#263C88', justifyContent: 'center', alignItems: 'center' }} onPress={() => this.StartTrip()}>
                                                    <Title style={{ fontSize: 16, fontFamily: 'Nunito-Bold' }}>Start the Trip</Title>
                                                </Button>
                                            )
                                        }
                                    </Header>
                                </TouchableOpacity> : null : null}

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
)(withNavigation(TripDetailScreen));

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
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