import { observable, computed, reaction, toJS } from 'mobx'
import firebase from './firebase'
import { Session } from '../types'
import _ from 'lodash'
import uuid from 'uuid/v4'
import { createDefaultSession } from '../utils'

const ANONYMOUS_USER_UID = 'anonymous-user-uid'

type ActiveSessionType = 'offline' | 'my' | 'shared'

/**
 * Apply some data transforms before passing a Session loaded from the API down to the app
 */
const preprocessLoadedSessionData = (session: Session): Session => ({
  ...createDefaultSession(),
  noteCards: [],
  ...session,
  modifiers: {
    enclosures: { enabled: false },
    chords: { enabled: false },
    scales: { enabled: false },
    intervals: { enabled: false },
    ...createDefaultSession().modifiers,
    ...session.modifiers,
  },
})

const db = firebase.firestore()
const sessionsRef = db.collection('sessions')
// const usersRef = db.collection("users")

class SessionStore {
  @observable
  private _hasLoadedMySessions = false
  @observable
  private _hasLoadedOfflineSession = false
  @observable
  private _hasLoadedSharedSession = false

  @observable
  private _mySessionsById: { [sessionKey: string]: Session } = {}
  @observable
  private _sharedSession?: Session = undefined
  @observable
  private _offlineSession?: Session = undefined

  @observable
  private _activeSessionType: ActiveSessionType = 'offline'
  @observable
  private _myActiveSessionKey?: string = undefined

  constructor() {
    reaction(
      // React to ANY change inside the activeSession object
      () => ({
        activeSessionType: this._activeSessionType,
        activeSession: toJS(this.activeSession),
      }),
      ({ activeSessionType, activeSession }) => {
        const user = this.getCurrentUser()
        if (!user) {
          return
        }
        if (
          activeSession &&
          activeSessionType !== 'offline' &&
          activeSession.author === user.uid
        ) {
          this.saveMySession(activeSession.id)
        }
      },
      { delay: 1000 },
    )
  }

  @computed
  public get activeSessionType() {
    return this._activeSessionType
  }

  @computed
  public get hasLoadedActiveSession() {
    if (this._activeSessionType === 'offline') {
      return this._hasLoadedOfflineSession
    }
    if (this._activeSessionType === 'my') {
      return this._hasLoadedMySessions
    }
    if (this._activeSessionType === 'shared') {
      return this._hasLoadedSharedSession
    }
    // Should never happen
    return undefined
  }

  @computed
  public get activeSession() {
    console.log('SessionStore > get activeSession', this._activeSessionType)
    if (this._activeSessionType === 'offline') {
      return this._offlineSession
    }
    if (this._activeSessionType === 'shared') {
      return this._sharedSession
    }
    if (this._activeSessionType === 'my' && this._myActiveSessionKey != null) {
      return this._mySessionsById[this._myActiveSessionKey]
    }
    return undefined
  }

  @computed
  public get mySessions() {
    return _.values(this._mySessionsById) as Session[]
  }

  @computed
  public get mySessionsById() {
    if (!this._hasLoadedMySessions) {
      throw new Error('My sessions have not been loaded yet')
    }
    return _.keyBy(this.mySessions, 'id')
  }

  @computed
  public get mySessionsSorted() {
    return _.reverse(
      _.sortBy(this.mySessions, (s: Session) => {
        return new Date(s.createdAt).getTime()
      }),
    ) as Session[]
  }

  public loadAndActivateSharedSession = async sessionSharedKey => {
    console.log('SessionStore > loadAndActivateSharedSession', sessionSharedKey)

    let sessionQuerySnapshot: firebase.firestore.QuerySnapshot
    try {
      sessionQuerySnapshot = await sessionsRef
        .where('sharedKey', '==', sessionSharedKey)
        .get()

      if (!sessionQuerySnapshot.docs || sessionQuerySnapshot.docs.length < 1) {
        throw new Error(
          `Could not find a shared session with sharedKey = "${sessionSharedKey}"`,
        )
      }
    } catch (error) {
      throw new Error(
        `Could not load shared session by its shared key: "${sessionSharedKey}"`,
      )
    }

    const sessionDoc = sessionQuerySnapshot.docs[0]
    const session = sessionDoc.data() as Session
    const sessionId = sessionDoc.id

    const user = this.getCurrentUser()
    if (user && session.author === user.uid) {
      // The shared session is in fact my session
      this._sharedSession = this._mySessionsById[sessionId]
    } else {
      this._sharedSession = {
        noteCards: [],
        ...preprocessLoadedSessionData(session),
        id: sessionId,
      }
    }

    this._activeSessionType = 'shared'
    this._hasLoadedSharedSession = true

    return this._sharedSession
  }

  public createAndActivateNewSession = async (
    values: Partial<Session> = {},
  ) => {
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    const newSessionDoc = await sessionsRef.add({
      ...createDefaultSession(),
      ..._.omit(values, ['author']),
      author: user.uid,
    } as Session)
    const sessionId = newSessionDoc.id
    const session = {
      ...(await newSessionDoc.get()).data(),
      id: sessionId,
    } as Session

    this._mySessionsById[sessionId] = {
      noteCards: [],
      ...preprocessLoadedSessionData(session),
    }

    this._myActiveSessionKey = sessionId
    this._activeSessionType = 'my'
    return this._mySessionsById[sessionId]
  }

  public saveMySession = async sessionId => {
    console.log('SessionStore > saveMySession', sessionId)
    const session = this._mySessionsById[sessionId]
    if (!session) {
      return
    }
    await sessionsRef.doc(sessionId).set({
      ...session,
      updatedAt: new Date().getTime(),
    })
  }

  public deleteMySessionById = async sessionId => {
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    await sessionsRef.doc(sessionId).delete()
    delete this._mySessionsById[sessionId]

    if (Object.keys(this._mySessionsById).length === 0) {
      await this.createAndActivateNewSession({ name: 'New session' })
    } else {
      this._myActiveSessionKey = this.mySessions[0].id
    }
  }

  public shareMySessionById = async sessionId => {
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    const session = this._mySessionsById[sessionId]
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    if (session.sharedKey) {
      return
    }
    const sharedKey = uuid()
    await sessionsRef.doc(sessionId).set({ sharedKey })
    session.sharedKey = sharedKey
    return session.sharedKey
  }

  public unshareMySessionById = async sessionId => {
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    const session = this._mySessionsById[sessionId]
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    if (!session.sharedKey) {
      return
    }

    if (session.sharedKey) {
      return
    }
    await sessionsRef.doc(sessionId).update({ sharedKey: null })
  }

  public clearMySessions = () => {
    this._mySessionsById = {}
    this._myActiveSessionKey = undefined
  }

  public loadMySessions = async () => {
    console.log('SessionStore > loadMySessions')
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    let sessionsDocList = (await sessionsRef
      .where('author', '==', user.uid)
      .get()).docs

    let sessionsById = {}
    sessionsDocList.forEach(doc => {
      sessionsById[doc.id] = {
        ...doc.data(),
        id: doc.id,
      }
    })

    if (!sessionsById || Object.keys(sessionsById).length === 0) {
      await this.createAndActivateNewSession()
    } else {
      this._mySessionsById = {
        ...this._mySessionsById,
        ..._.mapValues(sessionsById, preprocessLoadedSessionData),
      }
    }

    this._hasLoadedMySessions = true
  }

  public activateMySessionById = sessionKey => {
    console.log('SessionStore > activateMySessionById', sessionKey)
    if (!this._hasLoadedMySessions) {
      throw new Error("My sessions haven't been loaded yet")
    }
    if (!this.mySessionsById[sessionKey]) {
      throw new Error(`No session found: "${sessionKey}"`)
    }
    this._myActiveSessionKey = sessionKey
    this._activeSessionType = 'my'
  }

  public loadAndActivateOfflineSession = () => {
    console.log('SessionStore > loadAndActivateOfflineSession')
    const user = this.getCurrentUser()

    const offlineSession = {
      key: uuid(),
      author: user ? user.uid : ANONYMOUS_USER_UID,
      ...createDefaultSession(),
    } as Session

    this._offlineSession = offlineSession
    this._hasLoadedOfflineSession = true
    this._activeSessionType = 'offline'

    return offlineSession
  }

  private getCurrentUser = () => {
    return firebase.auth().currentUser
  }
}

const sessionStore = new SessionStore()
// @ts-ignore
window.sessionStore = sessionStore

export default sessionStore
