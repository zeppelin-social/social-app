import {type LocationGeocodedAddress} from 'expo-location'

import {type DeviceLocation} from '#/state/geolocation/types'
import {type Device} from '#/storage'

/**
 * Maps full US region names to their short codes.
 *
 * Context: in some cases, like on Android, we get the full region name instead
 * of the short code. We may need to expand this in the future to other
 * countries, hence the prefix.
 */
export const USRegionNameToRegionCode: {
  [regionName: string]: string
} = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  ['New Hampshire']: 'NH',
  ['New Jersey']: 'NJ',
  ['New Mexico']: 'NM',
  ['New York']: 'NY',
  ['North Carolina']: 'NC',
  ['North Dakota']: 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  ['Rhode Island']: 'RI',
  ['South Carolina']: 'SC',
  ['South Dakota']: 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  ['West Virginia']: 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

/**
 * Normalizes a `LocationGeocodedAddress` into a `DeviceLocation`.
 *
 * We don't want or care about the full location data, so we trim it down and
 * normalize certain fields, like region, into the format we need.
 */
export function normalizeDeviceLocation(
  _location: LocationGeocodedAddress,
): DeviceLocation {
  return {
    countryCode: 'US',
    regionCode: 'CA',
  }
}

/**
 * Combines precise location data with the geolocation config fetched from the
 * IP service, with preference to the precise data.
 */
export function mergeGeolocation(
  location?: DeviceLocation,
  config?: Device['geolocation'],
): DeviceLocation {
  if (location?.countryCode) return location
  return {
    countryCode: config?.countryCode,
    regionCode: config?.regionCode,
  }
}

/**
 * Computes the geolocation status (age-restricted, age-blocked) based on the
 * given location and geolocation config. `location` here should be merged with
 * `mergeGeolocation()` ahead of time if needed.
 */
export function computeGeolocationStatus(
  location: DeviceLocation,
  _config: Device['geolocation'],
) {
  return {
    ...location,
    isAgeRestrictedGeo: false,
    isAgeBlockedGeo: false,
  }
}

export async function getDeviceGeolocation(): Promise<DeviceLocation> {
  return {
    countryCode: undefined,
    regionCode: undefined,
  }
}
