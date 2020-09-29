import React, { Component } from "react";
import { Button, Container, Toast, Fab, Footer, FooterTab, Right, Left, Body, Title, Header } from 'native-base';
import { Text, StatusBar, Image, View, TouchableOpacity, ActivityIndicator, FlatList, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import firebase, { notifications } from 'react-native-firebase';
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import Modal from 'react-native-modalbox';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import APIService from '../component/APIServices';
import { connect } from "react-redux";
import Header1 from '../component/Header';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from "@react-native-community/netinfo";

class NotificationScreen extends Component {
    static navigationOptions =
        {
            header: null
        };
    constructor() {
        super();
        this.state = {
            loading: true,
            notifications_data: [],
            userDetails: [],
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

    async componentDidMount() {
        var jwtDecode = require('jwt-decode');
        this.setState({ loading: true, decoded: jwtDecode(await AsyncStorage.getItem('user_token')) });
        var userDetails = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)
        var responseJson = userDetails.data;
        if (responseJson.data[0].status === 1) {
            this.setState({
                data: responseJson.data[0],
                loading: false,
                focus: false
            })
        }
        else if (responseJson.data[0].status === 2) {
            this.setState({
                loading: false,
                focus: false
            })
            this.refs.modal1.open()
        }

        

        // var testing_config = firebase.initializeApp({
        //     clientId: '94333177175-5cn3h5h2omvpno5dt4t86d2tk07kf7u7.apps.googleusercontent.com',
        //     appId: '1:94333177175:android:40691843906883c4',
        //     apiKey: 'AIzaSyB4wKiwAB7cdMBNb7Mcw6EzJ14RfUaLvKM',
        //     databaseURL: 'https://sepio-saas-live.firebaseio.com',
        //     storageBucket: 'sepio-saas-live.appspot.com',
        //     messagingSenderId: '94333177175',
        //     authDomain: 'sepio-saas-live.appspot.com',
        //     projectId: 'sepio-saas-live',
        //     // enable persistence by adding the below flag
        //     persistence: true,
        // });
        // console.log("db:", testing_config);
        var db = firebase.firestore();
        if (this.state.decoded.user_type_id == 1) {
            db.collection("notification").where("status", "==", 1).where("company_id", "==", this.state.decoded.company_id)
                .orderBy("timestamp", "desc").onSnapshot(snapshot => {
                    var notify = []
                    snapshot.forEach(function (change) { notify.push(change._data); });
                    this.setState({ notifications_data: notify, loading: false })
                });
        }
        else if (this.state.decoded.user_type_id == 2) {
            if (this.state.decoded.access_right == 1) {
                db.collection("notification").where("status", "==", 1).where("company_id", "==", this.state.decoded.company_id)
                    .orderBy("timestamp", "desc").onSnapshot(snapshot => {
                        var notify = []
                        snapshot.forEach(function (change) {
                            notify.push(change._data);
                        });
                        this.setState({ notifications_data: notify, loading: false })
                    });

            }
            else if (this.state.decoded.access_right == 2) {
                db.collection("notification").where("status", "==", 1).where("company_id", "==", this.state.decoded.company_id)
                    .orderBy("timestamp", "desc").onSnapshot(snapshot => {
                        var notify = []
                        snapshot.forEach(function (change) {
                            notify.push(change._data);
                        });
                        this.setState({ notifications_data: notify, loading: false })
                    });

            }
            else if (this.state.decoded.access_right == 3) {
                var from_data = db.collection("notification").where("status", "==", 1).where("company_id", "==", this.state.decoded.company_id).where("from_location_id", "==", this.state.decoded.location_id).orderBy("timestamp", "desc");

                var to_data = db.collection("notification").where("status", "==", 1).where("company_id", "==", this.state.decoded.company_id).where("to_location_id", "==", this.state.decoded.location_id).orderBy("timestamp", "desc");


                const california = [];
                from_data.onSnapshot((querySnapshot) => {
                    // console.log(" from_data result$:", querySnapshot)
                    var data = querySnapshot.docs.map(d => d.data());
                    california.push(data);
                });

                to_data.onSnapshot((querySnapshot) => {
                    var data = querySnapshot.docs.map(d => d.data());
                    california.push(data);
                });

                // california.push(a);
                // // colorado.push(b);
                // california.push(b);
                // console.log("california:", california)
                try {
                    california.subscribe((snapshot) => {
                        // console.log("snapshot.size:",snapshot.size);
                        if (snapshot.size == 0) {
                            this.setState({
                                notifications_data: [],
                                loading: false
                            })
                        } else {
                            function compare(a, b) {
                                if (a.timestamp > b.timestamp)
                                    return -1;
                                if (a.timestamp < b.timestamp)
                                    return 1;
                                return 0;
                            }
                            var notify = []
                            for (var i = 0; i < snapshot.length; i++) {
                                // console.log("before nofity:", snapshot[i]);
                            }
                            this.setState({
                                notifications_data: notify,
                                loading: false
                            })
                        }

                    })
                }
                catch (e) {
                    // console.log("E:",e)
                    this.setState({
                        notifications_data: [],
                        loading: false
                    })
                }
            }
        }
        else if (this.state.decoded.user_type_id == 3) {
            db.collection("notification").where("status", "==", 1).where("company_id", "==", this.state.decoded.company_id)
                .orderBy("timestamp", "desc").onSnapshot(snapshot => {
                    var notify = []
                    snapshot.forEach(function (change) { notify.push(change._data); });
                    this.setState({ notifications_data: notify, loading: false })
                });
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

    render() {
        const notifications_data = this.state.notifications_data.reverse();
        return (
            <Container style={{ flex: 1, backgroundColor: '#EDEEF2' }}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#FD8000" translucent={true} />
                <Header1 label={"Notification"} expanded={true} onBack={() => { this.props.navigation.goBack() }}/>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ flex: 1, marginBottom: 10 }} >
                        {!this.state.loading ?
                            <View>
                                {this.state.notifications_data.length == 0 ?
                                    <View style={{ margin: 10, marginBottom: 2, backgroundColor: 'white', borderRadius: 10, paddingTop: 20, paddingBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignSelf: 'center' }}>
                                            <Image source={require('../../assets/images/bell.png')} style={{ height: 20, width: 20, resizeMode: 'contain', marginRight: 10 }} />
                                            <Text style={{ color: '#161719', fontWeight: 'bold', fontSize: 16 }}>No Notification Available</Text>
                                        </View>
                                    </View> :
                                    <View>
                                        <FlatList
                                            data={notifications_data}
                                            renderItem={({ item }) => (
                                                <View style={{ margin: 10, marginBottom: 2, backgroundColor: 'white', borderRadius: 10, paddingTop: 20, paddingBottom: 20 }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                                        <View style={{ height: 60, width: 80, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                                            <Image source={require('../../assets/images/start-trip.png')} style={{ height: 40, width: 40 }} />
                                                        </View>
                                                        <View style={{ flexDirection: 'column', flex: 1 }}>
                                                            <Text style={{ color: '#161719', fontWeight: 'bold', fontSize: 16 }}>{item.heading || '---'}</Text>
                                                            <Text style={{ color: '#949494', fontSize: 14, paddingRight: 5 }}>{item.text || "---"}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            )}
                                        />
                                    </View>
                                }
                            </View>
                            : <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', alignContent: 'center', marginTop: heightPercentageToDP('5%') }}>
                                <ActivityIndicator style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }} size={'large'} color='#263C88' />
                            </View>}
                    </View>
                </ScrollView>
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
const styles = StyleSheet.create({

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
})
const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(NotificationScreen));