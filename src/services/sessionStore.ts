import { observable, computed, reaction, toJS } from 'mobx'
import firebase, { base } from './firebase'
import { Session, SharedSessionInfo } from '../types'
import _ from 'lodash'
import uuid from 'uuid/v4'
import { createDefaultSession } from '../utils'

// @ts-ignore
window.base = base
// @ts-ignore
window.firebase = firebase

// Keys to reference the Firebase realtime DB
const userSessionsKey = userKey => `users/${userKey}/sessions`
const userSessionKey = (userKey, sessionKey) =>
  `${userSessionsKey(userKey)}/${sessionKey}`
const sharedSessionInfoRootKey = `sharedSessions`
const getSharedSessionInfoPath = sharedSessionKey =>
  `${sharedSessionInfoRootKey}/${sharedSessionKey}`

const ANONYMOUS_USER_UID = 'anonymous-user-uid'

type ActiveSessionType = 'offline' | 'my' | 'shared'

class SessionStore {
  @observable
  private _hasLoadedMySessions = false
  @observable
  private _hasLoadedOfflineSession = false
  @observable
  private _hasLoadedSharedSession = false

  @observable
  private _mySessionsByKey: { [sessionKey: string]: Session } = {}
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
          this.saveMySession(activeSession.key)
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
      return this._mySessionsByKey[this._myActiveSessionKey]
    }
    return undefined
  }

  @computed
  public get mySessions() {
    return _.values(this._mySessionsByKey) as Session[]
  }

  @computed
  public get mySessionsByKey() {
    if (!this._hasLoadedMySessions) {
      throw new Error('My sessions have not been loaded yet')
    }
    return _.keyBy(this.mySessions, 'key')
  }

  @computed
  public get mySessionsSorted() {
    return _.reverse(
      _.sortBy(this.mySessions, (s: Session) => {
        return new Date(s.createdAt).getTime()
      }),
    ) as Session[]
  }

  public loadAndActivateSharedSession = async sharedSessionInfoKey => {
    console.log(
      'SessionStore > loadAndActivateSharedSession',
      sharedSessionInfoKey,
    )
    const sharedInfo = await base.fetch(
      getSharedSessionInfoPath(sharedSessionInfoKey),
      {},
    )
    const { user: userKey, session: sessionKey } = sharedInfo
    console.log('SessionStore > loadAndActivateSharedSession', {
      userKey,
      sessionKey,
    })

    if (!sessionKey || !userKey) {
      throw new Error(
        `Could not load shared session: "${getSharedSessionInfoPath(
          sharedSessionInfoKey,
        )}" doesn't contain all necessary info`,
      )
    }

    const session = (await base.fetch(
      userSessionKey(userKey, sessionKey),
      {},
    )) as Session

    if (!session || _.isEmpty(session)) {
      throw new Error(
        `Could not find shared session under "${userSessionKey(
          userKey,
          sessionKey,
        )}"`,
      )
    }

    const user = this.getCurrentUser()
    if (user && session.author === user.uid) {
      // The shared session is in fact my session
      this._sharedSession = this._mySessionsByKey[sessionKey]
    } else {
      this._sharedSession = {
        noteCards: [],
        ...session,
        key: sessionKey,
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

    const ref = await base.push(userSessionsKey(user.uid), {
      data: {
        ...createDefaultSession(),
        ..._.omit(values, ['author', 'key']),
        author: user.uid,
      } as Session,
    })
    const sessionKey = ref.key

    const session = await base.fetch(userSessionKey(user.uid, sessionKey), {})
    this._mySessionsByKey[sessionKey] = {
      noteCards: [],
      ...session,
      key: sessionKey,
    }

    this._myActiveSessionKey = sessionKey
    this._activeSessionType = 'my'
    return this._mySessionsByKey[sessionKey]
  }

  public saveMySession = async sessionKey => {
    const session = this._mySessionsByKey[sessionKey]
    if (!session) {
      return
    }
    console.log('SessionStore > saveMySession', sessionKey, session)
    await base.update(userSessionKey(session.author, session.key), {
      data: {
        ...session,
        updatedAt: new Date().getTime(),
      },
    })
  }

  public deleteMySessionByKey = async key => {
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    await base.remove(userSessionKey(user.uid, key))
    delete this._mySessionsByKey[key]

    if (Object.keys(this._mySessionsByKey).length === 0) {
      await this.createAndActivateNewSession({ name: 'New session' })
    } else {
      this._myActiveSessionKey = this.mySessions[0].key
    }
  }

  public shareMySessionByKey = async key => {
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    const session = this._mySessionsByKey[key]
    if (!session) {
      throw new Error(`Session not found: ${key}`)
    }

    const sharedSessionInfoRef = await base.push(sharedSessionInfoRootKey, {
      data: {
        session: session.key,
        user: user.uid,
      } as SharedSessionInfo,
    })

    // Store the sharedKey on the remote Session data object
    await base.update(userSessionKey(user.uid, session.key), {
      data: {
        sharedKey: sharedSessionInfoRef.key,
      },
    })
    // Update local Session data too
    session.sharedKey = sharedSessionInfoRef.key
    return session.sharedKey
  }

  public unshareMySessionByKey = async key => {
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    const session = this._mySessionsByKey[key]
    if (!session) {
      throw new Error(`Session not found: ${key}`)
    }

    if (!session.sharedKey) {
      return
    }

    await base.remove(getSharedSessionInfoPath(session.sharedKey))
    session.sharedKey = undefined
  }

  public clearMySessions = () => {
    this._mySessionsByKey = {}
    this._myActiveSessionKey = undefined
  }

  public loadMySessions = async () => {
    console.log('SessionStore > loadMySessions')
    const user = this.getCurrentUser()
    if (!user) {
      throw new Error('No current user')
    }

    let sessionsByKey = _.keyBy(
      await base.fetch(userSessionsKey(user.uid), {
        asArray: true,
      }),
      'key',
    )

    if (!sessionsByKey || Object.keys(sessionsByKey).length === 0) {
      await this.createAndActivateNewSession()
      sessionsByKey = _.keyBy(
        await base.fetch(userSessionsKey(user.uid), { asArray: true }),
        'key',
      )
    }

    this._mySessionsByKey = {
      ...this._mySessionsByKey,
      ..._.mapValues(sessionsByKey, session => ({
        noteCards: [],
        ...session,
      })),
    }
    this._hasLoadedMySessions = true
  }

  public activateMySessionByKey = sessionKey => {
    console.log('SessionStore > activateMySessionByKey', sessionKey)
    if (!this._hasLoadedMySessions) {
      throw new Error("My sessions haven't been loaded yet")
    }
    if (!this.mySessionsByKey[sessionKey]) {
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
