export type ChannelId = PercussionChannelId | 'notes' | 'count-in'
export type PercussionChannelId = 'metronome' | 'rhythm' | 'subdivision'

export const channelId = {
  COUNT_IN: 'count-in',
  METRONOME: 'metronome',
  RHYTHM: 'rhythm',
  SUBDIVISION: 'subdivision',
  NOTES: 'notes',
}
