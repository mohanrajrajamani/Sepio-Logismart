import React, { Component } from "react";
import { Toast, Container, Body, Title, Header, CheckBox } from 'native-base';
import { Keyboard, Text, StatusBar, View, TouchableOpacity, TextInput, StyleSheet, Platform, Dimensions, ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import SearchableDropdown from "./SearchableDropdownLockID";
import APIService from '../component/APIServices';
const _ = require('lodash');
import Header1 from '../component/Header';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from "@react-native-community/netinfo";

class TripAssignScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showResortDropdown: false,
            lock_model: [],
            itemName: '',
            lock_vendor: '',
            data: '',
            checked1: false,
            checked2: false,
            isVisible1: true,
            isVisible2: true,
            Prolonged_Open: '',
            hour: '',
            Idle_Time: '',
            Authorised_Open: '',
            exp_trip: '',
            exp_delay: '',
            exp_idle: '',
            exp_auth_open: '',
            trip_id: '',
            trip_no: '',
            fromloc: '',
            tolocation: '',
            fromloc_id: '',
            tolocation_id: '',
            loading: false,
            old_lock: '',
            progressText: 'Loading...'
        };
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

    static navigationOptions =
        {
            header: null
        };

    componentDidMount() {
        this.setState({ data: this.props.navigation.state.params.item }, () => {
            var exp_trip = this.state.data.exp_trip_time
            exp_trip = exp_trip / 60;
            this.setState({ exp_trip: exp_trip.toFixed(2) });
            var exp_delay = this.state.data.exp_delay
            if (exp_delay > 0) {
                exp_delay = exp_delay / 60;
                this.setState({ exp_delay: exp_delay.toFixed(2) });
            } else {
                this.setState({ exp_delay: exp_delay });
            }
            var trip_id = this.state.data.trip_id;
            this.setState({ trip_id: trip_id });
            var trip_no = this.state.data.trip_no;
            this.setState({ trip_no: trip_no });
            var fromloc = this.state.data.from_location;
            this.setState({ fromloc: fromloc });
            var tolocation = this.state.data.to_location;
            this.setState({ tolocation: tolocation });
            var fromloc_id = this.state.data.from_location_id;
            this.setState({ fromloc_id: fromloc_id });
            var tolocation_id = this.state.data.to_location_id;
            this.setState({ tolocation_id: tolocation_id });
            var exp_idle_time = this.state.data.exp_idle
            exp_idle_time = exp_idle_time / 60;
            this.setState({ exp_idle: exp_idle_time });
            var exp_auth = this.state.data.exp_auth_open
            this.setState({ exp_auth_open: exp_auth })
            var Prolonged = this.state.data.exp_prolonged_open
            Prolonged = Prolonged / 60;
            this.setState({ Prolonged_Open: Prolonged })
            var old_lock = this.state.data.lock_id ? this.state.data.lock_id : ''
            this.setState({ old_lock: old_lock })
        })
    }

    async lockId() {
        this.setState({ showResortDropdown: true }, async () => {
            var responseJson = await APIService.execute('GET', APIService.URL + APIService.listonlinelockdetails, null)
            if (responseJson.data.data.length > 0) {
                // var temp = {}
                // temp.selectedLock = this.state.f_asset_id
                this.setState({ lock_model: responseJson.data.data });
            } else {
                this.setState({ showResortDropdown: false })
                this.showMessage("No lock available")
            }
        });

    }
    delay(text) { this.setState({ exp_delay: text }); }
    Idle_Time(text) {
        this.setState({ exp_idle: text });
    }
    Authorised_Open(text) {
        this.setState({ exp_auth_open: text });
    }
    Prolonged_Open(text) {
        this.setState({ Prolonged_Open: text });
    }
    async SaveAssign() {
        this.setState({ loading: true });
        var token = await AsyncStorage.getItem('loginData');
        if (token) {
            token = JSON.parse(token);
        }
        if (this.state.exp_idle.toString()) {
            var Idle_Time = this.state.exp_idle.toString();
            Idle_Time = Idle_Time * 60;
        }
        if (this.state.exp_delay) {
            var delay_Time = this.state.exp_delay;
            delay_Time = delay_Time * 60;
        }
        if (this.state.exp_trip) {
            var exp_time = this.state.exp_trip;
            exp_time = exp_time * 60;
        }
        if (this.state.Prolonged_Open.toString()) {
            var prolonged = this.state.Prolonged_Open.toString();
            prolonged = prolonged * 60;
        }

        if (delay_Time === null || delay_Time === undefined || delay_Time === '') {
            delay_Time = 0;
        }
        if (Idle_Time === null || Idle_Time === undefined || Idle_Time === '') {
            Idle_Time = 0;
        }
        if (this.state.exp_auth_open === null || this.state.exp_auth_open === undefined || this.state.exp_auth_open === '') {
            this.setState({ exp_auth_open: 0 })
        }
        if (prolonged === null || prolonged === undefined || prolonged === '') {
            prolonged = 0;
        }

        if (this.state.data.f_asset_id ? false : this.state.itemName.itemName == null || this.state.itemName.itemName == undefined || this.state.itemName.itemName == '') {
            alert("Select Lock ID");
            this.setState({ loading: false });
        }

        else if (this.state.exp_idle.toString() == null || this.state.exp_idle.toString() == undefined || this.state.exp_idle.toString() == '') {
            alert("Select Idle Time");
            this.setState({ loading: false });
        }
        else if (this.state.exp_auth_open.toString() == null || this.state.exp_auth_open.toString() == undefined || this.state.exp_auth_open.toString() == '') {
            alert("Select Authorised Open");
            this.setState({ loading: false });
        }
        else if (this.state.Prolonged_Open.toString() == null || this.state.Prolonged_Open.toString() == undefined || this.state.Prolonged_Open.toString() == '') {
            alert("Select Prolonged Open");
            this.setState({ loading: false });
        }
        else {
            this.setState({ loading: false });
            var body = {
                trip_id: this.state.trip_id,
                trip_no: this.state.trip_no,
                lock_id: this.state.itemName.id ? this.state.itemName.id : this.state.data.lock_id,
                old_lock_id: this.state.data.lock_id ? this.state.itemName.id ? this.state.old_lock : this.state.data.lock_id : this.state.itemName.id ? this.state.old_lock : '',
                f_asset_id: this.state.itemName ? this.state.itemName.itemName : this.state.data.f_asset_id,
                delay: delay_Time,
                idle_time: Idle_Time,
                auth_open: this.state.exp_auth_open.toString(),
                default_idle: this.state.checked1 ? 1 : 0,
                default_auth_open: this.state.checked2 ? 1 : 0,
                exp_prolonged_open: prolonged,
                event_city: null,
                message_status: this.state.old_lock ? 'edit' : 'assign',
                event_lat: null,
                event_long: null,
                from: this.state.fromloc,
                to: this.state.tolocation,
                from_id: this.state.fromloc_id,
                to_id: this.state.tolocation_id,
                lock_vendor: this.state.itemName.lock_vendor
            }
            
            var responseJson = await APIService.execute('POST', APIService.URL + APIService.assignlock, body)
            this.showMessage(responseJson.data.message)
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
            // this.props.navigation.navigate('TripHome', { item: this.state.data });
        }
    }

    renderModalContent = () => {
        if (this.state.showResortDropdown) {
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

        return (
            <Container style={{ flex: 1, backgroundColor: '#EDEEF2' }}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#FD8000" translucent={true} />
                <Header1 label={"Trip ID: " + this.state.trip_id || '---'} expanded={true} onBack={() => { this.props.navigation.goBack() }} />
                <ScrollView style={{ backgroundColor: '#EDEEF2' }}>
                    <View style={{ flex: 1, margin: 10 }} >
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Lock ID:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={() => { this.lockId() }}
                                style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.itemName ? this.state.itemName.itemName + " " + (this.state.itemName.lock_vendor === 'jt' ? "(SP701)" : "(SP777)") : this.state.data.f_asset_id ? this.state.data.f_asset_id + " " + (this.state.data.lock_vendor === 'jt' ? "(SP701)" : "(SP777)") : 'Select Lock'}</Text>
                                {/* <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.itemName ? this.state.itemName.itemName : this.state.data.f_asset_id + " "+ (this.state.data.lock_vendor === 'jt' ? "(SP701)" : "(SP777)") || 'Select Lock No'}</Text>              */}
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Expected trip time</Text>
                            <Text style={{ flex: 1, justifyContent: 'flex-end', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Delay:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View
                                style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5, }}>
                                <Text style={{ flex: 1, marginLeft: 15, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 7 }}>{this.state.exp_trip.toString() || "---"}</Text>
                                <View style={{ width: 40, marginLeft: 10, fontSize: 14, justifyContent: 'center', backgroundColor: '#f2f2f2', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                    <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#000' }}>hr</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <TextInput keyboardType={'numeric'} value={this.state.exp_delay} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.delay(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                <View style={{ width: 40, marginLeft: 10, fontSize: 14, justifyContent: 'center', backgroundColor: '#f2f2f2', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                    <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#000' }}>hr</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Idle Time</Text>
                            <Text style={{ flex: 1, justifyContent: 'flex-end', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Authorized Open:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <TextInput keyboardType={'numeric'} value={this.state.exp_idle.toString()} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.Idle_Time(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                <View style={{ width: 40, marginLeft: 10, fontSize: 14, justifyContent: 'center', backgroundColor: '#f2f2f2', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                    <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#000' }}>hr</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <TextInput keyboardType={'numeric'} value={this.state.exp_auth_open.toString()} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.Authorised_Open(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center', color: '#000' }} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', flex: 1 }}>
                            <CheckBox checked={this.state.isVisible1} style={{ marginRight: 5, backgroundColor: this.state.checked1 === true ? "#263C88" : "white", borderColor: this.state.checked1 === true ? "#263C88" : "#263C88", marginTop: 10, width: 25, height: 24, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 5 }}
                                onPress={() => this.setState({ checked1: !this.state.checked1 })} />

                            {this.state.checked1 ?
                                <TouchableOpacity onPress={() => this.setState({ checked1: !this.state.checked1 })}>
                                    <Text style={{ marginHorizontal: 20, flex: 1, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 11, fontSize: 16, fontWeight: 'bold' }}>Make Default</Text>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => this.setState({ checked1: !this.state.checked1 })}>
                                    <Text style={{ marginHorizontal: 20, flex: 1, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 11, fontSize: 16 }}>Make Default</Text>
                                </TouchableOpacity>
                            }
                            <CheckBox checked={this.state.isVisible2} style={{ marginRight: 5, backgroundColor: this.state.checked2 === true ? "#263C88" : "white", borderColor: this.state.checked2 === true ? "#263C88" : "#263C88", marginTop: 10, width: 25, height: 24, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 5 }}
                                onPress={() => this.setState({ checked2: !this.state.checked2 })} />
                            {this.state.checked2 ?
                                <TouchableOpacity onPress={() => this.setState({ checked2: !this.state.checked2 })}>
                                    <Text style={{ marginHorizontal: 20, flex: 1, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 11, fontSize: 16, fontWeight: 'bold' }}>Make Default</Text>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity onPress={() => this.setState({ checked2: !this.state.checked2 })}>
                                    <Text style={{ marginHorizontal: 20, flex: 1, justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', paddingTop: 11, fontSize: 16 }}>Make Default</Text>
                                </TouchableOpacity>
                            }
                        </View>
                        <View style={{ justifyContent: 'flex-start', flex: 1 }}>
                            <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 10, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Prolonged Open(Min)*</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                            <TouchableOpacity
                                style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <TextInput keyboardType={'phone-pad'} value={this.state.Prolonged_Open.toString()} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.Prolonged_Open(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                <View style={{ width: 40, marginLeft: 10, fontSize: 14, justifyContent: 'center', backgroundColor: '#f2f2f2', borderRadius: 5, shadowColor: '#F1F1F1', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1 }}>
                                    <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#000' }}>Min</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1 }} />
                        </View>
                    </View>
                </ScrollView>
                {this.renderModalContent()}
                <TouchableOpacity onPress={() => this.SaveAssign()}>
                    <Header style={{ backgroundColor: '#263C88', justifyContent: 'center', alignSelf: 'center' }}>
                        {
                            this.state.loading ? (
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
                            ) : (

                                    <Body style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <View transparent style={{ flex: 1, height: 45, width: widthPercentageToDP('50%'), justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                            <Text style={{ color: '#fff', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>Save & Assign</Text>
                                        </View>
                                    </Body>

                                )
                        }
                    </Header>
                </TouchableOpacity>
                {this.state.lock_model.length > 0 ? (
                    <SearchableDropdown
                        selectedLock={this.state.f_asset_id}
                        title={'Search Lock'}
                        data={this.state.lock_model}
                        onSelect={(selectedItem) => {
                            this.setState({
                                itemName: selectedItem, showResortDropdown: false,
                            })
                        }}
                        onCancel={() => {
                            this.setState({
                                showResortDropdown: false
                            })
                        }} isVisible={this.state.showResortDropdown === true} />

                ) : null
                }
            </Container>
        );
    }
}
export default withNavigation(TripAssignScreen);


const styles = StyleSheet.create({
    overlay: {
        height: Platform.OS === "android" ? Dimensions.get("window").height : null,
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', alignSelf: 'center'
    }
});