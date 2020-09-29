import { Button, Container, Content, Fab, Footer, FooterTab, Right, Left, Body, Title, Header } from 'native-base';
import React, { Component } from "./node_modules/react";
import { StatusBar, Text, Image } from "react-native";
import Trip from "../Trip/trip";
import Track from "./track";
import Lock from "../Lock/lock";
import TripList from '../Trip/triplist';
import {withNavigation } from './node_modules/react-navigation';

class TrackHome extends Component { static navigationOptions = { header: null };
    constructor(props) {
        super(props)
        this.state = { index: 1, active: 'true' }
    }
    switchScreen(index) { this.setState({ index: index }) }
    render() {
        let AppComponent = null;
        if (this.state.index == 0) {
            AppComponent = TripList
        }
        else if (this.state.index == 1) {
            AppComponent = Track
        }
        else if (this.state.index == 2) {
            AppComponent = Lock
        }
        return (
            <Container style={{ backgroundColor: '#fdfdfd' }}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#FD8000" translucent={true} />       
                 {this.state.index == 1 ?
                    <Header transparent style={{ backgroundColor: '#263C88' }}>
                        <Left style={{ flex: 1 }}>
                            <Button onPress={() => this.props.navigation.navigate('Profile')} transparent style={{ height: 40, width: 60 }}>
                                <Image source={require('../images/profile.png')} style={{ height: 28, width: 28, resizeMode: 'contain' }} />
                            </Button>
                        </Left>
                        <Body style={{ justifyContent: 'center', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                            <Title style={{ fontWeight: 'bold' }}>Track</Title>
                        </Body>
                        <Right style={{ flex: 1 }}>
                            <Button onPress={() => this.props.navigation.navigate('Notification')} transparent >
                                <Image source={require('../images/notification.png')} style={{ height: 28, width: 28, resizeMode: 'contain', tintColor: 'white' }} />
                            </Button>
                        </Right>
                    </Header> : null
                }
                 {this.state.index == 2 ?
                    <Header transparent style={{ backgroundColor: '#263C88' }}>
                        <Left style={{ flex: 1 }}>
                            <Button onPress={() => this.props.navigation.navigate('Profile')} transparent style={{ height: 40, width: 60 }}>
                                <Image source={require('../images/profile.png')} style={{ height: 28, width: 28, resizeMode: 'contain' }} />
                            </Button>
                        </Left>
                        <Body style={{ justifyContent: 'center', justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                            <Title style={{ fontWeight: 'bold' }}>Lock</Title>
                        </Body>
                        <Right style={{ flex: 1 }}>
                            <Button onPress={() => this.props.navigation.navigate('Notification')} transparent >
                                <Image source={require('../images/notification.png')} style={{ height: 28, width: 28, resizeMode: 'contain', tintColor: 'white' }} />
                            </Button>
                        </Right>
                    </Header> : null
                }
                <Content contentContainerStyle={{ flex: 1 }} style={{ backgroundColor: '#F5F5F4' }}>
                    <AppComponent />
                </Content>
                <Footer style={{ backgroundColor: 'white', shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 10, shadowRadius: 1, elevation: 3 }} >
                    <FooterTab style={{ backgroundColor: 'white'/*,alignItems:'center',justifyContent:'center',alignSelf:'center'*/ }}>
                        {this.state.index == 0 ?
                            <Button active style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }} onPress={() => this.switchScreen(0)}>
                                <Image source={require('../images/Trip.png')} style={{ height: 20, width: 20, tintColor: 'white' }} />
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Trip</Text>
                            </Button> : <Button style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }} onPress={() => this.switchScreen(0)}>
                                <Image source={require('../images/Trip.png')} style={{ height: 20, width: 20 }} />
                                <Text style={{ fontWeight: 'bold' }}>Trip</Text>
                            </Button>
                        }
                        {this.state.index == 1 ?
                            <Button active style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }} onPress={() => this.switchScreen(1)}>
                                <Image source={require('../images/truck-grey.png')} style={{ height: 20, width: 20, tintColor: 'white' }} />
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Track</Text>
                            </Button> : <Button style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }} onPress={() => this.switchScreen(1)}>
                                <Image source={require('../images/truck-grey.png')} style={{ height: 20, width: 20 }} />
                                <Text style={{ fontWeight: 'bold' }}>Track</Text>
                            </Button>
                        }
                        {this.state.index == 2 ?
                            <Button active style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }} onPress={() => this.switchScreen(2)}>
                                <Image source={require('../images/lock-grey.png')} style={{ height: 18, width: 18, tintColor: 'white', resizeMode:'contain' }} />
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Locks</Text>
                            </Button> : <Button style={{ alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }} onPress={() => this.switchScreen(2)}>
                                <Image source={require('../images/lock-grey.png')} style={{ height: 18, width: 18, resizeMode:'contain' }} />
                                <Text style={{ fontWeight: 'bold' }}>Locks</Text>
                            </Button> }
                    </FooterTab>
                </Footer>
            </Container>
        );
    }
}
const styles = {
    body: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    title: {
        fontFamily: 'Roboto',
        fontWeight: '100'
    }
};
export default withNavigation(TrackHome);