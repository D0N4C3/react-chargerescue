export const GOOGLE_ANDROID_GEO_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_GEO_API_KEY ?? '';

export const hasGoogleAndroidGeoApiKey = GOOGLE_ANDROID_GEO_API_KEY.length > 0;
