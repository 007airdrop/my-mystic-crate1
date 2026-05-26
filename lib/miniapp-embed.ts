import { ASSETS, APP_URL } from './constants'

/** Mini app embed metadata payload */
export const miniAppEmbed = {
  version: '1',
  imageUrl: ASSETS.miniappCard,
  button: {
    title: 'Open Mystic Crate',
    action: {
      type: 'launch_miniapp' as const,
      name: 'Mystic Crate',
      url: `${APP_URL}?v=4`,
      splashImageUrl: ASSETS.icon,
      splashBackgroundColor: '#0a0014',
    },
  },
}
