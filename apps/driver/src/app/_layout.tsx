import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="trip/offer" />
      <Stack.Screen name="trip/active" />
      <Stack.Screen name="vehicle/docs" />
    </Stack>
  );
}

