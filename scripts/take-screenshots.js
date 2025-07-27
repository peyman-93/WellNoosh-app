// Screenshot helper script
// This script can be used with tools like Detox for automated screenshots

const screenshots = {
  // Main Community Screen
  communityScreen: {
    name: 'V3CommunityScreen',
    tabs: ['challenges', 'feed', 'leaderboard', 'voting', 'connections'],
    file: 'screens/tabs/V3CommunityScreen.tsx'
  },
  
  // Family Choice Screen
  familyChoiceScreen: {
    name: 'FamilyChoiceScreen', 
    states: ['initial', 'with-title', 'with-recipes-selected', 'share-modal'],
    file: 'screens/FamilyChoiceScreen.tsx'
  },
  
  // Key screens to capture
  screensToCapture: [
    '1. Community Screen - Challenges Tab',
    '2. Community Screen - Feed Tab', 
    '3. Community Screen - Leaderboard Tab',
    '4. Community Screen - Voting Tab (with active votes)',
    '5. Community Screen - Connections Tab',
    '6. Family Choice Screen - Initial state',
    '7. Family Choice Screen - With title entered',
    '8. Family Choice Screen - With recipes selected',
    '9. Family Choice Screen - Share modal open',
    '10. Create Vote Modal - Recipe type selected'
  ]
}

// Instructions for taking screenshots:
console.log('To take screenshots of your React Native app:')
console.log('1. Run: npx expo start')
console.log('2. Open on device/simulator')
console.log('3. Navigate to each screen state')
console.log('4. Take screenshots manually or use automated tools')
console.log('\nScreens to capture:', screenshots.screensToCapture)

module.exports = screenshots