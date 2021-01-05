import {
    IS_SIGNED_IN,
    IS_SIGNED_OUT
} from '../actions/actionTypes';

const initialState = {
    signedIn: false
};

// eslint-disable-next-line
export default (state = initialState, action) => {
    switch (action.type) {
        case IS_SIGNED_IN:
            return {
                ...state,
                signedIn: true
            };
        case IS_SIGNED_OUT:
            return {
                ...state,
                signedIn: false
            };
        default:
            return state;
    }
};
