import React from "react";
import { SafeAreaView, StatusBar } from 'react-native';
import { connect } from "react-redux";
import LoadingIndicator from './styles/LoadingIndicator';
import { getUserData } from "./store/actions/userActions";
import LoginScreen from './login/LoginScreen';
import styles from './styles/Common';
import TabManager from "./dashboard/TabManager";
class InitialScreen extends React.Component {

    state = {
        loading: true
    }

    componentDidMount() {
        this.setState({
            loading: true
        }, async () => {
            await this.props.getUserData();
            this.setState({
                loading: false
            })
        })
    }

    getScreen() {

        if (this.state.loading) {
            return <LoadingIndicator />
        }
        else {
            console.log("data lodash : ", this.props.data)
            if (this.props.data && this.props.data.first_name) {
                return <TabManager />
            }
            else {
                return <LoginScreen />
            }
        }
    }

    render() {
        return (
            <SafeAreaView style={[styles.full]}>
                <StatusBar backgroundColor={'#000000'} barStyle='default' />
                {this.getScreen()}
            </SafeAreaView>
        );
    }
}

const mapStateToProps = state => ({
    data: state.user.data
});

const mapDispatchToProps = dispatch => ({
    getUserData: () => dispatch(getUserData()),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(InitialScreen);