import { StyleSheet, Platform } from "react-native";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';


export default (styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    margin:{
        marginLeft: wp('5%'),
        marginRight: wp('5%')
    },
    full: {
        flex: 1
    },
    column: {
        flexDirection: 'column'
    },
    row: {
        flexDirection: 'row'
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    margintop: (value) => {
        return {
            marginTop: wp(value)
        }
    },
    fontSize: (value) => {
        return {
            fontSize: hp(value)
        }
    },
    fontFamilyExtraBold:{
        fontWeight: Platform.OS === 'ios' ? null : 'normal',
        fontFamily: 'Nunito-ExtraBold'
    },
    fontFamilySemiBold:{
        fontWeight: Platform.OS === 'ios' ? null : 'normal',
        fontFamily: 'Nunito-SemiBold'
    },
    fontFamilyBold:{
        fontWeight: Platform.OS === 'ios' ? null : 'normal',
        fontFamily: 'Nunito-Bold'
    },
    fontFamilyBlack:{
        fontWeight: Platform.OS === 'ios' ? null : 'normal',
        fontFamily: 'Nunito-Black'
    },
    fontFamilyRegular:{
        fontWeight: Platform.OS === 'ios' ? null : 'normal',
        fontFamily: 'Nunito-Regular'
    },
    
    line: {
        marginBottom: hp('1%'),
        borderBottomColor: '#828EA5',
        borderBottomWidth: 0.5, 
    },
    rh: (value) => {
        return {
            height: hp(value)
        }
    },
    rw: (value) => {
        return {
            width: wp(value)
        }
    },
    pb: (value) => {
        return {
            paddingBottom: hp(value)
        }
    },
    br: (value) => {
        return {
            borderRadius: hp(value),
            borderWidth: 0.1
        }
    },
    backIcons: {
        width: wp('3.5%'),
        height: Platform.OS === 'ios' ? hp('4.5%') : hp('5%'),
        resizeMode: 'contain'
    },
}));
