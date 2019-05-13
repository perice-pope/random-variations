export type ChannelId = PercussionChannelId | 'notes'
export type PercussionChannelId = 'metronome' | 'rhythm' | 'subdivision'

export const channelId = {
  METRONOME: 'metronome',
  RHYTHM: 'rhythm',
  SUBDIVISION: 'subdivision',
  NOTES: 'notes',
}
