export interface I_ServiceResponse<Response> {
    data?: Response,
    error?: any
}

//various data on ip that may be requested by services
export interface I_IpRegionDataApiIp {
    ip: string,
    continentCode: string,
    continentName: string,
    countryCode: string,
    countryName: string,
    regionCode: string,
    regionName: string,
    postalCode: string,
    latitude: string,
    longitude: string,
    phoneCode: string,
    currency: {
        code: string
        name: string
    }
}