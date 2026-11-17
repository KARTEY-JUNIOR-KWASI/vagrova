import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack initialRouteName="welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="index" />
      <Stack.Screen name="book/vehicle-type" />
      <Stack.Screen name="book/pickup-delivery" />
      <Stack.Screen name="book/load-details" />
      <Stack.Screen name="book/photos-upload" />
      <Stack.Screen name="book/quote-confirmation" />
      <Stack.Screen name="jobs/tracking" />
    </Stack>
  );
}

