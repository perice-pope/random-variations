import * as React from 'react'
import Rebase from 're-base'
import * as firebase from 'firebase'

// Initialize Firebase
const config = {
  apiKey: 'AIzaSyAxNQHe76PzXr94Dypr-BFmj3tn4cdwD4k',
  authDomain: 'random-variations-api-staging.firebaseapp.com',
  databaseURL: 'https://random-variations-api-staging.firebaseio.com',
  projectId: 'random-variations-api-staging',
  storageBucket: 'random-variations-api-staging.appspot.com',
  messagingSenderId: '905007255924',
}
firebase.initializeApp(config)

export const base = Rebase.createClass(firebase.database())

export const FirebaseContext = React.createContext(firebase)

export default firebase

// This function takes a component...
export function withFirebase(Component) {
  // ...and returns another component...
  return function ComponentWithFirebase(props) {
    // ... and renders the wrapped component with the context theme!
    // Notice that we pass through any additional props as well
    return (
      <FirebaseContext.Consumer>
        {firebase => <Component {...props} firebase={firebase} />}
      </FirebaseContext.Consumer>
    )
  }
}
