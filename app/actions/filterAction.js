export const filterChange = (data) => {
    console.log("in filter change: ", data)
    return {
        type: 'SEARCH',
        payload: data
    };
}

export const filterVehicle = (data) => {
    console.log("in filter vehicle: ", data)
    return {
        type: 'VEHICLE',
        payload: data
    };
}

export const filterIncoice = (data) => {
    console.log("in filter invoice: ", data)
    return {
        type: 'INVOICE',
        payload: data
    };
}

export const filterBill = (data) => {
    console.log("in filter bill: ", data)
    return {
        type: 'BILL',
        payload: data
    };
}

export const filterTrip_Status = (data) => {
    console.log("in filter trip_status: ", data)
    return {
        type: 'TRIP_STATUS',
        payload: data
    };
}

export const filterDriverName = (data) => {
    console.log("in filter driver name : ", data)
    return {
        type: 'DRIVERNAME',
        payload: data
    };
}

export const filterDriverNo = (data) => {
    console.log("in filter driver no: ", data)
    return {
        type: 'DRIVERNO',
        payload: data
    };
}

export const filterfromloc = (data) => {
    console.log("in filter from location : ", data)
    return {
        type: 'FROMLOCATION',
        payload: data
    };
}

export const filtertoloc = (data) => {
    console.log("in filter to location : ", data)
    return {
        type: 'TOLOCATION',
        payload: data
    };
}

export const filterfromdate = (data) => {
    console.log("in filter from date : ", data)
    return {
        type: 'FROMDATE',
        payload: data
    };
}

export const filtertodate = (data) => {
    console.log("in filter to date : ", data)
    return {
        type: 'TODATE',
        payload: data
    };
}

