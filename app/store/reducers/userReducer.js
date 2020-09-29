import {
    GET_USER_DATA,
    SAVE_USER_DATA,
    UPDATE_USER_DATA
} from "../actions/types";

const initialState = {
    data: null,
};

export default (state = initialState, action) => {
    switch (action.type) {
        case GET_USER_DATA:
            return {
                ...state,
                data: {
                    ...action.payload,
                }
            };
            
        case UPDATE_USER_DATA:
            return {
                ...state,
                data: {
                    ...action.payload,
                }
            };

        case SAVE_USER_DATA:
            return {
                ...state,
                data: {
                    ...action.payload,
                }
            };

        default:
            return state;
    }
};
