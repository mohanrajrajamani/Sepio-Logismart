import { createStackNavigator } from 'react-navigation-stack';
import { createAppContainer } from 'react-navigation';
import SplashScreen from './login/SplashScreen';
import LoginScreen from './login/LoginScreen';
import InitialScreen from './InitialScreen';
import TabManager from './dashboard/TabManager';
import TripScreen from './dashboard/TripScreen';
import TrackScreen from './dashboard/TrackScreen';
import LockScreen from './dashboard/LockScreen';
import ProfileScreen from './dashboard/ProfileScreen';
import TripListScreen from './trip/TripListScreen';
import TripAdd from './trip/TripAdd';
import TripFilterScreen from './trip/TripFilterScreen';
import TripDetailScreen from './trip/TripDetailScreen';
import TripAssignScreen from './trip/TripAssignScreen';
import EditTripScreen from './trip/EditTripScreen';
import TrackFilter from './track/TrackFilter';
import TrackDetail from './track/TrackDetail';
import TrackEdit from './track/TrackEdit';
import NotificationScreen from './notification/NotificationScreen';
import Track from './dashboard/Track';
import EndTripListScreen from './endTrip/EndTripListScreen';
import EndtripDetail from './endTrip/EndtripDetail';

const Navigator = createStackNavigator(
    {
        SplashScreen,
        LoginScreen,
        InitialScreen,
        TabManager,
        TripScreen,
        TrackScreen,
        LockScreen,
        ProfileScreen,
        TripListScreen,
        TripAdd,
        TripFilterScreen,
        TripDetailScreen,
        TripAssignScreen,
        EditTripScreen,
        TrackDetail,
        TrackEdit,
        TrackFilter,
        NotificationScreen,
        Track,
        EndTripListScreen,
        EndtripDetail
    },
    {
        initialRouteName: 'SplashScreen',
        defaultNavigationOptions: {
            headerShown: false
        }
    }
);

export default createAppContainer(Navigator);