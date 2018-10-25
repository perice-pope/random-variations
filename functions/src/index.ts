import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp(functions.config().firebase)

exports.onUserCreate = functions.auth.user().onCreate(user => {
  const userId = user.uid
  return admin
    .database()
    .ref(`/users/${userId}`)
    .set({
      key: userId,
      email: user.email,
      displayName: user.displayName,
    })
})

exports.onUserDelete = functions.auth.user().onDelete(user => {
  const userId = user.uid
  return admin
    .database()
    .ref(`/users/${userId}`)
    .remove()
})
